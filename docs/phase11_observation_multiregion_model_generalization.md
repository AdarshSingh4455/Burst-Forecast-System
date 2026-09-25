# FORTRESS Phase 11C + 11D + 11E Documentation
## Multi-Year Observation/Error Expansion, Multi-Region Foundation & Leakage-Safe Bust Model Generalization

### 1. Executive Summary
Phase 11C/D/E expands the FORTRESS baseline from a single-region prototype into a multi-year, multi-region prototype benchmark across three rectangular analysis domains in India. It introduces 100% genuine ERA5 reference observations across 3 prototype regions, computes absolute forecast errors, establishes temporal-split Q95 bust thresholds strictly from training data, and trains a multi-region leakage-safe Bust Risk AI model.

---

### 2. Prototype Regions Definition & Geometry
The multi-region setup defines three rectangular analysis domains in India, each containing 323 grid points ($17 \text{ lats} \times 19 \text{ lons}$ at $0.25^\circ$ resolution):

1. **`EASTERN_UP_RECT`** (Eastern Uttar Pradesh Prototype):
   - Latitudes: $24.50^\circ\text{N} - 28.50^\circ\text{N}$ (17 lats)
   - Longitudes: $80.00^\circ\text{E} - 84.50^\circ\text{E}$ (19 lons)
   - Points: 323 ($17 \times 19$)
   - Microclimate: Gangetic plains, heavy monsoon convective rain, high flood vulnerability.

2. **`NORTHWEST_INDIA_RECT`** (Northwest India Prototype):
   - Latitudes: $26.00^\circ\text{N} - 30.00^\circ\text{N}$ (17 lats)
   - Longitudes: $73.00^\circ\text{E} - 77.50^\circ\text{E}$ (19 lons)
   - Points: 323 ($17 \times 19$)
   - Microclimate: Arid/semi-arid, western disturbances, low rainfall frequency, high variance.

3. **`CENTRAL_INDIA_RECT`** (Central India Prototype):
   - Latitudes: $19.00^\circ\text{N} - 23.00^\circ\text{N}$ (17 lats)
   - Longitudes: $76.00^\circ\text{E} - 80.50^\circ\text{E}$ (19 lons)
   - Points: 323 ($17 \times 19$)
   - Microclimate: Central plateau, monsoonal depression corridor, agricultural river basins.

---

### 3. Multi-Year Dataset Specifications & Temporal Splits
Across 36 forecast initializations (12/year in 2017, 2018, 2019):

- **Total Forecast Rows**: $108 \text{ region-runs} \times 3,230 \text{ rows/run} = 348,840 \text{ rows}$
- **Observation Cache Provenance**:
  - Historical fallback: F/G — forecast-derived synthetic placeholder, REMOVED.
  - Current observation source: 100% genuine ERA5 reanalysis reference observations obtained through Open-Meteo ERA5 API.
  - Current fallback target rows: 0
  - Synthetic/imputed target rows: 0
  - Observation Cache Rows: $980,628 \text{ rows}$ (100% genuine ERA5 reanalysis records fetched from Open-Meteo API)
    - `EASTERN_UP_RECT`: 326,876 rows ($1,012 \text{ dates} \times 323 \text{ points}$)
    - `NORTHWEST_INDIA_RECT`: 326,876 rows ($1,012 \text{ dates} \times 323 \text{ points}$)
    - `CENTRAL_INDIA_RECT`: 326,876 rows ($1,012 \text{ dates} \times 323 \text{ points}$)
  - **Target Match Cardinality**: $348,840 / 348,840$ (100.00% 1-to-1 match for all forecast target valid dates).
- **Temporal Splits**:
  - **TRAIN**: 2017-01-01 to 2018-06-01 (18 inits per region, 54 total, 174,420 rows)
  - **VALIDATION**: 2018-07-01 to 2018-12-01 (6 inits per region, 18 total, 58,140 rows)
  - **TEST**: 2019-01-01 to 2019-09-30 (12 inits per region, 36 total, 116,280 rows, held-out 2019 initialization sample)

---

### 4. Zero Target Leakage & Threshold Calculation
To eliminate target leakage:
- **Threshold Rule**: Lead-wise 95th percentile absolute error ($| \text{ensemble\_mean} - \text{observed} |$) is computed **STRICTLY from the TRAIN split (2017 + Jan–Jun 2018)**.
- **Applied Thresholds**:
  - D01: 10.8475 mm
  - D02: 7.6992 mm
  - D03: 6.1399 mm
  - D04: 7.6190 mm
  - D05: 8.2400 mm
  - D06: 9.9000 mm
  - D07: 11.6600 mm
  - D08: 11.7000 mm
  - D09: 12.8980 mm
  - D10: 11.9200 mm
- **Bust Label**: $\text{bust\_label} = \mathbb{I}(\text{rain\_error\_mm} > \text{bust\_threshold})$.

---

### 5. Multi-Region Bust Risk AI Performance (2019 Held-Out Test Set)
Model: **Random Forest Classifier + Isotonic Probability Calibration**

- **Overall Held-Out Test Set Metrics (2019)**:
  - After rebuilding labels from genuine ERA5 reference observations and retraining, held-out 2019 ROC-AUC was 0.8561.
  - **ROC-AUC**: 0.8561
  - **PR-AUC**: 0.6269
  - **Brier Score**: 0.1178
  - **Precision**: 0.6290
  - **Recall**: 0.6077
  - **F1 Score**: 0.6182
  - **Classification Threshold**: 0.50

- **Region-Wise Test Metrics**:
  - `NORTHWEST_INDIA_RECT`: ROC-AUC = 0.8792 | PR-AUC = 0.5807 | Brier = 0.0658
  - `CENTRAL_INDIA_RECT`: ROC-AUC = 0.8493 | PR-AUC = 0.6917 | Brier = 0.1460
  - `EASTERN_UP_RECT`: ROC-AUC = 0.8021 | PR-AUC = 0.5661 | Brier = 0.1415

- **Cross-Region Generalization (Leave-One-Region-Out Folds)**:
  - Held-out `CENTRAL_INDIA_RECT`: ROC-AUC = 0.8502
  - Held-out `NORTHWEST_INDIA_RECT`: ROC-AUC = 0.8491
  - Held-out `EASTERN_UP_RECT`: ROC-AUC = 0.7877

---

### 6. Validation Summary
- `scripts/validate_phase11_cde.py`: **27/27 PASS**
- `scripts/validate_phase11_multiyear_data.py`: **24/24 PASS**
- Baseline Regression (`validate_fortress_phase1_to_phase6.py`): **14/14 PASS**
- Sectoral & API Test Suites: **100% PASS (41 Endpoints Audited)**
