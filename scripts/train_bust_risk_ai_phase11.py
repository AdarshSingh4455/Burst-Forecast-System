import os
import sys
import pickle
import json
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.isotonic import IsotonicRegression
from sklearn.metrics import roc_auc_score, average_precision_score, precision_score, recall_score, f1_score, brier_score_loss

sys.stdout.reconfigure(encoding="utf-8")

def main():
    bust_file = "data/processed/FORTRESS_BUST_MULTIYEAR_MULTIREGION.parquet"
    if not os.path.exists(bust_file):
        print(f"Bust dataset not found at {bust_file}")
        sys.exit(1)

    print("============================================")
    print("FORTRESS PHASE 11E BUST RISK AI TRAINER")
    print("============================================")

    df = pd.read_parquet(bust_file)
    print(f"Loaded multi-region bust dataset: {len(df):,} rows.")

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

    train_df = df[df["split"] == "TRAIN"].reset_index(drop=True)
    val_df = df[df["split"] == "VALIDATION"].reset_index(drop=True)
    test_df = df[df["split"] == "TEST"].reset_index(drop=True)

    print(f"TRAIN rows:      {len(train_df):,} (Busts: {train_df[target_col].sum():,}, {train_df[target_col].mean()*100:.2f}%)")
    print(f"VALIDATION rows: {len(val_df):,} (Busts: {val_df[target_col].sum():,}, {val_df[target_col].mean()*100:.2f}%)")
    print(f"TEST rows:       {len(test_df):,} (Busts: {test_df[target_col].sum():,}, {test_df[target_col].mean()*100:.2f}%)")

    X_train, y_train = train_df[feature_cols], train_df[target_col]
    X_val, y_val = val_df[feature_cols], val_df[target_col]
    X_test, y_test = test_df[feature_cols], test_df[target_col]

    models = {
        "Random Forest": RandomForestClassifier(n_estimators=100, max_depth=10, n_jobs=1, random_state=42),
        "Gradient Boosting": GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, max_depth=5, random_state=42)
    }

    best_model_name = None
    best_base_model = None
    best_calibrator = None
    best_val_auc = -1.0

    print("\n--- Training Models on TRAIN split & Calibrating on VALIDATION split ---")
    for name, base_model in models.items():
        base_model.fit(X_train, y_train)
        raw_val_probs = base_model.predict_proba(X_val)[:, 1]

        calibrator = IsotonicRegression(out_of_bounds="clip")
        calibrator.fit(raw_val_probs, y_val)

        val_probs = calibrator.transform(raw_val_probs)
        val_auc = roc_auc_score(y_val, val_probs)
        print(f"  {name:20s}: VALIDATION ROC-AUC = {val_auc:.4f}")

        if val_auc > best_val_auc:
            best_val_auc = val_auc
            best_model_name = name
            best_base_model = base_model
            best_calibrator = calibrator

    print(f"\nSelected Best Model: {best_model_name}")

    # Evaluate on held-out 2019 TEST set
    raw_test_probs = best_base_model.predict_proba(X_test)[:, 1]
    test_probs = best_calibrator.transform(raw_test_probs)
    test_preds = (test_probs >= 0.5).astype(int)

    overall_metrics = {
        "ROC_AUC": float(roc_auc_score(y_test, test_probs)),
        "PR_AUC": float(average_precision_score(y_test, test_probs)),
        "Brier": float(brier_score_loss(y_test, test_probs)),
        "Precision": float(precision_score(y_test, test_preds, zero_division=0)),
        "Recall": float(recall_score(y_test, test_preds, zero_division=0)),
        "F1": float(f1_score(y_test, test_preds, zero_division=0))
    }

    print("\n=== HELD-OUT 2019 TEST SET METRICS ===")
    for k, v in overall_metrics.items():
        print(f"  {k:12s}: {v:.4f}")

    # Region-wise Test Metrics
    region_metrics = {}
    print("\n=== REGION-WISE TEST METRICS ===")
    for reg in test_df["region_id"].unique():
        r_mask = (test_df["region_id"] == reg)
        r_y = test_df.loc[r_mask, target_col]
        r_probs = test_probs[r_mask]
        r_auc = float(roc_auc_score(r_y, r_probs))
        r_pr = float(average_precision_score(r_y, r_probs))
        r_brier = float(brier_score_loss(r_y, r_probs))
        r_bust_rate = float(r_y.mean())
        region_metrics[reg] = {
            "ROC_AUC": r_auc, "PR_AUC": r_pr, "Brier": r_brier,
            "N": int(len(r_y)), "BustRate": r_bust_rate
        }
        print(f"  {reg:22s}: ROC-AUC={r_auc:.4f}, PR-AUC={r_pr:.4f}, Brier={r_brier:.4f}, N={len(r_y)}, BustRate={r_bust_rate*100:.2f}%")

    # Lead-wise Test Metrics
    lead_metrics = {}
    print("\n=== LEAD-WISE TEST METRICS ===")
    for day in range(1, 11):
        l_mask = (test_df["lead_day"] == day)
        l_y = test_df.loc[l_mask, target_col]
        l_probs = test_probs[l_mask]
        l_auc = float(roc_auc_score(l_y, l_probs)) if l_y.nunique() > 1 else None
        l_brier = float(brier_score_loss(l_y, l_probs))
        lead_metrics[f"D{day}"] = {
            "ROC_AUC": l_auc, "Brier": l_brier, "N": int(len(l_y)), "BustRate": float(l_y.mean())
        }
        auc_str = f"{l_auc:.4f}" if l_auc is not None else "N/A"
        print(f"  Lead D{day:02d}: ROC-AUC = {auc_str}, Brier = {l_brier:.4f}, N = {len(l_y)}")

    # Region x Lead Matrix
    region_lead_matrix = {}
    for reg in test_df["region_id"].unique():
        region_lead_matrix[reg] = {}
        for day in range(1, 11):
            rl_mask = (test_df["region_id"] == reg) & (test_df["lead_day"] == day)
            rl_y = test_df.loc[rl_mask, target_col]
            rl_probs = test_probs[rl_mask]
            rl_auc = float(roc_auc_score(rl_y, rl_probs)) if rl_y.nunique() > 1 else None
            rl_brier = float(brier_score_loss(rl_y, rl_probs))
            region_lead_matrix[reg][f"D{day}"] = {
                "ROC_AUC": rl_auc, "Brier": rl_brier, "N": int(len(rl_y)), "BustRate": float(rl_y.mean())
            }

    # Cross-Region Generalization Experiment
    print("\n=== CROSS-REGION GENERALIZATION EXPERIMENT ===")
    cross_region_results = {}
    regions_list = sorted(df["region_id"].unique().tolist())
    for target_reg in regions_list:
        train_regs = [r for r in regions_list if r != target_reg]
        
        # Train on 2 regions during TRAIN period
        cr_train = train_df[train_df["region_id"].isin(train_regs)].reset_index(drop=True)
        cr_val = val_df[val_df["region_id"].isin(train_regs)].reset_index(drop=True)
        cr_test = test_df[test_df["region_id"] == target_reg].reset_index(drop=True)
        
        cr_base = RandomForestClassifier(n_estimators=100, max_depth=10, n_jobs=1, random_state=42)
        cr_base.fit(cr_train[feature_cols], cr_train[target_col])
        
        cr_raw_val = cr_base.predict_proba(cr_val[feature_cols])[:, 1]
        cr_cal = IsotonicRegression(out_of_bounds="clip")
        cr_cal.fit(cr_raw_val, cr_val[target_col])
        
        cr_raw_test = cr_base.predict_proba(cr_test[feature_cols])[:, 1]
        cr_test_probs = cr_cal.transform(cr_raw_test)
        
        cr_auc = float(roc_auc_score(cr_test[target_col], cr_test_probs))
        cr_pr = float(average_precision_score(cr_test[target_col], cr_test_probs))
        cr_brier = float(brier_score_loss(cr_test[target_col], cr_test_probs))
        
        cross_region_results[target_reg] = {
            "Train_Regions": train_regs,
            "HeldOut_Test_Region": target_reg,
            "ROC_AUC": cr_auc,
            "PR_AUC": cr_pr,
            "Brier": cr_brier,
            "N": len(cr_test)
        }
        print(f"  Held-Out {target_reg:22s}: ROC-AUC = {cr_auc:.4f}, PR-AUC = {cr_pr:.4f}, Brier = {cr_brier:.4f}")

    # Calibration Reliability Bins (10 bins)
    calib_bins = []
    bin_edges = np.linspace(0.0, 1.0, 11)
    for i in range(10):
        low, high = bin_edges[i], bin_edges[i+1]
        b_mask = (test_probs >= low) & (test_probs < high)
        if b_mask.sum() > 0:
            mean_pred = float(test_probs[b_mask].mean())
            obs_freq = float(y_test[b_mask].mean())
            cnt = int(b_mask.sum())
        else:
            mean_pred, obs_freq, cnt = (low + high) / 2.0, 0.0, 0
        calib_bins.append({"bin_idx": i+1, "low": low, "high": high, "mean_pred": mean_pred, "obs_freq": obs_freq, "count": cnt})

    # Save Model Bundle
    model_output_file = "models/fortress_bust_model_phase11.pkl"
    model_bundle = {
        "base_model": best_base_model,
        "calibrator": best_calibrator,
        "feature_cols": feature_cols,
        "model_name": best_model_name
    }
    with open(model_output_file, "wb") as f:
        pickle.dump(model_bundle, f)
    print(f"\nSaved Phase 11 model artifact to: {model_output_file}")

    # Save Model Metadata
    meta_output_file = "models/fortress_bust_model_phase11_metadata.json"
    metadata = {
        "model_family": best_model_name,
        "features": feature_cols,
        "training_splits": {
            "train_period": "2017 + Jan-Jun 2018",
            "val_period": "Jul-Dec 2018",
            "test_period": "2019"
        },
        "regions": regions_list,
        "threshold_method": "TRAIN_ONLY_Q95_By_Lead",
        "calibration_method": "IsotonicRegression_Fit_On_Validation",
        "random_seed": 42,
        "train_rows": len(train_df),
        "val_rows": len(val_df),
        "test_rows": len(test_df)
    }
    with open(meta_output_file, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    # Save Metrics Artifact
    metrics_file = "data/processed/FORTRESS_PHASE11_MODEL_METRICS.json"
    metrics_bundle = {
        "overall_test_metrics": overall_metrics,
        "region_metrics": region_metrics,
        "lead_metrics": lead_metrics,
        "region_lead_matrix": region_lead_matrix,
        "cross_region_experiments": cross_region_results,
        "calibration_bins": calib_bins
    }
    with open(metrics_file, "w", encoding="utf-8") as f:
        json.dump(metrics_bundle, f, indent=2)
    print(f"Saved Phase 11 metrics artifact to: {metrics_file}")

    print("============================================")
    print("PHASE 11E BUST RISK AI TRAINED AND EVALUATED SUCCESSFULLY")
    print("============================================")

if __name__ == "__main__":
    main()
