import os
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

import numpy as np
import pandas as pd

df = pd.read_parquet("FORTRESS/data/processed/FORTRESS_INDEPENDENT_EVIDENCE.parquet")
df['forecast_init'] = pd.to_datetime(df['forecast_init'])

df['ffd_failure_found'] = (df['min_bust_delta_humidity'] != 0.0).astype(int)

def get_ai_risk_cat(p):
    if p < 0.20:
        return 'LOW'
    elif p < 0.50:
        return 'ELEVATED'
    else:
        return 'HIGH'

df['ai_risk_category'] = df['baseline_p_bust'].apply(get_ai_risk_cat)

def get_stress_ev(row):
    if row['ffd_failure_found'] == 0:
        return 'NO_FAILURE_FOUND_WITHIN_TESTED_RANGE'
    elif row['ffd'] < 0.50 or row['fragility_category'] == 'HIGH FRAGILITY':
        return 'HIGHLY_FRAGILE'
    elif row['ffd'] < 0.85 or row['fragility_category'] == 'MODERATE FRAGILITY':
        return 'MODERATELY_FRAGILE'
    else:
        return 'ROBUST_WITHIN_TESTED_RANGE'

df['stress_evidence'] = df.apply(get_stress_ev, axis=1)

def get_hist_ev(row):
    if row['analogue_available'] == 0:
        return 'NO_HISTORY'
    elif row['analogue_mean_bust_rate'] >= 0.40:
        return 'HIGH HISTORICAL BUST SUPPORT'
    elif row['analogue_mean_bust_rate'] >= 0.15:
        return 'MIXED HISTORICAL SUPPORT'
    else:
        return 'LOW HISTORICAL BUST SUPPORT'

df['history_evidence'] = df.apply(get_hist_ev, axis=1)

def get_dna_ev(sim):
    if sim >= 0.90:
        return 'HIGH HISTORICAL FAILURE PATTERN MATCH'
    elif sim >= 0.80:
        return 'MODERATE MATCH'
    else:
        return 'LOW MATCH'

df['dna_evidence'] = df['failure_dna_max_sim'].apply(get_dna_ev)

risk_votes = []
stable_votes = []

for idx, row in df.iterrows():
    r_cnt = 0
    s_cnt = 0
    
    if row['stress_evidence'] in ['HIGHLY_FRAGILE', 'MODERATELY_FRAGILE']:
        r_cnt += 1
    elif row['stress_evidence'] in ['ROBUST_WITHIN_TESTED_RANGE', 'NO_FAILURE_FOUND_WITHIN_TESTED_RANGE']:
        s_cnt += 1
        
    if row['history_evidence'] == 'HIGH HISTORICAL BUST SUPPORT':
        r_cnt += 1
    elif row['history_evidence'] == 'LOW HISTORICAL BUST SUPPORT':
        s_cnt += 1
        
    if row['dna_evidence'] == 'HIGH HISTORICAL FAILURE PATTERN MATCH':
        r_cnt += 1
        
    if row['ensemble_disagreement_category'] == 'HIGH':
        r_cnt += 1
    elif row['ensemble_disagreement_category'] == 'LOW':
        s_cnt += 1
        
    if row['ood_category'] == 'HIGHLY NOVEL':
        r_cnt += 1
    elif row['ood_category'] == 'FAMILIAR':
        s_cnt += 1
        
    risk_votes.append(r_cnt)
    stable_votes.append(s_cnt)

df['supporting_evidence_count'] = stable_votes
df['contradicting_evidence_count'] = risk_votes

def get_status(row):
    ai_cat = row['ai_risk_category']
    r_cnt = row['contradicting_evidence_count']
    s_cnt = row['supporting_evidence_count']
    ood_cat = row['ood_category']
    hist_ev = row['history_evidence']
    
    if ai_cat == 'LOW' and r_cnt >= 2:
        return 'CONFLICT / POSSIBLE BLIND SPOT'
    elif ai_cat == 'HIGH' and s_cnt >= 2 and r_cnt == 0:
        return 'CONFLICT / POSSIBLE BLIND SPOT'
    elif ood_cat == 'HIGHLY NOVEL' and (hist_ev == 'NO_HISTORY' or r_cnt >= 2):
        return 'EXPERT REVIEW'
    elif ai_cat in ['ELEVATED', 'HIGH'] and r_cnt >= 1:
        return 'SUPPORTED WARNING'
    elif hist_ev == 'NO_HISTORY' and ai_cat == 'LOW' and r_cnt < 2:
        return 'INSUFFICIENT EVIDENCE'
    elif ai_cat in ['ELEVATED', 'HIGH']:
        return 'SUPPORTED WARNING'
    else:
        return 'SUPPORTED RELIABILITY'

df['self_audit_status'] = df.apply(get_status, axis=1)

def get_reason(row):
    st = row['self_audit_status']
    if st == 'SUPPORTED RELIABILITY':
        return "Low Bust AI risk and independent evidence is mostly stable."
    elif st == 'SUPPORTED WARNING':
        return "High Bust AI risk supported by elevated stress fragility and historical failure evidence."
    elif st == 'CONFLICT / POSSIBLE BLIND SPOT':
        return "Low Bust AI risk conflicts with elevated stress fragility and high ensemble disagreement."
    elif st == 'INSUFFICIENT EVIDENCE':
        return "No prior analogue history available and low baseline risk."
    else:
        return "Highly novel atmospheric state with limited historical support; expert review recommended."

