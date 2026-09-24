import os
import json
import yaml
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional
from backend.app.data_service import data_service

class RenewableService:
    def __init__(self):
        self.scenarios: List[Dict[str, Any]] = []
        self.config: Dict[str, Any] = {}
        self.loaded = False

    def load_data(self, base_dir: str = "."):
        # Load config
        config_path = os.path.join(base_dir, "configs", "renewable_grid_decision_support.yaml")
        if os.path.exists(config_path):
            with open(config_path, "r", encoding="utf-8") as f:
                self.config = yaml.safe_load(f)
        else:
            self.config = {
                "wind": {"low_ms": 3.0, "moderate_ms": 6.0, "elevated_ms": 10.0, "high_variability_delta_ms": 3.5},
                "trust": {"low_trust_index": 50.0, "moderate_trust_index": 70.0},
                "bust": {"elevated_probability": 0.40, "high_probability": 0.60},
                "variability": {"moderate_change_ms": 2.0, "high_change_ms": 4.0},
                "spatial": {
                    "pilot_min_lat": 24.5,
                    "pilot_max_lat": 28.5,
                    "pilot_min_lon": 80.0,
                    "pilot_max_lon": 84.5,
                    "max_snap_dist_deg": 0.75
                }
            }

        # Load domain demo renewable scenarios
        json_path = os.path.join(base_dir, "data", "domain", "renewable_demo.json")
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

    def compute_wind_variability_diagnostic(self, forecast_init: str, lat: float, lon: float, current_lead: int) -> Dict[str, Any]:
        """Calculate lead-to-lead wind speed change and D1-D3 range diagnostic (10m wind)."""
        curr_row = self.find_nearest_grid_point(forecast_init, current_lead, lat, lon)
        curr_wind = float(curr_row.get('wind_speed_mean_ms', 4.5)) if curr_row is not None else 4.5

        if current_lead > 1:
            prev_row = self.find_nearest_grid_point(forecast_init, current_lead - 1, lat, lon)
            prev_wind = float(prev_row.get('wind_speed_mean_ms', 4.5)) if prev_row is not None else curr_wind
        else:
            prev_wind = curr_wind

        wind_change = round(abs(curr_wind - prev_wind), 2)

        # D1-D3 wind range
        d1_d3_winds = []
        for lead in range(1, 4):
            r = self.find_nearest_grid_point(forecast_init, lead, lat, lon)
            if r is not None:
                d1_d3_winds.append(float(r.get('wind_speed_mean_ms', 4.5)))
        
        wind_range_d1_d3 = round(max(d1_d3_winds) - min(d1_d3_winds), 2) if d1_d3_winds else 0.0

        return {
            "wind_speed_10m_ms": round(curr_wind, 2),
            "wind_change_ms": wind_change,
            "wind_range_d1_d3_ms": wind_range_d1_d3
        }

    def generate_weather_flags(
        self,
        wind_speed_ms: float,
        wind_change_ms: float,
        technology_type: str,
        planning_mode: str,
        grid_sensitivity: str,
        variability_sensitivity: str
    ) -> List[str]:
        flags = []
        high_wind = self.config.get("wind", {}).get("elevated_ms", 10.0)
        high_delta = self.config.get("wind", {}).get("high_variability_delta_ms", 3.5)
        mod_delta = self.config.get("variability", {}).get("moderate_change_ms", 2.0)
        low_wind = self.config.get("wind", {}).get("low_ms", 3.0)

        if wind_speed_ms >= high_wind:
            flags.append("ELEVATED_WIND")
        elif wind_speed_ms < low_wind:
            flags.append("LOW_WIND_CONTEXT")

        if wind_change_ms >= high_delta:
            flags.append("HIGH_WIND_VARIABILITY")
        elif wind_change_ms >= mod_delta:
            flags.append("RAPID_WIND_CHANGE")

        if grid_sensitivity == "HIGH":
            flags.append("GRID_SENSITIVITY_HIGH_DEMO")

        if variability_sensitivity == "HIGH":
            flags.append("VARIABILITY_SENSITIVITY_HIGH_DEMO")

        if technology_type in ["SOLAR", "HYBRID"]:
            flags.append("SOLAR_DIAGNOSTIC_UNAVAILABLE")

        return flags

    def calculate_attention_status(
        self,
        technology_type: str,
        planning_mode: str,
        variability_sensitivity: str,
        grid_sensitivity: str,
        wind_speed_ms: float,
        wind_change_ms: float,
        rainfall_mm: float,
        bust_prob: float,
        self_audit_status: str,
        reliability_band: str,
        trust_index: float,
        ood_category: str = "NORMAL"
    ) -> tuple[str, List[str]]:
        reasons = []

        # Thresholds
        mod_wind = self.config.get("wind", {}).get("moderate_ms", 6.0)
        high_wind = self.config.get("wind", {}).get("elevated_ms", 10.0)
        high_delta = self.config.get("wind", {}).get("high_variability_delta_ms", 3.5)
        mod_delta = self.config.get("variability", {}).get("moderate_change_ms", 2.0)
        low_trust = self.config.get("trust", {}).get("low_trust_index", 50.0)
        elev_bust = self.config.get("bust", {}).get("elevated_probability", 0.40)

        # 1. Operational relevance gate
        is_wind_relevance = (
            technology_type in ["WIND", "HYBRID"] and (
                wind_speed_ms >= mod_wind or
                wind_change_ms >= mod_delta or
                planning_mode in ["GENERATION_PLANNING_REVIEW", "GRID_BALANCING_REVIEW", "EXPERT_OPERATIONAL_REVIEW"] or
                variability_sensitivity == "HIGH" or
                grid_sensitivity == "HIGH"
            )
        )

        is_elevated_grid_context = (
            grid_sensitivity == "HIGH" or
            planning_mode in ["GRID_BALANCING_REVIEW", "EXPERT_OPERATIONAL_REVIEW"]
        )

        if technology_type == "SOLAR":
            renewable_relevance = is_elevated_grid_context
        else:
            renewable_relevance = is_wind_relevance or is_elevated_grid_context

        is_poor_reliability = (
            self_audit_status in ["CONFLICT", "POSSIBLE BLIND SPOT", "EXPERT REVIEW"] or
            reliability_band == "RED" or
            trust_index < low_trust or
            ood_category in ["UNUSUAL", "HIGHLY_NOVEL", "NOVEL", "EXTREME_NOVEL"]
        )

        # High Uncertainty Rule
        if renewable_relevance and is_poor_reliability:
            reasons.append(
                f"Renewable/grid planning context is weather-sensitive (Technology: {technology_type}, Mode: {planning_mode}), "
                f"while forecast reliability evidence is weak or conflicting (Self-Audit: '{self_audit_status}', "
                f"Reliability Band: '{reliability_band}', Trust Index: {trust_index:.1f}/100). "
                f"Expert meteorological and grid-operations review is recommended before relying on weather forecast guidance."
            )
            return "HIGH_UNCERTAINTY_EXPERT_REVIEW", reasons

        # Grid Preparedness Review Rule
        if technology_type in ["WIND", "HYBRID"]:
            if (wind_speed_ms >= high_wind or wind_change_ms >= high_delta or planning_mode == "GRID_BALANCING_REVIEW") and (grid_sensitivity == "HIGH" or variability_sensitivity == "HIGH"):
                reasons.append(
                    f"Elevated 10m wind weather signal (Wind Speed: {wind_speed_ms:.1f} m/s, Lead Change: {wind_change_ms:.1f} m/s) "
                    f"combines with HIGH grid/variability sensitivity ({grid_sensitivity}/{variability_sensitivity}) in selected planning mode ({planning_mode})."
                )
                return "GRID_PREPAREDNESS_REVIEW", reasons
        elif technology_type == "SOLAR":
            if planning_mode == "GRID_BALANCING_REVIEW" and grid_sensitivity == "HIGH":
                reasons.append(
                    f"Generic grid preparedness review triggered by selected planning mode ({planning_mode}) and HIGH grid sensitivity ({grid_sensitivity}). "
                    f"Note: Solar irradiance diagnostic is unavailable; status is based on generic grid-planning context, not solar generation prediction."
                )
                return "GRID_PREPAREDNESS_REVIEW", reasons

        # Generation Variability Review Rule
        if technology_type in ["WIND", "HYBRID"]:
            if wind_speed_ms >= mod_wind or wind_change_ms >= mod_delta or planning_mode in ["GENERATION_PLANNING_REVIEW", "VARIABILITY_MONITORING"] or bust_prob >= elev_bust or reliability_band == "YELLOW":
                if wind_speed_ms >= mod_wind:
                    reasons.append(f"Moderate 10m wind speed forecast ({wind_speed_ms:.1f} m/s).")
                if wind_change_ms >= mod_delta:
                    reasons.append(f"Lead-to-lead 10m wind speed variation ({wind_change_ms:.1f} m/s).")
                if planning_mode in ["GENERATION_PLANNING_REVIEW", "VARIABILITY_MONITORING"]:
                    reasons.append(f"Selected grid planning mode is {planning_mode}.")
                if bust_prob >= elev_bust:
                    reasons.append(f"Elevated forecast bust probability ({bust_prob*100:.1f}%).")
                if reliability_band == "YELLOW":
                    reasons.append(f"Moderate forecast reliability (AMBER band).")
                return "GENERATION_VARIABILITY_REVIEW", reasons
        elif technology_type == "SOLAR":
            if planning_mode in ["GENERATION_PLANNING_REVIEW", "VARIABILITY_MONITORING"]:
                reasons.append(
                    f"Generic grid planning context ({planning_mode}). Note: Solar irradiance diagnostic is unavailable; "
                    f"this status reflects generic grid monitoring mode and does NOT predict solar generation variability."
                )
                return "GENERATION_VARIABILITY_REVIEW", reasons

        # Normal Monitoring
        if is_poor_reliability and not renewable_relevance:
            reasons.append(
                f"Weather forecast reliability is {reliability_band} / low trust ({trust_index:.1f}/100), "
                f"but operational relevance to renewable/grid planning context is low. "
                f"Displayed as weather-reliability concern without escalating renewable grid status."
            )

        reasons.append("No elevated renewable/grid decision-support trigger was identified under current prototype rules.")
        return "NORMAL_MONITORING", reasons


    def get_renewable_summary(self) -> List[Dict[str, Any]]:
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
                "technology_type": s['technology_type'],
                "planning_mode": s['planning_mode'],
                "variability_sensitivity": s['variability_sensitivity'],
                "grid_sensitivity": s['grid_sensitivity'],
                "installed_capacity_mode": s.get('installed_capacity_mode', 'DEMO'),
                "installed_capacity_mw": s.get('installed_capacity_mw', 100.0),
                "solar_irradiance_available": False,
                "coverage_available": in_pilot,
                "in_pilot_coverage": in_pilot
            })
        return result

    def get_renewable_detail(self, scenario_id: str) -> Optional[Dict[str, Any]]:
        for s in self.scenarios:
            if s['scenario_id'] == scenario_id:
                s_copy = dict(s)
                in_pilot = self.check_pilot_coverage(s['latitude'], s['longitude'])
                s_copy['coverage_available'] = in_pilot
                s_copy['in_pilot_coverage'] = in_pilot
                s_copy['solar_irradiance_available'] = False
                return s_copy
        return None

    def get_forecast_context(self, scenario_id: str, forecast_init: str) -> Optional[Dict[str, Any]]:
        scen = self.get_renewable_detail(scenario_id)
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
        tech = scen['technology_type']
        mode = scen['planning_mode']
        v_sens = scen['variability_sensitivity']
        g_sens = scen['grid_sensitivity']

        lead_contexts = []
        for lead in range(1, 11):
            grid_row = self.find_nearest_grid_point(forecast_init, lead, lat, lon)
            wind_diag = self.compute_wind_variability_diagnostic(forecast_init, lat, lon, lead)
            
            if grid_row is not None:
                rain = float(grid_row['ensemble_mean_mm'])
                temp = float(grid_row.get('temperature_c', 28.5))
                hum = float(grid_row.get('humidity_gkg', 14.2))
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
                bust_p = 0.1
                ffd = 0.8
                fragility_cat = "LOW"
                trust_idx = 85.0
                rel_band = "GREEN"
                audit_status = "OK"
                ood_cat = "NORMAL"
                ffd_fail = False

            wind_speed = wind_diag['wind_speed_10m_ms']
            wind_change = wind_diag['wind_change_ms']

            att_status, _ = self.calculate_attention_status(
                tech, mode, v_sens, g_sens, wind_speed, wind_change, rain, bust_p, audit_status, rel_band, trust_idx, ood_cat
            )

            lead_contexts.append({
                "lead_day": lead,
                "wind_speed_10m_ms": wind_speed,
                "wind_change_ms": wind_change,
                "rainfall_mm": round(rain, 2),
                "temperature_c": round(temp, 1),
                "humidity_gkg": round(hum, 2),
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
            "context_mode": "Renewable energy / grid decision support context (Mode B)",
            "forecast_context": "AVAILABLE",
            "lead_contexts": lead_contexts
        }

    def get_decision_support(
        self,
        scenario_id: str,
        forecast_init: str,
        lead_day: int = 1
    ) -> Optional[Dict[str, Any]]:
        scen = self.get_renewable_detail(scenario_id)
        if not scen:
            return None

        in_pilot = scen['in_pilot_coverage']
        lat, lon = scen['latitude'], scen['longitude']
        tech = scen['technology_type']
        mode = scen['planning_mode']
        v_sens = scen['variability_sensitivity']
        g_sens = scen['grid_sensitivity']

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
                "technology_type": tech,
                "planning_mode": mode,
                "variability_sensitivity": v_sens,
                "grid_sensitivity": g_sens,
                "installed_capacity_mode": scen.get('installed_capacity_mode', 'DEMO'),
                "installed_capacity_mw": scen.get('installed_capacity_mw', 100.0),
                "solar_diagnostic_available": False,
                "solar_message": "SOLAR GENERATION DIAGNOSTIC NOT AVAILABLE IN PROTOTYPE",
                "forecast_context": None,
                "decision_support": None,
                "attention_status": None,
                "wind_speed_10m_ms": None,
                "wind_change_ms": None,
                "wind_range_d1_d3_ms": None,
                "rainfall_mm": None,
                "temperature_c": None,
                "humidity_gkg": None,
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
                "wind_speed_ms_override": None,
                "weather_flags": [],
                "reasons": [
                    "FORTRESS reliability analysis is unavailable outside the current Eastern UP pilot coverage."
                ],
                "limitations": [
                    "Coverage: FORTRESS model pilot restricted to Eastern UP region (24.5-28.5 N, 80.0-84.5 E).",
                    "Outside Pilot: Reliability analysis, forecast context, and attention status are suppressed for scenarios outside pilot extent."
                ],
                "disclaimer": (
                    "MANDATORY DISCLAIMER: Decision-support information ONLY — not a generation guarantee, "
                    "grid-dispatch instruction, market instruction, or official power system alert."
                )
            }

        grid_row = self.find_nearest_grid_point(forecast_init, lead_day, lat, lon)
        wind_diag = self.compute_wind_variability_diagnostic(forecast_init, lat, lon, lead_day)

        if grid_row is not None:
            rain = float(grid_row['ensemble_mean_mm'])
            temp = float(grid_row.get('temperature_c', 28.5))
            hum = float(grid_row.get('humidity_gkg', 14.2))
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

        wind_speed = wind_diag['wind_speed_10m_ms']
        wind_change = wind_diag['wind_change_ms']
        wind_range = wind_diag['wind_range_d1_d3_ms']

        flags = self.generate_weather_flags(wind_speed, wind_change, tech, mode, g_sens, v_sens)

        att_status, reasons = self.calculate_attention_status(
            tech, mode, v_sens, g_sens, wind_speed, wind_change, rain, bust_p, audit_status, rel_band, trust_idx, ood_cat
        )

        limitations = [
            "Prototype renewable energy / grid decision-support heuristics.",
            "Scenario data and installed capacities are synthetic for SIH26079 demonstration.",
            "10 m forecast wind is not turbine hub-height wind and must not be interpreted as plant-level turbine inflow.",
            "No turbine power curve model or solar irradiance model is implemented.",
            "No MW generation prediction, power deficit calculation, or grid dispatch command is issued.",
            "Coverage restricted to Eastern UP pilot region (24.5-28.5 N, 80.0-84.5 E)."
        ]


        disclaimer = (
            "MANDATORY DISCLAIMER: Decision-support information ONLY — not a generation guarantee, "
            "grid-dispatch instruction, market instruction, or official power system alert."
        )

        solar_msg = "SOLAR GENERATION DIAGNOSTIC NOT AVAILABLE IN PROTOTYPE" if tech in ["SOLAR", "HYBRID"] else "N/A"

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
            "context_mode": "Renewable energy / grid decision support context (Mode B)",
            "forecast_context": "AVAILABLE",
            "decision_support": "AVAILABLE",
            "technology_type": tech,
            "planning_mode": mode,
            "variability_sensitivity": v_sens,
            "grid_sensitivity": g_sens,
            "installed_capacity_mode": scen.get('installed_capacity_mode', 'DEMO'),
            "installed_capacity_mw": scen.get('installed_capacity_mw', 100.0),
            "solar_diagnostic_available": False,
            "solar_message": solar_msg,
            "wind_speed_10m_ms": wind_speed,
            "wind_change_ms": wind_change,
            "wind_range_d1_d3_ms": wind_range,
            "rainfall_mm": round(rain, 2),
            "temperature_c": round(temp, 1),
            "humidity_gkg": round(hum, 2),
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
            "wind_speed_ms_override": None,
            "attention_status": att_status,
            "weather_flags": flags,
            "reasons": reasons,
            "limitations": limitations,
            "disclaimer": disclaimer
        }

    def process_custom_scenario(
        self,
        scenario_id: str,
        technology_type: Optional[str] = None,
        planning_mode: Optional[str] = None,
        variability_sensitivity: Optional[str] = None,
        grid_sensitivity: Optional[str] = None,
        wind_speed_ms_override: Optional[float] = None,
        scenario_name: str = "Custom Renewable What-If Scenario",
        forecast_init: Optional[str] = None,
        lead_day: int = 1
    ) -> Optional[Dict[str, Any]]:
        scen = self.get_renewable_detail(scenario_id)
        if not scen:
            return None

        if not forecast_init and data_service.init_dates:
            forecast_init = data_service.init_dates[0]

        in_pilot = scen['in_pilot_coverage']
        lat, lon = scen['latitude'], scen['longitude']

        eff_tech = technology_type or scen['technology_type']
        eff_mode = planning_mode or scen['planning_mode']
        eff_v_sens = variability_sensitivity or scen['variability_sensitivity']
        eff_g_sens = grid_sensitivity or scen['grid_sensitivity']

        if not in_pilot:
            return {
                "scenario_id": scenario_id,
                "scenario_name": scenario_name,
                "technology_type": eff_tech,
                "planning_mode": eff_mode,
                "variability_sensitivity": eff_v_sens,
                "grid_sensitivity": eff_g_sens,
                "coverage_available": False,
                "is_what_if_override": True,
                "actual_wind_speed_10m_ms": None,
                "wind_speed_ms_override": wind_speed_ms_override,
                "attention_status": None,
                "weather_flags": [],
                "reasons": [
                    "FORTRESS reliability analysis is unavailable outside the current Eastern UP pilot coverage."
                ],
                "data_mode": scen.get('data_mode', 'DEMO_SCENARIO')
            }

        grid_row = self.find_nearest_grid_point(forecast_init, lead_day, lat, lon) if forecast_init else None
        wind_diag = self.compute_wind_variability_diagnostic(forecast_init, lat, lon, lead_day) if forecast_init else {"wind_speed_10m_ms": 4.5, "wind_change_ms": 0.0}

        if grid_row is not None:
            rain = float(grid_row['ensemble_mean_mm'])
            bust_p = float(grid_row['baseline_p_bust'])
            trust_idx = float(grid_row['trust_index'])
            rel_band = str(grid_row['reliability_band'])
            audit_status = str(grid_row['self_audit_status'])
            ood_cat = str(grid_row.get('ood_category', 'NORMAL'))
        else:
            rain = 0.0
            bust_p = 0.1
            trust_idx = 85.0
            rel_band = "GREEN"
            audit_status = "OK"
            ood_cat = "NORMAL"

        actual_wind = wind_diag['wind_speed_10m_ms']
        eff_wind = wind_speed_ms_override if wind_speed_ms_override is not None else actual_wind
        wind_change = wind_diag['wind_change_ms']

        flags = self.generate_weather_flags(eff_wind, wind_change, eff_tech, eff_mode, eff_g_sens, eff_v_sens)

        att_status, reasons = self.calculate_attention_status(
            eff_tech, eff_mode, eff_v_sens, eff_g_sens, eff_wind, wind_change, rain, bust_p, audit_status, rel_band, trust_idx, ood_cat
        )

        if wind_speed_ms_override is not None:
            reasons.append(f"DEMO WHAT-IF OVERRIDE: 10m Wind speed set to {wind_speed_ms_override:.1f} m/s (actual GEFS forecast: {actual_wind:.1f} m/s).")

        return {
            "scenario_id": scenario_id,
            "scenario_name": scenario_name,
            "technology_type": eff_tech,
            "planning_mode": eff_mode,
            "variability_sensitivity": eff_v_sens,
            "grid_sensitivity": eff_g_sens,
            "coverage_available": True,
            "is_what_if_override": True,
            "actual_wind_speed_10m_ms": round(actual_wind, 2),
            "wind_speed_ms_override": round(wind_speed_ms_override, 2) if wind_speed_ms_override is not None else None,
            "attention_status": att_status,
            "weather_flags": flags,
            "reasons": reasons,
            "data_mode": scen.get('data_mode', 'DEMO_SCENARIO')
        }

renewable_service = RenewableService()
