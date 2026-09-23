# FORTRESS — Forecast Reliability Stress-Testing & Self-Audit System

> **SIH26079 | Smart India Hackathon 2026**  
> **Team:** Cyber Greecks  
> **Category:** Software  
> **Organization / Department:** MoES / NCMRWF

---

## 1. Project Identity

**FORTRESS** is not another weather forecasting model.

Existing Numerical Weather Prediction (NWP) systems already generate medium-range forecasts for **D1–D10**. FORTRESS acts as a **reliability, vulnerability, stress-testing, explainability and self-audit layer** on top of those forecasts.

### Core Pitch

> **“Do not only ask what the weather forecast says. Ask how much the forecast can be trusted, how close it is to failure, why it may fail, and when reliability starts breaking down.”**

### One-line USP

> **Other systems ask: “Will the forecast fail?” FORTRESS additionally asks: “How easy is it to make the forecast fail?”**

---

## 2. Problem

Medium-range weather forecasts sometimes produce large errors during rapidly evolving systems such as:

- Monsoon depressions
- Heavy rainfall
- Cyclones
- Western disturbances
- Heat waves
- Active / break monsoon phases
- Rapid circulation changes

These large failures are called **forecast busts**.

A bust can affect:

- Disaster management
- Reservoir / dam operations
- Agriculture planning
- Renewable-energy scheduling
- Aviation / logistics
- Government decision-making

FORTRESS focuses on:

- **where** the forecast may fail,
- **when** it may fail,
- **how fragile** it is,
- **why** it is vulnerable,
- and **whether the AI itself should be trusted**.

---

# 3. End-to-End Solution Flow

```text
NWP Forecast / Historical Forecast Archive
                |
                v
       Data Ingestion Layer
                |
                v
     Preprocessing & Alignment
                |
                v
   Historical Forecast Error Cube
                |
                v
       Bust / No-Bust Labels
                |
                v
         Bust Risk AI
                |
                v
       Forecast Stress Lab
                |
      +---------+---------+
      |         |         |
      v         v         v
     FFD   Failure Corridors   Fragility Curve
      |         |         |
      +---------+---------+
                |
                v
       Failure Fingerprint
                |
                v
   Independent Evidence Layer
      |      |       |      |
      v      v       v      v
 Analogues  DNA   Ensemble   OOD
      \       |       |      /
       \______|_______|_____/
                |
                v
          AI Self-Audit
                |
                v
        D1–D10 Trust Horizon
                |
                v
       Forecast Breaking Point
                |
                v
        Reliability Passport
                |
                v
        Decision-Support Layer
```

---

# 4. Core Features

## 4.1 Bust Risk AI

The Bust Risk Engine predicts the probability that a forecast may experience unusually large error.

### Candidate Inputs

- Rainfall
- Temperature
- Relative humidity
- Pressure
- Wind speed
- Wind direction
- 850 hPa U/V winds
- 850 hPa moisture / humidity
- 500 hPa geopotential
- Vertical velocity
- Vorticity
- CAPE
- Moisture convergence
- Ensemble spread
- Historical error behaviour
- Lead day
- Season / weather regime
- Terrain / geographic context
- Pattern novelty

### Output

```text
P(Bust) ∈ [0,1]
```

Example:

```text
Region: Eastern Uttar Pradesh
Lead: D6
Variable: Rainfall
Bust Probability: 0.72
```

---

# 5. Forecast Bust Definition

For a variable `v`, region `r` and lead `L`:

```text
Error(v,r,L) = |Forecast - Verification|
```

A possible bust label:

```text
Bust = 1
if Error > historical threshold
```

The threshold can be region-, lead- and variable-specific.

Example:

```text
Historical Q95 error threshold
```

Q95 is only an example and must be validated.

---

# 6. Forecast Stress Lab

The Stress Lab actively tests forecast vulnerability.

It generates **small meteorologically plausible perturbations** in variables such as:

- Humidity
- Wind speed
- Wind direction
- Pressure
- Temperature
- Moisture / circulation indicators

### Perturbations should be constrained by

- Historical ranges
- Historical covariance
- Ensemble perturbations
- Analysis-error statistics
- Physical bounds
- Regional climatology

