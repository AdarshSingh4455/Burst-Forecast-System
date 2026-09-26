# FORTRESS Final Judge Q&A / SIH FAQ (SIH26079)

---

### Q1: What exactly does FORTRESS do?
**A**: FORTRESS is an automated Forecast Reliability Stress-Testing & Self-Audit System. It ingests numerical weather forecasts (GEFS) and automatically evaluates whether the forecast is likely to fail ("bust"), assigning trust scores, reliability bands (GREEN/RED), and breaking point warnings.

### Q2: What is unique about FORTRESS?
**A**: Standard weather tools display raw forecast outputs. FORTRESS **audits the forecast itself** by combining machine learning failure prediction with independent evidence streams (OOD novelty, Failure DNA, Ensemble Disagreement, FFD fragility).

### Q3: Why not just use ensemble spread?
**A**: Ensemble spread alone evaluates model variance, not actual forecast error. Evaluated on held-out test data, ensemble spread achieved an ROC-AUC of only **0.6120**, whereas FORTRESS achieved **0.8567**.

### Q4: What is $P(\text{Bust})$?
**A**: $P(\text{Bust})$ is the predicted probability that the absolute rainfall forecast error between ensemble mean prediction and observed precipitation will exceed $15.0 \text{ mm/day}$.

### Q5: What is FFD (Forecast Fragility Direction)?
**A**: FFD is an experimental diagnostic that measures initial condition sensitivity by checking whether ensemble member spread aligns directionally with forecast error magnitude.

### Q6: Why perform Self-Audit?
**A**: Machine learning models can suffer from hidden blind spots when encountering novel weather regimes. Self-audit acts as a multi-tier safety check before forecast dissemination.

### Q7: What is Failure DNA?
**A**: Failure DNA represents a 6-variable atmospheric fingerprint of historical forecast failures. When a new forecast matches a past failure profile ($\ge 0.90$), Failure DNA flags a risk vote even if baseline AI predicts low risk.

### Q8: What is OOD (Out-Of-Distribution)?
**A**: OOD measures atmospheric novelty using an IsolationForest trained on baseline training features. High OOD scores automatically route forecasts to `EXPERT REVIEW`.

### Q9: What is Trust Horizon?
**A**: Trust Horizon measures the contiguous sequence of lead days (starting from D1) during which forecast diagnostics remain GREEN. On held-out 2019 test data, the overall mean Trust Horizon was **4.65 days**.

### Q10: What is Breaking Point?
**A**: Breaking Point records the exact lead day ($D1 \dots D9$) of the first sustained transition into RED status, warning users where model reliability breaks down.

### Q11: Why use GREEN / RED reliability bands?
**A**: Color-coded bands simplify complex multi-variable diagnostics into actionable decision signals. Evaluated on held-out test data, GREEN forecasts exhibited a **5.70%** bust rate vs **37.02%** for RED forecasts.

### Q12: How was FORTRESS scientifically validated?
**A**: Validated across 348,840 multi-region forecast grid rows (2017–2019) spanning Eastern UP, Northwest India, and Central India, including held-out 2019 test evaluation, ablation studies, baseline comparisons, and rule sensitivity analysis.

### Q13: Why evaluate 3 sub-domain regions only?
**A**: The 3 rectangular regions represent distinct Indian climatological regimes (convective Central India, terrain-influenced Eastern UP, and dry Northwest India) selected for prototype evaluation.

### Q14: Can FORTRESS be deployed India-wide?
**A**: Yes, the architecture is designed to scale across grid points nationwide once full high-resolution IMD observation pipelines are integrated.

### Q15: Does FORTRESS issue official weather warnings?
**A**: No. FORTRESS is a decision-support and reliability audit tool for meteorologists and sector managers, not an official meteorological issuing authority.

### Q16: Does FORTRESS control physical dam floodgates?
**A**: No. FORTRESS provides decision-support advisories for reservoir operators but does not execute automated physical control.

### Q17: How is this different from weather prediction?
**A**: Weather prediction models forecast atmospheric state (temperature, rain). FORTRESS **predicts the error and reliability of those weather prediction models**.

### Q18: What is the biggest limitation of FORTRESS?
**A**: It is a research prototype evaluated on retrospective ERA5 reanalysis reference data across selected regional windows, rather than an operational real-time system.

### Q19: What will you do next?
**A**: Integrate continuous IMD high-resolution radar/station data, expand sub-domain coverage nationwide, and initiate pilot operational testing with regional weather forecasting centers.
