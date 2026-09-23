# FORTRESS — Forecast Reliability Stress-Testing & Self-Audit System

**Problem Statement ID:** SIH26079  
**Title:** AI-Based Forecast Bust Detection for Medium-Range Weather Forecasts  
**Organization:** Ministry of Earth Sciences (MoES) — NCMRWF  
**Category:** Software  

---

## 1. Project Core Identity

**FORTRESS** is NOT another weather forecasting model. It is a **trust, reliability, stress-testing, explainability, and vulnerability layer** built on top of existing numerical weather prediction (NWP) ensemble systems (such as NOAA GEFSv12).

> *"Weather forecast dena nahi — weather forecast par kab aur kitna bharosa karna hai, ye batana."*

```
Standard NWP System:   Weather Forecast  --->  User
FORTRESS Architecture: Weather Forecast  --->  [ FORTRESS Reliability Layer ]  --->  Trust Horizon & Self-Audit  --->  User
```

---

## 2. Current 12-Phase Master Roadmap

| Phase | Description | Status |
| :--- | :--- | :--- |
| **Phase 1** | Foundation + Historical Forecast Feature Pipeline (NOAA GEFSv12) | **COMPLETE** |
| **Phase 2** | Historical Forecast Error + Bust Dataset (ERA5 Reference) | **COMPLETE** |
| **Phase 3** | Bust Risk AI (Random Forest + Isotonic Calibration) | **COMPLETE** |
| **Phase 4** | Forecast Stress Lab + Forecast Failure Distance (FFD) | **COMPLETE** |
| **Phase 5** | Failure Intelligence (Corridors & 6D Fingerprints) | **COMPLETE** |
| **Phase 6** | Independent Evidence Layer (Analogues, Failure DNA, Ensemble, OOD) | **COMPLETE** |
| **Phase 7** | AI Self-Audit + Trust Horizon + Breaking Point | **NEXT** |
| **Phase 8** | Backend API + Dashboard + Reliability Passport | **PLANNED** |
| **Phase 9** | Decision-Support Extensions (Agriculture, Disaster, Urban) | **PLANNED** |
| **Phase 10** | AI Assistant + Multilingual Voice Interface | **PLANNED** |
| **Phase 11** | Multi-Region / Multi-Year Expansion | **PLANNED** |
| **Phase 12** | Scientific Validation & Operational Handoff | **PLANNED** |

---

## 3. Data Strategy & Scope

### Implemented Pilot Scope
- **Forecast Source**: Real NOAA GEFSv12 Reforecast (AWS S3 `noaa-gefs-retrospective`)
- **Reference Observation Source**: Open-Meteo ERA5 / ERA5-Land Reanalysis Daily Archive API
- **Region**: Eastern Uttar Pradesh Pilot Box (24.5°N – 28.5°N, 80.0°E – 84.5°E)
- **Grid Resolution**: 0.25° (~25 km), 323 grid points
- **Forecast Lead Days**: D1 to D10
- **Forecast Initialization Dates**: 12 historical dates across 2019 monsoon & winter season
- **Master Dataset Volume**: 38,760 forecast state rows (12 dates × 323 grid points × 10 lead days)

### Forecast Predictor Inventory
- **Ensemble Members (5)**: `c00` (control), `p01`, `p02`, `p03`, `p04` (perturbed)
- **Implemented Atmospheric Variables**:
  - `temp_2m_c`: 2m Temperature (°C)
  - `specific_humidity_gkg`: 2m Specific Humidity (g/kg)
  - `mslp_hpa`: Mean Sea Level Pressure (hPa)
  - `pwat_mm`: Precipitable Water (mm liquid equivalent)
  - `u10_mean_ms`, `v10_mean_ms`, `wind_speed_mean_ms`: 10m Wind Vector & Speed (m/s)
- **Candidate Predictors (Planned Expansion)**:
  - 850 hPa U/V Wind, 850 hPa Humidity, 500 hPa Geopotential Height, Vertical Velocity, CAPE, Moisture Convergence, Weather Regimes.

---

## 4. Operational Pipeline Architecture (Phases 1–6)

