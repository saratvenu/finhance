# src/predict_service.py
import os
import joblib
from fastapi import FastAPI, Header, HTTPException
from typing import List, Optional
import pandas as pd
import numpy as np

from src.predict_schema import PredictRequest, PredictResponse, PredictResponseRow
from src.feature_engineering import prepare_time_series_features

app = FastAPI(title="Finhance Budget Predictor")

MODEL_PATH = os.environ.get("MODEL_PATH", "budget_model.pkl")
API_KEY = None

# ----- load model bundle -----
model = None
calibrator = None
feature_names = None
log_target = False

if os.path.exists(MODEL_PATH):
    try:
        bundle = joblib.load(MODEL_PATH)
        model = bundle.get("model", None)
        calibrator = bundle.get("calibrator", None)
        feature_names = bundle.get("feature_names", None)
        log_target = bool(bundle.get("log_target", False))
        print("Model loaded from", MODEL_PATH)
        print("feature_names:", feature_names)
        print("log_target:", log_target)
        print("calibrator present:", calibrator is not None)
    except Exception as e:
        print("Failed to load model:", e)
else:
    print("Model file not found at", MODEL_PATH)


# ----- helpers -----
def _check_api_key(x_api_key: Optional[str]):
    if API_KEY is not None and x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="invalid api key")


def _apply_postprocessing(raw_preds: np.ndarray) -> np.ndarray:
    """
    Given raw model outputs (the direct model.predict outputs), convert to final predictions
    in original units and apply calibrator if present.
    """
    # ensure numpy array
    raw = np.array(raw_preds)
    if log_target:
        preds = np.expm1(raw)
    else:
        preds = raw

    if calibrator is not None:
        # calibrator expects 2D input
        preds = calibrator.predict(preds.reshape(-1, 1))
    return preds


def _predict_from_dataframe(df: pd.DataFrame) -> np.ndarray:
    """
    Given a dataframe with columns matching feature_names, return predictions in original units,
    including inverse-transform and calibration.
    """
    if feature_names is None:
        # fallback: if model was trained without feature_names, assume numeric order already matches
        X = df.values
    else:
        # ensure columns exist and are in correct order
        missing = [c for c in feature_names if c not in df.columns]
        if missing:
            raise HTTPException(status_code=400, detail=f"Missing feature columns: {missing}")
        X = df[feature_names].fillna(0).values

    raw_preds = model.predict(X)
    return _apply_postprocessing(raw_preds)


# ----- existing endpoint (row-wise) -----
@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest, x_api_key: str = Header(None)):
    _check_api_key(x_api_key)
    if model is None:
        raise HTTPException(status_code=500, detail="model not loaded")

    rows = req.rows
    # If we have feature_names, use DataFrame path so ordering and names are safe.
    if feature_names:
        # Build DataFrame from incoming rows using model feature names
        records = []
        for r in rows:
            rec = {
                "avg_1m": r.avg_1m,
                "avg_3m": r.avg_3m,
                "avg_6m": r.avg_6m,
                "std_6m": r.std_6m,
                "count_6m": r.count_6m,
                "seasonality_month": r.seasonality_month,
            }
            # include any other attributes present in row that might be in feature_names
            for fn in feature_names:
                if fn not in rec:
                    if hasattr(r, fn):
                        rec[fn] = getattr(r, fn)
            records.append(rec)

        df = pd.DataFrame(records)
        try:
            preds = _predict_from_dataframe(df)
        except HTTPException:
            raise
    else:
        # fallback old behavior: construct numeric array in legacy order
        X = []
        meta = []
        for r in rows:
            X.append([
                r.avg_1m, r.avg_3m, r.avg_6m, r.std_6m, r.count_6m, r.seasonality_month
            ])
            meta.append((r.account_id, r.category))
        X = np.array(X)
        raw_preds = model.predict(X)
        preds = _apply_postprocessing(raw_preds)

    out = []
    # If rows include account_id & category, map them; else attempt to get from rows
    for r, p in zip(rows, preds):
        acct = getattr(r, "account_id", None)
        cat = getattr(r, "category", None)
        out.append(PredictResponseRow(account_id=acct or "", category=cat or "", predicted_next_month=float(p)))

    return PredictResponse(predictions=out)


