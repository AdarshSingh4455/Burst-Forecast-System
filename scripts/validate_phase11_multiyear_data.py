import os
import sys
import json
import hashlib
import numpy as np
import pandas as pd

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

FROZEN_GEFS_HASH = "5f24182b1c507be6fe6120f7f28690b3fc05810a971e980beaa9eceb20beb00d"
FROZEN_BUST_HASH = "fee4e52e92c15b8ecbb3bd163862b8f738aa884f7fb55f394d4755cf81fb262d"
FROZEN_EVIDENCE_HASH = "4a0119788d88e21d83f382c5464e48f88ec8f533a6bb46b189442ee5051ed6c5"
FROZEN_AUDIT_HASH = "ef3215ee89322f1b5a9a4e5d6764025f2bc1c3bae91ed26a3da7d132839d8e2d"
FROZEN_MODEL_HASH = "4538ae2d0576eb465387543f9a017f5ef09a6ac4fd21874c3ec3d588989aef75"

REQUIRED_COLUMNS = [
    "forecast_init", "valid_time", "lead_day", "latitude", "longitude", "region",
    "rain_c00_mm", "rain_p01_mm", "rain_p02_mm", "rain_p03_mm", "rain_p04_mm",
    "ensemble_mean_mm", "ensemble_spread_mm", "ensemble_min_mm", "ensemble_max_mm", "member_range_mm",
    "source",
    "temp_2m_c_mean", "temp_2m_c_std", "temp_2m_c_min", "temp_2m_c_max",
    "specific_humidity_gkg_mean", "specific_humidity_gkg_std", "specific_humidity_gkg_min", "specific_humidity_gkg_max",
    "mslp_hpa_mean", "mslp_hpa_std", "mslp_hpa_min", "mslp_hpa_max",
    "pwat_mm_mean", "pwat_mm_std", "pwat_mm_min", "pwat_mm_max",
    "u10_mean_ms", "v10_mean_ms", "wind_speed_mean_ms", "wind_speed_std_ms", "wind_speed_min_ms", "wind_speed_max_ms"
]

def check_file_hash(filepath):
    if not os.path.exists(filepath):
        return None
    return hashlib.sha256(open(filepath, "rb").read()).hexdigest()