The goal is not to create unrealistic weather states.

---

# 7. Forecast Failure Distance — FFD

FFD is the central proposed vulnerability metric.

Given current forecast state `x`, find the nearest plausible state `x + δ` that enters the bust regime.

Conceptually:

```text
FFD(x) = min D(x, x+δ)
```

subject to:

```text
x + δ is meteorologically plausible
AND
forecast response crosses bust criterion
```

### Interpretation

```text
Small FFD  -> failure boundary nearby -> fragile forecast
Large FFD  -> failure state farther away -> comparatively robust
```

### Prototype distance

```text
FFD =
sqrt(
 Δhumidity_norm² +
 Δwind_norm² +
 Δpressure_norm² +
 Δtemperature_norm²
)
```

Advanced versions:

- Mahalanobis distance
- Physics-weighted distance
- Learned latent distance

> **FFD is a proposed research metric and must be validated on held-out history.**

---

# 8. Minimum Bust Scenario

The nearest tested vulnerability state is shown to the user.

```text
Current State
Humidity: 68%
Wind: 14 km/h
Pressure: 1004 hPa

Nearest Tested Failure State
Humidity: 73%
Wind: 17 km/h
Pressure: 1002 hPa

FFD: 0.24
Fragility: HIGH
```

Correct wording:

> **Nearest tested vulnerability scenario**

Do not present it as a prediction that these exact changes will happen.

---

# 9. Failure Corridors

A forecast can fail in more than one way.

FORTRESS groups successful failure perturbations into **multiple failure corridors**.

Examples:

- Moisture Amplification
- Wind / Circulation Shift
- Pressure Instability
- Temperature-Moisture Interaction
- Multi-variable Instability

Prototype flow:

```text
Successful bust perturbations
          |
          v
Normalize perturbation vectors
          |
          v
KMeans clustering
          |
          v
2–4 failure corridors
```

Each corridor returns:

```text
name
frequency
centroid
average_ffd
dominant_variables
```

---

# 10. Failure Fingerprint

The Failure Fingerprint summarizes vulnerability drivers.

Example:

```text
Moisture Sensitivity       91
Wind Sensitivity           73
Pressure Sensitivity       21
Temperature Sensitivity    32
Ensemble Disagreement      82
Pattern Novelty            66
```

Composite label:

```text
Moisture-driven + circulation-sensitive
```

This is a diagnostic signature, not automatically a proven physical causal mechanism.

---

# 11. Forecast Fragility Curve

Stress is increased gradually and the system checks how many perturbations enter the bust regime.

| Stress Level | Busting Perturbations |
|---:|---:|
| 0% | 0% |
| 20% | 8% |
| 40% | 31% |
| 60% | 58% |
| 80% | 76% |
| 100% | 88% |

A fragile forecast rises quickly.

---

# 12. Historical Analogues

FORTRESS finds similar historical weather / forecast states.

Possible methods:

- kNN
- Euclidean distance
- Cosine similarity
- Mahalanobis distance
- Learned embeddings
- FAISS
- pgvector

Possible output:

```text
Top 10 Similar Historical Cases
7 / 10 busted
Historical Bust Rate = 70%
```

---

# 13. Failure DNA

Every historical verified failure can be encoded as a compact vector:

```text
[
 moisture_sensitivity,
 wind_sensitivity,
 pressure_sensitivity,
 temperature_sensitivity,
 ensemble_disagreement,
 novelty,
 normalized_ffd
]
```

For the current forecast:

```text
Current Failure DNA
        |
        v
Cosine Similarity
        |
        +--> Historical Failure A
        +--> Historical Failure B
        +--> Historical Failure C
```

---

# 14. Ensemble Evidence

If ensemble members are available, FORTRESS calculates:

- Mean
- Standard deviation
- Spread
- Range
- Member disagreement
- Distribution

Possible evidence labels:

```text
LOW
MEDIUM
HIGH
```

High ensemble disagreement is treated as an independent uncertainty signal.

---

# 15. OOD / Novelty Detector

The AI should know when it is seeing an unfamiliar weather pattern.

Possible methods:

- Isolation Forest
- Mahalanobis distance
- Local Outlier Factor
- Autoencoder reconstruction error
- Latent-density methods

