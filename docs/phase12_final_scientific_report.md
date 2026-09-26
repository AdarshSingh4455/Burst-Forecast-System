# FORTRESS Phase 12 Final Scientific Synthesis Report

> [!IMPORTANT]
> **Scientific Protocol Compliance Notice**: This report synthesizes all scientific findings of FORTRESS (Phase 1 through Phase 12). Evaluation is strictly performed on the frozen Phase 1–11 binaries (`models/fortress_bust_model_phase11.pkl`) and held-out 2019 test data (`data/processed/FORTRESS_BUST_MULTIYEAR_MULTIREGION.parquet`). Zero thresholds or model weights were tuned on held-out test data.

---

## 1. Executive Summary

FORTRESS (Forecast Reliability Stress-Testing & Self-Audit System) is an automated reliability monitoring and diagnostic self-audit platform designed for numerical weather predictions across India. Phase 12 synthesizes all experimental evaluations across Phase 12A–F into a frozen release pack.

Key Scientific Achievements:
- **AI Bust Risk Detector**: Achieves held-out 2019 test ROC-AUC of **0.8567** (uncalibrated) and **0.8561** (isotonic calibrated) across 116,280 forecast grid evaluations.
- **Reliability Band Separation**: Evaluates a held-out retrospective RED-vs-GREEN bust-incidence separation of approximately **6.5x** (GREEN observed bust rate = **5.70%**, RED observed bust rate = **37.02%**).
- **Sub-Domain Performance**: Evaluates regional performance across Northwest India (`NORTHWEST_INDIA_RECT`: ROC-AUC **0.8792**, Brier **0.0658**), Central India (`CENTRAL_INDIA_RECT`: ROC-AUC **0.8493**, PR-AUC **0.7068**), and Eastern UP (`EASTERN_UP_RECT`: ROC-AUC **0.8021**, Brier **0.1415**).
- **Trust Horizon Mechanics**: Measures continuous lead-horizon reliability. Phase 11 full-corpus mean ($N = 34,884$) is **6.96 days**, while Phase 12 held-out TEST-only mean ($N = 11,628$) is **4.65 days** (median **4.0 days**) due to higher 2019 monsoon bust prevalence.

---

## 2. Problem Definition

Numerical Weather Prediction (NWP) models (such as GEFS 10-day ensemble forecasts) frequently experience localized prediction failures ("busts") during extreme Indian monsoon events. Traditional operational centers rely on manual meteorologist inspection, which cannot scale across thousands of spatial grid points daily. FORTRESS automates real-time forecast self-auditing by providing automated reliability passports, trust indices, and failure diagnostic flags.

---

## 3. FORTRESS Architecture

The FORTRESS system comprises a 4-tier modular pipeline:
1. **Data Ingestion & Preprocessing**: GEFS 10-day ensemble forecasts ($10 \text{ members}$) and ERA5 observational reference data.
2. **Predictive AI Engine**: Random Forest / LightGBM bust risk classifier predicting probability of forecast failure $P(\text{Bust})$.
3. **Independent Evidence & Stress Testing**: IsolationForest OOD novelty detector, Failure DNA fingerprinting, Forecast Fragility Direction (FFD), and prior-only historical analogues.
4. **Self-Audit & Trust Horizon Layer**: Decision rule engine assigning diagnostic statuses, Trust Index scores (0–100), reliability bands (GREEN/YELLOW/RED), and contiguous Trust Horizons (D1–D10).

---

## 4. Data Sources

- **NOAA GEFSv12**: 10-day ensemble forecasts ($10 \text{ members}$), 0.5° spatial resolution, D1–D10 lead horizons.
- **ERA5 Reanalysis**: ECMWF ERA5 global atmospheric reanalysis serving as the observational reference.
- **Corpus Coverage**: 348,840 multi-region forecast grid rows spanning 3 geographical sub-domains across 2017, 2018, and 2019 monsoon seasons.

---

## 5. Forecast Error & Bust Definition

A forecast failure ("Bust") is explicitly defined as a absolute rainfall prediction error exceeding $15.0 \text{ mm/day}$ between ensemble mean prediction $\bar{f}$ and ERA5 observed precipitation $o$:
$$\text{Bust} = \begin{cases} 1 & \text{if } |\bar{f} - o| \ge 15.0 \text{ mm/day} \\ 0 & \text{otherwise} \end{cases}$$

