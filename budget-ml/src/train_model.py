# train_model.py
import sys
import json
import joblib
import pandas as pd
import numpy as np
from pprint import pprint
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import RandomizedSearchCV, TimeSeriesSplit
from sklearn.metrics import mean_absolute_error
from src.feature_engineering import prepare_time_series_features

RANDOM_STATE = 42
N_ITER = 50
CV_SPLITS = 5
LOG_TARGET = True

def detect_time_column(df):
    for c in ("month_start", "date", "period_end", "period", "period_start"):
        if c in df.columns:
            return c
    return None

def train(csv_path: str, out_model_path: str = "budget_model.pkl"):
    raw = pd.read_csv(csv_path)
    raw["amount"] = raw["amount"].astype(float).abs()

    features = prepare_time_series_features(raw)

    if features.shape[0] == 0:
        print("No training rows created. Ensure your CSV has multiple months per account/category.")
        return

    time_col = detect_time_column(features)
    if time_col:
        try:
            features[time_col] = pd.to_datetime(features[time_col])
        except Exception:
            pass

    # FEATURES: match output of your feature_engineering.py
    feature_cols = [c for c in [
        "avg_1m", "avg_3m", "avg_6m",
        "std_6m", "count_6m",
        "growth_1m_over_3m", "ratio_1m_over_6m", "std_norm",
        "seasonality_month", "season_sin", "season_cos",
        "is_recurring_candidate"
    ] if c in features.columns]

    if len(feature_cols) == 0:
        raise RuntimeError("No matching feature columns found in prepared features: " + ", ".join(features.columns))

    X = features[feature_cols].fillna(0)
    y = features["label_next_month"].astype(float)

    # log-transform to stabilize variance / downweight large bills
    if LOG_TARGET:
        y_train_transform = np.log1p
        y_pred_transform = np.expm1
    else:
        y_train_transform = lambda x: x
        y_pred_transform = lambda x: x

    # Chronological 80/20 split by time_col if available
    if time_col in features.columns:
        fsorted = features.sort_values(time_col).reset_index(drop=True)
        split_idx = int(0.8 * len(fsorted))
        X_train = fsorted.iloc[:split_idx][feature_cols]
        y_train = fsorted.iloc[:split_idx]["label_next_month"].astype(float).map(y_train_transform)
        X_test = fsorted.iloc[split_idx:][feature_cols]
        y_test = fsorted.iloc[split_idx:]["label_next_month"].astype(float)
        cv = TimeSeriesSplit(n_splits=CV_SPLITS)
        print(f"Chronological split: train={len(X_train)} rows, test={len(X_test)} rows (by {time_col})")
    else:
        # fallback: TimeSeriesSplit not possible, do simple random CV by indices
        # Use TimeSeriesSplit semantics by index order but fallback to simple split
        idx = np.arange(len(X))
        split_idx = int(0.8 * len(idx))
        X_train = X.iloc[:split_idx]
        y_train = y.iloc[:split_idx].map(y_train_transform)
        X_test = X.iloc[split_idx:]
        y_test = y.iloc[split_idx:]
        cv = TimeSeriesSplit(n_splits=CV_SPLITS)
        print(f"No time column found. Using index-based chronological split as fallback: train={len(X_train)}, test={len(X_test)}")

    # RandomForest base estimator
    base_rf = RandomForestRegressor(random_state=RANDOM_STATE, n_jobs=-1)

    param_distributions = {
        "n_estimators": [100, 200, 400, 600, 800],
        "max_depth": [8, 12, 18, 28, None],
        "min_samples_split": [2, 5, 8, 12],
        "min_samples_leaf": [1, 2, 4, 6],
        "max_features": ["sqrt", "log2", 0.5]
    }

    search = RandomizedSearchCV(
        estimator=base_rf,
        param_distributions=param_distributions,
        n_iter=N_ITER,
        cv=cv,
        scoring="neg_mean_absolute_error",
        random_state=RANDOM_STATE,
        verbose=2,
        n_jobs=-1
    )

    print("Starting RandomizedSearchCV...")
    search.fit(X_train, y_train)

    print("Best cross-val score (neg MAE):", search.best_score_)
    print("Best params:")
    pprint(search.best_params_)

    best_model = search.best_estimator_

    # Evaluate on test set (remember to invert transform if we trained on log)
    raw_preds = best_model.predict(X_test)
    if LOG_TARGET:
        preds = y_pred_transform(raw_preds)
    else:
        preds = raw_preds

    test_mae = mean_absolute_error(y_test, preds)
    print("Test MAE (original units):", test_mae)

    out = {
        "model": best_model,
        "feature_names": feature_cols,
        "log_target": bool(LOG_TARGET),
        "best_params": {k: (v.tolist() if hasattr(v, "tolist") else v) for k, v in search.best_params_.items()},
        "cv_best_score": float(search.best_score_),
        "test_mae": float(test_mae)
    }

    joblib.dump(out, out_model_path)

    # Save summary json
    summary_path = out_model_path.replace(".pkl", ".json")
    with open(summary_path, "w") as f:
        json.dump({
            "feature_names": feature_cols,
            "log_target": bool(LOG_TARGET),
            "best_params": out["best_params"],
            "cv_best_score": out["cv_best_score"],
            "test_mae": out["test_mae"]
        }, f, indent=2)

    print("Saved tuned model to", out_model_path)
    print("Saved summary to", summary_path)

if __name__ == "__main__":
    csv_path = sys.argv[1] if len(sys.argv) > 1 else "data/transactions_export.csv"
    train(csv_path)
