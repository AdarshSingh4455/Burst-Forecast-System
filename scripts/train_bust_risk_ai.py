import os
import pickle
import numpy as np
import pandas as pd
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.isotonic import IsotonicRegression
from sklearn.metrics import roc_auc_score, average_precision_score, precision_score, recall_score, f1_score, brier_score_loss

input_file = os.path.join("data", "processed", "FORTRESS_BUST_INDIA.parquet")
models_dir = "models"
os.makedirs(models_dir, exist_ok=True)
model_output_file = os.path.join(models_dir, "fortress_bust_model.pkl")

if not os.path.exists(input_file):
    raise FileNotFoundError(f"Bust target dataset missing: {input_file}")

print("Loading FORTRESS bust target dataset...")
df = pd.read_parquet(input_file)
print(f"Loaded {len(df)} rows.")

feature_cols = [
    "lead_day",
    "rain_c00_mm", "rain_p01_mm", "rain_p02_mm", "rain_p03_mm", "rain_p04_mm",
    "ensemble_mean_mm", "ensemble_spread_mm", "ensemble_min_mm", "ensemble_max_mm", "member_range_mm",
    "temp_2m_c_mean", "temp_2m_c_std", "temp_2m_c_min", "temp_2m_c_max",
    "specific_humidity_gkg_mean", "specific_humidity_gkg_std", "specific_humidity_gkg_min", "specific_humidity_gkg_max",
    "mslp_hpa_mean", "mslp_hpa_std", "mslp_hpa_min", "mslp_hpa_max",
    "pwat_mm_mean", "pwat_mm_std", "pwat_mm_min", "pwat_mm_max",
    "u10_mean_ms", "v10_mean_ms", "wind_speed_mean_ms", "wind_speed_std_ms", "wind_speed_min_ms", "wind_speed_max_ms"
]

target_col = "bust_label"

init_dates = sorted(df["forecast_init"].unique())
split_idx = int(len(init_dates) * 0.75)
train_dates = init_dates[:split_idx]
test_dates = init_dates[split_idx:]

print(f"Time-separated split: {len(train_dates)} training dates, {len(test_dates)} testing dates.")

train_df = df[df["forecast_init"].isin(train_dates)].reset_index(drop=True)
test_df = df[df["forecast_init"].isin(test_dates)].reset_index(drop=True)

X_train, y_train = train_df[feature_cols], train_df[target_col]
X_test, y_test = test_df[feature_cols], test_df[target_col]

print(f"Train samples: {len(X_train)} (Busts: {y_train.sum()})")
print(f"Test samples: {len(X_test)} (Busts: {y_test.sum()})")

models = {
    "Random Forest": RandomForestClassifier(n_estimators=100, max_depth=10, n_jobs=1, random_state=42),
    "Gradient Boosting": GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, max_depth=5, random_state=42)
}

best_model_name = None
best_base_model = None
best_calibrator = None
best_auc = -1.0

print("\nEvaluating baseline models with Isotonic calibration...")
for name, base_model in models.items():
    base_model.fit(X_train, y_train)
    raw_train_probs = base_model.predict_proba(X_train)[:, 1]
    
    calibrator = IsotonicRegression(out_of_bounds="clip")
    calibrator.fit(raw_train_probs, y_train)
    
    raw_test_probs = base_model.predict_proba(X_test)[:, 1]
    probs = calibrator.transform(raw_test_probs)
    preds = (probs >= 0.5).astype(int)
    
    auc = roc_auc_score(y_test, probs)
    pr_auc = average_precision_score(y_test, probs)
    prec = precision_score(y_test, preds, zero_division=0)
    rec = recall_score(y_test, preds, zero_division=0)
    f1 = f1_score(y_test, preds, zero_division=0)
    brier = brier_score_loss(y_test, probs)
    
    print(f"--- {name} ---")
    print(f"  ROC-AUC:   {auc:.4f}")
    print(f"  PR-AUC:    {pr_auc:.4f}")
    print(f"  Precision: {prec:.4f}")
    print(f"  Recall:    {rec:.4f}")
    print(f"  F1 Score:  {f1:.4f}")
    print(f"  Brier:     {brier:.4f}")
    
    if auc > best_auc:
        best_auc = auc
        best_model_name = name
        best_base_model = base_model
        best_calibrator = calibrator

print(f"\nBest Model: {best_model_name} (ROC-AUC: {best_auc:.4f})")

print("\nLead-wise Performance of Best Model:")
test_df_copy = test_df.copy()
raw_test_probs_best = best_base_model.predict_proba(X_test)[:, 1]
test_df_copy["prob_bust"] = best_calibrator.transform(raw_test_probs_best)

for day in range(1, 11):
    day_df = test_df_copy[test_df_copy["lead_day"] == day]
    if len(day_df) > 0 and day_df[target_col].nunique() > 1:
        day_auc = roc_auc_score(day_df[target_col], day_df["prob_bust"])
        day_brier = brier_score_loss(day_df[target_col], day_df["prob_bust"])
        print(f"  Lead D{day:02d}: ROC-AUC = {day_auc:.4f}, Brier = {day_brier:.4f}")

model_bundle = {
    "base_model": best_base_model,
    "calibrator": best_calibrator,
    "feature_cols": feature_cols,
    "model_name": best_model_name
}

with open(model_output_file, "wb") as f:
    pickle.dump(model_bundle, f)

print("============================================")
print("PHASE 3 - BUST RISK AI TRAINED SUCCESSFULLY")
print(f"Model File Saved: {model_output_file}")
print("============================================")