---

## 6. Bust Risk AI

The baseline bust risk model (`models/fortress_bust_model_phase11.pkl`) is a ensemble tree classifier trained on 34 atmospheric predictor features (ensemble mean, spread, min, max, member range, 2m temperature, specific humidity, MSLP, precipitable water, and 10m u/v wind speeds).
- **TRAIN Fit**: 174,420 rows (2017 + H1 2018)
- **Held-Out TEST Discrimination**: ROC-AUC **0.8567**, PR-AUC **0.6408**, Brier Score **0.1173**.

---

## 7. Stress Lab & Forecast Fragility Direction (FFD)

The Stress Lab evaluates forecast stability under artificial perturbation of initial conditions.
- **FFD Definition**: Measures whether ensemble member spread directionally aligns with forecast error magnitude.
- **Role**: Serves as an experimental fragility/explainability diagnostic. In held-out 2019 test data, FFD contributed continuous score penalties (-10/-20 points) in Trust Index without forcing categorical boundary shifts.

---

## 8. Failure Corridors & 6D Fingerprint

Every forecast grid cell is represented by a 6-dimensional failure fingerprint:
1. `ensemble_spread_norm`: Normalized member spread
2. `temp_2m_anomaly`: Surface temperature anomaly
3. `humidity_anomaly`: Specific humidity anomaly
4. `mslp_gradient`: Pressure spatial gradient
5. `pwat_anomaly`: Precipitable water anomaly
6. `wind_shear_10m`: 10m wind speed magnitude

---

## 9. Historical Analogues

- **Coverage**: Evaluates prior-only historical analogue matches for **97.22%** of test grid queries.
- **Temporal Isolation**: Strictly restricts search space to dates preceding the target initialization date to prevent temporal data leakage.

---

## 10. Failure DNA

- **Similarity Metric**: Cosine similarity against a historical repository of verified forecast failure fingerprints.
- **Mechanism**: High similarity ($\ge 0.90$) adds a contradicting risk vote. When baseline AI predicts low risk ($P < 0.20$), Failure DNA triggers a `CONFLICT / POSSIBLE BLIND SPOT` status.

---

## 11. Ensemble Disagreement

Categorizes internal 10-member ensemble variance into LOW, MODERATE, or HIGH disagreement categories, serving as an independent indicator of atmospheric predictability.

---

## 12. Out-Of-Distribution (OOD) Novelty

- **Model**: IsolationForest trained strictly on TRAIN split atmospheric features.
- **Mechanism**: Identifies anomalous atmospheric regimes (`HIGHLY NOVEL`). Acts as a mandatory conjunct in routing suspicious forecasts to `EXPERT REVIEW`.

---

## 13. Self-Audit Diagnostic Framework

The decision rule engine combines baseline AI prediction with independent evidence (OOD, Failure DNA, Ensemble Disagreement, Analogues, FFD) to assign 5 mutually exclusive statuses:
1. `SUPPORTED RELIABILITY`: Consistent low-risk signals across all evidence streams.
2. `SUPPORTED WARNING`: Consistent high-risk signals across evidence streams.
3. `EXPERT REVIEW`: High OOD novelty requiring human meteorologist inspection.
4. `CONFLICT / POSSIBLE BLIND SPOT`: Baseline AI predicts low risk but evidence stream indicates high risk.
5. `INSUFFICIENT EVIDENCE`: Absence of historical analogue matches or incomplete data.

---

## 14. Prototype Diagnostic Trust Index

Continuous score bounded in $[0, 100]$:
$$\text{Trust Index} = 100 \times (1 - P(\text{Bust})) - \text{Penalties}_{\text{OOD, DNA, Disagreement, FFD}}$$
- **GREEN Band**: $\text{Trust Index} \ge 60$ AND Status == `SUPPORTED RELIABILITY`
- **YELLOW Band**: Status == `INSUFFICIENT EVIDENCE` OR ($50 \le \text{Trust Index} < 60$)
- **RED Band**: Status $\in \{\text{SUPPORTED WARNING}, \text{EXPERT REVIEW}, \text{CONFLICT}\}$ OR $\text{Trust Index} < 50$

---

## 15. Trust Horizon Analysis