Example:

```text
Novelty Score: 82 / 100
Status: HIGHLY NOVEL

Limited historical support.
Expert review recommended.
```

---

# 16. AI Self-Audit

FORTRESS does not blindly trust its own Bust AI.

Example:

```text
Bust AI              LOW RISK
FFD                  HIGH FRAGILITY
History              HIGH BUST RATE
Ensemble             HIGH DISAGREEMENT
OOD                  NORMAL
```

Instead of averaging everything:

```text
CONFLICT / POSSIBLE AI BLIND SPOT
```

Possible final statuses:

- SUPPORTED RELIABILITY
- SUPPORTED WARNING
- CONFLICT / POSSIBLE BLIND SPOT
- INSUFFICIENT EVIDENCE
- EXPERT REVIEW

---

# 17. Trust Horizon

FORTRESS summarizes D1–D10 reliability.

```text
D1  GREEN
D2  GREEN
D3  GREEN
D4  GREEN
D5  YELLOW
D6  RED
D7  RED
D8  RED
D9  RED
D10 RED
```

Example:

```text
Trust Horizon ≈ D1–D5
```

Green does not mean guaranteed correct.

---

# 18. Forecast Breaking Point

The Breaking Point is the first lead where reliability sharply deteriorates and stays weak / unstable.

```text
D1 D2 D3 D4 D5 | D6 D7 D8 D9 D10
 G  G  G  G  Y | R  R  R  R   R
                ^
           Breaking Point
```

Output:

```text
Trust Horizon: D1–D5
Breaking Point: D6
Primary Vulnerability: Moisture + Circulation
```

---

# 19. Reliability Passport

Final forecast audit card:

```text
FORTRESS RELIABILITY PASSPORT

Region: Eastern Uttar Pradesh
Variable: Rainfall
Lead: D6

Forecast: 25 mm
Bust Risk: 72%

FFD: 0.24
Fragility: HIGH

Failure Fingerprint:
Moisture-driven + circulation-sensitive

Failure Corridors: 3
Historical Support: STRONG
Ensemble Disagreement: HIGH
Pattern Novelty: MEDIUM

Trust Horizon: D1–D5
Breaking Point: D6

Self-Audit:
SUPPORTED WARNING
```

Footer:

> **Decision-support information — not an official weather warning.**

---

# 20. Post-Event Verification / Forecast Autopsy

After verification data arrives, FORTRESS compares its earlier assessment with reality.

Possible outcomes:

- Correct Warning
- False Alarm
- Missed Bust
- Correct Reliability

Autopsy checks:

- OOD pattern?
- Missing feature?
- Weak analogue?
- Surrogate weakness?
- Poor calibration?
- Too-restrictive perturbation constraints?
- Data-quality issue?

Verified failures are stored in:

```text
Failure Memory
```

Retraining should be controlled, not uncontrolled live self-learning.

---

# 21. Decision-Support Extensions

## 21.1 Reservoir / Dam Release Support

FORTRESS can add reliability context before reservoir operators use rainfall forecasts.

```text
Rainfall Forecast
        |
        v
FORTRESS Reliability Audit
        |
        +--> Bust Risk
        +--> FFD
        +--> Ensemble Disagreement
        +--> Trust Horizon
        |
        v
Reservoir Scenario Layer
        |
        v
Human Expert Decision
```

FORTRESS should not autonomously command water release.

---

## 21.2 Agriculture Planning

Possible applications:

- Sowing
- Irrigation
- Fertilizer timing
- Harvest timing
- Crop protection

Example:

```text
Rain forecast: likely
D5 reliability: fragile

Advisory:
Treat rainfall timing as uncertain and review irrigation schedule.
```

---

## 21.3 Disaster Management

Users:

- NDMA / SDMA
- District administration
- Emergency operation centres
- Meteorological officers

FORTRESS can prioritize:

- High impact + high fragility
- High bust probability
- High ensemble disagreement
- Highly novel situations
- Leads beyond the trust horizon

---

## 21.4 Solar / Wind Grid Forecast Reliability

Weather forecasts affect renewable-power forecasting.

FORTRESS can flag:

- Wind forecast fragility
- Cloud / radiation uncertainty
- Lead-wise generation forecast confidence
- Forecast periods requiring additional reserves / review

Final power-system decisions remain with qualified operators.

---

# 22. AI Assistant / User Query

Possible queries:

```text
Why is D6 rainfall risky?

Show the most fragile lead days.

Why did the AI issue expert review?

Which historical failures look similar?

What is causing the small FFD?
```

The AI assistant translates technical model outputs into understandable explanations.

---

# 23. Multilingual Voice Assistance

Prototype target:

- English
- Hindi
- One regional Indian language

Flow:

```text
User Query
    |
    v
FORTRESS Assistant
    |
    v
Evidence-backed Explanation
    |
    v
Text + Voice Output
```

Example Hindi explanation:

```text
D6 par forecast ki reliability kam ho rahi hai.
Moisture aur wind sensitivity high hai aur historical
similar cases mein forecast bust zyada dekha gaya.
```

---

# 24. Dataset Strategy

FORTRESS can construct its own derived forecast-failure dataset rather than relying on a single ready-made dataset.

## Main Sources

### TIGGE

Use for:

- Historical medium-range forecasts
- D1–D10 lead forecasts
- Ensemble members
- Ensemble spread

Possible variables:

- Precipitation
- 2m temperature
- MSLP
- 850 hPa U/V winds
- 850 hPa humidity
- 500 hPa geopotential

### ERA5

Use as atmospheric reference / reanalysis for:

- Temperature
- Pressure
- Wind
- Humidity
- Geopotential

### NASA GPM IMERG

Use for rainfall verification.

### Optional IMD Data

Possible future India-specific verification:

- Gridded rainfall
- Station observations

Check access and licensing before use.

---

# 25. Derived Dataset — FORTRESS-BUST-INDIA

Example schema:

```text
forecast_init
valid_time
lead_day

latitude
longitude
region

forecast_rain
forecast_temperature
forecast_humidity
forecast_pressure
forecast_u850
forecast_v850
forecast_z500

ensemble_mean
ensemble_spread

observed_rain
observed_temperature
observed_pressure

rain_error
temperature_error

historical_error_percentile
bust_threshold
bust_label

season
weather_regime
terrain_height
pattern_novelty
```

---

# 26. Dataset Creation Flow

```text
TIGGE Historical Forecast
        |
        v
Forecast Valid Time
        |
        +-----------------+
        |                 |
        v                 v
ERA5                 IMERG / IMD
Atmosphere            Rainfall
        |                 |
        +--------+--------+
                 |
                 v
Time / Grid / Unit Alignment
                 |
                 v
Forecast vs Verification
                 |
                 v
Error Calculation
                 |
                 v
Historical Error Distribution
                 |
                 v
Bust Threshold
                 |
                 v
BUST / NO-BUST
                 |
                 v
FORTRESS-BUST-INDIA
```

---

# 27. FORTRESS Event Library

Suggested event categories:

- Monsoon Depressions
- Extreme Rainfall
- Active Monsoon
- Break Monsoon
- Western Disturbances
- Cyclones
- Heat Waves
- Normal / Control Cases

Each event can store:

```text
D1–D10 forecast
Verification
Error evolution
Bust day
Ensemble behaviour
Atmospheric state
Failure fingerprint
Failure DNA
```

---

# 28. Prototype Dataset Scope

Start small:

```text
2–3 years
2–3 Indian regions
D1–D10
Rainfall
Humidity
Wind
Pressure
Temperature
Ensemble spread
```

Then expand.

---

# 29. Train / Validation / Test

Avoid random time-series splitting.

Recommended:

```text
Earlier years -> Train
Later years   -> Validation
Newest unseen years -> Test
```

Also avoid putting the same cyclone / weather system in both train and test.

---

# 30. Evaluation Metrics

Use:

- Precision
- Recall
- F1
- PR-AUC
- ROC-AUC
- Brier Score
- Reliability Diagram
- Calibration Error

Do not rely only on accuracy.

---

# 31. FFD Validation

Hypothesis:

> Forecasts with smaller FFD should show higher observed bust frequency / severity on unseen history.

Test:

```text
1. Compute FFD before verification.
2. Bin forecasts by FFD.
3. Compare real bust rates.
4. Test monotonic relationship.
```

