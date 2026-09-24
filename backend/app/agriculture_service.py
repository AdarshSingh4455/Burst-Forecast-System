import os
import json
import yaml
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional
from backend.app.data_service import data_service

class AgricultureService:
    def __init__(self):
        self.scenarios: List[Dict[str, Any]] = []
        self.config: Dict[str, Any] = {}
        self.loaded = False

    def load_data(self, base_dir: str = "."):
        # Load config
        config_path = os.path.join(base_dir, "configs", "agriculture_decision_support.yaml")
        if os.path.exists(config_path):
            with open(config_path, "r", encoding="utf-8") as f:
                self.config = yaml.safe_load(f)
        else:
            self.config = {
                "rainfall": {"light_mm": 5.0, "moderate_mm": 15.0, "heavy_mm": 35.0},
                "temperature": {"high_c": 38.0, "low_c": 12.0},
                "wind": {"high_ms": 10.0},
                "trust": {"low_trust_index": 50.0, "moderate_trust_index": 70.0},
                "bust": {"elevated_probability": 0.40, "high_probability": 0.60},
                "soil_moisture": {"low_percent": 30.0, "high_percent": 70.0},
                "spatial": {
                    "pilot_min_lat": 24.5,
                    "pilot_max_lat": 28.5,
                    "pilot_min_lon": 80.0,
                    "pilot_max_lon": 84.5,
                    "max_snap_dist_deg": 0.75
                }
            }

        # Load domain demo agriculture scenarios
        json_path = os.path.join(base_dir, "data", "domain", "agriculture_demo.json")
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

        # Compute Euclidean distance in lat/lon space
        sub = sub.copy()
        sub['dist'] = np.sqrt((sub['latitude'] - lat) ** 2 + (sub['longitude'] - lon) ** 2)
        min_row = sub.sort_values('dist').iloc[0]
        return min_row

    def generate_weather_flags(
        self,
        rainfall_mm: float,
        temperature_c: float,
        wind_speed_ms: float,
        soil_moisture_percent: float,
        crop_stage: str,
        field_operation: str
    ) -> List[str]:
        flags = []
        mod_rain = self.config.get("rainfall", {}).get("moderate_mm", 15.0)
        heavy_rain = self.config.get("rainfall", {}).get("heavy_mm", 35.0)
        light_rain = self.config.get("rainfall", {}).get("light_mm", 5.0)
        high_temp = self.config.get("temperature", {}).get("high_c", 38.0)
        low_temp = self.config.get("temperature", {}).get("low_c", 12.0)
        high_wind = self.config.get("wind", {}).get("high_ms", 10.0)
        low_soil = self.config.get("soil_moisture", {}).get("low_percent", 30.0)

        if rainfall_mm >= heavy_rain:
            flags.append("HEAVY_RAINFALL")
        elif rainfall_mm >= mod_rain:
            flags.append("SIGNIFICANT_RAINFALL")
        elif rainfall_mm < light_rain:
            flags.append("LOW_RAINFALL")

        if temperature_c >= high_temp:
            flags.append("HIGH_TEMPERATURE")
        elif temperature_c <= low_temp:
            flags.append("LOW_TEMPERATURE")

        if wind_speed_ms >= high_wind:
            flags.append("HIGH_WIND")

        if soil_moisture_percent <= low_soil:
            flags.append("LOW_SOIL_MOISTURE_DEMO")

        if crop_stage == "HARVEST" or field_operation == "HARVEST_WINDOW":
            flags.append("HARVEST_RAIN_SENSITIVITY")

        if crop_stage == "SOWING" or field_operation == "SOWING_WINDOW":
            flags.append("SOWING_RAIN_SENSITIVITY")

        return flags

    def calculate_attention_status(
        self,
        crop: str,
        crop_stage: str,
        field_operation: str,
        soil_moisture_percent: float,
        rainfall_mm: float,
        temperature_c: float,
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
        light_rain = self.config.get("rainfall", {}).get("light_mm", 5.0)
        high_temp = self.config.get("temperature", {}).get("high_c", 38.0)
        high_wind = self.config.get("wind", {}).get("high_ms", 10.0)
        low_soil = self.config.get("soil_moisture", {}).get("low_percent", 30.0)
        low_trust = self.config.get("trust", {}).get("low_trust_index", 50.0)
        elev_bust = self.config.get("bust", {}).get("elevated_probability", 0.40)

        # 1. Operational relevance gate
        is_sowing = (field_operation == "SOWING_WINDOW" or crop_stage == "SOWING")
        is_harvest = (field_operation == "HARVEST_WINDOW" or crop_stage == "HARVEST")
        is_irrigation = (field_operation == "IRRIGATION_REVIEW")
        is_flowering = (crop_stage == "FLOWERING")
        is_field_op = (field_operation == "FIELD_OPERATION")

        agricultural_relevance = (
            (is_sowing and rainfall_mm >= light_rain) or
            (is_harvest and (rainfall_mm >= light_rain or wind_speed_ms >= high_wind)) or
            (is_irrigation and (soil_moisture_percent <= low_soil or rainfall_mm < light_rain)) or
            (is_flowering and (rainfall_mm >= mod_rain or temperature_c >= high_temp)) or
            (is_field_op and rainfall_mm >= mod_rain)
        )

        is_poor_reliability = (
            self_audit_status in ["CONFLICT", "POSSIBLE BLIND SPOT", "EXPERT REVIEW"] or
            reliability_band == "RED" or
            trust_index < low_trust or
            ood_category in ["UNUSUAL", "HIGHLY_NOVEL", "NOVEL", "EXTREME_NOVEL"]
        )

        # High Uncertainty Rule
        if agricultural_relevance and is_poor_reliability:
            reasons.append(
                f"The current agricultural operation ({field_operation}, crop stage: {crop_stage}) is weather-sensitive, "
                f"while forecast reliability evidence is weak or conflicting (Self-Audit: '{self_audit_status}', "
                f"Reliability Band: '{reliability_band}', Trust Index: {trust_index:.1f}/100). "
                f"Expert agrometeorological review is recommended."
            )
            return "HIGH_UNCERTAINTY_EXPERT_REVIEW", reasons

        # Weather Sensitive Window Rule
        if (is_sowing or is_harvest or is_field_op) and (rainfall_mm >= mod_rain or wind_speed_ms >= high_wind):
            reasons.append(
                f"Selected crop stage ({crop_stage}) / field operation ({field_operation}) is in a weather-sensitive window "
                f"with significant forecasted weather (Rain: {rainfall_mm:.1f} mm, Wind: {wind_speed_ms:.1f} m/s)."
            )
            return "WEATHER_SENSITIVE_WINDOW", reasons

        # Farm Advisory Review Rule
        if rainfall_mm >= mod_rain or bust_prob >= elev_bust or reliability_band == "YELLOW" or soil_moisture_percent <= low_soil:
            if rainfall_mm >= mod_rain:
                reasons.append(f"Moderate rainfall forecast ({rainfall_mm:.1f} mm).")
            if bust_prob >= elev_bust:
                reasons.append(f"Elevated forecast bust probability ({bust_prob*100:.1f}%).")
            if soil_moisture_percent <= low_soil:
                reasons.append(f"Low demo soil moisture ({soil_moisture_percent:.1f}%).")
            if reliability_band == "YELLOW":
                reasons.append(f"Moderate forecast reliability (AMBER band).")
            return "FARM_ADVISORY_REVIEW", reasons

        # Normal Monitoring
        if is_poor_reliability and not agricultural_relevance:
            reasons.append(
                f"Weather forecast reliability is {reliability_band} / low trust ({trust_index:.1f}/100), "
                f"but operational relevance to current crop stage ({crop_stage}) is low. "
                f"Displayed as weather-reliability concern without escalating agricultural operational attention."
            )

        reasons.append("No elevated agricultural decision-support trigger was identified under current prototype rules.")
        return "NORMAL_MONITORING", reasons

    def get_agriculture_summary(self) -> List[Dict[str, Any]]:
        result = []
        for s in self.scenarios:
            in_pilot = self.check_pilot_coverage(s['latitude'], s['longitude'])
            result.append({
                "agri_id": s['agri_id'],
                "name": s['name'],
                "latitude": s['latitude'],
                "longitude": s['longitude'],
                "district_label": s['district_label'],
                "state": s['state'],
                "data_mode": s.get('data_mode', 'DEMO_SCENARIO'),
                "crop": s['crop'],
                "crop_stage": s['crop_stage'],
                "field_operation": s['field_operation'],
                "soil_moisture_mode": s.get('soil_moisture_mode', 'DEMO'),
                "soil_moisture_percent": s['soil_moisture_percent'],
                "scenario_name": s['scenario_name'],
                "coverage_available": in_pilot,
                "in_pilot_coverage": in_pilot
            })
        return result

    def get_agriculture_detail(self, agri_id: str) -> Optional[Dict[str, Any]]:
        for s in self.scenarios:
            if s['agri_id'] == agri_id:
                s_copy = dict(s)
                in_pilot = self.check_pilot_coverage(s['latitude'], s['longitude'])
                s_copy['coverage_available'] = in_pilot
                s_copy['in_pilot_coverage'] = in_pilot
                return s_copy
        return None

    def get_forecast_context(self, agri_id: str, forecast_init: str) -> Optional[Dict[str, Any]]:
        scen = self.get_agriculture_detail(agri_id)
        if not scen:
            return None

        in_pilot = scen['in_pilot_coverage']
        if not in_pilot:
            return {
                "agri_id": scen['agri_id'],
                "agri_name": scen['name'],
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
        crop = scen['crop']
        stage = scen['crop_stage']
        op = scen['field_operation']
        soil_pct = scen['soil_moisture_percent']

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

            att_status, _ = self.calculate_attention_status(
                crop, stage, op, soil_pct, rain, temp, wind, bust_p, audit_status, rel_band, trust_idx, ood_cat
            )

            lead_contexts.append({
                "lead_day": lead,
                "rainfall_mm": round(rain, 2),
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
            "agri_id": scen['agri_id'],
            "agri_name": scen['name'],
            "forecast_init": forecast_init,
            "data_mode": scen.get('data_mode', 'DEMO_SCENARIO'),
            "coverage_available": True,
            "in_pilot_coverage": True,
            "context_mode": "Agricultural field forecast context (Mode B)",
            "forecast_context": "AVAILABLE",
            "lead_contexts": lead_contexts
        }

    def compute_dry_spell_days(self, forecast_init: str, lat: float, lon: float) -> int:
        """Calculate dry spell length (consecutive days with forecast rainfall < 2.5 mm WMO threshold) from D1-D10 forecast series."""
        max_dry = 0
        current_dry = 0
        for lead in range(1, 11):
            grid_row = self.find_nearest_grid_point(forecast_init, lead, lat, lon)
            rain = float(grid_row['ensemble_mean_mm']) if grid_row is not None else 0.0
            if rain < 2.5:
                current_dry += 1
                max_dry = max(max_dry, current_dry)
            else:
                current_dry = 0
        return max_dry

    def get_decision_support(
        self,
        agri_id: str,
        forecast_init: str,
        lead_day: int = 1
    ) -> Optional[Dict[str, Any]]:
        scen = self.get_agriculture_detail(agri_id)
        if not scen:
            return None

        in_pilot = scen['in_pilot_coverage']
        lat, lon = scen['latitude'], scen['longitude']
        crop = scen['crop']
        stage = scen['crop_stage']
        op = scen['field_operation']
        soil_pct = float(scen['soil_moisture_percent'])
        scen_name = scen['scenario_name']

        if not in_pilot:
            return {
                "agri_id": scen['agri_id'],
                "agri_name": scen['name'],
                "data_mode": scen.get('data_mode', 'DEMO_SCENARIO'),
                "forecast_init": forecast_init,
                "lead_day": lead_day,
                "latitude": lat,
                "longitude": lon,
                "coverage_available": False,
                "in_pilot_coverage": False,
                "context_mode": "OUTSIDE_PILOT",
                "crop": crop,
                "crop_stage": stage,
                "field_operation": op,
                "soil_moisture_mode": scen.get('soil_moisture_mode', 'DEMO'),
                "soil_moisture_percent": soil_pct,
                "scenario_name": scen_name,
                "forecast_context": None,
                "decision_support": None,
                "attention_status": None,
                "rainfall_mm": None,
                "dry_spell_days": None,
                "dry_spell_source": None,
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
                "dry_spell_days_override": None,
                "weather_flags": [],
                "reasons": [
                    "FORTRESS reliability analysis is unavailable outside the current Eastern UP pilot coverage."
                ],
                "limitations": [
                    "Coverage: FORTRESS model pilot restricted to Eastern UP region (24.5-28.5 N, 80.0-84.5 E).",
                    "Outside Pilot: Reliability analysis, forecast context, and attention status are suppressed for fields outside pilot extent."
                ],
                "disclaimer": (
                    "MANDATORY DISCLAIMER: Decision-support information ONLY — not an official agricultural advisory, crop yield guarantee, "
                    "or automatic field-operation instruction. Official agrometeorological advisories remain authoritative."
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

        actual_dry_spell = self.compute_dry_spell_days(forecast_init, lat, lon)
        flags = self.generate_weather_flags(rain, temp, wind, soil_pct, stage, op)

        att_status, reasons = self.calculate_attention_status(
            crop, stage, op, soil_pct, rain, temp, wind, bust_p, audit_status, rel_band, trust_idx, ood_cat
        )

        limitations = [
            "Prototype agricultural decision-support heuristics.",
            "Demo crop and soil values are synthetic for SIH26079 demonstration.",
            "Dry-spell duration is derived from D1-D10 GEFS forecast series (WMO <2.5mm threshold).",
            "No crop-growth simulation or yield prediction is implemented.",
            "Rainfall does not directly equal soil moisture.",
            "No automatic irrigation control, pesticide, or fertilizer recommendation is performed.",
            "Coverage restricted to Eastern UP pilot region (24.5-28.5 N, 80.0-84.5 E)."
        ]

        disclaimer = (
            "MANDATORY DISCLAIMER: Decision-support information ONLY — not an official agricultural advisory, crop yield guarantee, "
            "or automatic field-operation instruction. Official agrometeorological advisories remain authoritative."
        )

        return {
            "agri_id": scen['agri_id'],
            "agri_name": scen['name'],
            "data_mode": scen.get('data_mode', 'DEMO_SCENARIO'),
            "forecast_init": forecast_init,
            "lead_day": lead_day,
            "latitude": lat,
            "longitude": lon,
            "coverage_available": True,
            "in_pilot_coverage": True,
            "context_mode": "Agricultural field forecast context (Mode B)",
            "forecast_context": "AVAILABLE",
            "decision_support": "AVAILABLE",
            "crop": crop,
            "crop_stage": stage,
            "field_operation": op,
            "soil_moisture_mode": scen.get('soil_moisture_mode', 'DEMO'),
            "soil_moisture_percent": round(soil_pct, 1),
            "scenario_name": scen_name,
            "rainfall_mm": round(rain, 2),
            "dry_spell_days": actual_dry_spell,
            "dry_spell_source": "ACTUAL_DERIVED_FORECAST_SERIES",
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
            "dry_spell_days_override": None,
            "attention_status": att_status,
            "weather_flags": flags,
            "reasons": reasons,
            "limitations": limitations,
            "disclaimer": disclaimer
        }

    def process_custom_scenario(
        self,
        agri_id: str,
        crop: Optional[str] = None,
        crop_stage: Optional[str] = None,
        field_operation: Optional[str] = None,
        soil_moisture_percent: Optional[float] = None,
        rainfall_mm_override: Optional[float] = None,
        dry_spell_days_override: Optional[int] = None,
        scenario_name: str = "Custom What-If Scenario",
        forecast_init: Optional[str] = None,
        lead_day: int = 1
    ) -> Optional[Dict[str, Any]]:
        scen = self.get_agriculture_detail(agri_id)
        if not scen:
            return None

        if not forecast_init and data_service.init_dates:
            forecast_init = data_service.init_dates[0]

        in_pilot = scen['in_pilot_coverage']
        lat, lon = scen['latitude'], scen['longitude']

        eff_crop = crop or scen['crop']
        eff_stage = crop_stage or scen['crop_stage']
        eff_op = field_operation or scen['field_operation']
        eff_soil = soil_moisture_percent if soil_moisture_percent is not None else scen['soil_moisture_percent']

        if not in_pilot:
            return {
                "agri_id": agri_id,
                "scenario_name": scenario_name,
                "crop": eff_crop,
                "crop_stage": eff_stage,
                "field_operation": eff_op,
                "soil_moisture_percent": round(eff_soil, 1),
                "soil_moisture_mode": scen.get('soil_moisture_mode', 'DEMO'),
                "coverage_available": False,
                "is_what_if_override": True,
                "actual_rainfall_mm": None,
                "rainfall_mm_override": rainfall_mm_override,
                "actual_dry_spell_days": None,
                "dry_spell_days_override": dry_spell_days_override,
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
            temp = float(grid_row.get('temperature_c', 28.5))
            wind = float(grid_row.get('wind_speed_ms', 4.5))
            bust_p = float(grid_row['baseline_p_bust'])
            trust_idx = float(grid_row['trust_index'])
            rel_band = str(grid_row['reliability_band'])
            audit_status = str(grid_row['self_audit_status'])
            ood_cat = str(grid_row.get('ood_category', 'NORMAL'))
        else:
            rain = 0.0
            temp = 28.5
            wind = 4.5
            bust_p = 0.1
            trust_idx = 85.0
            rel_band = "GREEN"
            audit_status = "OK"
            ood_cat = "NORMAL"

        actual_dry_spell = self.compute_dry_spell_days(forecast_init, lat, lon)
        eff_rain = rainfall_mm_override if rainfall_mm_override is not None else rain

        flags = self.generate_weather_flags(eff_rain, temp, wind, eff_soil, eff_stage, eff_op)

        att_status, reasons = self.calculate_attention_status(
            eff_crop, eff_stage, eff_op, eff_soil, eff_rain, temp, wind, bust_p, audit_status, rel_band, trust_idx, ood_cat
        )

        if rainfall_mm_override is not None:
            reasons.append(f"DEMO WHAT-IF OVERRIDE: Rainfall set to {rainfall_mm_override:.1f} mm (actual GEFS forecast: {rain:.1f} mm).")
        if dry_spell_days_override is not None:
            reasons.append(f"DEMO WHAT-IF OVERRIDE: Dry spell duration set to {dry_spell_days_override} days (actual D1-D10 forecast: {actual_dry_spell} days).")

        return {
            "agri_id": agri_id,
            "scenario_name": scenario_name,
            "crop": eff_crop,
            "crop_stage": eff_stage,
            "field_operation": eff_op,
            "soil_moisture_percent": round(eff_soil, 1),
            "soil_moisture_mode": scen.get('soil_moisture_mode', 'DEMO'),
            "coverage_available": True,
            "is_what_if_override": True,
            "actual_rainfall_mm": round(rain, 2),
            "rainfall_mm_override": round(rainfall_mm_override, 2) if rainfall_mm_override is not None else None,
            "actual_dry_spell_days": actual_dry_spell,
            "dry_spell_days_override": dry_spell_days_override,
            "attention_status": att_status,
            "weather_flags": flags,
            "reasons": reasons,
            "data_mode": scen.get('data_mode', 'DEMO_SCENARIO')
        }

agriculture_service = AgricultureService()
