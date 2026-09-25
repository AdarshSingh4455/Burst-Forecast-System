# FORTRESS Phase 11A + 11B: Multi-Year Data Pipeline Generalization & Expansion

## 1. Overview & Purpose
Phase 11 generalizes the Phase 1 NOAA GEFSv12 forecast data construction pipeline to support automated, config-driven, multi-year historical forecast ingestion without altering or breaking the frozen Phase 1–10 scientific prototype baseline (`phase1-10-final`).

Phase 11A/11B focuses strictly on creating a **balanced multi-year forecast-history dataset by annual run count** for the canonical pilot region (Eastern UP, 24.5°N–28.5°N, 80.0°E–84.5°E, 323 grid points, D1–D10 lead days).

---

## 2. Sample Progression & Temporal Distribution
1. **Initial Controlled Sample (Checkpoint 286cb73)**:
   - Total Forecast Runs: **20 initializations** (64,600 rows)
   - Distribution: 2017: 7 runs, 2018: 1 run, 2019: 12 runs
2. **Balanced Expanded Sample**:
   - Total Forecast Runs: **36 initializations** (116,280 rows)
   - Annual Distribution (balanced by annual run count):
     - **2017 = 12** runs (1 run per calendar month, Jan–Dec)
     - **2018 = 12** runs (1 run per calendar month, Jan–Dec)
     - **2019 = 12** runs (1 Jan, 2 Jun, 3 Jul, 3 Aug, 3 Sep, with 2019 monthly clustering retained from the accepted existing sample)

---

## 3. Baseline Protection & Hash Invariance
The following Phase 1–10 baseline scientific artifacts and models are 100% frozen and unmodified:
- `data/processed/FORTRESS_GEFS_HISTORY.parquet` (SHA-256: `5f24182b...`)
- `data/processed/FORTRESS_BUST_INDIA.parquet` (SHA-256: `fee4e52e...`)
- `data/processed/FORTRESS_INDEPENDENT_EVIDENCE.parquet` (SHA-256: `4a011978...`)
- `data/processed/FORTRESS_SELF_AUDIT.parquet` (SHA-256: `ef3215ee...`)
- `models/fortress_bust_model.pkl` (SHA-256: `4538ae2d...`)

Phase 11 outputs strictly write to new filenames:
- Multi-Year Parquet: `data/processed/FORTRESS_GEFS_MULTIYEAR.parquet`
- Manifest: `data/processed/FORTRESS_GEFS_MULTIYEAR_MANIFEST.json`

---

## 4. Key Pipeline Improvements & Features
1. **Config-Driven Architecture** (`configs/phase11_multiyear_data.yaml`):
   - Fully specifies region boundaries, grid resolution, lead days, ensemble members (`c00`, `p01`, `p02`, `p03`, `p04`), target dates, intermediate & final paths.
2. **Flexible Date Generation**:
   - Supports explicit date lists, date range generation, and frequency-based sampling (monthly, weekly) across multi-year historical spans.
3. **Resumable & Idempotent Execution**:
   - Skips re-downloading or re-processing completed intermediate per-date parquet files (`data/phase11/intermediate/fortress_gefs_YYYYMMDD00.parquet`).
4. **Dry-Run & Limit Modes**:
   - `--dry-run`: Validates configuration, date lists, expected row counts, and planned disk operations without downloading.
   - `--limit N`: Restricts execution to the first N dates for quick debugging.
   - `--smoke-test YYYYMMDD00`: Compares output directly against Phase 1 baseline down to 0.00000000 floating difference.
5. **Download & Network Error Handling**:
   - Missing S3 files or network drops are caught gracefully per date, preventing dataset corruption.

---

## 5. Scientific Invariants Preserved
- **Daily Rainfall Calculation**: Daily rainfall = sum of 4 independent, non-overlapping 6-hour precipitation accumulation windows (`[6, 12, 18, 24]` hours from `(lead_day - 1) * 24`).
- **Atmospheric Predictor Transformations**:
  - `temp_2m_c`: $K - 273.15$
  - `specific_humidity_gkg`: $kg/kg \times 1000.0$
  - `mslp_hpa`: $Pa / 100.0$
  - `pwat_mm`: $mm$
  - `wind_speed_mean_ms`: $\sqrt{u_{10}^2 + v_{10}^2}$
- **Canonical Spatial Grid**: Exactly 323 grid points x 10 lead days = 3,230 rows per complete forecast run.

---

## 6. Diagnostic Extremes & Source Verification
- **Temperature Minimum (-14.53 °C)**: The minimum occurs at the northeastern high-elevation edge of the rectangular prototype domain (28.50°N, 84.50°E, D10 lead day) and was source-verified from GEFS 2 m temperature.
- **Temperature Maximum (+43.47 °C)**: The maximum occurs in the south-western plains region (25.50°N, 80.00°E, D4 lead day) during June pre-monsoon heatwave conditions and was source-verified from GEFS 2 m temperature.

---

## 7. Summary Statistics & Manifest
All multi-year execution details are stored in `data/processed/FORTRESS_GEFS_MULTIYEAR_MANIFEST.json`, including date coverage tables, row counts, missing value summaries, and schema column specifications.
