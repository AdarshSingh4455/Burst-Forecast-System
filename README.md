# FORTRESS
### Forecast Reliability Stress-Testing & Self-Audit System

> FORTRESS does not replace the weather forecast — it estimates where, when and how confidently that forecast can be trusted.

---

## About

Medium-range numerical weather prediction (NWP) models frequently provide valuable guidance, but they can occasionally suffer from large, unexpected prediction failures—termed **forecast busts**—especially during rapidly evolving synoptic events like active monsoon surges, heavy convective precipitation, and sudden cyclonic depressions.

FORTRESS introduces an AI-driven forecast reliability and self-audit intelligence layer on top of operational multi-member ensemble forecasts. Rather than attempting to predict the weather anew, FORTRESS evaluates the trustworthiness of existing forecasts and answers five critical operational questions:

1. **Where** is the forecast at risk of becoming unreliable?
2. **At which lead time** (D1–D10) does reliability start degrading?
3. **What is the estimated bust probability** ($P_{\text{bust}}$)?
4. **Why** is confidence low (underlying physical sensitivities and ensemble spread)?
5. **Does independent evidence** support or conflict with the AI signal?

---

## Key Features

* **Forecast Bust Probability — $P(\text{Bust})$**: Calibrated probability estimating the risk of extreme error exceeding the 95th historical percentile.
* **Forecast Confidence Map**: Spatial GIS visualization categorizing reliability into operational trust tiers across lead times.
* **Error-Prone Area Detection**: Automated identification of localized geographic pockets with heightened error vulnerability.
* **D1–D10 Reliability Analysis**: Continuous lead-time trajectory tracking to evaluate forecast skill degradation from Day 1 to Day 10.
* **Reliability Bands**: Categorization into standardized operational risk bands (`GREEN` — Reliable, `YELLOW` — Caution, `RED` — Lower Trust / Review).
* **Prototype Diagnostic Trust Index**: Composite metric ($0–100$) reflecting agreement across AI, stress testing, and historical analogues.
* **Trust Horizon**: The latest lead day through which the forecast sequence remains robust and actionable.
* **Breaking Point**: The lead time beyond which severe forecast degradation persists.
* **Stress Lab**: Synthetic perturbation laboratory evaluating forecast vulnerability to atmospheric shifts.
* **Forecast Failure Distance (FFD)**: Proposed diagnostic metric quantifying how small a physical perturbation is required to induce forecast failure.
* **6D Failure Fingerprint**: Multi-dimensional diagnostic profile mapping failure sensitivities across physical and ensemble dimensions.
* **Historical Analogues**: Non-parametric k-nearest neighbors matching against verified historical reforecast cases.
* **Failure DNA**: Cosine similarity matching against historical forecast busts to detect recurring failure modes.
* **GEFS Ensemble Disagreement**: Quantified member spread and inter-member variance across the forecast ensemble.
* **OOD / Novelty Detection**: Unsupervised anomaly detection isolating unusual atmospheric patterns outside the training distribution.
* **Independent Evidence**: Four decoupled validation streams that operate independently of the primary AI prediction.
* **Self-Audit System**: Automated consensus engine synthesizing AI risk against independent evidence to detect potential blind spots.
* **Sequence Analysis**: Markov state transition probability modeling sequence evolution across lead times.
* **Reliability Passport**: Standardized, printable, and downloadable diagnostic audit card for weather-sensitive operations.
* **Decision Support**: Operational advisory layers providing human-in-the-loop guidance for infrastructure and emergency planning.

---

## Supported Prototype Regions

The current prototype provides validated reliability data exclusively for three meteorological domains:

1. **Eastern Uttar Pradesh** (Pilot Domain: $24.5^\circ\text{N} - 28.5^\circ\text{N},\ 80.0^\circ\text{E} - 84.5^\circ\text{E}$, 323 grid points)
2. **Central India** (Synoptic Domain: $20.0^\circ\text{N} - 24.5^\circ\text{N},\ 76.0^\circ\text{E} - 82.0^\circ\text{E}$, 323 grid points)
3. **Northwest India** (Synoptic Domain: $28.0^\circ\text{N} - 32.5^\circ\text{N},\ 74.0^\circ\text{E} - 80.0^\circ\text{E}$, 323 grid points)

> **Scope Clarification**: The current prototype contains reliability data only for these three domains. It does not provide pan-India operational coverage.

---

## Data Sources

* **Forecast Source — NOAA GEFSv12 Reforecast**:
  Retrospective ensemble reforecasts initialized at 00Z. Features are derived from 5 ensemble members:
  - `c00` (Control member)
  - `p01`, `p02`, `p03`, `p04` (Perturbed ensemble members)
  - Atmospheric predictors: 2m Temperature (`tmp_2m`), Specific Humidity (`spfh_2m`), Mean Sea Level Pressure (`pres_msl`), Precipitable Water (`pwat_eatm`), 10m Wind components (`u10_10m`, `v10_10m`), and Total Precipitation (`apcp_sfc`).