---

# 32. Ablation Study

```text
Historical Baseline
        |
        v
Bust Classifier
        |
        v
+ Historical Analogues
        |
        v
+ Ensemble Evidence
        |
        v
+ FFD
        |
        v
+ Self-Audit
```

Only claim added value if held-out results support it.

---

# 33. Technology Stack

## Languages

- Python 3.11+
- TypeScript
- SQL

## Scientific / Weather

- NumPy
- Pandas
- xarray
- Dask
- SciPy
- MetPy
- cfgrib
- ecCodes
- netCDF4
- Zarr
- GeoPandas
- Rasterio
- Shapely

## ML

- scikit-learn
- XGBoost
- LightGBM
- PyTorch (optional advanced)

## Backend

- FastAPI
- Uvicorn
- Pydantic

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

## Charts

- Plotly.js
- ECharts
- Recharts

## Maps

- MapLibre GL JS
- Leaflet

## Storage

Prototype:

- JSON
- SQLite
- Parquet

Scale:

- PostgreSQL
- PostGIS
- MinIO / S3
- Zarr
- Redis

## MLOps

- MLflow
- DVC
- GitHub
- pytest
- Docker
- Docker Compose

---

# 34. Repository Structure

```text
fortress/
├── README.md
├── LICENSE
├── .gitignore
├── .env.example
├── docker-compose.yml
├── pyproject.toml
│
├── configs/
│   ├── data.yaml
│   ├── model.yaml
│   ├── stress_test.yaml
│   └── self_audit.yaml
│
├── data/
│   ├── raw/
│   ├── interim/
│   ├── processed/
│   ├── event_library/
│   └── synthetic/
│
├── notebooks/
│   ├── 01_data_exploration.ipynb
│   ├── 02_bust_definition.ipynb
│   ├── 03_bust_model.ipynb
│   ├── 04_ffd_experiments.ipynb
│   └── 05_validation.ipynb
│
├── src/fortress/
│   ├── data/
│   ├── features/
│   ├── bust/
│   ├── surrogate/
│   ├── stress/
│   ├── analogues/
│   ├── ensemble/
│   ├── novelty/
│   ├── fusion/
│   ├── decisions/
│   ├── assistant/
│   ├── verification/
│   └── api/
│
├── backend/app/
│   ├── main.py
│   ├── routers/
│   └── services/
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── types/
│
├── tests/
│   ├── test_alignment.py
│   ├── test_bust_labels.py
│   ├── test_constraints.py
│   ├── test_ffd.py
│   ├── test_corridors.py
│   ├── test_ood.py
│   └── test_self_audit.py
│
├── scripts/
│   ├── preprocess.py
│   ├── train_bust_model.py
│   ├── train_surrogate.py
│   ├── compute_ffd.py
│   ├── build_event_library.py
│   └── verify_forecasts.py
│
└── docs/
    ├── architecture.md
    ├── data_dictionary.md
    ├── validation.md
    └── api.md
```

---

# 35. Suggested API Endpoints

```text
GET  /api/health
GET  /api/regions
GET  /api/forecast/{region}

POST /api/predict-bust
POST /api/stress-test

GET  /api/ffd/{region}/{lead}
GET  /api/failure-corridors/{region}/{lead}
GET  /api/fingerprint/{region}/{lead}
GET  /api/fragility-curve/{region}/{lead}

GET  /api/analogues/{region}/{lead}
GET  /api/failure-dna/{region}/{lead}
GET  /api/ensemble/{region}/{lead}
GET  /api/novelty/{region}/{lead}

GET  /api/self-audit/{region}/{lead}
GET  /api/trust-horizon/{region}
GET  /api/breaking-point/{region}

GET  /api/passport/{region}/{lead}

POST /api/query
POST /api/voice/explain
```

Optional:

```text
GET /api/decision/reservoir/{region}
GET /api/decision/agriculture/{region}
GET /api/decision/disaster/{region}
GET /api/decision/renewable-grid/{region}
```

---

# 36. Dashboard Layout