df['self_audit_reason'] = df.apply(get_reason, axis=1)

scores = []
for idx, row in df.iterrows():
    sc = 100.0
    sc -= (row['baseline_p_bust'] * 40.0)
    
    if row['stress_evidence'] == 'HIGHLY_FRAGILE':
        sc -= 20.0
    elif row['stress_evidence'] == 'MODERATELY_FRAGILE':
        sc -= 10.0
        
    if row['history_evidence'] == 'HIGH HISTORICAL BUST SUPPORT':
        sc -= 20.0
    elif row['history_evidence'] == 'MIXED HISTORICAL SUPPORT':
        sc -= 10.0
        
    if row['ensemble_disagreement_category'] == 'HIGH':
        sc -= 15.0
    elif row['ensemble_disagreement_category'] == 'MODERATE':
        sc -= 5.0
        
    if row['ood_category'] == 'HIGHLY NOVEL':
        sc -= 15.0
    elif row['ood_category'] == 'UNUSUAL':
        sc -= 5.0
        
    if row['dna_evidence'] == 'HIGH HISTORICAL FAILURE PATTERN MATCH':
        sc -= 10.0
        
    scores.append(float(np.clip(sc, 0.0, 100.0)))

df['trust_index'] = np.round(scores, 2)

def get_band(st):
    if st == 'SUPPORTED RELIABILITY':
        return 'GREEN'
    elif st == 'INSUFFICIENT EVIDENCE':
        return 'YELLOW'
    else:
        return 'RED'

df['reliability_band'] = df['self_audit_status'].apply(get_band)

def get_vuln(corr):
    if corr == 'Moisture-Driven Instability':
        return 'Moisture Sensitivity'
    elif corr == 'Wind / Circulation Sensitive':
        return 'Wind / Circulation Sensitivity'
    else:
        return 'Mixed Atmospheric Sensitivity'

df['primary_vulnerability'] = df['failure_corridor_label'].apply(get_vuln)

df = df.sort_values(by=['forecast_init', 'latitude', 'longitude', 'lead_day']).reset_index(drop=True)

th_days = []
bp_days = []

grid_groups = df.groupby(['forecast_init', 'latitude', 'longitude'])

for (init_dt, lat, lon), g_df in grid_groups:
    g_sorted = g_df.sort_values(by='lead_day').reset_index(drop=True)
    bands = g_sorted['reliability_band'].values
    
    bp = None
    for i in range(len(bands) - 1):
        if bands[i] == 'RED' and bands[i+1] == 'RED':
            bp = int(g_sorted.loc[i, 'lead_day'])
            break
            
    if bp is not None:
        th = max(1, bp - 1)
        bp_val = float(bp)
    else:
        th = 10
        bp_val = np.nan
        
    for l_day in g_sorted['lead_day'].values:
        th_days.append(th)
        bp_days.append(bp_val)

df['trust_horizon_day'] = th_days
df['breaking_point_day'] = bp_days

df.to_parquet("FORTRESS/data/processed/FORTRESS_SELF_AUDIT.parquet", index=False)

reg_records = []
reg_groups = df.groupby(['forecast_init', 'region', 'lead_day'])

for (init_dt, reg_name, l_day), r_df in reg_groups:
    n_tot = len(r_df)
    g_frac = float((r_df['reliability_band'] == 'GREEN').sum() / n_tot)
    y_frac = float((r_df['reliability_band'] == 'YELLOW').sum() / n_tot)
    r_frac = float((r_df['reliability_band'] == 'RED').sum() / n_tot)
    med_trust = float(r_df['trust_index'].median())
    
    if r_frac >= 0.20:
        reg_band = 'RED'
    elif y_frac >= 0.30 or g_frac < 0.70:
        reg_band = 'YELLOW'
    else:
        reg_band = 'GREEN'
        
    reg_records.append({
        'forecast_init': init_dt,
        'region': reg_name,
        'lead_day': l_day,
        'green_fraction': np.round(g_frac, 4),
        'yellow_fraction': np.round(y_frac, 4),
        'red_fraction': np.round(r_frac, 4),
        'median_trust_index': np.round(med_trust, 2),
        'regional_reliability_band': reg_band
    })

reg_df = pd.DataFrame(reg_records)
reg_df = reg_df.sort_values(by=['forecast_init', 'region', 'lead_day']).reset_index(drop=True)

reg_th_list = []
reg_bp_list = []

for (init_dt, reg_name), g_df in reg_df.groupby(['forecast_init', 'region']):
    g_sorted = g_df.sort_values(by='lead_day').reset_index(drop=True)
    r_bands = g_sorted['regional_reliability_band'].values
    
    bp = None
    for i in range(len(r_bands) - 1):
        if r_bands[i] == 'RED' and r_bands[i+1] == 'RED':
            bp = int(g_sorted.loc[i, 'lead_day'])
            break
            
    if bp is not None:
        th = max(1, bp - 1)
        bp_val = float(bp)
    else:
        th = 10
        bp_val = np.nan
        
    for l_day in g_sorted['lead_day'].values:
        reg_th_list.append(th)
        reg_bp_list.append(bp_val)

reg_df['regional_trust_horizon_day'] = reg_th_list
reg_df['regional_breaking_point_day'] = reg_bp_list

reg_df.to_parquet("FORTRESS/data/processed/FORTRESS_TRUST_HORIZON.parquet", index=False)
print("SUCCESS: Phase 7 execution complete!", flush=True)