* **Reference Observation — ERA5 Reanalysis**:
  Copernicus Climate Change Service / ECMWF ERA5 reanalysis daily precipitation archive.
  *Note*: ERA5 is used as an objective reanalysis reference for validation and retrospective labeling; it is not described as perfect physical ground truth.

---

## Model Architecture

* **Bust Risk AI**:
  - Classifier: **Random Forest** (ensemble of 100 decision trees)
  - Post-Processing: **Isotonic Calibration** for empirical probability calibration
* **Out-of-Distribution (OOD) / Novelty Detector**:
  - Algorithm: **IsolationForest** trained on baseline feature spaces to identify out-of-distribution synoptic states.
* **Stress Diagnostic**:
  - **Forecast Failure Distance (FFD)**: Experimental diagnostic evaluating model sensitivity under controlled moisture, temperature, pressure, and wind perturbations.

---

## 6D Failure Fingerprint

Forecast vulnerabilities are mapped across exactly six normalized diagnostic axes:

1. **Moisture**: Atmospheric moisture transport, precipitable water anomaly, and specific humidity.
2. **Temperature**: 2m thermal gradient and regional deviations.
3. **Pressure**: Mean sea level synoptic pressure anomalies and localized pressure tendencies.
4. **Wind**: 10m zonal and meridional kinetic energy and shear.
5. **Ensemble**: GEFS inter-member variance and spread-skill deficiency.
6. **Novelty**: Statistical anomaly score relative to historical training distribution.

---

## Independent Evidence

The self-audit framework relies on four decoupled evidence components:

1. **Historical Analogues**: Prior reforecast matching evaluating past bust frequencies under similar conditions.
2. **Failure DNA**: Cosine similarity against an established database of historical forecast busts.
3. **GEFS Ensemble Disagreement**: Direct ensemble dispersion metrics reflecting physical atmospheric chaos.
4. **OOD / Novelty**: Unsupervised isolation forest flagging unrepresentative synoptic regimes.

---

## Self-Audit Statuses

The agreement between the primary AI signal and independent evidence streams results in five distinct self-audit statuses:

* `SUPPORTED RELIABILITY`: AI indicates low bust risk, corroborated by low ensemble spread and strong historical analogues.
* `SUPPORTED WARNING`: AI flags elevated bust risk, verified by independent evidence (e.g., high ensemble divergence or high Failure DNA similarity).
* `CONFLICT / POSSIBLE BLIND SPOT`: Disagreement between the AI prediction and independent physical evidence, highlighting potential model blind spots.
* `INSUFFICIENT EVIDENCE`: Rare or data-sparse synoptic regime where analogue coverage is insufficient for conclusive validation.
* `EXPERT REVIEW`: Borderline confidence scores or contradictory physical indicators requiring human meteorological review.

---

## Validation & Benchmarks

The multi-region model was evaluated across selected initialization samples spanning 2017–2019 (not a continuous full 3-year climatology) with chronologically separated training and testing splits:

* **Total Dataset**: 348,840 forecast state rows
* **Held-out Test Sample**: 116,280 rows (evaluated on unseen initialization dates across all three prototype regions)
* **Model Evaluation Metrics on Held-out Test Data**:

| Metric | Raw Uncalibrated Model | Calibrated Model (Isotonic) |
| :--- | :---: | :---: |
| **ROC-AUC** | 0.8567 | 0.8561 |
| **PR-AUC** | 0.6408 | 0.6408 |
| **Brier Score** | 0.1173 | 0.1178 |

*Note on Calibration*: Isotonic calibration aligns predicted probabilities with observed empirical frequencies for probability reliability and interpretability; it does not claim to arbitrarily minimize Brier score over raw uncalibrated predictions.

---

## Tech Stack

* **Frontend**:
  - React 18
  - TypeScript
  - Vite
  - Leaflet & React-Leaflet
  - Recharts
  - Lucide React
  - Tailwind CSS
* **Backend**:
  - FastAPI
  - Python 3.11
  - Uvicorn
* **AI & Scientific Data Processing**:
  - scikit-learn (RandomForestClassifier, IsotonicRegression, IsolationForest)
  - Pandas
  - NumPy
  - PyArrow (Parquet)

---

## Project Structure