```text
HEADER
FORTRESS
"Don't just forecast the weather. Audit the trust."

CONTROLS
Region | Variable | Lead | Forecast Run

ROW 1
Forecast | Bust Risk | FFD | Fragility | Self-Audit

ROW 2
India Reliability Map

ROW 3
Trust Horizon | Forecast Breaking Point

ROW 4
Fragility Curve | Failure Fingerprint

ROW 5
Failure Corridors

ROW 6
Historical Analogues | Failure DNA

ROW 7
Ensemble Distribution | OOD Gauge

ROW 8
AI Conflict Audit

ROW 9
Reliability Passport

ROW 10
Decision-Support Modules

ROW 11
AI Query / Voice Assistant
```

---

# 37. Synthetic Prototype

For SIH demo, use deterministic synthetic weather data.

Suggested regions:

- Eastern Uttar Pradesh
- Western Uttar Pradesh
- Delhi NCR
- Rajasthan
- Madhya Pradesh
- Maharashtra
- Odisha
- West Bengal
- Assam
- Kerala
- Tamil Nadu

Generate D1–D10:

- Rainfall
- Temperature
- Humidity
- Pressure
- Wind speed / direction
- Geopotential proxy
- Ensemble spread
- Historical error
- Pattern novelty

Use a fixed random seed.

---

# 38. Required Demo Cases

## Stable

```text
Low Bust Risk
Large FFD
Low Ensemble Spread
Familiar Pattern
```

## High Risk

```text
High Bust Risk
Historical evidence supports warning
```

## Fragile

```text
Moderate Risk
Small FFD
High sensitivity
```

## AI Blind Spot

```text
Bust AI = Low
FFD = High Fragility
History = Risky
Ensemble = High Disagreement

Result:
CONFLICT / POSSIBLE BLIND SPOT
```

## OOD

```text
Highly Novel
Limited Historical Support
Expert Review
```

## Breaking Point

```text
D1–D4 Stable
D5 Caution
D6+ Weak

Breaking Point = D6
```

---

# 39. Hero SIH Demo

Recommended scenario:

```text
Region: Eastern Uttar Pradesh
Variable: Rainfall
Lead: D6
```

Story:

1. Forecast initially appears normal.
2. Bust AI shows elevated risk.
3. Stress Lab tests plausible nearby states.
4. Small FFD is discovered.
5. Multiple failure corridors appear.
6. Fingerprint shows moisture + wind sensitivity.
7. Historical failures look similar.
8. Ensemble disagreement is high.
9. Self-Audit compares all evidence.
10. Trust begins degrading around D5.
11. Breaking Point appears around D6.
12. Reliability Passport recommends expert attention.

---

# 40. Development Phases

## Phase 1
- Repository
- Schemas
- Synthetic data
- Preprocessing
- Bust labels

## Phase 2
- Bust AI
- Calibration
- Basic dashboard

## Phase 3
- Stress Lab
- FFD
- Minimum Bust Scenario

## Phase 4
- Failure Corridors
- Failure Fingerprint
- Fragility Curve

## Phase 5
- Historical Analogues
- Failure DNA
- Ensemble Evidence
- OOD

## Phase 6
- AI Self-Audit
- Trust Horizon
- Breaking Point
- Reliability Passport

## Phase 7
- Reservoir
- Agriculture
- Disaster
- Renewable Grid

## Phase 8
- AI Query
- Multilingual Voice

## Phase 9
- Real TIGGE / ERA5 / IMERG integration

---

# 41. Testing

Unit tests:

- Data alignment
- Bust labels
- Calibration
- Perturbation constraints
- FFD
- No-failure case
- Corridor clustering
- DNA similarity
- Ensemble calculations
- OOD
- Self-Audit

API tests:

```text
/api/health
/api/regions
/api/predict-bust
/api/stress-test
/api/trust-horizon
/api/passport
```

UI checks:

- Region switch works
- D1–D10 works
- Graphs update
- No dead buttons
- No fake hard-coded metric presented as calculated
- Prototype disclaimer visible

---

# 42. Deployment

MVP:

```text
Docker Compose
```

Services:

```text
frontend -> Next.js
backend  -> FastAPI
db       -> SQLite / PostgreSQL
redis    -> optional
```

Kubernetes is not required for SIH MVP.

---

# 43. Local Development

## Backend

