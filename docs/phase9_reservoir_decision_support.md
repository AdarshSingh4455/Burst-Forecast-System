# FORTRESS Phase 9A — Reservoir / Dam Decision Support Documentation

## Overview
Phase 9A introduces end-to-end domain-specific decision support for **Reservoirs and Dams** within the FORTRESS system (Forecast Reliability Stress-Testing & Self-Audit System, SIH26079).

It translates scientific forecast reliability intelligence (Bust Risk, Fragility/FFD, Self-Audit Status, Trust Horizon) into actionable operational context for dam monitoring without altering underlying Phase 1–8 scientific models.

---

## 1. Safety & Operational Constraints
- **Separation of Dimensions**: Hydrological pressure (storage %) and weather forecast reliability (trust index, self-audit) are evaluated as separate dimensions before being synthesized into an Attention Status.
- **Strict Prohibition**: FORTRESS does NOT generate automated dam release orders, reservoir operational rules, or gate dispatch commands.
- **Mandatory Disclaimer**: All outputs display the mandatory operational disclaimer emphasizing human operator authority.

---

## 2. Decision Logic & Thresholds
Defined in `configs/reservoir_decision_support.yaml`:

### Storage Pressure Thresholds
- Normal Storage: `< 75%`
- Heightened Storage: `75% – 85%`
- High / Critical Storage: `>= 85%`

### Rainfall Thresholds
- Moderate Rainfall: `>= 15.0 mm`
- Heavy Rainfall: `>= 35.0 mm`

### Weather Reliability & High Uncertainty Override Rule
- If `Self-Audit Status` is `CONFLICT`, `POSSIBLE BLIND SPOT`, or `EXPERT REVIEW` OR `Reliability Band` is `RED` OR `Trust Index < 50.0`:
  - **Status**: `HIGH_UNCERTAINTY_EXPERT_REVIEW`
  - **Reason**: Forecast model exhibits high uncertainty or self-audit conflict; expert review required before relying on forecast.

### Standard Attention Status Rules
- `OPERATOR_REVIEW_ADVISED`: Storage `>= 85%` AND Forecasted Rain `>= 35.0 mm`
- `HEIGHTENED_MONITORING`: Storage `>= 75%` OR Forecasted Rain `>= 15.0 mm` OR Bust Probability `>= 40%`
- `NORMAL_MONITORING`: Normal storage and manageable weather context.

---

## 3. Spatial Coverage & Mode B Fallback
- **Pilot Region**: Eastern UP Bounding Box (24.5°–28.5°N, 80.0°–84.5°E).
- **Mode B Context**: When catchment geometry is unavailable, FORTRESS snaps reservoir coordinates to the nearest available FORTRESS grid point.
- **Outside Pilot Case**: Reservoirs located outside the pilot bounding box (e.g. Matatila Reservoir at Lon 78.38°E) display an explicit outside coverage warning banner while using nearest grid approximation.

---

## 4. API Endpoints
All 5 endpoints return HTTP 200 with valid JSON response schemas:
1. `GET /api/reservoirs`: List all demo reservoirs with summary storage and pilot coverage status.
2. `GET /api/reservoirs/{id}`: Detailed metadata for a specific reservoir.
3. `GET /api/reservoirs/{id}/forecast-context`: D1–D10 lead timeline context.
4. `GET /api/reservoirs/{id}/decision-support`: Full decision support evaluation for selected forecast run, lead day, and scenario.
5. `POST /api/reservoirs/{id}/scenario`: Interactive what-if custom scenario simulation.

---

## 5. UI Features
- **Light Green Custom Theme**: Background `#EEF9F4`, Header `#F4FAF6`, Border `#C8EAD9`, Accent `#059669`, Dark Text `#044E3A`.
- **Top KPI Cards**: Storage %, MCM Volume, Flow Rates, Rain (mm), Bust Risk %, Reliability Band, Trust Index.
- **Attention Status Card**: Visibly highlights one of the 4 attention statuses with full bulleted scientific reason breakdown.
- **2D Decision Matrix**: Interactive 3x3 grid highlighting storage vs reliability cell.
- **D1–D10 Timeline Table**: Clickable lead day horizon timeline.
- **What-If Scenario Panel**: Interactive storage slider and inflow rate simulator with instant re-calculation.
- **Spatial Map**: Leaflet map showing reservoir marker, snapped grid point marker, and pilot bounding box rectangle.
- **Explanation Assistant Integration**: One-click AI assistant popover trigger pre-populated with reservoir context.
- **Mandatory Operational Disclaimer**: Prominently displayed at the bottom of the page.
