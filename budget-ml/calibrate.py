import joblib, numpy as np, pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error
from src.feature_engineering import prepare_time_series_features

BUNDLE_IN = "budget_model.pkl"
BUNDLE_OUT = "budget_model_calibrated.pkl"
CSV = "data/transactions_export.csv"

b = joblib.load(BUNDLE_IN)
model = b["model"]
fnames = b["feature_names"]
log_target = b["log_target"]

df = pd.read_csv(CSV)
df['date'] = pd.to_datetime(df['date'])
df['amount'] = df['amount'].abs()

features = prepare_time_series_features(df).dropna(subset=fnames + ["label_next_month"])
features = features.sort_values("month_start").reset_index(drop=True)

# take last 20% for calibration
split = int(0.8 * len(features))
cal = features.iloc[split:]

Xc = cal[fnames].fillna(0).values
yc = cal["label_next_month"].astype(float).values

pred_raw = model.predict(Xc)
pred = np.expm1(pred_raw) if log_target else pred_raw

lr = LinearRegression().fit(pred.reshape(-1,1), yc)
pred_adj = lr.predict(pred.reshape(-1,1))

print("MAE before calibration:", mean_absolute_error(yc, pred))
print("MAE after  calibration:", mean_absolute_error(yc, pred_adj))
print("Calibration slope =", lr.coef_[0], " intercept =", lr.intercept_)

joblib.dump({
    "model": model,
    "calibrator": lr,
    "feature_names": fnames,
    "log_target": log_target
}, BUNDLE_OUT)

print("Saved calibrated model to", BUNDLE_OUT)
