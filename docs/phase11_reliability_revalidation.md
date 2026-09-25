# FORTRESS Phase 11F + 11G + 11H Documentation
## Multi-Year, Multi-Region Forecast Reliability Revalidation & Self-Audit Evaluation

### 1. Purpose
This document provides the prototype scientific evaluation and revalidation of the FORTRESS reliability engine—including the Stress Lab, Forecast Failure Distance (FFD), Failure Corridors, 6D Failure Fingerprints, Independent Evidence (Prior-Only Analogues, Failure DNA, Ensemble Disagreement, OOD/Novelty), Self-Audit, Prototype Diagnostic Trust Index, Trust Horizon, and Breaking Point—across 3 prototype regions in India over a multi-year dataset (2017–2019, 348,840 rows, 34,884 forecast sequences).

---

### 2. Data and Model Checkpoint
- **Model Checkpoint**: `models/fortress_bust_model_phase11.pkl` (Random Forest Classifier + Isotonic Calibration on Validation split).
- **Multi-Region Forecast History**: `data/processed/FORTRESS_GEFS_MULTIYEAR_MULTIREGION.parquet` (108 region-runs, 323 grid points/run, D1–D10 leads).
- **Reference Observations**: `data/processed/FORTRESS_OBS_MULTIYEAR_MULTIREGION.parquet` (100% genuine ERA5 reanalysis reference observations).
- **Target Bust Labels**: `data/processed/FORTRESS_BUST_MULTIYEAR_MULTIREGION.parquet` (Q95 thresholds derived strictly from TRAIN split).

---

### 3. Stress Lab Methodology & Sampling
- **Perturbation Dimensions**: 4 physical atmospheric dimensions ($d_{\text{hum}} \in [-3, +3]$ g/kg, $d_{\text{tmp}} \in [-3, +3]^\circ\text{C}$, $d_{\text{prs}} \in [-5, +5]$ hPa, $d_{\text{wnd}} \in [-5, +5]$ m/s).
- **Evaluation Strategy**: Vectorized prediction over all 348,840 forecast states across 50 normalized perturbation scenarios ($N = 348,840$).
- **Sampling Seed**: 42 (deterministic, scientifically neutral).

---

### 4. Forecast Failure Distance (FFD) Methodology
- **Failure Rule**: A stressed forecast state is classified as a failure when $P(\text{Bust}) \ge 0.50$.
- **FFD Definition**: Minimum normalized perturbation distance $d_{\text{norm}} = \sqrt{(d_{\text{hum}}/3)^2 + (d_{\text{tmp}}/3)^2 + (d_{\text{prs}}/5)^2 + (d_{\text{wnd}}/5)^2}$ among tested scenarios that induces failure.
- **No-Failure Handling**: When no tested scenario reaches $P(\text{Bust}) \ge 0.50$, `ffd_failure_found` is set to `0` and `ffd` is stored as `NaN` (no fake FFD=1.0 assigned).
- **Artifact**: `data/processed/FORTRESS_FFD_PHASE11.parquet`
- **Summary**:
  - Failure Found Rate: **`12.39%`** (43,233 / 348,840)
  - No-Failure Rate: **`87.61%`** (305,607 / 348,840)
  - Median FFD (when failure found): **`0.4287`**

---

### 5. Failure Corridors
- **Clustering**: Evaluated $K=2, 3, 4$ KMeans clustering on 4D sensitivity vector ($\Delta P$ for $+2$ g/kg moisture, $+2^\circ\text{C}$ temp, $-3$ hPa pressure, $+3$ m/s wind).
- **Silhouette Scores**:
  - $K=2$: 0.7750
  - $K=3$: 0.7850
  - **$K=4$**: **`0.7903`** (Selected $K=4$)
- **Terminology**: Classified as **four prototype failure-pattern clusters** (not physical meteorological regimes).
- **Seed & Determinism Audit**:
  - `random_state` / `seed` = **42**
  - Repeated execution with identical seed: **YES** (100% deterministic assignment)
  - Alternate seed stability: Tested seeds 42, 123, 999, 2026. Silhouette score remained stable (0.7903 ± 0.0005) with cluster allocations matching within 0.8% across seeds.
- **Corridor Labels & Cluster Sizes**:
  - **Corridor 1**: **116,964 rows** (33.53%) — Moisture-dominant sensitivity cluster.
  - **Corridor 2**: **119,443 rows** (34.24%) — Thermal/pressure co-dominant sensitivity cluster.
  - **Corridor 3**: **56,128 rows** (16.09%) — Circulation-dominant sensitivity cluster.
  - **Corridor 4**: **56,305 rows** (16.14%) — Compound multi-variable stress sensitivity cluster.
- **Cluster Stability**: Zero degenerate clusters (all clusters exceed 16.0% allocation).

---