1. **Feature Extraction (`scripts/batch_build_dates.py`)**:
   - Extract ensemble rainfall accumulations (summing 4 non-overlapping 6-hour blocks for exact 24h totals) and 3-hourly atmospheric state statistics across D1-D10.
   - Saves: `data/processed/FORTRESS_GEFS_HISTORY.parquet`

2. **Observed Error & Bust Labeling (`scripts/build_obs_and_bust_labels.py`)**:
   - Integrates ERA5 daily reference rainfall, computes absolute error $|F_{mean} - Obs|$, and constructs lead-wise 95th percentile error thresholds (`bust_threshold`).
   - Saves: `data/processed/FORTRESS_BUST_INDIA.parquet` (1,940 bust labels out of 38,760 rows).

3. **Bust Risk AI (`scripts/train_bust_risk_ai.py`)**:
   - Trains calibrated Random Forest on chronologically separated dates ($\le \text{2019-08-30}$ train vs $\ge \text{2019-09-01}$ test).
   - Test ROC-AUC = 0.8329, Brier Score = 0.0447.
   - Saves: `models/fortress_bust_model.pkl`

4. **Forecast Stress Lab (`scripts/run_stress_lab.py`)**:
   - Evaluates 50 meteorologically constrained perturbation scenarios per forecast state.
   - Computes Forecast Failure Distance (`ffd`), minimum bust scenarios, and fragility curves across humidity, temp, pressure, wind.
   - Saves: `data/processed/FORTRESS_STRESS_RESULTS.parquet`

5. **Failure Intelligence (`scripts/build_failure_intelligence.py`)**:
   - Clusters failure sensitivity vectors into $K=2$ Failure Corridors (`Moisture-Driven Instability` & `Wind/Circulation Sensitive`, Silhouette Score = 0.8704).
   - Constructs normalized 6D Failure Fingerprints (0–100 percentile scale) and `fragility_auc`.
   - Saves: `data/processed/FORTRESS_FAILURE_CORRIDORS.parquet`, `FORTRESS_FAILURE_FINGERPRINTS.parquet`, `FORTRESS_FAILURE_INTELLIGENCE.parquet`

6. **Independent Evidence Layer (`scripts/build_independent_evidence.py`)**:
   - Decoupled 4-stream verification without data leakage:
     - **Historical Analogues**: Strict leak-free prior KNN search ($T_{prior} < T$) saving `FORTRESS_HISTORICAL_ANALOGUES.parquet`.
     - **Failure DNA**: 6D fingerprint cosine similarity against verified prior busts (`failure_dna_risk_flag`).
     - **Ensemble Evidence**: Lead-wise spread and range percentile ranks (`ensemble_disagreement_score`).
     - **OOD / Novelty Detection**: Leak-free `IsolationForest` trained on training dates saving `models/fortress_ood_model.pkl`.
   - Saves: `data/processed/FORTRESS_INDEPENDENT_EVIDENCE.parquet` (38,760 rows, 87 columns, 0 missing values).

---

## 5. Automated Verification & Verification Suite

Run the automated Phase 1–6 audit suite:
```bash
python scripts/validate_fortress_phase1_to_phase6.py
```
All 14 scientific and data invariant checks pass with zero duplicate keys, zero missing values, and zero temporal leakage.

---

## 6. Project Status Summary

- **Implementation**: COMPLETE (Phases 1–6)
- **Technical Validation**: VERIFIED & REPRODUCIBLE
- **Scientific Validation Status**: Prototype Implemented / Multi-Year Operational Validation Pending

---

## 7. Known Prototype Limitations

1. **Pilot Scope**: 12 initialization dates over Eastern UP pilot box (multi-year, multi-region expansion planned for Phase 11).
2. **Q95 Threshold Definition**: prototype quantile error cutoff; operational deployment will use climatological historical baselines.
3. **Cosine Similarity Heuristics**: Failure DNA similarity threshold (0.85) is an empirical heuristic on positive rank vectors.
4. **Ensemble Size**: 5 GEFS reforecast members (`c00`, `p01`-`p04`); operational 31-member GEFS expansion planned.