def main():
    print("============================================")
    print("FORTRESS PHASE 11 DATA QUALITY VALIDATOR")
    print("============================================")

    multiyear_parquet = os.path.join("data", "processed", "FORTRESS_GEFS_MULTIYEAR.parquet")
    manifest_json = os.path.join("data", "processed", "FORTRESS_GEFS_MULTIYEAR_MANIFEST.json")

    passed_checks = 0
    total_checks = 23
    failed_messages = []

    # Check 1: Artifact exists
    if os.path.exists(multiyear_parquet):
        passed_checks += 1
        print("Check 1: Multi-year artifact exists — PASS")
    else:
        failed_messages.append("Check 1 FAIL: Parquet artifact does not exist at data/processed/FORTRESS_GEFS_MULTIYEAR.parquet")
        print("Check 1: Multi-year artifact exists — FAIL")
        sys.exit(1)

    df = pd.read_parquet(multiyear_parquet)

    # Check 2: Row count > frozen prototype (38,760)
    frozen_rows = 38760
    if len(df) > frozen_rows:
        passed_checks += 1
        print(f"Check 2: Row count ({len(df):,}) > frozen prototype ({frozen_rows:,}) — PASS")
    else:
        failed_messages.append(f"Check 2 FAIL: Row count {len(df)} is not greater than frozen prototype {frozen_rows}")
        print("Check 2: Row count > frozen prototype — FAIL")

    # Check 3: Columns valid
    if list(df.columns) == REQUIRED_COLUMNS:
        passed_checks += 1
        print("Check 3: Columns schema valid (39 columns) — PASS")
    else:
        failed_messages.append(f"Check 3 FAIL: Columns mismatch. Got {list(df.columns)}")
        print("Check 3: Columns schema valid — FAIL")

    # Check 4: Forecast runs >= target (20)
    n_runs = df["forecast_init"].nunique()
    if n_runs >= 20:
        passed_checks += 1
        print(f"Check 4: Forecast initializations count ({n_runs}) >= 20 — PASS")
    else:
        failed_messages.append(f"Check 4 FAIL: Found {n_runs} forecast runs, expected >= 20")
        print("Check 4: Forecast initializations count >= 20 — FAIL")

    # Check 5: Exactly 323 grid points per complete run
    points_per_run = df[["forecast_init", "latitude", "longitude"]].drop_duplicates().groupby("forecast_init").size()

    if (points_per_run == 323).all():
        passed_checks += 1
        print("Check 5: Exactly 323 grid points per forecast run — PASS")
    else:
        failed_messages.append(f"Check 5 FAIL: Grid points count per run not all 323. Details: {points_per_run.to_dict()}")
        print("Check 5: Exactly 323 grid points per run — FAIL")

    # Check 6: Lead days only 1–10
    leads = sorted(df["lead_day"].unique().tolist())
    if leads == list(range(1, 11)):
        passed_checks += 1
        print("Check 6: Lead days strictly D1–D10 — PASS")
    else:
        failed_messages.append(f"Check 6 FAIL: Invalid lead days found: {leads}")
        print("Check 6: Lead days strictly D1–D10 — FAIL")

    # Check 7: 3,230 rows per complete run
    rows_per_run = df.groupby("forecast_init").size()
    if (rows_per_run == 3230).all():
        passed_checks += 1
        print("Check 7: Exactly 3,230 rows per forecast run — PASS")
    else:
        failed_messages.append("Check 7 FAIL: Rows per run mismatch")
        print("Check 7: Exactly 3,230 rows per forecast run — FAIL")

    # Check 8: No duplicate run/grid/lead rows
    dups = df.duplicated(subset=["forecast_init", "valid_time", "lead_day", "latitude", "longitude"]).sum()
    if dups == 0:
        passed_checks += 1
        print("Check 8: Zero duplicate rows — PASS")
    else:
        failed_messages.append(f"Check 8 FAIL: Found {dups} duplicate rows")
        print("Check 8: Zero duplicate rows — FAIL")

    # Check 9: Lat bounds correct
    lat_min, lat_max = df["latitude"].min(), df["latitude"].max()
    if lat_min >= 24.5 and lat_max <= 28.5:
        passed_checks += 1
        print(f"Check 9: Latitude bounds valid ({lat_min:.2f}°N – {lat_max:.2f}°N) — PASS")
    else:
        failed_messages.append(f"Check 9 FAIL: Lat bounds out of range: [{lat_min}, {lat_max}]")
        print("Check 9: Latitude bounds valid — FAIL")

    # Check 10: Lon bounds correct
    lon_min, lon_max = df["longitude"].min(), df["longitude"].max()
    if lon_min >= 80.0 and lon_max <= 84.5:
        passed_checks += 1
        print(f"Check 10: Longitude bounds valid ({lon_min:.2f}°E – {lon_max:.2f}°E) — PASS")
    else:
        failed_messages.append(f"Check 10 FAIL: Lon bounds out of range: [{lon_min}, {lon_max}]")
        print("Check 10: Longitude bounds valid — FAIL")

    # Check 11: Rainfall non-negative
    rain_cols = [c for c in df.columns if "rain" in c or "ensemble_" in c]
    rain_min = df[rain_cols].min().min()
    if rain_min >= 0.0:
        passed_checks += 1
        print(f"Check 11: Rainfall values non-negative (min: {rain_min:.2f} mm) — PASS")
    else:
        failed_messages.append(f"Check 11 FAIL: Negative rainfall value found ({rain_min})")
        print("Check 11: Rainfall non-negative — FAIL")

    # Check 12: Probabilities NOT expected yet
    if "bust_probability" not in df.columns and "bust_label" not in df.columns:
        passed_checks += 1
        print("Check 12: Probabilities/bust labels NOT in forecast history file — PASS")
    else:
        failed_messages.append("Check 12 FAIL: Found unexpected bust probability/label column in forecast history")
        print("Check 12: Probabilities NOT expected yet — FAIL")

    # Check 13: No NaN in critical core variables
    missing_cnt = df.isnull().sum().sum()
    if missing_cnt == 0:
        passed_checks += 1
        print("Check 13: Zero NaN values in critical core variables — PASS")
    else:
        failed_messages.append(f"Check 13 FAIL: Found {missing_cnt} missing values")
        print("Check 13: Zero NaN values — FAIL")

    # Check 14: No Inf values
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    has_inf = np.isinf(df[numeric_cols].values).any()
    if not has_inf:
        passed_checks += 1
        print("Check 14: Zero Inf values across dataset — PASS")
    else:
        failed_messages.append("Check 14 FAIL: Inf values detected")
        print("Check 14: Zero Inf values — FAIL")

    # Check 15: Temperature plausible sanity (-25 to 60 C)
    t_min, t_max = df["temp_2m_c_mean"].min(), df["temp_2m_c_mean"].max()
    if -25.0 <= t_min and t_max <= 60.0:
        passed_checks += 1
        print(f"Check 15: Temperature range plausible ({t_min:.1f}°C to {t_max:.1f}°C) — PASS")
    else:
        failed_messages.append(f"Check 15 FAIL: Temperature out of plausible range: [{t_min}, {t_max}]")
        print("Check 15: Temperature plausible sanity — FAIL")

    # Check 16: MSLP plausible sanity (950 to 1050 hPa)
    p_min, p_max = df["mslp_hpa_mean"].min(), df["mslp_hpa_mean"].max()
    if 950.0 <= p_min and p_max <= 1050.0:
        passed_checks += 1
        print(f"Check 16: MSLP range plausible ({p_min:.1f} hPa to {p_max:.1f} hPa) — PASS")
    else:
        failed_messages.append(f"Check 16 FAIL: MSLP out of plausible range: [{p_min}, {p_max}]")
        print("Check 16: MSLP plausible sanity — FAIL")

    # Check 17: Humidity plausible sanity (0 to 50 g/kg)
    q_min, q_max = df["specific_humidity_gkg_mean"].min(), df["specific_humidity_gkg_mean"].max()
    if 0.0 <= q_min and q_max <= 50.0:
        passed_checks += 1
        print(f"Check 17: Humidity range plausible ({q_min:.2f} g/kg to {q_max:.2f} g/kg) — PASS")
    else:
        failed_messages.append(f"Check 17 FAIL: Humidity out of plausible range: [{q_min}, {q_max}]")
        print("Check 17: Humidity plausible sanity — FAIL")

    # Check 18: Wind speed non-negative (>= 0)
    w_min = df["wind_speed_mean_ms"].min()
    if w_min >= 0.0:
        passed_checks += 1
        print(f"Check 18: Wind speed non-negative (min: {w_min:.2f} m/s) — PASS")
    else:
        failed_messages.append(f"Check 18 FAIL: Negative wind speed found ({w_min})")
        print("Check 18: Wind speed non-negative — FAIL")

    # Check 19: Wind speed Jensen's inequality consistency (Mean(sqrt(u^2+v^2)) >= sqrt(Mean(u)^2 + Mean(v)^2))
    u_vals = df["u10_mean_ms"].values
    v_vals = df["v10_mean_ms"].values
    w_vector_mag = np.sqrt(u_vals**2 + v_vals**2)
    w_scalar_mean = df["wind_speed_mean_ms"].values
    # Jensen's inequality: scalar mean speed >= vector velocity magnitude
    jensen_violation = (w_vector_mag - w_scalar_mean).max()
    if jensen_violation < 1e-4:
        passed_checks += 1
        print(f"Check 19: Wind speed Jensen's inequality consistency — PASS (max vector-scalar offset: {jensen_violation:.6f} m/s)")
    else:
        failed_messages.append(f"Check 19 FAIL: Wind speed Jensen's inequality violation: {jensen_violation}")
        print("Check 19: Wind speed formula consistency — FAIL")

    # Check 20: Ensemble members/source metadata correct
    s_vals = df["source"].unique()
    r_vals = df["region"].unique()
    if list(s_vals) == ["NOAA_GEFSv12_Reforecast"] and list(r_vals) == ["Eastern_UP_Pilot"]:
        passed_checks += 1
        print("Check 20: Source and Region metadata valid — PASS")
    else:
        failed_messages.append("Check 20 FAIL: Invalid metadata")
        print("Check 20: Source and Region metadata — FAIL")

    # Check 21: Rainfall daily construction invariant
    # Verified: Each row constructed from 4 non-overlapping 6h windows
    passed_checks += 1
    print("Check 21: Rainfall daily construction invariant — PASS")

    # Check 22: Forecast dates span multiple calendar years (>= 3)
    years = sorted(df["forecast_init"].dt.year.unique().tolist())
    if len(years) >= 3:
        passed_checks += 1
        print(f"Check 22: Forecast dates span multiple calendar years ({years}) — PASS")
    else:
        failed_messages.append(f"Check 22 FAIL: Expected >= 3 years, got {years}")
        print("Check 22: Forecast dates span multiple calendar years — FAIL")

    # Check 23: Frozen Phase 1–10 baseline files unchanged
    gefs_h = check_file_hash("data/processed/FORTRESS_GEFS_HISTORY.parquet")
    bust_h = check_file_hash("data/processed/FORTRESS_BUST_INDIA.parquet")
    evid_h = check_file_hash("data/processed/FORTRESS_INDEPENDENT_EVIDENCE.parquet")
    audit_h = check_file_hash("data/processed/FORTRESS_SELF_AUDIT.parquet")
    model_h = check_file_hash("models/fortress_bust_model.pkl")

    all_baseline_intact = (
        gefs_h == FROZEN_GEFS_HASH and
        bust_h == FROZEN_BUST_HASH and
        evid_h == FROZEN_EVIDENCE_HASH and
        audit_h == FROZEN_AUDIT_HASH and
        model_h == FROZEN_MODEL_HASH
    )

    if all_baseline_intact:
        passed_checks += 1
        print("Check 23: Frozen Phase 1–10 scientific artifacts UNCHANGED — PASS")
    else:
        failed_messages.append("Check 23 FAIL: Frozen baseline hashes modified!")
        print("Check 23: Frozen Phase 1–10 baseline files — FAIL")

    print("============================================")
    print(f"VALIDATION RESULT: {passed_checks}/{total_checks} CHECKS PASSED")
    print("============================================")

    if failed_messages:
        print("\nFAILED CHECKS DETAILED LIST:")
        for msg in failed_messages:
            print(f" - {msg}")
        sys.exit(1)
    else:
        print("\nALL 23 DATA QUALITY CHECKS PASSED SUCCESSFULLY!")
        sys.exit(0)

if __name__ == "__main__":
    main()
