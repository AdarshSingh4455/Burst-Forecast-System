# FORTRESS Phase 9D — Renewable Energy / Grid Decision Support Documentation

## Overview
Phase 9D implements the **Renewable Energy & Grid Decision Support** domain overlay for the FORTRESS Forecast Reliability Stress-Testing & Self-Audit System. This module translates FORTRESS 10-day GEFS ensemble forecasts, bust probabilities, FFD scores, and self-audit reliability flags into domain-specific operational context for renewable energy operators, grid planners, and dispatch analysts.

---

## Key Features & Architectural Principles

1. **Strict Weather Dataset Truthfulness & Solar Irradiance Handling**:
   - The FORTRESS GEFS self-audit dataset provides 10m wind speeds (`wind_speed_mean_ms`), 2m temperature (`temp_2m_c_mean`), 2m humidity (`humidity_gkg`), and 6-hourly accumulated rainfall (`ensemble_mean_mm`).
   - Solar irradiance / radiation fields are **absent** from the dataset.
   - For all solar or hybrid scenarios, `solar_diagnostic_available` is explicitly set to `false`, displaying the operational disclaimer: `"SOLAR GENERATION DIAGNOSTIC NOT AVAILABLE IN PROTOTYPE"`.
   - Solar output is **never** estimated or hallucinated from temperature or rainfall.

2. **10m Wind Speed Diagnostic & Hub-Height Disclaimer**:
   - Wind diagnostics use 10m wind speed (`wind_speed_mean_ms`) directly.
   - All UI components, API schemas, and documentation explicitly label this metric as: `"10 m forecast wind speed diagnostic"`.
   - Clear operational disclaimers emphasize that 10m wind speed is NOT turbine hub-height wind speed (80m–120m) and is not converted to MW power curves.

3. **Lead-to-Lead Wind Variability Diagnostic**:
   - Evaluates step changes between consecutive lead days (e.g., $|\text{Wind}_{D_k} - \text{Wind}_{D_{k-1}}|$) and D1–D3 wind speed ranges.
   - Triggers `GENERATION_VARIABILITY_REVIEW` or `GRID_PREPAREDNESS_REVIEW` when rapid shifts ($\ge 2.0\text{ m/s}$ or $\ge 3.5\text{ m/s}$) coincide with high sensitivity settings.

4. **Strict Attention Status Classification**:
   - System outputs are restricted to four standardized attention statuses:
     - `NORMAL_MONITORING`
     - `GENERATION_VARIABILITY_REVIEW`
     - `GRID_PREPAREDNESS_REVIEW`
     - `HIGH_UNCERTAINTY_EXPERT_REVIEW`
   - If forecast reliability is weak (`RED` band, low trust index, or `CONFLICT`/`POSSIBLE BLIND SPOT` self-audit) in a weather-relevant context, the status escalates to `HIGH_UNCERTAINTY_EXPERT_REVIEW`.

5. **Spatial Pilot Boundary Enforcement**:
   - Pilot region is strictly bounded to Eastern Uttar Pradesh ($24.5^\circ\text{--}28.5^\circ\text{N}$, $80.0^\circ\text{--}84.5^\circ\text{E}$).
   - Scenarios located outside this bounding box return `coverage_available: false`, `context_mode: "OUTSIDE_PILOT"`, grid-point snapping is disabled, and all FORTRESS scientific metrics are cleanly suppressed.

---

## Domain Architecture & Configuration

- **Configuration File**: `configs/renewable_grid_decision_support.yaml`
- **Demo Scenario Catalog**: `data/domain/renewable_demo.json`
- **Backend Service**: `backend/app/renewable_service.py`
- **API Router & Schemas**: Mounted under `/api/renewable` in `backend/app/main.py` & schemas in `backend/app/schemas.py`
- **Frontend UI View**: `frontend/src/views/DecisionSupportView.tsx` (Tab index 3: "Renewable Energy / Grid")

---

## API Endpoints

1. `GET /api/renewable`: Returns summary list of all renewable zones/scenarios.
2. `GET /api/renewable/{scenario_id}`: Returns detailed metadata for a specific scenario.
3. `GET /api/renewable/{scenario_id}/forecast-context`: Returns 10-day GEFS forecast lead contexts for inside-pilot zones, or suppressed context for outside-pilot zones.
4. `GET /api/renewable/{scenario_id}/decision-support`: Returns decision-support heuristics, attention status, wind diagnostics, solar unavailability notice, and operational advice.
5. `POST /api/renewable/{scenario_id}/scenario`: Evaluates interactive what-if scenario overrides (e.g. wind speed override, sensitivity tweaks).

---

## Operational Safety Disclaimer
> **MANDATORY DISCLAIMER**: Decision-support information ONLY — not a generation guarantee, grid-dispatch instruction, market instruction, or official power system alert. Official load-dispatch center (SLDC/RLDC) instructions remain authoritative.
