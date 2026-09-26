# FORTRESS — Final Judge Summary (SIH26079)

---

## 1. Problem
Numerical Weather Prediction (NWP) models (e.g. GEFS) frequently experience localized rainfall forecast failures ("busts") during extreme Indian monsoons. Meteorologists cannot manually inspect thousands of grid cells daily, leading to unmonitored forecast risk.

## 2. Solution
FORTRESS is an automated Forecast Reliability Stress-Testing & Self-Audit System. It evaluates baseline forecast risk alongside independent evidence streams (OOD novelty, Failure DNA, Ensemble Disagreement, FFD fragility) to generate automated Reliability Passports, Trust Indices, and Color-Coded Reliability Badges (GREEN / YELLOW / RED).

## 3. Why FORTRESS is Different
Unlike standard weather apps that display raw ensemble forecasts, FORTRESS **self-audits the forecast itself**, identifying potential AI blind spots and atmospheric novelty before dissemination.

## 4. How it Works
1. Ingests GEFS 10-day ensemble predictions and ERA5 observational reference data.
2. AI model predicts probability of failure $P(\text{Bust})$.
3. Evidence engine checks OOD novelty, Failure DNA matches ($\ge 0.90$), and Forecast Fragility Direction (FFD).
4. Decision rules assign diagnostic statuses and Trust Index (0–100).
5. Outputs contiguous Trust Horizons (D1–D10) and breaking point warnings.

## 5. Key Implemented Features
- **Bust Risk AI**: Machine learning bust classifier.
- **Stress Lab & FFD**: Initial condition perturbation testing.
- **Failure DNA**: 6D failure fingerprinting and similarity search.
- **Self-Audit Engine**: 5 diagnostic statuses + Trust Index + GREEN/YELLOW/RED bands.
- **Trust Horizon & Breaking Point**: Contiguous safe lead-time calculation.
- **Multi-Region Dashboard & Sector Modules**: Agriculture, Reservoirs, Disaster, Energy.
- **Multilingual Assistant & Voice Interaction**: Interactive Q&A support.

## 6. Scientific Validation
- Evaluated on 348,840 multi-region forecast grid rows across Eastern UP, Northwest India, and Central India (2017–2019).
- Held-out 2019 TEST evaluation ($N = 116,280$): **0.8567 ROC-AUC**, **0.6408 PR-AUC**, **0.1173 Brier Score**.
- Retrospective RED-vs-GREEN separation ratio of approximately **6.5x** (GREEN bust rate = 5.70%, RED bust rate = 37.02%).

## 7. Current Metrics Summary
- **Held-Out TEST ROC-AUC**: 0.8567
- **GREEN Band Bust Rate**: 5.70%
- **RED Band Bust Rate**: 37.02%
- **TEST Mean Trust Horizon**: 4.65 Days (Median 4.0 Days)

## 8. Real-World Usefulness
Provides decision-support for disaster management agencies, reservoir operators, and agricultural planners by warning when numerical weather models are likely to fail.

## 9. Limitations
- Research prototype evaluated on 3 rectangular sub-domains in India.
- Retrospective evaluation using ERA5 reanalysis reference.
- Does not automate physical control of dams or power grids.

## 10. Demo Flow
1. Overview & Region Selection -> 2. Lead Day Navigation -> 3. Forecast Analytics & $P(\text{Bust})$ -> 4. Stress Lab & FFD -> 5. Failure Intelligence & DNA -> 6. Self-Audit & Trust Horizon -> 7. Reliability Passport -> 8. Sector Modules & Multilingual Voice Assistant.

---
**Final One-Line Pitch**: *FORTRESS brings automated self-auditing to weather forecasting, ensuring decision-makers know when to trust the forecast and when to prepare for model failure.*
