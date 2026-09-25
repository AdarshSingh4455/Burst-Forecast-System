# FORTRESS Demo Walkthrough: Phase 1 to Phase 11
## Judge & Evaluator Guided Demonstration Flow

### Overview
This document provides a step-by-step demonstration walkthrough of the FORTRESS Forecast Reliability Stress-Testing & Self-Audit System across all development phases (Phase 1 through Phase 11).

---

### Step-by-Step Demo Walkthrough

#### Step 1: Open System Overview
- **Action**: Navigate to `Overview` tab.
- **Display**: High-level platform status, active model version (`Phase 11 AI`), multi-region coverage metrics, and baseline performance summary.

#### Step 2: Select Prototype Region
- **Action**: Use the global Multi-Region Selector. Choose **`Central India Prototype`** (`CENTRAL_INDIA_RECT`).
- **Display**: Map centers on $[21.75^\circ\text{N}, 78.75^\circ\text{E}]$ showing the 323 grid points covering Central India.

#### Step 3: Select Forecast Initialization & Lead Day
- **Action**: Select Initialization Date `2019-07-01 00:00:00` and Lead Day **`D5`**.
- **Display**: Updated spatial grid map rendering baseline $P(\text{Bust})$, ensemble rainfall, and reliability status for all 323 grid points.

#### Step 4: Inspect Baseline Bust Risk $P(\text{Bust})$
- **Action**: Click on grid point $[21.75^\circ\text{N}, 78.75^\circ\text{E}]$.
- **Display**: Calibrated baseline bust probability $P(\text{Bust}) = 0.2450$ (ELEVATED risk).

#### Step 5: Stress Lab & Forecast Failure Distance (FFD)
- **Action**: Open the `Stress Lab` module.
- **Display**:
  - Stress Result: `Failure found at FFD = 0.4287`
  - Dominant Vulnerability Dimension: `Moisture (+2 g/kg)`
  - Fragility Curve: Vectorized stress response across 50 normalized perturbation scenarios.
  - Disclaimer: *"Experimental stress-based fragility diagnostic."*

#### Step 6: 6D Failure Fingerprints & Corridors
- **Action**: Open `Failure Intelligence` tab.
- **Display**:
  - Prototype Failure-Pattern Cluster: `Corridor 2` (Thermal/pressure co-dominant sensitivity cluster).
  - 6D Fingerprint Radar / Bar Breakdown: Moisture (62%), Temperature (81%), Pressure (75%), Wind (45%), Ensemble Spread (68%), Novelty (72%).

#### Step 7: Historical Analogues & Independent Evidence OOD
- **Action**: Open `Independent Evidence` tab.
- **Display**:
  - Prior-Only Analogue Availability: `97.22%` ($T' < T$ prior history search).
  - Top Analogue Match: 2018-07-15 ($T' < T$, bust rate = 40.0%).
  - Independent Evidence OOD: `78.50` (`UNUSUAL` category, non-parametric IsolationForest tree path length anomaly).

#### Step 8: Self-Audit & Diagnostic Trust Index
- **Action**: Open `Self-Audit` tab.
- **Display**:
  - Supporting Evidence Count: 2
  - Contradicting Evidence Count: 2
  - Self-Audit Status: **`CONFLICT / POSSIBLE BLIND SPOT`**
  - Tooltip: *"AI prediction and supporting evidence disagree; this is not a confirmed model failure."*
  - Prototype Diagnostic Trust Index: **`62.5 / 100`** (Reliability Band: **`RED`**).

#### Step 9: Trust Horizon & Breaking Point
- **Action**: Open `Trust Horizon` view.
- **Display**:
  - Lead Timeline D1–D10: D1 (GREEN), D2 (GREEN), D3 (GREEN), D4 (RED), D5 (RED), D6 (RED)...
  - Prototype Trust Horizon: **3 days** (last lead before sustained RED transition).
  - Diagnostic Breaking Point: **D4** (first sustained RED transition).

#### Step 10: Reliability Passport Export
- **Action**: Click `Reliability Passport`.
- **Display**: Complete cryptographic JSON passport summarizing baseline risk, stress FFD, fingerprint, analogues, OOD score, self-audit status, trust index, and disclaimer.

#### Step 11: Sectoral Decision-Support Modules
- **Action**: Open `Decision Support` $\rightarrow$ `Reservoirs` / `Agriculture` / `Disaster` / `Renewable`.
- **Display**: Sectoral what-if scenario testing combining physical sector thresholds with Phase 11 reliability context.

#### Step 12: Multilingual Grounded Voice Assistant
- **Action**: Click Voice Assistant button and speak/type in Hinglish: *"Why is confidence low here at D5?"*
- **Response**: Assistant responds using active context: *"D5 pe model $P(\text{Bust})$ 0.245 hai, lekin stress lab me high moisture sensitivity ki wajah se Self-Audit status CONFLICT / POSSIBLE BLIND SPOT hai aur Trust Band RED hai."*
