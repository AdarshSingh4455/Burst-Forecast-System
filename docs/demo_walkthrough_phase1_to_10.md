# FORTRESS Phase 1–10 Master Demonstration & Walkthrough Guide

============================================================  
**PROJECT**: FORTRESS — Forecast Reliability Stress-Testing & Self-Audit System  
**SIH PROBLEM STATEMENT**: SIH26079  
**CORE PITCH**:  
> *"FORTRESS does not replace NWP forecasting. It estimates where, when, and why an existing NWP forecast may become unreliable, explaining model error risk to support downstream operational decisions."*  
============================================================  

---

## 1. Five Core Problem Statement Outcomes

Judges and evaluators can verify the five core requested outcomes directly in the UI:

| Core Outcome | Where to See in FORTRESS | Description |
| :--- | :--- | :--- |
| **A. Forecast Confidence Map** | **Overview** / **India Map** | Grid spatial visualization categorized by GREEN (Reliable), YELLOW (Caution), and RED (High Risk) bands. |
| **B. Forecast Bust Risk** | **Forecast Analytics** | Quantitative model error risk ($P_{\text{bust}}$ %) computed across lead days D1–D10. |
| **C. Error-Prone Area Detection** | **Failure Intelligence** / **Stress Lab** | Automated identification of spatial vulnerability corridors (e.g. Moisture Transport Sensitivity). |
| **D. Explainable Reasons** | **Self-Audit** / **Assistant** | Plain-language synthesis of AI risk predictions against stress lab perturbations, historical analogues, and ensemble spread. |
| **E. Dashboard & API** | **Vite Frontend & FastAPI** | Interactive React UI at `http://127.0.0.1:3000` & 41 audited REST endpoints at `http://127.0.0.1:8000/docs`. |

---

## 2. Recommended 5–7 Minute Demo Walkthrough Storyline

```
1. OVERVIEW & CONFIDENCE MAP
   ↓
2. FORECAST ANALYTICS & BUST RISK
   ↓
3. STRESS LAB (FFD & FRAGILITY)
   ↓
4. FAILURE INTELLIGENCE (FINGERPRINTS)
   ↓
5. INDEPENDENT EVIDENCE (FAILURE DNA)
   ↓
6. SELF-AUDIT SYNTHESIS
   ↓
7. TRUST HORIZON & BREAKING POINT
   ↓
8. RELIABILITY PASSPORT EXPORT
   ↓
9. PHASE 9 OPERATIONAL DECISION SUPPORT (RESERVOIR DEMO)
   ↓
10. MULTILINGUAL & VOICE ASSISTANT DEMO
```

### Step-by-Step Presentation Script

#### Step 1: Overview & India Grid Map
- Open `http://127.0.0.1:3000` (Overview View).
- Show the interactive Eastern UP pilot grid map ($24.5^\circ\text{N} \le \text{lat} \le 28.5^\circ\text{N}$, $80.0^\circ\text{E} \le \text{lon} \le 84.5^\circ\text{E}$).
- Highlight color-coded reliability bands: GREEN (High Trust), YELLOW (Moderate Risk), RED (High Error Risk).

#### Step 2: Forecast Analytics & Bust Risk
- Click on an error-prone grid point (e.g. `25.75°N, 82.00°E` on Lead Day D5).
- Demonstrate the **Bust Probability** score ($P_{\text{bust}} = 62\%$). Explain: *"This is not probability of rain; it measures estimated NWP model error risk."*

#### Step 3: Stress Lab (Fast Failure Direction - FFD)
- Navigate to **Stress Lab**.
- Show the Fast Failure Direction (FFD) score ($0.32$).
- Explain: *"FFD tests forecast fragility under minor atmospheric perturbations (+1.2°C temperature / +15% moisture). A low FFD means small errors push forecasts over the failure boundary."*

#### Step 4: Failure Intelligence & Atmospheric Fingerprints
- Navigate to **Failure Intelligence**.
- Show the primary vulnerability corridor (*Moisture Transport Sensitivity*) and 6-dimensional error fingerprint.

#### Step 5: Independent Evidence & Failure DNA
- Navigate to **Independent Evidence**.
- Show historical pattern matching via **Failure DNA** vector similarity and nearest historical analogues.