Trust Horizon calculates the maximum contiguous lead horizon (starting from D1) during which diagnostics maintain GREEN status:
- **Phase 11 Full-Corpus Population ($N = 34,884$ sequences)**: Mean = **6.96 days** (Median **10.0 days**).
- **Phase 12 Held-Out TEST Population ($N = 11,628$ sequences)**: Mean = **4.65 days** (Median **4.0 days**).
- *Explanation*: The held-out 2019 test set experienced higher monsoon bust prevalence ($22.04\%$ vs $5.00\%$ in TRAIN), naturally shortening contiguous GREEN horizons.

---

## 16. Breaking Point Analysis

Breaking Point records the exact lead day ($D1 \dots D9$) of the first sustained transition into RED status.
- **Unbroken Sequences (GREEN D1–D10)**: **31.69%** overall (**45.90%** in Northwest India, **27.12%** in Central India, **22.06%** in Eastern UP).

---

## 17. Reliability Passport

A consolidated machine-readable JSON object certifying forecast provenance, AI risk prediction, 6D fingerprint, OOD novelty rating, Failure DNA match status, self-audit status, trust index, and trust horizon for any single grid point.

---

## 18. Phase 12 Case Studies Summary

Evaluates 8 representative case studies across regions, lead horizons, and diagnostic statuses:
1. `CASE_01`: GREEN / Supported Reliability (Central India, D2)
2. `CASE_02`: RED / Supported Warning (Northwest India, D5)
3. `CASE_03`: RED / Conflict Blind Spot (Eastern UP, D3)
4. `CASE_04`: RED / Expert Review Novel State (Central India, D6)
5. `CASE_05`: High OOD Novelty (Northwest India, D8)
6. `CASE_06`: Low FFD Fragile State (Eastern UP, D4)
7. `CASE_07`: Robust FFD No-Failure State (Central India, D1)
8. `CASE_08`: Late Lead D10 Sequence Case (Northwest India, D10)

---

## 19. Baseline Model Comparisons

Compares FORTRESS against 5 alternative baseline approaches on held-out 2019 TEST data:

| Model / Approach | ROC-AUC | PR-AUC | Brier Score |
| :--- | :---: | :---: | :---: |
| Ensemble Spread Heuristic | 0.6120 | 0.3105 | 0.1850 |
| Climatological Prevalence Baseline | 0.5000 | 0.2204 | 0.1718 |
| Logistic Regression | 0.7420 | 0.4850 | 0.1420 |
| Single Decision Tree | 0.7150 | 0.4310 | 0.1560 |
| Uncalibrated Random Forest / LightGBM | **0.8567** | **0.6408** | **0.1173** |
| **FORTRESS Full Self-Audit System** | **0.8561** | **0.6408** | **0.1178** |

---

## 20. Ablation Findings

Evaluates 8 ablation configurations to quantify component contributions:
- **FFD Ablation**: Produced 0 categorical status boundary shifts in held-out 2019 test data; functions primarily as an explainability and fragility diagnostic.
- **OOD Ablation**: Removing OOD eliminated all `EXPERT REVIEW` assignments (reducing rate from $25.21\%$ to $0.00\%$), confirming its mandatory role in the novelty path.
- **Failure DNA Ablation**: Removing Failure DNA reduced `CONFLICT` assignments from $16.28\%$ to $3.57\%$, proving its role in detecting AI blind spots.
- **Historical Analogues**: Serves as supporting evidence for confidence weighting.

---

## 21. Probability Calibration Findings

- **Uncalibrated TEST**: ROC-AUC **0.8567**, PR-AUC **0.6408**, Brier **0.1173**, ECE **0.0205**, MCE **0.0725**, Log Loss **0.3642**.
- **Isotonic Calibrated TEST**: ROC-AUC **0.8561**, PR-AUC **0.6408**, Brier **0.1178**, ECE **0.0234**, MCE **0.0831**, Log Loss **0.3665**.
- **Conclusion**: Isotonic probability mapping changed probability scaling and improved fixed-threshold recall (from **0.5310** to **0.6077**) and F1 (from **0.5893** to **0.6182**) at 0.50, while listed held-out probability-quality metrics (Brier, ECE, Log Loss) were slightly worse. Held-out calibration improvement is **not** claimed.

---

## 22. Region-Wise Results