```bash
cd backend
python -m venv .venv

# Linux / macOS
source .venv/bin/activate

# Windows
.venv\Scripts\activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Docker

```bash
docker compose up --build
```

---

# 44. Example Environment

```env
FORTRESS_ENV=development

BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000

FRONTEND_URL=http://localhost:3000

DATABASE_URL=sqlite:///./fortress.db

USE_SYNTHETIC_DATA=true

STRESS_TEST_SAMPLES=300
BUST_THRESHOLD=0.60

DEFAULT_LANGUAGE=en
```

---

# 45. Prototype Labels

Always show:

```text
Prototype using synthetic weather data.
```

For FFD:

```text
Prototype vulnerability metric — not operationally validated.
```

For observation / inspection hints:

```text
Experimental diagnostic suggestion.
```

Final disclaimer:

```text
Decision-support information — not an official weather warning.
```

---

# 46. Innovation Positioning

FORTRESS should **not** claim that every underlying method is world-first.

Existing concepts already include:

- Ensemble forecasting
- Historical analogues
- Perturbation methods
- Sensitivity analysis
- Counterfactual ML
- Explainability
- OOD detection

The proposed differentiation is the integrated bust-specific workflow:

```text
Bust Risk
+
Forecast Failure Distance
+
Failure Corridors
+
Failure Fingerprint
+
Fragility Curve
+
Failure DNA
+
Independent Evidence
+
AI Self-Audit
+
Trust Horizon
+
Breaking Point
+
Reliability Passport
```

Best positioning:

> **FORTRESS is not merely a bust detector. It is a forecast vulnerability auditor: predict → stress-test → cross-check → explain → verify.**

---

# 47. Do Not Overclaim

Avoid:

- “World’s first”
- “100% accurate”
- “Guaranteed forecast reliability”
- “FFD is scientifically proven”
- “AI knows the exact physical cause”
- “FORTRESS automatically decides dam releases”

until scientifically validated.

---

# 48. Definition of Done

The prototype is complete when a user can:

1. Select a region.
2. Select D1–D10.
3. View forecast data.
4. See calculated Bust Risk.
5. Run Stress Test.
6. See FFD.
7. See Minimum Bust Scenario.
8. See Failure Corridors.
9. See Failure Fingerprint.
10. See Fragility Curve.
11. See Historical Analogues.
12. See Failure DNA.
13. See Ensemble Evidence.
14. See OOD.
15. See AI Self-Audit.
16. See Trust Horizon.
17. See Breaking Point.
18. Generate Reliability Passport.
19. Open decision-support use cases.
20. Ask a natural-language question.
21. Receive multilingual / voice explanation.
22. Change region or lead and get updated results.
23. Clearly see the prototype disclaimer.

---

# 49. Project Status

```text
Project Concept                 Complete
PRD                             Complete
TRD                             Complete
SIH Presentation                Complete
Dataset Strategy                Defined
Synthetic Prototype Design      Defined
Bust AI                         Prototype / Planned
Stress Lab                      Prototype / Planned
FFD                             Proposed / To Validate
Failure Corridors               Planned
Failure Fingerprint             Planned
Failure DNA                     Planned
AI Self-Audit                   Planned
Trust Horizon                   Planned
Reliability Passport            Planned
Decision Modules                Planned
Multilingual AI Assistant       Planned
Real NWP Integration            Next Phase
```

---

# 50. Final Pitch

> **FORTRESS does not replace weather forecasting. It makes weather forecasts more trustworthy by detecting bust risk, stress-testing vulnerability, cross-checking independent evidence, and showing when a forecast deserves human attention.**

---

## Team

**Cyber Greecks**

## Problem Statement

**SIH26079 — AI-Based Forecast Bust Detection for Medium-Range Weather Forecasts**

## Final Identity

**FORTRESS — Forecast Reliability Stress-Testing & Self-Audit System**

> **A Forecast Failure Laboratory for Medium-Range Weather Forecasts.**

---

## Disclaimer

This repository currently describes a **research and SIH prototype architecture**.

Synthetic outputs, FFD values, reliability labels, observation priorities and decision-support suggestions must not be used as official meteorological warnings or autonomous high-stakes operational decisions without scientific validation, domain review and operational integration.