# ----- new endpoint: accept raw transactions list and predict latest per (account,category) -----
from pydantic import BaseModel


class RawTransaction(BaseModel):
    account_id: str
    category: str
    amount: float
    date: str  # ISO date


@app.post("/predict_from_transactions")
def predict_from_transactions(
    transactions: List[RawTransaction],
    account_id: Optional[str] = None,
    category: Optional[str] = None,
    x_api_key: str = Header(None)
):
    """
    Builds monthly features from raw transactions and returns one-step-ahead predictions
    for the latest month per (account_id, category). Response includes:
    - feature_month_start: the month the features were built from (ISO)
    - month_start: preserved legacy field (same as feature_month_start)
    - predicted_month_start: ISO first day of the month being predicted (one month after feature_month_start)
    - predicted_month_name: human readable name like "June 2024"
    - prediction_next_month: predicted numeric amount for that predicted month
    """
    _check_api_key(x_api_key)
    if model is None:
        raise HTTPException(status_code=500, detail="model not loaded")

    # convert to DataFrame for feature engineering
    tx_df = pd.DataFrame([t.dict() for t in transactions])
    if tx_df.empty:
        raise HTTPException(status_code=400, detail="no transactions provided")

    # ensure columns exist
    if not {"date", "amount", "account_id", "category"}.issubset(set(tx_df.columns)):
        raise HTTPException(status_code=400, detail="transactions must include date, amount, account_id, category")

    tx_df["date"] = pd.to_datetime(tx_df["date"])
    tx_df["amount"] = tx_df["amount"].astype(float).abs()

    features = prepare_time_series_features(tx_df, keep_last_row_for_inference=True)
    if features.empty:
        raise HTTPException(status_code=404, detail="no feature rows created (not enough months)")

    if "month_start" not in features.columns:
        raise HTTPException(status_code=500, detail="feature engineering missing month_start")

    # pick the latest month row per group
    latest = features.sort_values("month_start").groupby(["account_id", "category"]).tail(1).reset_index(drop=True)

    # apply optional filters
    if account_id:
        latest = latest[latest["account_id"] == account_id]
    if category:
        latest = latest[latest["category"] == category]

    if latest.empty:
        raise HTTPException(status_code=404, detail="no matching (account,category) rows to predict")

    # Build DataFrame for model prediction using feature_names, or fallback to selecting known columns
    if feature_names:
        missing = [c for c in feature_names if c not in latest.columns]
        if missing:
            raise HTTPException(status_code=500, detail=f"missing model feature columns in engineered features: {missing}")
        X_df = latest[feature_names].fillna(0)
    else:
        # fallback to legacy columns
        cols = ["avg_1m", "avg_3m", "avg_6m", "std_6m", "count_6m", "seasonality_month"]
        missing = [c for c in cols if c not in latest.columns]
        if missing:
            raise HTTPException(status_code=500, detail=f"missing fallback feature columns: {missing}")
        X_df = latest[cols].fillna(0)

    # preds are already converted to original units by _predict_from_dataframe
    preds = _predict_from_dataframe(X_df)

    resp = []
    for i, row in latest.reset_index(drop=True).iterrows():
        # ensure month_start is a Timestamp
        feat_month = pd.to_datetime(row["month_start"])
        # predicted month is the next month after the feature_month
        predicted_month_start = (feat_month + pd.offsets.MonthBegin(1))
        # format ISO and human-readable month name
        predicted_month_iso = pd.Timestamp(predicted_month_start).isoformat()
        predicted_month_name = pd.Timestamp(predicted_month_start).strftime("%B %Y")

        resp.append({
            "account_id": row["account_id"],
            "category": row["category"],
            "feature_month_start": pd.Timestamp(feat_month).isoformat(),
            "month_start": pd.Timestamp(feat_month).isoformat(),
            "predicted_month_start": predicted_month_iso,
            "predicted_month_name": predicted_month_name,
            "prediction_next_month": float(preds[i])
        })

    return {"predictions": resp}
