# debug_predict.py
import json
import joblib
import pandas as pd
import numpy as np
from src.feature_engineering import prepare_time_series_features

# --- Paste the exact transactions you sent to the server here ---
transactions = [
  {"account_id": "acc_001", "category": "Transport", "amount": 110.00, "date": "2024-01-06"},
  {"account_id": "acc_001", "category": "Transport", "amount": 145.00, "date": "2024-01-23"},
  {"account_id": "acc_001", "category": "Transport", "amount": 140.00, "date": "2024-02-03"},
  {"account_id": "acc_001", "category": "Transport", "amount": 155.00, "date": "2024-02-21"},
  {"account_id": "acc_001", "category": "Transport", "amount": 160.00, "date": "2024-03-12"},
  {"account_id": "acc_001", "category": "Transport", "amount": 150.00, "date": "2024-03-27"},
  {"account_id": "acc_001", "category": "Transport", "amount": 170.00, "date": "2024-04-07"},
  {"account_id": "acc_001", "category": "Transport", "amount": 165.00, "date": "2024-04-19"}
]

# Load model bundle
bundle = joblib.load("budget_model.pkl")
model = bundle["model"]
feature_names = bundle.get("feature_names", None)
log_target = bool(bundle.get("log_target", False))

print("Loaded model. log_target:", log_target)
print("Feature names expected by model:", feature_names)

# Build DataFrame and create features exactly like server
df = pd.DataFrame(transactions)
df['date'] = pd.to_datetime(df['date'])
df['amount'] = df['amount'].astype(float).abs()

features = prepare_time_series_features(df)
print("\nAll engineered feature rows (tail):")
pd.set_option("display.max_columns", None)
print(features.tail(10).to_string(index=False))

# pick the latest row per (account,category) — same logic as server
latest = features.sort_values("month_start").groupby(["account_id","category"]).tail(1).reset_index(drop=True)
print("\nLatest engineered rows for each group:")
print(latest.to_string(index=False))

if latest.empty:
    print("No latest rows produced — not enough months.")
    raise SystemExit(1)

# Build X using model feature_names if available
if feature_names:
    missing = [c for c in feature_names if c not in latest.columns]
    if missing:
        print("\nMISSING FEATURES that the model expects:", missing)
    X = latest[feature_names].fillna(0)
else:
    # fallback: print numeric columns used
    possible = ["avg_1m","avg_3m","avg_6m","std_6m","count_6m","seasonality_month"]
    uses = [c for c in possible if c in latest.columns]
    X = latest[uses].fillna(0)
    print("\nUsing fallback columns:", uses)

print("\nFinal DataFrame passed to model (X):")
print(X.to_string(index=False))

# Run model.predict
raw_preds = model.predict(X)
print("\nRaw model outputs (these are on the model's target scale):", raw_preds)

# If model trained on log target, invert
if log_target:
    preds = np.expm1(raw_preds)
    print("After inverse-transform (expm1) predictions:", preds)
else:
    print("Predictions (original scale):", raw_preds)

# Print feature importances for context
try:
    fi = model.feature_importances_
    print("\nFeature importances:")
    for name, score in sorted(zip(feature_names, fi), key=lambda x: -x[1]):
        print(f"  {name}: {score:.4f}")
except Exception as e:
    print("\nCould not read feature_importances_:", e)