### 6. 6D Failure Fingerprints & Novelty vs OOD Distinction
Six bounded rank percentile dimensions [0, 100]:
1. **Moisture Sensitivity**: Rank percentile of moisture perturbation sensitivity.
2. **Temperature Sensitivity**: Rank percentile of thermal perturbation sensitivity.
3. **Pressure Sensitivity**: Rank percentile of barometric perturbation sensitivity.
4. **Wind Sensitivity**: Rank percentile of circulation perturbation sensitivity.
5. **Ensemble Disagreement**: Rank percentile of ensemble spread.
6. **Novelty**: Rank percentile of Euclidean Z-score distance across **4 atmospheric dimensions**:
   - Specific humidity $q$ (`specific_humidity_gkg_mean`)
   - Temperature $T$ (`temp_2m_c_mean`)
   - Surface pressure $P$ (`mslp_hpa_mean`)
   - Wind state $W$ (`wind_speed_mean_ms`, derived scalar wind speed magnitude $W = \sqrt{u_{10}^2 + v_{10}^2}$)

$$D_{\text{novelty}} = \sqrt{\left(\frac{q - \mu_q}{\sigma_q}\right)^2 + \left(\frac{T - \mu_T}{\sigma_T}\right)^2 + \left(\frac{P - \mu_P}{\sigma_P}\right)^2 + \left(\frac{W - \mu_W}{\sigma_W}\right)^2}$$

- **Strict TRAIN-Only Reference Isolation**:
  - Means ($\mu_q, \mu_T, \mu_P, \mu_W$) and standard deviations ($\sigma_q, \sigma_T, \sigma_P, \sigma_W$) are calculated **STRICTLY from the TRAIN split** (`forecast_init <= 2018-06-01`).
  - Empirical cumulative distribution function (ECDF) percentile mapping reference is built **STRICTLY from TRAIN raw novelty distances**.
  - All Validation and Test distances are transformed independently against this frozen TRAIN reference distribution (zero full-corpus test distribution leakage).
- **Artifact**: `data/processed/FORTRESS_FAILURE_FINGERPRINT_PHASE11.parquet`

---

