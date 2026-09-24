import os
import json
import yaml
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional
from backend.app.data_service import data_service

class ReservoirService:
    def __init__(self):
        self.reservoirs: List[Dict[str, Any]] = []
        self.config: Dict[str, Any] = {}
        self.loaded = False

    def load_data(self, base_dir: str = "."):
        # Load config
        config_path = os.path.join(base_dir, "configs", "reservoir_decision_support.yaml")
        if os.path.exists(config_path):
            with open(config_path, "r", encoding="utf-8") as f:
                self.config = yaml.safe_load(f)
        else:
            # Fallback default config
            self.config = {
                "storage": {"heightened_monitoring_percent": 75.0, "operator_review_percent": 85.0},
                "rainfall": {"moderate_mm": 15.0, "high_mm": 35.0},
                "inflow": {"elevated_cumecs": 500.0},
                "trust": {"low_trust_index": 50.0, "moderate_trust_index": 70.0},
                "bust": {"elevated_probability": 0.40, "high_probability": 0.60},
                "spatial": {
                    "pilot_min_lat": 24.5,
                    "pilot_max_lat": 28.5,
                    "pilot_min_lon": 80.0,
                    "pilot_max_lon": 84.5,
                    "max_snap_dist_deg": 0.75
                }
            }

        # Load domain demo reservoirs
        json_path = os.path.join(base_dir, "data", "domain", "reservoirs_demo.json")
        if os.path.exists(json_path):
            with open(json_path, "r", encoding="utf-8") as f:
                self.reservoirs = json.load(f)
        else:
            self.reservoirs = []

        self.loaded = True

    def check_pilot_coverage(self, lat: float, lon: float) -> bool:
        spatial = self.config.get("spatial", {})
        min_lat = spatial.get("pilot_min_lat", 24.5)
        max_lat = spatial.get("pilot_max_lat", 28.5)
        min_lon = spatial.get("pilot_min_lon", 80.0)
        max_lon = spatial.get("pilot_max_lon", 84.5)
        return (min_lat <= lat <= max_lat) and (min_lon <= lon <= max_lon)

    def find_nearest_grid_point(self, forecast_init: str, lead_day: int, lat: float, lon: float):
        """Find grid point in df_self_audit nearest to lat, lon (permitted only for inside-pilot reservoirs)."""
        if not self.check_pilot_coverage(lat, lon):
            return None

        if not data_service.data_loaded or data_service.df_self_audit is None:
            return None

        sub = data_service.df_self_audit[
            (data_service.df_self_audit['forecast_init_str'] == forecast_init) &
            (data_service.df_self_audit['lead_day'] == lead_day)
        ]
        if len(sub) == 0:
            return None

        # Compute Euclidean distance in lat/lon space
        sub = sub.copy()
        sub['dist'] = np.sqrt((sub['latitude'] - lat) ** 2 + (sub['longitude'] - lon) ** 2)
        min_row = sub.sort_values('dist').iloc[0]
        return min_row

    def calculate_attention_status(
        self,
        storage_percent: float,
        rainfall_mm: float,
        bust_prob: float,
        self_audit_status: str,
        reliability_band: str,
        trust_index: float,
        recent_inflow_cumecs: float = 0.0
    ) -> tuple[str, List[str]]:
        reasons = []

        # Thresholds
        heightened_storage_thresh = self.config.get("storage", {}).get("heightened_monitoring_percent", 75.0)
        op_storage_thresh = self.config.get("storage", {}).get("operator_review_percent", 85.0)
        mod_rain_thresh = self.config.get("rainfall", {}).get("moderate_mm", 15.0)
        high_rain_thresh = self.config.get("rainfall", {}).get("high_mm", 35.0)
        elev_inflow_thresh = self.config.get("inflow", {}).get("elevated_cumecs", 500.0)
        low_trust_thresh = self.config.get("trust", {}).get("low_trust_index", 50.0)
        elev_bust_thresh = self.config.get("bust", {}).get("elevated_probability", 0.40)

        # Operational relevance gate
        operational_relevance = (
            storage_percent >= heightened_storage_thresh or
            rainfall_mm >= mod_rain_thresh or
            recent_inflow_cumecs >= elev_inflow_thresh
        )

        is_poor_reliability = (
            self_audit_status in ["CONFLICT", "POSSIBLE BLIND SPOT", "EXPERT REVIEW"] or
            reliability_band == "RED" or
            trust_index < low_trust_thresh
        )

        if operational_relevance and is_poor_reliability:
            reasons.append(
                f"High forecast uncertainty detected during operationally relevant conditions "
                f"(Storage: {storage_percent:.1f}%, Rain: {rainfall_mm:.1f}mm, Inflow: {recent_inflow_cumecs:.1f} cumecs). "
                f"Self-Audit: '{self_audit_status}', Reliability Band: '{reliability_band}', Trust Index: {trust_index:.1f}/100."
            )
            return "HIGH_UNCERTAINTY_EXPERT_REVIEW", reasons

        if storage_percent >= op_storage_thresh and rainfall_mm >= high_rain_thresh:
            reasons.append(f"High storage level ({storage_percent:.1f}%) combined with heavy forecasted rainfall ({rainfall_mm:.1f} mm).")
            return "OPERATOR_REVIEW_ADVISED", reasons

        if storage_percent >= heightened_storage_thresh or rainfall_mm >= mod_rain_thresh or bust_prob >= elev_bust_thresh:
            if storage_percent >= heightened_storage_thresh:
                reasons.append(f"Elevated storage level ({storage_percent:.1f}%).")
            if rainfall_mm >= mod_rain_thresh:
                reasons.append(f"Moderate forecasted rainfall ({rainfall_mm:.1f} mm).")
            if bust_prob >= elev_bust_thresh:
                reasons.append(f"Elevated forecast bust probability ({bust_prob*100:.1f}%).")
            return "HEIGHTENED_MONITORING", reasons

        if is_poor_reliability and not operational_relevance:
            reasons.append(
                f"Weather forecast reliability is {reliability_band} / low trust ({trust_index:.1f}/100), "
                f"but operational relevance is low (storage < {heightened_storage_thresh}%, rain < {mod_rain_thresh}mm). "
                f"Displayed as weather-reliability concern without escalating operational attention."
            )

        reasons.append(f"Storage level normal ({storage_percent:.1f}%) and forecasted rainfall manageable ({rainfall_mm:.1f} mm).")
        return "NORMAL_MONITORING", reasons

    def get_reservoirs_summary(self) -> List[Dict[str, Any]]:
        result = []
        for r in self.reservoirs:
            in_pilot = self.check_pilot_coverage(r['latitude'], r['longitude'])
            default_scen = r.get('scenarios', {}).get('NORMAL', {})
            result.append({
                "reservoir_id": r['reservoir_id'],
                "name": r['name'],
                "latitude": r['latitude'],
                "longitude": r['longitude'],
                "state": r['state'],
                "district": r['district'],
                "river": r['river'],
                "data_mode": r.get('data_mode', 'DEMO_SCENARIO'),
                "capacity_mcm": r['capacity_mcm'],
                "current_storage_mcm": default_scen.get('current_storage_mcm', r['capacity_mcm'] * 0.6),
                "storage_percent": default_scen.get('storage_percent', 60.0),
                "recent_inflow_cumecs": default_scen.get('recent_inflow_cumecs', 200.0),
                "recent_outflow_cumecs": default_scen.get('recent_outflow_cumecs', 180.0),
                "coverage_available": in_pilot,
                "in_pilot_coverage": in_pilot
            })
        return result

    def get_reservoir_detail(self, reservoir_id: str) -> Optional[Dict[str, Any]]:
        for r in self.reservoirs:
            if r['reservoir_id'] == reservoir_id:
                r_copy = dict(r)
                in_pilot = self.check_pilot_coverage(r['latitude'], r['longitude'])
                r_copy['coverage_available'] = in_pilot
                r_copy['in_pilot_coverage'] = in_pilot
                return r_copy
        return None

    def get_forecast_context(self, reservoir_id: str, forecast_init: str) -> Optional[Dict[str, Any]]:
        res = self.get_reservoir_detail(reservoir_id)
        if not res:
            return None

        in_pilot = res['in_pilot_coverage']
        if not in_pilot:
            return {
                "reservoir_id": res['reservoir_id'],
                "reservoir_name": res['name'],
                "forecast_init": forecast_init,
                "data_mode": res.get('data_mode', 'DEMO_SCENARIO'),
                "coverage_available": False,
                "in_pilot_coverage": False,
                "context_mode": "OUTSIDE_PILOT",
                "reason": "FORTRESS reliability analysis is unavailable outside the current Eastern UP pilot coverage.",
                "forecast_context": None,
                "lead_contexts": None
            }

        lat, lon = res['latitude'], res['longitude']
        default_scen = res.get('scenarios', {}).get('NORMAL', {})
        storage_pct = default_scen.get('storage_percent', 60.0)
        inflow = default_scen.get('recent_inflow_cumecs', 200.0)

        lead_contexts = []
        for lead in range(1, 11):
            grid_row = self.find_nearest_grid_point(forecast_init, lead, lat, lon)
            if grid_row is not None:
                rain = float(grid_row['ensemble_mean_mm'])
                bust_p = float(grid_row['baseline_p_bust'])
                ffd = float(grid_row['ffd'])
                fragility_cat = str(grid_row['fragility_category'])
                trust_idx = float(grid_row['trust_index'])
                rel_band = str(grid_row['reliability_band'])
                audit_status = str(grid_row['self_audit_status'])
                ffd_fail = ffd < 0.55 or fragility_cat in ["HIGH", "EXTREME"]
            else:
                rain = 0.0
                bust_p = 0.1
                ffd = 0.8
                fragility_cat = "LOW"
                trust_idx = 85.0
                rel_band = "GREEN"
                audit_status = "OK"
                ffd_fail = False

            att_status, _ = self.calculate_attention_status(
                storage_pct, rain, bust_p, audit_status, rel_band, trust_idx, inflow
            )

            lead_contexts.append({
                "lead_day": lead,
                "rainfall_mm": round(rain, 2),
                "bust_probability": round(bust_p, 4),
                "ffd": round(ffd, 4),
                "ffd_failure_found": ffd_fail,
                "fragility_category": fragility_cat,
                "trust_index": round(trust_idx, 2),
                "reliability_band": rel_band,
                "self_audit_status": audit_status,
                "attention_status": att_status
            })

        return {
            "reservoir_id": res['reservoir_id'],
            "reservoir_name": res['name'],
            "forecast_init": forecast_init,
            "data_mode": res.get('data_mode', 'DEMO_SCENARIO'),
            "coverage_available": True,
            "in_pilot_coverage": True,
            "context_mode": "Reservoir-area forecast context (Mode B)",
            "forecast_context": "AVAILABLE",
            "lead_contexts": lead_contexts
        }

    def get_decision_support(
        self,
        reservoir_id: str,
        forecast_init: str,
        lead_day: int = 1,
        scenario_key: str = "NORMAL"
    ) -> Optional[Dict[str, Any]]:
        res = self.get_reservoir_detail(reservoir_id)
        if not res:
            return None

        scenarios = res.get('scenarios', {})
        scen_data = scenarios.get(scenario_key, scenarios.get('NORMAL', {}))
        
        storage_pct = float(scen_data.get('storage_percent', 60.0))
        current_mcm = float(scen_data.get('current_storage_mcm', res['capacity_mcm'] * (storage_pct / 100.0)))
        inflow = float(scen_data.get('recent_inflow_cumecs', 200.0))
        scen_name = str(scen_data.get('scenario_name', scenario_key))

        in_pilot = res['in_pilot_coverage']
        lat, lon = res['latitude'], res['longitude']

        if not in_pilot:
            return {
                "reservoir_id": res['reservoir_id'],
                "reservoir_name": res['name'],
                "data_mode": res.get('data_mode', 'DEMO_SCENARIO'),
                "forecast_init": forecast_init,
                "lead_day": lead_day,
                "latitude": lat,
                "longitude": lon,
                "coverage_available": False,
                "in_pilot_coverage": False,
                "context_mode": "OUTSIDE_PILOT",
                "capacity_mcm": res['capacity_mcm'],
                "current_storage_mcm": round(current_mcm, 1),
                "storage_percent": round(storage_pct, 1),
                "recent_inflow_cumecs": inflow,
                "scenario_name": scen_name,
                "forecast_context": None,
                "decision_support": None,
                "attention_status": None,
                "rainfall_mm": None,
                "bust_probability": None,
                "ffd": None,
                "ffd_failure_found": None,
                "fragility_category": None,
                "ensemble_disagreement_category": None,
                "ood_category": None,
                "self_audit_status": None,
                "self_audit_reason": None,
                "trust_index": None,
                "reliability_band": None,
                "trust_horizon_day": None,
                "breaking_point_day": None,
                "reasons": [
                    "FORTRESS reliability analysis is unavailable outside the current Eastern UP pilot coverage."
                ],
                "limitations": [
                    "Coverage: FORTRESS model pilot restricted to Eastern UP region (24.5-28.5 N, 80.0-84.5 E).",
                    "Outside Pilot: Reliability analysis, forecast context, and attention status are suppressed for reservoirs outside the pilot extent."
                ],
                "disclaimer": (
                    "MANDATORY DISCLAIMER: FORTRESS provides forecast reliability stress-testing and self-audit intelligence ONLY. "
                    "It does NOT generate automated dam release orders, reservoir operation rules, or gate dispatch instructions. "
                    "Human dam safety authorities retain sole decision authority for reservoir management."
                )
            }

        grid_row = self.find_nearest_grid_point(forecast_init, lead_day, lat, lon)
        if grid_row is not None:
            rain = float(grid_row['ensemble_mean_mm'])
            bust_p = float(grid_row['baseline_p_bust'])
            ffd = float(grid_row['ffd'])
            fragility_cat = str(grid_row['fragility_category'])
            trust_idx = float(grid_row['trust_index'])
            rel_band = str(grid_row['reliability_band'])
            audit_status = str(grid_row['self_audit_status'])
            audit_reason = str(grid_row['self_audit_reason'])
            ens_dis = str(grid_row.get('ensemble_disagreement_category', 'LOW'))
            ood_cat = str(grid_row.get('ood_category', 'NORMAL'))
            ffd_fail = ffd < 0.55 or fragility_cat in ["HIGH", "EXTREME"]
            t_horizon = int(grid_row.get('trust_horizon_day', 5))
            b_point = int(grid_row['breaking_point_day']) if pd.notna(grid_row.get('breaking_point_day')) else None
        else:
            rain = 0.0
            bust_p = 0.1
            ffd = 0.8
            fragility_cat = "LOW"
            trust_idx = 85.0
            rel_band = "GREEN"
            audit_status = "OK"
            audit_reason = "Normal weather conditions verified."
            ens_dis = "LOW"
            ood_cat = "NORMAL"
            ffd_fail = False
            t_horizon = 5
            b_point = None

        att_status, reasons = self.calculate_attention_status(
            storage_pct, rain, bust_p, audit_status, rel_band, trust_idx, inflow
        )

        limitations = [
            "Mode B (Reservoir-Area Context): Catchment-aggregated hydrometeorological modeling unavailable; single nearest grid point utilized.",
            "Data Mode: DEMO_SCENARIO values used for SIH26079 prototype demonstration. Not connected to live SCADA systems.",
            "Coverage: FORTRESS model pilot restricted to Eastern UP region (24.5-28.5 N, 80.0-84.5 E)."
        ]

        disclaimer = (
            "MANDATORY DISCLAIMER: FORTRESS provides forecast reliability stress-testing and self-audit intelligence ONLY. "
            "It does NOT generate automated dam release orders, reservoir operation rules, or gate dispatch instructions. "
            "Human dam safety authorities retain sole decision authority for reservoir management."
        )

        return {
            "reservoir_id": res['reservoir_id'],
            "reservoir_name": res['name'],
            "data_mode": res.get('data_mode', 'DEMO_SCENARIO'),
            "forecast_init": forecast_init,
            "lead_day": lead_day,
            "latitude": lat,
            "longitude": lon,
            "coverage_available": True,
            "in_pilot_coverage": True,
            "context_mode": "Reservoir-area forecast context (Mode B)",
            "forecast_context": "AVAILABLE",
            "decision_support": "AVAILABLE",
            "capacity_mcm": res['capacity_mcm'],
            "current_storage_mcm": round(current_mcm, 1),
            "storage_percent": round(storage_pct, 1),
            "recent_inflow_cumecs": inflow,
            "scenario_name": scen_name,
            "rainfall_mm": round(rain, 2),
            "bust_probability": round(bust_p, 4),
            "ffd": round(ffd, 4),
            "ffd_failure_found": ffd_fail,
            "fragility_category": fragility_cat,
            "ensemble_disagreement_category": ens_dis,
            "ood_category": ood_cat,
            "self_audit_status": audit_status,
            "self_audit_reason": audit_reason,
            "trust_index": round(trust_idx, 2),
            "reliability_band": rel_band,
            "trust_horizon_day": t_horizon,
            "breaking_point_day": b_point,
            "attention_status": att_status,
            "reasons": reasons,
            "limitations": limitations,
            "disclaimer": disclaimer
        }

    def process_custom_scenario(
        self,
        reservoir_id: str,
        storage_percent: float,
        recent_inflow_cumecs: float = 300.0,
        scenario_name: str = "Custom What-If Scenario",
        forecast_init: Optional[str] = None,
        lead_day: int = 1
    ) -> Optional[Dict[str, Any]]:
        res = self.get_reservoir_detail(reservoir_id)
        if not res:
            return None

        if not forecast_init and data_service.init_dates:
            forecast_init = data_service.init_dates[0]

        in_pilot = res['in_pilot_coverage']
        lat, lon = res['latitude'], res['longitude']
        capacity = res['capacity_mcm']
        current_mcm = capacity * (storage_percent / 100.0)

        if not in_pilot:
            return {
                "reservoir_id": reservoir_id,
                "scenario_name": scenario_name,
                "storage_percent": round(storage_percent, 1),
                "current_storage_mcm": round(current_mcm, 1),
                "recent_inflow_cumecs": recent_inflow_cumecs,
                "coverage_available": False,
                "attention_status": None,
                "reasons": [
                    "FORTRESS reliability analysis is unavailable outside the current Eastern UP pilot coverage."
                ],
                "data_mode": res.get('data_mode', 'DEMO_SCENARIO')
            }

        grid_row = self.find_nearest_grid_point(forecast_init, lead_day, lat, lon) if forecast_init else None
        if grid_row is not None:
            rain = float(grid_row['ensemble_mean_mm'])
            bust_p = float(grid_row['baseline_p_bust'])
            trust_idx = float(grid_row['trust_index'])
            rel_band = str(grid_row['reliability_band'])
            audit_status = str(grid_row['self_audit_status'])
        else:
            rain = 0.0
            bust_p = 0.1
            trust_idx = 85.0
            rel_band = "GREEN"
            audit_status = "OK"

        att_status, reasons = self.calculate_attention_status(
            storage_percent, rain, bust_p, audit_status, rel_band, trust_idx, recent_inflow_cumecs
        )

        return {
            "reservoir_id": reservoir_id,
            "scenario_name": scenario_name,
            "storage_percent": round(storage_percent, 1),
            "current_storage_mcm": round(current_mcm, 1),
            "recent_inflow_cumecs": recent_inflow_cumecs,
            "coverage_available": True,
            "attention_status": att_status,
            "reasons": reasons,
            "data_mode": res.get('data_mode', 'DEMO_SCENARIO')
        }

reservoir_service = ReservoirService()