```
FORTRESS/
├── backend/
│   └── app/
│       ├── main.py
│       ├── data_service.py
│       ├── reservoir_service.py
│       ├── agriculture_service.py
│       ├── disaster_service.py
│       ├── renewable_service.py
│       ├── phase11_service.py
│       ├── assistant_service.py
│       └── schemas.py
├── configs/
│   └── regions.json
├── data/
│   └── processed/
├── docs/
│   ├── figures/
│   ├── final_feature_inventory.md
│   ├── final_judge_qa.md
│   └── final_research_references.md
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── views/
│   │   ├── lib/api.ts
│   │   └── types/index.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── models/
│   ├── fortress_bust_model_phase11.pkl
│   ├── fortress_bust_model.pkl
│   └── fortress_ood_model.pkl
├── scripts/
│   ├── train_bust_risk_ai_phase11.py
│   ├── run_stress_lab.py
│   └── validate_phase12_final.py
├── tests/
│   ├── test_agriculture_decision_support.py
│   ├── test_disaster_decision_support.py
│   ├── test_multilingual_assistant.py
│   ├── test_renewable_grid_decision_support.py
│   ├── test_reservoir_decision_support.py
│   └── test_voice_assistant_contract.py
├── .env.example
├── .gitignore
├── requirements.txt
└── README.md
```

---

## Setup & Execution

### 1. Environment Setup

Clone the repository and create a Python virtual environment:

```bash
git clone https://github.com/Cyber-Greecks/Burst-Forecast-System.git
cd Burst-Forecast-System/FORTRESS

# Activate conda or venv
conda activate fortress
# or: python -m venv .venv && source .venv/bin/activate (on Windows: .venv\Scripts\activate)

# Install Python dependencies
pip install -r requirements.txt
```

### 2. Backend Service

Start the FastAPI application:

```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

The API documentation is accessible at `http://127.0.0.1:8000/docs`.

### 3. Frontend Application

Install Node packages and run the Vite development server:

```bash
cd frontend
npm install
npm run dev
```

The user interface will be live at `http://127.0.0.1:3000`.

### 4. Running Verification Tests

Run the backend unit test suite:

```bash
python -m unittest discover tests
```

Run frontend TypeScript compilation and production build verification:

```bash
cd frontend
npm run build
```

---

## Environment Variables

Configuration options can be supplied via a `.env` file based on `.env.example`:

```ini
# API Client URL (used by Vite frontend)
VITE_API_URL=http://127.0.0.1:8000/api

# Backend Server Host & Port
HOST=127.0.0.1
PORT=8000
ENVIRONMENT=development
```

---

## Decision Support Modules

FORTRESS provides operational risk interpretation across four key sectors:

1. **Reservoir & Dam Management**: Monitored pre-release advisories and inflow uncertainty assessments.
2. **Agriculture & Farmers**: Sowing and harvesting vulnerability windows based on rainfall reliability.
3. **Disaster Preparedness**: Pre-positioning warnings and lead-time alert reliability for state relief agencies.
4. **Renewable Energy Grid**: Surface wind speed reliability and grid stability decision-support indices (Note: direct solar irradiance forecasting is not integrated in the prototype).

> **Operational Guardrail**: All advisories are for decision-support and risk context only. FORTRESS does not issue official weather warnings and does not perform automatic operational control or physical actuation.

---

## Research & Data References

1. **NOAA GEFSv12 Reforecast**:
   Hamill, T. M., et al. (2022). *The Version 12 Global Ensemble Forecast System (GEFSv12) Reforecast Dataset*. Monthly Weather Review. [NOAA Open Data Portal](https://registry.opendata.aws/noaa-gefs-retrospective/)
2. **ERA5 Reanalysis**:
   Hersbach, H., et al. (2020). *The ERA5 global reanalysis*. Quarterly Journal of the Royal Meteorological Society. [Copernicus Climate Data Store](https://cds.climate.copernicus.eu/)
3. **Forecast Verification & Calibration**:
   Gneiting, T., & Raftery, A. E. (2007). *Strictly proper scoring rules, prediction, and estimation*. Journal of the American Statistical Association.
4. **Isotonic Probability Calibration**:
   Zadrozny, B., & Elkan, C. (2002). *Transforming classifier scores into accurate multiclass probability estimates*. KDD.

---

## Visualizations & Documentation

Scientific evaluation figures and calibration curves are located in `docs/figures/`:
* `docs/figures/calibration_curves.png`: Reliability calibration curves across raw and calibrated probabilities.
* `docs/figures/breaking_point_distribution.png`: Frequency distribution of lead-time breaking points.
* `docs/figures/leadwise_roc_prevalence.png`: ROC-AUC performance and event prevalence across lead days D1–D10.
* `docs/figures/region_metric_comparison.png`: Metric breakdown across the three prototype domains.

---

## Disclaimer

**FORTRESS is a research prototype developed for forecast reliability analysis, stress-testing, and decision-support modeling. It does not issue official meteorological warnings or replace the statutory authority of official forecasting bodies (such as IMD/NCMRWF) or professional meteorological/hydrological expert judgment.**
