import os
import json
import yaml
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional
from backend.app.data_service import data_service

class DisasterService:
    def __init__(self):
        self.scenarios: List[Dict[str, Any]] = []
        self.config: Dict[str, Any] = {}
        self.loaded = False

    def load_data(self, base_dir: str = "."):
        # Load config
        config_path = os.path.join(base_dir, "configs", "disaster_decision_support.yaml")
        if os.path.exists(config_path):
            with open(config_path, "r", encoding="utf-8") as f:
                self.config = yaml.safe_load(f)
        else:
            self.config = {
                "rainfall": {"light_mm": 5.0, "moderate_mm": 15.0, "heavy_mm": 35.0, "very_heavy_mm": 65.0, "multi_day_heavy_mm": 50.0},
                "wind": {"elevated_ms": 8.0, "high_ms": 15.0},
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

        # Load domain demo disaster scenarios
        json_path = os.path.join(base_dir, "data", "domain", "disaster_demo.json")
        if os.path.exists(json_path):
            with open(json_path, "r", encoding="utf-8") as f:
                self.scenarios = json.load(f)
        else:
            self.scenarios = []

        self.loaded = True

    def check_pilot_coverage(self, lat: float, lon: float) -> bool:
        spatial = self.config.get("spatial", {})
        min_lat = spatial.get("pilot_min_lat", 24.5)
        max_lat = spatial.get("pilot_max_lat", 28.5)
        min_lon = spatial.get("pilot_min_lon", 80.0)
        max_lon = spatial.get("pilot_max_lon", 84.5)
        return (min_lat <= lat <= max_lat) and (min_lon <= lon <= max_lon)

    def find_nearest_grid_point(self, forecast_init: str, lead_day: int, lat: float, lon: float):
        """Find grid point in df_self_audit nearest to lat, lon (permitted only for inside-pilot locations)."""
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

        sub = sub.copy()
        sub['dist'] = np.sqrt((sub['latitude'] - lat) ** 2 + (sub['longitude'] - lon) ** 2)
        min_row = sub.sort_values('dist').iloc[0]
        return min_row

    def compute_multi_day_accumulated_rain(self, forecast_init: str, lat: float, lon: float, max_lead: int = 3) -> float:
        """Calculate multi-day accumulated forecast rainfall (D1 through max_lead)."""
        total_rain = 0.0
        for lead in range(1, max_lead + 1):
            grid_row = self.find_nearest_grid_point(forecast_init, lead, lat, lon)
            if grid_row is not None:
                total_rain += float(grid_row['ensemble_mean_mm'])
        return round(total_rain, 2)

    def generate_weather_flags(
        self,
        rainfall_mm: float,
        multi_day_rain_mm: float,
        wind_speed_ms: float,
        vulnerability_level: str,
        exposure_level: str,
        hazard_context: str
    ) -> List[str]:
        flags = []
        mod_rain = self.config.get("rainfall", {}).get("moderate_mm", 15.0)
        heavy_rain = self.config.get("rainfall", {}).get("heavy_mm", 35.0)
        multi_heavy = self.config.get("rainfall", {}).get("multi_day_heavy_mm", 50.0)
        high_wind = self.config.get("wind", {}).get("high_ms", 15.0)

        if rainfall_mm >= heavy_rain:
            flags.append("HEAVY_RAINFALL")
        elif rainfall_mm >= mod_rain:
            flags.append("SIGNIFICANT_RAINFALL")

        if multi_day_rain_mm >= multi_heavy:
            flags.append("MULTI_DAY_RAINFALL_ACCUMULATION")

        if wind_speed_ms >= high_wind:
            flags.append("HIGH_WIND")

        if vulnerability_level == "HIGH":
            flags.append("HIGH_VULNERABILITY_DEMO")

        if exposure_level == "HIGH":
            flags.append("HIGH_EXPOSURE_DEMO")

        if hazard_context in ["FLOOD_PREPAREDNESS", "MULTI_HAZARD_WEATHER"]:
            flags.append("CRITICAL_ASSET_CONTEXT")

        return flags

    def calculate_attention_status(
        self,
        hazard_context: str,
        preparedness_mode: str,
        vulnerability_level: str,
        exposure_level: str,
        rainfall_mm: float,
        multi_day_rain_mm: float,
        wind_speed_ms: float,
        bust_prob: float,
        self_audit_status: str,
        reliability_band: str,
        trust_index: float,
        ood_category: str = "NORMAL"
    ) -> tuple[str, List[str]]:
        reasons = []

        # Thresholds
        mod_rain = self.config.get("rainfall", {}).get("moderate_mm", 15.0)
        heavy_rain = self.config.get("rainfall", {}).get("heavy_mm", 35.0)
        multi_heavy = self.config.get("rainfall", {}).get("multi_day_heavy_mm", 50.0)
        elev_wind = self.config.get("wind", {}).get("elevated_ms", 8.0)
        high_wind = self.config.get("wind", {}).get("high_ms", 15.0)
        low_trust = self.config.get("trust", {}).get("low_trust_index", 50.0)
        elev_bust = self.config.get("bust", {}).get("elevated_probability", 0.40)

        # 1. Operational relevance gate
        is_weather_signal = (
            rainfall_mm >= mod_rain or
            multi_day_rain_mm >= multi_heavy or
            wind_speed_ms >= elev_wind or
            hazard_context in ["FLOOD_PREPAREDNESS", "HEAVY_RAINFALL", "MULTI_HAZARD_WEATHER"]
        )
        is_elevated_context = (
            vulnerability_level == "HIGH" or
            exposure_level == "HIGH" or
            preparedness_mode in ["RESOURCE_REVIEW", "FIELD_TEAM_READINESS", "CRITICAL_ASSET_MONITORING", "EMERGENCY_COORDINATION_REVIEW"]
        )

        disaster_relevance = is_weather_signal or is_elevated_context

        is_poor_reliability = (
            self_audit_status in ["CONFLICT", "POSSIBLE BLIND SPOT", "EXPERT REVIEW"] or
            reliability_band == "RED" or
            trust_index < low_trust or
            ood_category in ["UNUSUAL", "HIGHLY_NOVEL", "NOVEL", "EXTREME_NOVEL"]
        )

        # High Uncertainty Rule
        if disaster_relevance and is_poor_reliability:
            reasons.append(
                f"Preparedness-relevant weather conditions are present (Hazard Context: {hazard_context}, Preparedness Mode: {preparedness_mode}), "
                f"while forecast reliability evidence is weak or conflicting (Self-Audit: '{self_audit_status}', "
                f"Reliability Band: '{reliability_band}', Trust Index: {trust_index:.1f}/100). "
                f"Expert meteorological / disaster-management review is recommended before relying on forecast guidance."
            )
            return "HIGH_UNCERTAINTY_EXPERT_REVIEW", reasons

        # Heightened Preparedness Rule
        if (rainfall_mm >= heavy_rain or multi_day_rain_mm >= multi_heavy or wind_speed_ms >= high_wind) and (vulnerability_level == "HIGH" or exposure_level == "HIGH" or preparedness_mode in ["RESOURCE_REVIEW", "EMERGENCY_COORDINATION_REVIEW"]):
            reasons.append(
                f"Significant weather signal (Rainfall: {rainfall_mm:.1f} mm, D1-D3 Accumulation: {multi_day_rain_mm:.1f} mm, Wind: {wind_speed_ms:.1f} m/s) "
                f"combines with HIGH vulnerability / exposure ({vulnerability_level}/{exposure_level}) in selected preparedness mode ({preparedness_mode})."
            )
            return "HEIGHTENED_PREPAREDNESS", reasons

        # Preparedness Review Rule
        if rainfall_mm >= mod_rain or multi_day_rain_mm >= 30.0 or vulnerability_level in ["MEDIUM", "HIGH"] or bust_prob >= elev_bust or reliability_band == "YELLOW":
            if rainfall_mm >= mod_rain:
                reasons.append(f"Moderate rainfall forecast ({rainfall_mm:.1f} mm).")
            if multi_day_rain_mm >= 30.0:
                reasons.append(f"Elevated D1-D3 forecast rainfall accumulation ({multi_day_rain_mm:.1f} mm).")
            if vulnerability_level in ["MEDIUM", "HIGH"]:
                reasons.append(f"Demo vulnerability level is {vulnerability_level}.")
            if bust_prob >= elev_bust:
                reasons.append(f"Elevated forecast bust probability ({bust_prob*100:.1f}%).")
            if reliability_band == "YELLOW":
                reasons.append(f"Moderate forecast reliability (AMBER band).")
            return "PREPAREDNESS_REVIEW", reasons

        # Normal Monitoring
        if is_poor_reliability and not disaster_relevance:
            reasons.append(
                f"Weather forecast reliability is {reliability_band} / low trust ({trust_index:.1f}/100), "
                f"but operational relevance to disaster preparedness context is low. "
                f"Displayed as weather-reliability concern without escalating disaster preparedness status."
            )

        reasons.append("No elevated disaster-preparedness trigger was identified under current prototype decision-support rules.")
        return "NORMAL_MONITORING", reasons

    def get_disaster_summary(self) -> List[Dict[str, Any]]:
        result = []
        for s in self.scenarios:
            in_pilot = self.check_pilot_coverage(s['latitude'], s['longitude'])
            result.append({
                "scenario_id": s['scenario_id'],
                "name": s['name'],
                "latitude": s['latitude'],
                "longitude": s['longitude'],
                "district_label": s['district_label'],
                "state": s['state'],
                "data_mode": s.get('data_mode', 'DEMO_SCENARIO'),
                "hazard_context": s['hazard_context'],
                "preparedness_mode": s['preparedness_mode'],
                "vulnerability_level": s['vulnerability_level'],
                "exposure_level": s['exposure_level'],
                "population_exposure_mode": s.get('population_exposure_mode', 'DEMO'),
                "population_exposure_value": s.get('population_exposure_value', 0),
                "coverage_available": in_pilot,
                "in_pilot_coverage": in_pilot
            })
        return result

    def get_disaster_detail(self, scenario_id: str) -> Optional[Dict[str, Any]]:
        for s in self.scenarios:
            if s['scenario_id'] == scenario_id:
                s_copy = dict(s)
                in_pilot = self.check_pilot_coverage(s['latitude'], s['longitude'])
                s_copy['coverage_available'] = in_pilot
                s_copy['in_pilot_coverage'] = in_pilot
                return s_copy
        return None

    def get_forecast_context(self, scenario_id: str, forecast_init: str) -> Optional[Dict[str, Any]]:
        scen = self.get_disaster_detail(scenario_id)
        if not scen:
            return None

        in_pilot = scen['in_pilot_coverage']
        if not in_pilot:
            return {
                "scenario_id": scen['scenario_id'],
                "scenario_name": scen['name'],
                "forecast_init": forecast_init,
                "data_mode": scen.get('data_mode', 'DEMO_SCENARIO'),
                "coverage_available": False,
                "in_pilot_coverage": False,
                "context_mode": "OUTSIDE_PILOT",
                "reason": "FORTRESS reliability analysis is unavailable outside the current Eastern UP pilot coverage.",
                "forecast_context": None,
                "lead_contexts": None
            }

        lat, lon = scen['latitude'], scen['longitude']
        hazard = scen['hazard_context']
        mode = scen['preparedness_mode']
        vuln = scen['vulnerability_level']
        exp = scen['exposure_level']

        lead_contexts = []
        for lead in range(1, 11):
            grid_row = self.find_nearest_grid_point(forecast_init, lead, lat, lon)
            if grid_row is not None:
                rain = float(grid_row['ensemble_mean_mm'])
                temp = float(grid_row.get('temperature_c', 28.5))
                hum = float(grid_row.get('humidity_gkg', 14.2))
                wind = float(grid_row.get('wind_speed_ms', 4.5))
                bust_p = float(grid_row['baseline_p_bust'])
                ffd = float(grid_row['ffd'])
                fragility_cat = str(grid_row['fragility_category'])
                trust_idx = float(grid_row['trust_index'])
                rel_band = str(grid_row['reliability_band'])
                audit_status = str(grid_row['self_audit_status'])
                ood_cat = str(grid_row.get('ood_category', 'NORMAL'))
                ffd_fail = ffd < 0.55 or fragility_cat in ["HIGH", "EXTREME"]
            else:
                rain = 0.0
                temp = 28.5
                hum = 14.2
                wind = 4.5
                bust_p = 0.1
                ffd = 0.8
                fragility_cat = "LOW"
                trust_idx = 85.0
                rel_band = "GREEN"
                audit_status = "OK"
                ood_cat = "NORMAL"
                ffd_fail = False

            multi_rain = self.compute_multi_day_accumulated_rain(forecast_init, lat, lon, max_lead=min(lead, 3))

            att_status, _ = self.calculate_attention_status(
                hazard, mode, vuln, exp, rain, multi_rain, wind, bust_p, audit_status, rel_band, trust_idx, ood_cat
            )

            lead_contexts.append({
                "lead_day": lead,
                "rainfall_mm": round(rain, 2),
                "multi_day_rainfall_mm": multi_rain,
                "temperature_c": round(temp, 1),
                "humidity_gkg": round(hum, 2),
                "wind_speed_ms": round(wind, 1),
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
            "scenario_id": scen['scenario_id'],
            "scenario_name": scen['name'],
            "forecast_init": forecast_init,
            "data_mode": scen.get('data_mode', 'DEMO_SCENARIO'),
            "coverage_available": True,
            "in_pilot_coverage": True,
            "context_mode": "Disaster preparedness forecast context (Mode B)",
            "forecast_context": "AVAILABLE",
            "lead_contexts": lead_contexts
        }

    def get_decision_support(
        self,
        scenario_id: str,
        forecast_init: str,
        lead_day: int = 1
    ) -> Optional[Dict[str, Any]]:
        scen = self.get_disaster_detail(scenario_id)
        if not scen:
            return None

        in_pilot = scen['in_pilot_coverage']
        lat, lon = scen['latitude'], scen['longitude']
        hazard = scen['hazard_context']
        mode = scen['preparedness_mode']
        vuln = scen['vulnerability_level']
        exp = scen['exposure_level']

        if not in_pilot:
            return {
                "scenario_id": scen['scenario_id'],
                "scenario_name": scen['name'],
                "data_mode": scen.get('data_mode', 'DEMO_SCENARIO'),
                "forecast_init": forecast_init,
                "lead_day": lead_day,
                "latitude": lat,
                "longitude": lon,
                "coverage_available": False,
                "in_pilot_coverage": False,
                "context_mode": "OUTSIDE_PILOT",
                "hazard_context": hazard,
                "preparedness_mode": mode,
                "vulnerability_level": vuln,
                "exposure_level": exp,
                "critical_assets": scen.get('critical_assets', 'N/A'),
                "population_exposure_mode": scen.get('population_exposure_mode', 'DEMO'),
                "population_exposure_value": scen.get('population_exposure_value', 0),
                "forecast_context": None,
                "decision_support": None,
                "attention_status": None,
                "rainfall_mm": None,
                "multi_day_rainfall_mm": None,
                "temperature_c": None,
                "humidity_gkg": None,
                "wind_speed_ms": None,
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
                "is_what_if_override": False,
                "rainfall_mm_override": None,
                "wind_speed_override": None,
                "weather_flags": [],
                "reasons": [
                    "FORTRESS reliability analysis is unavailable outside the current Eastern UP pilot coverage."
                ],
                "limitations": [
                    "Coverage: FORTRESS model pilot restricted to Eastern UP region (24.5-28.5 N, 80.0-84.5 E).",
                    "Outside Pilot: Reliability analysis, forecast context, and attention status are suppressed for scenarios outside pilot extent."
                ],
                "disclaimer": (
                    "MANDATORY DISCLAIMER: Decision-support information ONLY — not an official weather, flood, evacuation, "
                    "or emergency-management warning. Official IMD/CWC/NDMA warnings remain authoritative."
                )
            }

        grid_row = self.find_nearest_grid_point(forecast_init, lead_day, lat, lon)
        if grid_row is not None:
            rain = float(grid_row['ensemble_mean_mm'])
            temp = float(grid_row.get('temperature_c', 28.5))
            hum = float(grid_row.get('humidity_gkg', 14.2))
            wind = float(grid_row.get('wind_speed_ms', 4.5))
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
            temp = 28.5
            hum = 14.2
            wind = 4.5
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

        multi_rain = self.compute_multi_day_accumulated_rain(forecast_init, lat, lon, max_lead=min(lead_day, 3))
        flags = self.generate_weather_flags(rain, multi_rain, wind, vuln, exp, hazard)

        att_status, reasons = self.calculate_attention_status(
            hazard, mode, vuln, exp, rain, multi_rain, wind, bust_p, audit_status, rel_band, trust_idx, ood_cat
        )

        limitations = [
            "Prototype disaster management decision-support heuristics.",
            "Scenario vulnerability and exposure values are synthetic for SIH26079 demonstration.",
            "No hydrological routing model or flood inundation depth prediction is implemented.",
            "Rainfall does not directly equal flooding.",
            "No automatic evacuation order or emergency dispatch command is issued.",
            "Coverage restricted to Eastern UP pilot region (24.5-28.5 N, 80.0-84.5 E)."
        ]

        disclaimer = (
            "MANDATORY DISCLAIMER: Decision-support information ONLY — not an official weather, flood, evacuation, "
            "or emergency-management warning. Official IMD/CWC/NDMA warnings remain authoritative."
        )

        return {
            "scenario_id": scen['scenario_id'],
            "scenario_name": scen['name'],
            "data_mode": scen.get('data_mode', 'DEMO_SCENARIO'),
            "forecast_init": forecast_init,
            "lead_day": lead_day,
            "latitude": lat,
            "longitude": lon,
            "coverage_available": True,
            "in_pilot_coverage": True,
            "context_mode": "Disaster preparedness forecast context (Mode B)",
            "forecast_context": "AVAILABLE",
            "decision_support": "AVAILABLE",
            "hazard_context": hazard,
            "preparedness_mode": mode,
            "vulnerability_level": vuln,
            "exposure_level": exp,
            "critical_assets": scen.get('critical_assets', 'N/A'),
            "population_exposure_mode": scen.get('population_exposure_mode', 'DEMO'),
            "population_exposure_value": scen.get('population_exposure_value', 0),
            "rainfall_mm": round(rain, 2),
            "multi_day_rainfall_mm": multi_rain,
            "temperature_c": round(temp, 1),
            "humidity_gkg": round(hum, 2),
            "wind_speed_ms": round(wind, 1),
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
            "is_what_if_override": False,
            "rainfall_mm_override": None,
            "wind_speed_override": None,
            "attention_status": att_status,
            "weather_flags": flags,
            "reasons": reasons,
            "limitations": limitations,
            "disclaimer": disclaimer
        }

    def process_custom_scenario(
        self,
        scenario_id: str,
        hazard_context: Optional[str] = None,
        preparedness_mode: Optional[str] = None,
        vulnerability_level: Optional[str] = None,
        exposure_level: Optional[str] = None,
        rainfall_mm_override: Optional[float] = None,
        wind_speed_override: Optional[float] = None,
        scenario_name: str = "Custom Disaster What-If Scenario",
        forecast_init: Optional[str] = None,
        lead_day: int = 1
    ) -> Optional[Dict[str, Any]]:
        scen = self.get_disaster_detail(scenario_id)
        if not scen:
            return None

        if not forecast_init and data_service.init_dates:
            forecast_init = data_service.init_dates[0]

        in_pilot = scen['in_pilot_coverage']
        lat, lon = scen['latitude'], scen['longitude']

        eff_hazard = hazard_context or scen['hazard_context']
        eff_mode = preparedness_mode or scen['preparedness_mode']
        eff_vuln = vulnerability_level or scen['vulnerability_level']
        eff_exp = exposure_level or scen['exposure_level']

        if not in_pilot:
            return {
                "scenario_id": scenario_id,
                "scenario_name": scenario_name,
                "hazard_context": eff_hazard,
                "preparedness_mode": eff_mode,
                "vulnerability_level": eff_vuln,
                "exposure_level": eff_exp,
                "coverage_available": False,
                "is_what_if_override": True,
                "actual_rainfall_mm": None,
                "rainfall_mm_override": rainfall_mm_override,
                "actual_wind_speed_ms": None,
                "wind_speed_override": wind_speed_override,
                "attention_status": None,
                "weather_flags": [],
                "reasons": [
                    "FORTRESS reliability analysis is unavailable outside the current Eastern UP pilot coverage."
                ],
                "data_mode": scen.get('data_mode', 'DEMO_SCENARIO')
            }

        grid_row = self.find_nearest_grid_point(forecast_init, lead_day, lat, lon) if forecast_init else None
        if grid_row is not None:
            rain = float(grid_row['ensemble_mean_mm'])
            wind = float(grid_row.get('wind_speed_ms', 4.5))
            bust_p = float(grid_row['baseline_p_bust'])
            trust_idx = float(grid_row['trust_index'])
            rel_band = str(grid_row['reliability_band'])
            audit_status = str(grid_row['self_audit_status'])
            ood_cat = str(grid_row.get('ood_category', 'NORMAL'))
        else:
            rain = 0.0
            wind = 4.5
            bust_p = 0.1
            trust_idx = 85.0
            rel_band = "GREEN"
            audit_status = "OK"
            ood_cat = "NORMAL"

        multi_rain = self.compute_multi_day_accumulated_rain(forecast_init, lat, lon, max_lead=min(lead_day, 3))
        eff_rain = rainfall_mm_override if rainfall_mm_override is not None else rain
        eff_wind = wind_speed_override if wind_speed_override is not None else wind

        flags = self.generate_weather_flags(eff_rain, multi_rain, eff_wind, eff_vuln, eff_exp, eff_hazard)

        att_status, reasons = self.calculate_attention_status(
            eff_hazard, eff_mode, eff_vuln, eff_exp, eff_rain, multi_rain, eff_wind, bust_p, audit_status, rel_band, trust_idx, ood_cat
        )

        if rainfall_mm_override is not None:
            reasons.append(f"DEMO WHAT-IF OVERRIDE: Rainfall set to {rainfall_mm_override:.1f} mm (actual GEFS forecast: {rain:.1f} mm).")
        if wind_speed_override is not None:
            reasons.append(f"DEMO WHAT-IF OVERRIDE: Wind speed set to {wind_speed_override:.1f} m/s (actual GEFS forecast: {wind:.1f} m/s).")

        return {
            "scenario_id": scenario_id,
            "scenario_name": scenario_name,
            "hazard_context": eff_hazard,
            "preparedness_mode": eff_mode,
            "vulnerability_level": eff_vuln,
            "exposure_level": eff_exp,
            "coverage_available": True,
            "is_what_if_override": True,
            "actual_rainfall_mm": round(rain, 2),
            "rainfall_mm_override": round(rainfall_mm_override, 2) if rainfall_mm_override is not None else None,
            "actual_wind_speed_ms": round(wind, 1),
            "wind_speed_override": round(wind_speed_override, 1) if wind_speed_override is not None else None,
            "attention_status": att_status,
            "weather_flags": flags,
            "reasons": reasons,
            "data_mode": scen.get('data_mode', 'DEMO_SCENARIO')
        }

disaster_service = DisasterService()