### 7. Historical Analogues (Prior-Only)
- **Leakage Prevention**: For forecast initialization date $T$, candidate analogues are selected **STRICTLY from prior forecast initialization dates ($T' < T$)**.
- **Coverage**:
  - Prior-Only Analogue Availability: **`97.22%`** (339,150 / 348,840 rows)
  - Same-Region Analogue Coverage: 92.4%
  - Cross-Region Analogue Coverage: 97.2%

---

### 8. Failure DNA Threshold Sensitivity Study
- **Method**: Cosine similarity between 6D fingerprint and prior observed bust cases ($T' < T$ and prior `bust_label == 1`).
- **Threshold Sensitivity Analysis**:
  - Threshold 0.80: Match Rate = **19.42%**
  - Threshold 0.85: Match Rate = **8.42%** (Current prototype heuristic threshold)
  - Threshold 0.90: Match Rate = **2.15%**
  - Threshold 0.95: Match Rate = **0.31%**
- **Role**: Prototype heuristic similarity metric for pattern association (does not confirm identical physical failure mechanism).

---

### 9. Ensemble Disagreement
- **Method**: Average of lead-wise rank percentiles of ensemble spread ($\sigma$) and total member range.
- **Caveat**: High ensemble disagreement indicates atmospheric variance, not guaranteed forecast bust.

---

### 10. OOD / Novelty Distinction
- **Method**: `IsolationForest(n_estimators=100, random_state=42)` fitted **STRICTLY on TRAIN split** ($174,420$ rows) over 8 forecast state variables. Applied to Validation and Test sets across all regions.
- **Distinction from Fingerprint Novelty**:
  - *Fingerprint Novelty*: Parametric Z-score distance across 4 atmospheric dimensions ($q, T, P, W$) mapped against frozen TRAIN ECDF.
  - *Independent Evidence OOD*: Non-parametric `IsolationForest` decision score reflecting tree path length anomaly across 8 forecast variables.
  - Both metrics derive all normalization and fitting statistics strictly from the TRAIN split (`forecast_init <= 2018-06-01`).
- **Highly Novel Rate**: **`22.81%`** ($\text{OOD score} \ge 90.0$).
- **Caveat**: High OOD score reflects training-distribution shift, not forecast error.

---

### 11. Self-Audit Logic & Independent Evidence Artifact
- **Artifact**: `data/processed/FORTRESS_INDEPENDENT_EVIDENCE_PHASE11.parquet` and `data/processed/FORTRESS_SELF_AUDIT_PHASE11.parquet`.
- **Status Taxonomy**:
  - `SUPPORTED RELIABILITY`: Low AI risk, stable independent evidence.
  - `SUPPORTED WARNING`: High AI risk supported by elevated stress fragility or historical failure evidence.
  - `CONFLICT / POSSIBLE BLIND SPOT`: Low AI risk conflicting with elevated stress fragility or high ensemble disagreement.
  - `INSUFFICIENT EVIDENCE`: Low AI risk with no prior historical analogue coverage.
  - `EXPERT REVIEW`: Highly novel atmospheric state with limited historical support.

---

### 12. Prototype Diagnostic Trust Index
- **Scale**: 0 to 100 score based on baseline risk and independent evidence penalties.
- **Reliability Bands**:
  - **GREEN**: `SUPPORTED RELIABILITY`
  - **YELLOW**: `INSUFFICIENT EVIDENCE`
  - **RED**: `SUPPORTED WARNING`, `CONFLICT`, `EXPERT REVIEW`

---

### 13. Held-Out Retrospective Test Set Validation (2019 Test Set, 116,280 Rows)

#### Retrospective Observed Bust Rates by Reliability Band:

| Reliability Band | Sample Size ($N$) | Observed Bust Count | Observed Bust Rate | Mean $P(\text{Bust})$ |
| :--- | :---: | :---: | :---: | :---: |
| **`GREEN`** | 55,532 | 3,163 | **`5.70%`** | 0.0499 |
| **`YELLOW`** | 0 | 0 | **`0.00%`** | 0.0000 |
| **`RED`** | 60,748 | 22,468 | **`36.99%`** | 0.3899 |

#### 2019 Test Set Row Accounting & YELLOW Band Explanation:
- In the 2019 held-out test set ($116,280$ rows), prior analogue availability is **100.0%** ($116,280 / 116,280$) because all 2019 initialization dates ($T \ge 2019-01-01$) have prior forecast history available from 2017–2018 ($T' < T$).
- Consequently, exactly **0 rows** were assigned `INSUFFICIENT EVIDENCE` (the sole status mapping to YELLOW).
- Full accounting of all 116,280 test rows:
  - `SUPPORTED RELIABILITY` (GREEN): **55,532 rows** (47.76%)
  - `CONFLICT / POSSIBLE BLIND SPOT` (RED): **18,928 rows** (16.28%)
  - `EXPERT REVIEW` (RED): **37,009 rows** (31.83%)
  - `SUPPORTED WARNING` (RED): **4,811 rows** (4.14%)
  - **Total**: $55,532 + 18,928 + 37,009 + 4,811 = 116,280$ rows (100.0% accounted for, 0 test rows dropped or unclassified).

#### Retrospective Observed Bust Rates by Self-Audit Status:

| Self-Audit Status | Sample Size ($N$) | Observed Bust Count | Observed Bust Rate | Mean $P(\text{Bust})$ |
| :--- | :---: | :---: | :---: | :---: |
| **`SUPPORTED RELIABILITY`** | 55,532 | 3,163 | **`5.70%`** | 0.0499 |
| **`CONFLICT / POSSIBLE BLIND SPOT`** | 18,928 | 2,640 | **`13.95%`** | 0.1203 |
| **`SUPPORTED WARNING`** | 4,811 | 1,314 | **`27.31%`** | 0.3510 |
| **`EXPERT REVIEW`** | 37,009 | 18,514 | **`50.03%`** | 0.5328 |

---

### 14. Trust Horizon & Breaking Point
- **Total Forecast Sequences**: **`34,884`** ($3 \text{ regions} \times 36 \text{ inits} \times 323 \text{ grid points}$).
- **Average Trust Horizon**: **`6.42 days`**
- **Median Trust Horizon**: **`7.00 days`**
- **Sequences Reaching D10 Without RED**: **`47.76%`**
- **Sequences with Breaking Point**: 18,223 ($52.24\%$)
- **Median Breaking Point Lead**: D3
- **Artifact**: `data/processed/FORTRESS_TRUST_HORIZON_PHASE11.parquet`

---

### 15. Region-Wise Reliability Metrics
- **`NORTHWEST_INDIA_RECT`**: Average Trust Horizon = **7.84 days** | GREEN fraction = 62.1%
- **`CENTRAL_INDIA_RECT`**: Average Trust Horizon = **5.61 days** | GREEN fraction = 41.2%
- **`EASTERN_UP_RECT`**: Average Trust Horizon = **5.81 days** | GREEN fraction = 45.4%

---

### 16. Strict Scientific Claim Limits
- **Prototype Diagnostic**: FFD is a stress-based fragility measure, not an established meteorological standard or guaranteed failure proof.
- **Supporting Evidence**: Reliability bands and Self-Audit statuses represent supporting diagnostic indicators derived from stress and historical evidence.
- **Coverage**: Multi-region prototype evaluation across three rectangular analysis domains in India. No national administrative or operational coverage is claimed.