| Metric | Eastern UP | Northwest India | Central India |
| :--- | :---: | :---: | :---: |
| **Bust Prevalence %** | 24.16% | 11.31% | 30.67% |
| **ROC-AUC** | 0.8021 | 0.8792 | 0.8493 |
| **PR-AUC** | 0.5799 | 0.5910 | 0.7068 |
| **Brier Score** | 0.1415 | 0.0658 | 0.1460 |
| **TEST Mean Trust Horizon** | 3.75 Days | 5.82 Days | 4.38 Days |

---

## 23. Lead-Wise Results (D1–D10)

Predictive discrimination peaks at D3 ($\text{ROC-AUC} = 0.8848$, $\text{PR-AUC} = 0.7558$) due to atmospheric feature development, before gradually degrading to D10 ($\text{ROC-AUC} = 0.8087$, $\text{PR-AUC} = 0.5268$).

---

## 24. Region × Lead Matrix Results

Evaluates full 30-cell sub-domain grid ($3 \text{ Regions} \times 10 \text{ Lead Days}$), demonstrating that Northwest India D1–D3 maintains the highest reliability ($\text{ROC-AUC} \ge 0.895$, GREEN rate $\ge 66\%$), while Central India D3 experiences the highest bust prevalence ($41.82\%$).

---

## 25. Failure Analysis & Confusion Taxonomy

Held-out 2019 confusion breakdown at 0.50 threshold ($N = 116,280$):
- $\text{TP} = 15,576$, $\text{FP} = 9,188$, $\text{TN} = 81,461$, $\text{FN} = 10,055$.
- $\text{Recall} = 60.77\%$, $\text{Precision} = 62.90\%$, $\text{FPR} = 10.14\%$, $\text{FNR} = 39.23\%$.
- **GREEN Band Bust Rate**: **5.70%** ($3,163 / 55,532$).
- **RED Band Bust Rate**: **37.02%** ($22,468 / 60,748$).
- **Held-Out Retrospective Separation**: Approximately **6.5x** separation between RED and GREEN bust incidence.

---

## 26. Rule Sensitivity & Robustness

Perturbation testing across 8 parameter configurations demonstrates stable GREEN band bust rates within **[4.95%, 5.82%]**, proving system stability under rule parameter variation.

---

## 27. Statistical Uncertainty (95% Bootstrap CIs)

Evaluated over 50 bootstrap iterations (seed = 42):
- **Overall ROC-AUC**: Mean **0.8554** ($95\% \text{ CI: } [0.8459, 0.8657]$)
- **GREEN Bust Rate %**: Mean **5.78%** ($95\% \text{ CI: } [4.97\%, 6.62\%]$)
- **RED Bust Rate %**: Mean **37.02%** ($95\% \text{ CI: } [35.37\%, 39.39\%]$)

---

## 28. Prototype Limitations

1. **Research Prototype Scope**: FORTRESS is an academic research prototype, not an operational weather forecasting system.
2. **Geographical Limitation**: Evaluated on 3 rectangular sub-domains in India, not continuous national coverage.
3. **Reference Reanalysis**: ERA5 serves as atmospheric reference, which contains reanalysis estimation uncertainties.
4. **Sampled Temporal Window**: Evaluated on selected 2017–2019 monsoon initialization dates.
5. **No Automatic Control**: System does not automate dam management, power grid operations, or disaster evacuations.

---

## 29. Strict Claim Boundaries

- **No Safety Guarantee**: GREEN band status does not guarantee 100% forecast correctness.
- **No Bust Guarantee**: RED band status does not guarantee forecast failure.
- **No Operational Validation**: Does not constitute operational India-wide deployment.
- **Prototype Diagnostics**: FFD, Trust Index, Trust Horizon, and Breaking Point are experimental research diagnostics, not established meteorological standards.

---

## 30. Future Work

1. Extension to continuous high-resolution IMD gridded observation datasets.
2. Integration of satellite radar precipitation products (INSAT-3D / GPM).
3. Expansion of sub-domain coverage to Southern Peninsular and Himalayan regions.
4. Operational pilot deployment with regional meteorological centers.

---

## 31. Final Scientific Conclusion

FORTRESS successfully demonstrates that automated self-auditing of numerical weather predictions can effectively isolate forecast failure risks. By integrating machine learning bust prediction with independent evidence streams, the system achieves strong discrimination ($\text{ROC-AUC} = 0.8567$) and an effective retrospective RED-vs-GREEN separation ratio of 6.5x on held-out test data.
