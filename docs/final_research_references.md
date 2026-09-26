# FORTRESS Research References & Academic Citations

This document lists external scientific foundations and distinguishes them explicitly from novel FORTRESS prototype contributions.

---

## 1. External Scientific Foundations

### Numerical Weather Prediction & Ensemble Forecasting
- **NOAA GEFSv12**: Hamill, T. M., et al. (2022). *The Version-12 Global Ensemble Forecast System (GEFSv12)*. Monthly Weather Review, 150(1), 145-164.
- **ECMWF ERA5 Reanalysis**: Hersbach, H., et al. (2020). *The ERA5 global reanalysis*. Quarterly Journal of the Royal Meteorological Society, 146(730), 1999-2049.
- **Ensemble Verification**: Gneiting, T., & Raftery, A. E. (2007). *Strictly proper scoring rules, prediction, and estimation*. Journal of the American Statistical Association, 102(477), 359-378.

### Machine Learning & Anomaly Detection
- **LightGBM**: Ke, G., et al. (2017). *LightGBM: A highly efficient gradient boosting decision tree*. Advances in Neural Information Processing Systems (NeurIPS 30), 3146-3154.
- **Isolation Forest (OOD)**: Liu, F. T., Ting, K. M., & Zhou, Z. H. (2008). *Isolation forest*. IEEE International Conference on Data Mining (ICDM), 413-422.
- **Probability Calibration**: Zadrozny, B., & Elkan, C. (2002). *Transforming classifier scores into accurate multiclass probability estimates*. ACM SIGKDD International Conference on Knowledge Discovery and Data Mining, 694-699.

---

## 2. Novel FORTRESS Prototype Contributions

The following frameworks and diagnostic metrics are novel experimental contributions developed specifically for the FORTRESS research prototype system (SIH26079) and do **not** represent established meteorological standards:

1. **Forecast Fragility Direction (FFD)**: An experimental initial condition sensitivity metric measuring directional alignment between member spread and error magnitude.
2. **Failure DNA Fingerprinting**: 6D atmospheric failure pattern representation and similarity matching engine for AI blind spot identification.
3. **Multi-Evidence Self-Audit Framework**: Multi-tier decision rule framework synthesizing baseline AI predictions with independent evidence streams.
4. **Prototype Diagnostic Trust Index**: Continuous reliability scoring metric bounded in $[0, 100]$.
5. **Trust Horizon**: Contiguous lead-day reliability window metric ($D1 \dots D10$).
6. **Breaking Point Warning Diagnostic**: First sustained RED transition lead-day indicator.
