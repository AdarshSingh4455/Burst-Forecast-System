# FORTRESS Phase 11 Executive Summary & Judge Briefing
## SIH26079 — Forecast Reliability Stress-Testing & Self-Audit System

### Problem Statement
Operational weather forecast models and numerical weather prediction (NWP) ensembles frequently exhibit localized "forecast busts"—sudden, catastrophic drops in forecast skill during high-impact weather events. AI risk wrappers often output uncalibrated confidence probabilities without stress-testing their predictions against atmospheric perturbations, leading to hidden blind spots.

---

### Solution: The FORTRESS Engine
FORTRESS is an automated stress-testing and self-audit reliability system that stress-tests forecast predictions across multi-variable physical perturbations, detects failure corridors, matches historical failure patterns, and computes a diagnostic Trust Index and Trust Horizon.

---

### How It Works
1. **Multi-Region Ensemble Baseline**: Evaluates 348,840 forecast states across 3 prototype regions in India (`CENTRAL`, `NORTHWEST`, `EASTERN UP`) against 100% genuine ERA5 reanalysis reference observations.
2. **Stress Lab & FFD**: Subjects forecast states to 50 normalized 4D physical perturbations ($q, T, P, W$) to discover the minimum Forecast Failure Distance (FFD).
3. **Failure Corridors & Fingerprints**: Clusters failure sensitivity profiles into 4 prototype failure-pattern clusters and computes 6D Failure Fingerprints.
4. **Independent Evidence Integration**: Combines prior-only historical analogues ($97.22\%$ coverage), Failure DNA cosine similarity, ensemble spread, and IsolationForest OOD detection ($22.81\%$ highly novel rate).
5. **Self-Audit & Trust Horizon**: Maps risk and evidence votes into 5 Self-Audit statuses (`SUPPORTED RELIABILITY`, `SUPPORTED WARNING`, `CONFLICT`, `INSUFFICIENT EVIDENCE`, `EXPERT REVIEW`) and computes the Prototype Diagnostic Trust Index ($0-100$) and sequence-level Trust Horizon.

---

### Core Technology Stack
- **Backend API**: Python 3.11, FastAPI, Uvicorn, Pandas, NumPy, Scikit-learn, SciPy.
- **Frontend Dashboard**: React 18, Vite, Tailwind CSS, Lucide icons, Leaflet interactive maps.
- **AI Models**: Random Forest Classifier + Isotonic Calibration (`ROC-AUC = 0.8561`, `Brier = 0.1178`).
- **Grounded Assistant**: Multilingual LLM explanation pipeline with evidence grounding (English, Hindi, Hinglish).

---

### Key Empirical Validation Findings (2019 Held-Out Test Set)
- **GREEN Reliability Band**: Retrospective observed bust rate = **`5.70%`** ($N = 55,532$).
- **RED Reliability Band**: Retrospective observed bust rate = **`36.99%`** ($N = 60,748$).
- **Average Trust Horizon**: **`6.42 days`** across 34,884 forecast sequences.
- **Regression Suite**: 100% pass rate across all 11 development phases.

---

### Prototype Disclaimers & Claim Limitations
- **Evaluation Scope**: Prototype diagnostic evaluation across 3 rectangular analysis domains in India. No national administrative coverage or operational deployment is claimed.
- **Diagnostic Definitions**: FFD is a stress-based fragility indicator; Trust Index is a diagnostic decision-support indicator, not a calibrated correctness probability.
