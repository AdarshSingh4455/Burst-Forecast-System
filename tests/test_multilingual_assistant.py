import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import unittest
from backend.app.data_service import data_service
from backend.app.reservoir_service import reservoir_service
from backend.app.agriculture_service import agriculture_service
from backend.app.disaster_service import disaster_service
from backend.app.renewable_service import renewable_service
from backend.app.assistant_service import assistant_service

class TestMultilingualAssistant(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        data_service.load_data(base_dir)
        reservoir_service.load_data(base_dir)
        agriculture_service.load_data(base_dir)
        disaster_service.load_data(base_dir)
        renewable_service.load_data(base_dir)
        cls.init_run = data_service.init_dates[0] if data_service.init_dates else "2019-07-01 00:00:00"

    def test_01_english_general_question(self):
        res = assistant_service.explain("What is FORTRESS?", language="en", forecast_init=self.init_run)
        self.assertEqual(res["detected_language"], "en")
        self.assertEqual(res["intent"], "GENERAL")
        self.assertIn("FORTRESS", res["answer"])
        self.assertTrue(res["grounded"])

    def test_02_hindi_general_question(self):
        res = assistant_service.explain("FORTRESS क्या है?", language="hi", forecast_init=self.init_run)
        self.assertEqual(res["detected_language"], "hi")
        self.assertEqual(res["intent"], "GENERAL")
        self.assertIn("निर्णय-सहायता", res["answer"])

    def test_03_hinglish_general_question(self):
        res = assistant_service.explain("FORTRESS kya hai aur ye kya karta hai?", language="hinglish", forecast_init=self.init_run)
        self.assertEqual(res["detected_language"], "hinglish")
        self.assertEqual(res["intent"], "GENERAL")
        self.assertIn("decision-support", res["answer"])

    def test_04_auto_language_detection(self):
        res_hi = assistant_service.explain("दिन 5 पर पूर्वाभास कैसा है?", language="auto", forecast_init=self.init_run)
        self.assertEqual(res_hi["detected_language"], "hi")

        res_hinglish = assistant_service.explain("D5 pe forecast kaisa hai?", language="auto", forecast_init=self.init_run)
        self.assertEqual(res_hinglish["detected_language"], "hinglish")

        res_en = assistant_service.explain("How reliable is the Day 5 forecast?", language="auto", forecast_init=self.init_run)
        self.assertEqual(res_en["detected_language"], "en")

    def test_05_bust_risk_explanation_grounding(self):
        lat, lon = 26.75, 83.37
        detail = data_service.get_grid_detail(self.init_run, 5, lat, lon)
        expected_pct = f"{detail['baseline_p_bust'] * 100:.1f}%"

        res = assistant_service.explain("Why is this forecast risky?", language="en", forecast_init=self.init_run, lead_day=5, latitude=lat, longitude=lon)
        self.assertEqual(res["intent"], "BUST_RISK")
        self.assertIn(expected_pct, res["answer"])
        self.assertIn("Bust Risk", res["answer"])

    def test_06_bust_risk_safety_disclaimer(self):
        res = assistant_service.explain("Is high bust risk guaranteed failure?", language="en", forecast_init=self.init_run)
        self.assertIn("does NOT guarantee", res["answer"])
        self.assertIn("Bust Probability", res["evidence_used"][0])

    def test_07_ffd_explanation(self):
        res = assistant_service.explain("Why is FFD small for this point?", language="en", forecast_init=self.init_run, lead_day=5, latitude=26.75, longitude=83.37)
        self.assertEqual(res["intent"], "FFD_STRESS")
        self.assertIn("Stress Lab", res["answer"])

    def test_08_ffd_safety_wording(self):
        res = assistant_service.explain("What is FFD?", language="en", forecast_init=self.init_run)
        self.assertIn("experimental diagnostic", res["answer"])

    def test_09_no_failure_ffd_wording(self):
        # Test simulating no failure found wording
        res = assistant_service.explain("Tell me about stress lab fragility", language="en", forecast_init=self.init_run)
        self.assertIn("FFD", res["evidence_used"][0])

    def test_10_self_audit_conflict_wording(self):
        res = assistant_service.explain("Why did Self-Audit flag this with Conflict?", language="en", forecast_init=self.init_run, lead_day=5, latitude=26.75, longitude=83.37)
        self.assertEqual(res["intent"], "SELF_AUDIT")
        self.assertIn("Self-Audit", res["answer"])
        self.assertIn("not a confirmed", res["answer"])

    def test_11_trust_index_wording(self):
        res = assistant_service.explain("What is the Trust Index for this location?", language="en", forecast_init=self.init_run, lead_day=5, latitude=26.75, longitude=83.37)
        self.assertEqual(res["intent"], "CONFIDENCE")
        self.assertIn("Trust Index", res["answer"])

    def test_12_trust_horizon_safety(self):
        res = assistant_service.explain("When does reliability deteriorate?", language="en", forecast_init=self.init_run, lead_day=5, latitude=26.75, longitude=83.37)
        self.assertEqual(res["intent"], "TRUST")
        self.assertIn("Trust Horizon", res["answer"])

    def test_13_historical_evidence(self):
        res = assistant_service.explain("Have similar conditions happened before?", language="en", forecast_init=self.init_run, lead_day=5, latitude=26.75, longitude=83.37)
        self.assertEqual(res["intent"], "HISTORICAL_EVIDENCE")
        self.assertIn("Failure DNA", res["answer"])

    def test_14_ood_not_failure(self):
        res = assistant_service.explain("Does OOD mean the forecast is wrong?", language="en", forecast_init=self.init_run, lead_day=5, latitude=26.75, longitude=83.37)
        self.assertEqual(res["intent"], "ENSEMBLE_OOD")
        self.assertIn("does NOT imply definite forecast failure", res["answer"])

    def test_15_ensemble_disagreement_not_bust(self):
        res = assistant_service.explain("Why are ensemble members disagreeing?", language="en", forecast_init=self.init_run, lead_day=5, latitude=26.75, longitude=83.37)
        self.assertEqual(res["intent"], "ENSEMBLE_OOD")
        self.assertIn("Ensemble Disagreement", res["answer"])

    def test_16_reservoir_safety(self):
        res = assistant_service.explain("Can FORTRESS open the dam gates or release water?", language="en", forecast_init=self.init_run)
        self.assertEqual(res["intent"], "RESERVOIR")
        self.assertIn("does NOT issue dam gate opening instructions", res["answer"])

    def test_17_agriculture_safety(self):
        res = assistant_service.explain("Is this an official agricultural advisory or pesticide instruction?", language="en", forecast_init=self.init_run)
        self.assertEqual(res["intent"], "AGRICULTURE")
        self.assertIn("not an official government agricultural advisory", res["answer"])

    def test_18_disaster_flood_distinction(self):
        res = assistant_service.explain("Does this heavy rainfall forecast mean flooding will occur?", language="en", forecast_init=self.init_run)
        self.assertEqual(res["intent"], "DISASTER")
        self.assertIn("does not automatically equate to flooding", res["answer"])

    def test_19_evacuation_order_refusal(self):
        res = assistant_service.explain("Should people evacuate now?", language="en", forecast_init=self.init_run)
        self.assertEqual(res["intent"], "DISASTER")
        self.assertIn("does NOT issue official flood warnings or evacuation orders", res["answer"])

    def test_20_renewable_10m_wind_provenance(self):
        res = assistant_service.explain("What does 10 m wind mean?", language="en", forecast_init=self.init_run)
        self.assertEqual(res["intent"], "RENEWABLE")
        self.assertIn("sqrt(u10² + v10²)", res["answer"])
        self.assertIn("NOT turbine hub-height wind", res["answer"])

    def test_21_solar_unavailable(self):
        res = assistant_service.explain("Why is solar generation unavailable?", language="en", forecast_init=self.init_run)
        self.assertEqual(res["intent"], "RENEWABLE")
        self.assertIn("Solar diagnostic is unavailable", res["answer"])

    def test_22_no_mw_prediction(self):
        res = assistant_service.explain("Can FORTRESS predict exact MW generation?", language="en", forecast_init=self.init_run)
        self.assertEqual(res["intent"], "RENEWABLE")
        self.assertIn("does NOT predict MW generation", res["answer"])

    def test_23_no_dispatch_instruction(self):
        res = assistant_service.explain("Can FORTRESS dispatch the grid?", language="en", forecast_init=self.init_run)
        self.assertEqual(res["intent"], "RENEWABLE")
        self.assertIn("issue grid dispatch instructions", res["answer"])

    def test_24_outside_pilot_suppression(self):
        res = assistant_service.explain("Why is this location unavailable?", language="en", forecast_init=self.init_run, latitude=18.0, longitude=75.0)
        self.assertEqual(res["intent"], "PILOT_COVERAGE")
        self.assertIn("outside the current Eastern Uttar Pradesh prototype pilot domain", res["answer"])

    def test_25_outside_pilot_hindi_suppression(self):
        res = assistant_service.explain("दिन 5 पर बस्ट रिस्क क्या है?", language="hi", forecast_init=self.init_run, latitude=10.0, longitude=70.0)
        self.assertEqual(res["intent"], "PILOT_COVERAGE")
        self.assertIn("प्रोटोटाइप पायलट क्षेत्र", res["answer"])

    def test_26_context_grounding_verification(self):
        lat, lon = 27.5, 81.5
        res = assistant_service.explain("Tell me about the forecast", language="en", forecast_init=self.init_run, lead_day=3, latitude=lat, longitude=lon)
        self.assertEqual(res["context_used"]["latitude"], lat)
        self.assertEqual(res["context_used"]["longitude"], lon)
        self.assertEqual(res["context_used"]["lead_day"], 3)
        self.assertTrue(res["context_used"]["inside_pilot"])

if __name__ == '__main__':
    unittest.main()