#### Step 6: Self-Audit Synthesis
- Navigate to **Self-Audit**.
- Show how FORTRESS synthesizes AI risk predictions with stress evidence and ensemble spread into an audited verdict (e.g. `SUPPORTED_WARNING` or `CONFLICT_POSSIBLE_BLIND_SPOT`) and computes the **Trust Index** ($78/100$).

#### Step 7: Trust Horizon & Breaking Point
- Navigate to **Trust Horizon**.
- Demonstrate the lead-time timeline: forecast reliability remains usable up to **Trust Horizon D5**, with sustained RED deterioration (**Breaking Point**) starting at Day 6.

#### Step 8: Reliability Passport Export
- Navigate to **Reliability Passport**.
- Show the unified printable/exportable forecast passport summarizing all scientific metrics for the selected location.

#### Step 9: Phase 9 Operational Decision Support (Primary: Reservoir)
- Navigate to **Decision Support** -> **Reservoir**.
- Demonstrate how NWP reliability context guides reservoir inflow risk management (`RES_MEJA`). Show What-If scenario testing.

#### Step 10: Multilingual & Voice Assistant Demo
- Click the floating **AI Assistant** button (or navigate to AI Assistant view).
- Switch language to **Hinglish**: Ask *"D5 pe forecast risky kyun hai?"*
- Click the **Microphone** button to demonstrate browser-native voice input.
- Click **Listen** to hear the grounded text answer spoken aloud via browser speech synthesis.

---

## 3. Pre-Configured Demonstration Contexts

| Scenario | Run Init Date | Lead Day | Latitude / Longitude | Key Expected Diagnostics |
| :--- | :--- | :---: | :---: | :--- |
| **Demo Context A** *(Reliable Baseline)* | `2019-07-01 00:00:00` | **D1** | `26.75°N, 83.37°E` | **GREEN** Band, Low Bust Risk (<15%), High FFD (>0.80), High Trust Index (>90/100). |
| **Demo Context B** *(Fragile / High Risk)* | `2019-07-01 00:00:00` | **D5** | `25.75°N, 82.00°E` | **RED** Band, High Bust Risk (~62%), Low FFD (~0.32), Moisture Sensitivity, Breaking Point D6. |
| **Demo Context C** *(Self-Audit & Attention Status)* | `2019-07-31 00:00:00` | **D5** | `24.50°N, 80.00°E` | **YELLOW/RED** Band, Self-Audit Status: `SUPPORTED_WARNING` (Decision-Support Attention: `HIGH_UNCERTAINTY_EXPERT_REVIEW`). |

---

## 4. Phase 9 Operational Modules Summary

1. **Phase 9A Reservoir Decision Support** (*Primary Decision-Support Demo*): Integrates inflow volume uncertainty and storage level what-if scenarios (`RES_MEJA`).
2. **Phase 9B Agriculture Decision Support**: Evaluates weather-sensitive farming windows and dry-spell diagnostics (`AGRI_EUP_01`).
3. **Phase 9C Disaster Management Support**: Synthesizes heavy rainfall signals with exposure/vulnerability attributes (`DISASTER_EUP_01`).
4. **Phase 9D Renewable Grid Decision Support**: Evaluates 10m wind vector norm diagnostics ($\sqrt{u_{10}^2 + v_{10}^2}$) and grid planning variability (`RENEW_EUP_01`).

---

## 5. Mandatory Safety & Domain Boundaries

1. **Canonical Pilot Bounds**: $24.5^\circ\text{N} \le \text{lat} \le 28.5^\circ\text{N}$, $80.0^\circ\text{E} \le \text{lon} \le 84.5^\circ\text{E}$. Locations outside this domain return strict scientific data suppression.
2. **Decision-Support Scope**: FORTRESS does not issue dam gate commands, official flood warnings, evacuation orders, agricultural prescriptions, or grid dispatch instructions.
3. **10m Wind Speed Formula**: Derived from NOAA GEFS vector components:
   $$\text{wind\_speed\_10m\_ms} = \sqrt{u_{10}^2 + v_{10}^2}$$
4. **Solar Generation**: Surface solar irradiance is not integrated in the current prototype; solar diagnostic is explicitly reported as unavailable.
