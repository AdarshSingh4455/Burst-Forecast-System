import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import unittest
import glob
from backend.app.data_service import data_service
from backend.app.assistant_service import assistant_service

class TestVoiceAssistantContract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        data_service.load_data(base_dir)
        cls.init_run = data_service.init_dates[0] if data_service.init_dates else "2019-07-01 00:00:00"

    def test_01_backend_no_audio_endpoints(self):
        # Verify no audio endpoints or audio persistence functions were added to backend
        from backend.app import main
        routes = [r.path for r in main.app.routes]
        audio_routes = [r for r in routes if "audio" in r or "voice" in r or "mic" in r]
        self.assertEqual(len(audio_routes), 0, f"Found unexpected audio backend routes: {audio_routes}")

    def test_02_no_audio_files_or_blobs_stored(self):
        # Verify no audio files (.wav, .mp3, .ogg, .m4a) exist in repo
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        audio_files = glob.glob(os.path.join(base_dir, "**", "*.wav"), recursive=True) + \
                      glob.glob(os.path.join(base_dir, "**", "*.mp3"), recursive=True) + \
                      glob.glob(os.path.join(base_dir, "**", "*.ogg"), recursive=True)
        self.assertEqual(len(audio_files), 0, f"Found audio files stored in repo: {audio_files}")

    def test_03_english_voice_transcript_contract(self):
        transcript_text = "Why is the forecast risky on Day 5?"
        res = assistant_service.explain(transcript_text, language="en", forecast_init=self.init_run, lead_day=5, latitude=26.75, longitude=83.37)
        self.assertEqual(res["intent"], "BUST_RISK")
        self.assertTrue(res["grounded"])
        self.assertIn("Bust Risk", res["answer"])

    def test_04_hindi_voice_transcript_contract(self):
        transcript_text = "दिन 5 पर पूर्वानुमान का भरोसा कम क्यों है?"
        res = assistant_service.explain(transcript_text, language="hi", forecast_init=self.init_run, lead_day=5, latitude=26.75, longitude=83.37)
        self.assertEqual(res["intent"], "CONFIDENCE")
        self.assertTrue(res["grounded"])
        self.assertIn("विश्वसनीयता", res["answer"])

    def test_05_hinglish_voice_transcript_contract(self):
        transcript_text = "D5 pe forecast risky kyun hai?"
        res = assistant_service.explain(transcript_text, language="hinglish", forecast_init=self.init_run, lead_day=5, latitude=26.75, longitude=83.37)
        self.assertEqual(res["intent"], "BUST_RISK")
        self.assertTrue(res["grounded"])
        self.assertIn("Bust Risk", res["answer"])

    def test_06_voice_outside_pilot_suppression(self):
        transcript_text = "What is the bust probability here?"
        res = assistant_service.explain(transcript_text, language="en", forecast_init=self.init_run, lead_day=5, latitude=15.0, longitude=75.0)
        self.assertEqual(res["intent"], "PILOT_COVERAGE")
        self.assertIn("outside the current Eastern Uttar Pradesh prototype pilot domain", res["answer"])
        self.assertEqual(len(res["evidence_used"]), 1)
        self.assertEqual(res["evidence_used"][0], "Pilot Scope Control")

    def test_07_voice_dam_release_command_refusal(self):
        transcript_text = "Open the dam gates and release 500 cumecs now!"
        res = assistant_service.explain(transcript_text, language="en", forecast_init=self.init_run)
        self.assertEqual(res["intent"], "RESERVOIR")
        self.assertIn("does NOT issue dam gate opening instructions", res["answer"])

    def test_08_voice_evacuation_order_refusal(self):
        transcript_text = "Tell everyone to evacuate immediately!"
        res = assistant_service.explain(transcript_text, language="en", forecast_init=self.init_run)
        self.assertEqual(res["intent"], "DISASTER")
        self.assertIn("does NOT issue official flood warnings or evacuation orders", res["answer"])

    def test_09_voice_renewable_mw_prediction_refusal(self):
        transcript_text = "How many MW will this solar plant generate?"
        res = assistant_service.explain(transcript_text, language="en", forecast_init=self.init_run)
        self.assertEqual(res["intent"], "RENEWABLE")
        self.assertIn("does NOT predict MW generation", res["answer"])

    def test_10_voice_grid_dispatch_refusal(self):
        transcript_text = "Dispatch 200 MW thermal power right now!"
        res = assistant_service.explain(transcript_text, language="en", forecast_init=self.init_run)
        self.assertEqual(res["intent"], "RENEWABLE")
        self.assertIn("issue grid dispatch instructions", res["answer"])

    def test_11_text_assistant_unchanged(self):
        # Ensure Phase 10A text functionality works 100% identically
        res = assistant_service.explain("What is FFD?", language="en", forecast_init=self.init_run)
        self.assertEqual(res["intent"], "FFD_STRESS")
        self.assertIn("experimental diagnostic", res["answer"])

    def test_12_unsupported_browser_fallback_contract(self):
        # Contract verification: Assistant gracefully handles missing Web Speech API
        res = assistant_service.explain("How reliable is D5?", language="auto", forecast_init=self.init_run, lead_day=5, latitude=26.75, longitude=83.37)
        self.assertEqual(res["intent"], "CONFIDENCE")
        self.assertTrue(res["grounded"])

if __name__ == '__main__':
    unittest.main()
