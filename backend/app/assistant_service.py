import re
from typing import Dict, Any, Optional, List, Tuple
from backend.app.data_service import data_service
from backend.app.reservoir_service import reservoir_service
from backend.app.agriculture_service import agriculture_service
from backend.app.disaster_service import disaster_service
from backend.app.renewable_service import renewable_service

class AssistantService:
    def __init__(self):
        pass

    def is_inside_pilot(self, lat: float, lon: float) -> bool:
        return (24.5 <= lat <= 28.5) and (80.0 <= lon <= 84.5)

    def detect_language(self, message: str, requested_lang: str) -> Tuple[str, str]:
        req = (requested_lang or "auto").lower().strip()
        if req in ["en", "english"]:
            return "en", "en"
        elif req in ["hi", "hindi"]:
            return "hi", "hi"
        elif req in ["hinglish"]:
            return "hinglish", "hinglish"

        # Auto detection logic
        # 1. Devanagari script check
        if re.search(r'[\u0900-\u097F]', message):
            return "hi", "hi"

        # 2. Hinglish keyword check
        msg_lower = message.lower()
        hinglish_words = [
            "kyun", "kyu", "hai", "kya", "par", "kaise", "hoga", "nahi", "din", "chahiye",
            "pe", "ho", "batao", "sakta", "mera", "ye", "wo", "kaun", "kab", "kuch",
            "hai?", "kyun?", "hai.", "hoga?"
        ]
        words = re.findall(r'\w+', msg_lower)
        hinglish_count = sum(1 for w in words if w in hinglish_words)

        if hinglish_count >= 1:
            return "hinglish", "hinglish"

        return "en", "en"

    def detect_intent(self, message: str, active_view: Optional[str] = None) -> str:
        q = message.lower()

        # Specific negative / safety triggers first
        if any(k in q for k in ["outside pilot", "location unavailable", "outside domain", "pilot region", "pilot coverage"]):
            return "PILOT_COVERAGE"

        if any(k in q for k in ["mw", "power generation", "grid dispatch", "curtailment", "dispatch instruction", "exact mw", "generation forecast"]):
            return "RENEWABLE"

        if any(k in q for k in ["solar", "irradiance", "solar generation"]):
            return "RENEWABLE"

        if any(k in q for k in ["evacuate", "evacuation", "flood warning", "official warning", "pesticide", "fertilizer", "gate opening", "release quantity"]):
            if any(k in q for k in ["gate", "release", "dam"]):
                return "RESERVOIR"
            elif any(k in q for k in ["pesticide", "fertilizer", "crop"]):
                return "AGRICULTURE"
            else:
                return "DISASTER"

        # Trust / Trust Horizon / Breaking Point
        if any(k in q for k in ["trust horizon", "breaking point", "sustained red", "deteriorate", "when does reliability"]):
            return "TRUST"

        # General intent matching by keywords
        if any(k in q for k in ["what is fortress", "what does this system do", "is this a weather forecasting model", "weather model", "about fortress", "system do"]):
            return "GENERAL"

        if any(k in q for k in ["bust risk", "bust probability", "p_bust", "risky", "why risky", "high bust", "guaranteed failure", "बस्ट"]):
            return "BUST_RISK"

        if any(k in q for k in ["trust index", "trust level", "how reliable", "why confidence low", "confidence", "reliability band", "reliable", "reliability", "भरोसा", "विश्वासनीयता", "विश्वसनीयता"]):
            return "CONFIDENCE"

        if any(k in q for k in ["ffd", "stress lab", "fragility", "small ffd", "sensitive variable", "stress testing", "perturbation"]):
            return "FFD_STRESS"

        if any(k in q for k in ["corridor", "fingerprint", "vulnerability", "vulnerable"]):
            return "FAILURE_INTELLIGENCE"

        if any(k in q for k in ["analogue", "historical", "happened before", "failure dna", "dna"]):
            return "HISTORICAL_EVIDENCE"

        if any(k in q for k in ["ensemble", "disagreement", "out of distribution", "unusual", "wrong"]) or re.search(r'\bood\b', q):
            return "ENSEMBLE_OOD"

        if any(k in q for k in ["self-audit", "self audit", "flag", "conflict", "blind spot", "expert review"]):
            return "SELF_AUDIT"

        if any(k in q for k in ["reservoir", "dam", "inflow", "spillway"]):
            return "RESERVOIR"

        if any(k in q for k in ["agriculture", "crop", "dry spell", "dry-spell", "advisory", "sowing", "irrigation"]):
            return "AGRICULTURE"

        if any(k in q for k in ["disaster", "flood", "flooding", "preparedness"]):
            return "DISASTER"

        if any(k in q for k in ["renewable", "grid", "10m wind", "10 m wind", "wind speed", "variability", "wind"]):
            return "RENEWABLE"

        # Active View fallback heuristics if query is ambiguous
        if active_view:
            v = active_view.lower()
            if "stress" in v:
                return "FFD_STRESS"
            elif "failure" in v:
                return "FAILURE_INTELLIGENCE"
            elif "evidence" in v:
                return "HISTORICAL_EVIDENCE"
            elif "audit" in v:
                return "SELF_AUDIT"
            elif "trust" in v or "breaking" in v:
                return "TRUST"
            elif "reservoir" in v:
                return "RESERVOIR"
            elif "agri" in v:
                return "AGRICULTURE"
            elif "disaster" in v:
                return "DISASTER"
            elif "renewable" in v:
                return "RENEWABLE"

        return "GENERAL"

    def explain(
        self,
        message: str,
        language: str = "auto",
        forecast_init: Optional[str] = None,
        lead_day: int = 5,
        latitude: float = 25.75,
        longitude: float = 82.00,
        active_view: Optional[str] = "Overview",
        scenario_id: Optional[str] = None
    ) -> Dict[str, Any]:

        # Default run if missing
        if not forecast_init and data_service.init_dates:
            forecast_init = data_service.init_dates[0]
        elif not forecast_init:
            forecast_init = "2019-07-01 00:00:00"

        detected_lang, lang_code = self.detect_language(message, language)

        inside_pilot = self.is_inside_pilot(latitude, longitude)

        # Context representation
        context_used = {
            "forecast_init": forecast_init,
            "lead_day": lead_day,
            "latitude": latitude,
            "longitude": longitude,
            "inside_pilot": inside_pilot,
            "active_view": active_view,
            "scenario_id": scenario_id
        }

        # Check outside pilot rule first
        if not inside_pilot:
            if lang_code == "hi":
                answer = (
                    f"चयनित स्थान ({latitude:.2f}°N, {longitude:.2f}°E) वर्तमान पूर्वी उत्तर प्रदेश प्रोटोटाइप पायलट क्षेत्र (24.5–28.5°N, 80.0–84.5°E) से बाहर है। "
                    f"इसलिए इस स्थान के लिए FORTRESS वैज्ञानिक विश्वसनीयता मीट्रिक उपलब्ध नहीं हैं।"
                )
            elif lang_code == "hinglish":
                answer = (
                    f"Selected location ({latitude:.2f}°N, {longitude:.2f}°E) current Eastern UP pilot domain (24.5–28.5°N, 80.0–84.5°E) se bahar hai. "
                    f"Isliye FORTRESS scientific reliability metrics is location ke liye display nahi kiye jaate."
                )
            else:
                answer = (
                    f"The selected location ({latitude:.2f}°N, {longitude:.2f}°E) is outside the current Eastern Uttar Pradesh prototype pilot domain (24.5–28.5°N, 80.0–84.5°E), "
                    f"so FORTRESS scientific reliability metrics are not provided for this location."
                )

            return {
                "answer": answer,
                "detected_language": detected_lang,
                "intent": "PILOT_COVERAGE",
                "context_used": context_used,
                "evidence_used": ["Pilot Scope Control"],
                "limitations": ["Location outside canonical pilot domain (24.5–28.5°N, 80.0–84.5°E). Scientific diagnostics suppressed."],
                "grounded": True
            }

        intent = self.detect_intent(message, active_view)

        # Fetch grid detail if inside pilot
        detail = data_service.get_grid_detail(forecast_init, lead_day, latitude, longitude) if inside_pilot else None

        # Build response based on intent and language
        evidence_used = []
        limitations = ["This is decision-support information and not an operational instruction."]
        answer = ""

        # Safe extraction of point values
        p_bust = detail.get("baseline_p_bust") if detail else None
        p_bust_pct = f"{p_bust * 100:.1f}%" if p_bust is not None else "N/A"
        risk_cat = detail.get("ai_risk_category", "N/A") if detail else "N/A"
        ffd_val = detail.get("ffd") if detail else None
        ffd_found = detail.get("ffd_failure_found") if detail else 1
        ffd_str = f"{ffd_val:.2f}" if (ffd_val is not None and ffd_found != 0) else ("No boundary" if ffd_found == 0 else "N/A")
        fragility_cat = detail.get("fragility_category", "N/A") if detail else "N/A"
        audit_status = detail.get("self_audit_status", "N/A") if detail else "N/A"
        audit_reason = detail.get("self_audit_reason", "N/A") if detail else "N/A"
        trust_idx = detail.get("trust_index", "N/A") if detail else "N/A"
        rel_band = detail.get("reliability_band", "N/A") if detail else "N/A"
        horizon_day = detail.get("trust_horizon_day", 10) if detail else 10
        breaking_day = detail.get("breaking_point_day") if detail else None
        ens_dis = detail.get("ensemble_disagreement_category", "N/A") if detail else "N/A"
        ens_score = detail.get("ensemble_disagreement_score") if detail else None
        ood_cat = detail.get("ood_category", "N/A") if detail else "N/A"
        ood_score = detail.get("ood_score") if detail else None
        dna_sim = detail.get("failure_dna_max_sim") if detail else None
        corridor_lbl = detail.get("failure_corridor_label", "N/A") if detail else "N/A"
        fingerprint_lbl = detail.get("failure_fingerprint_label", "N/A") if detail else "N/A"

        # General Intent
        if intent == "GENERAL":
            evidence_used = ["FORTRESS System Definition"]
            if lang_code == "hi":
                answer = (
                    "FORTRESS (Forecast Reliability Stress-Testing & Self-Audit System) एक निर्णय-सहायता प्रणाली है जो NWP मौसम पूर्वानुमानों की विश्वसनीयता, "
                    "मॉडल बस्ट जोखिम (bust risk), तथा मॉडल संवेदनशीलता (FFD) का विश्लेषण करती है। यह स्वयं एक मौसम पूर्वानुमान मॉडल नहीं है, "
                    "बल्कि मौजूदा पूर्वानुमानों का स्व-लेखापरीक्षण (Self-Audit) करती है।"
                )
            elif lang_code == "hinglish":
                answer = (
                    "FORTRESS (Forecast Reliability Stress-Testing & Self-Audit System) ek decision-support framework hai jo NWP weather forecasts ki reliability, "
                    "model bust risk, aur sensitivity (FFD) ko evaluate karta hai. Ye naya weather forecasting model nahi hai, balki existing forecasts ka self-audit karta hai."
                )
            else:
                answer = (
                    "FORTRESS (Forecast Reliability Stress-Testing & Self-Audit System) is a decision-support platform designed to evaluate NWP weather forecast reliability, "
                    "estimate model bust risk, and perform stress testing (FFD). It is not a weather forecasting model itself; it audits existing NWP model outputs."
                )

        # Bust Risk Intent
        elif intent == "BUST_RISK":
            evidence_used = ["Bust Probability", "Risk Category", "Vulnerability Corridor"]
            if p_bust is None:
                answer = "That diagnostic is not available for the current context."
            else:
                limitations.append("Bust Probability represents estimated model error risk, NOT probability of rain or certainty of forecast failure.")
                if lang_code == "hi":
                    answer = (
                        f"स्थान ({latitude:.2f}°N, {longitude:.2f}°E) पर लीड दिन D{lead_day} के लिए मॉडल-अनुमानित Bust Probability {p_bust_pct} ({risk_cat}) है। "
                        f"मुख्य संवेदनशीलता गलियारा '{corridor_lbl}' है।\n\n"
                        f"ध्यान दें: उच्च बस्ट संभावना यह गारंटी नहीं देती कि पूर्वानुमान निश्चित रूप से गलत होगा, यह मॉडल त्रुटि जोखिम का संकेत देती है।"
                    )
                elif lang_code == "hinglish":
                    answer = (
                        f"Grid ({latitude:.2f}°N, {longitude:.2f}°E) par D{lead_day} ke liye estimated Bust Risk {p_bust_pct} ({risk_cat}) hai. "
                        f"Primary vulnerability corridor: '{corridor_lbl}'.\n\n"
                        f"Note: High bust probability ka matlab forecast definitely wrong hona nahi hai; ye model-estimated large-error risk ko show karta hai."
                    )
                else:
                    answer = (
                        f"The model-estimated Bust Risk for lead day D{lead_day} at ({latitude:.2f}°N, {longitude:.2f}°E) is {p_bust_pct} ({risk_cat}). "
                        f"The primary failure corridor is '{corridor_lbl}'.\n\n"
                        f"Note: Bust Probability measures estimated model large-error risk. High bust probability does NOT guarantee forecast failure or precipitation."
                    )

        # Confidence Intent
        elif intent == "CONFIDENCE":
            evidence_used = ["Reliability Band", "Trust Index", "Ensemble Disagreement", "OOD Category"]
            if detail is None:
                answer = "That diagnostic is not available for the current context."
            else:
                if lang_code == "hi":
                    answer = (
                        f"लीड दिन D{lead_day} पर पूर्वानुमान विश्वसनीयता श्रेणी '{rel_band}' (ट्रस्ट इंडेक्स: {trust_idx}/100) है। "
                        f"एन्सेम्बल असहमति '{ens_dis}' और OOD स्थिति '{ood_cat}' है।\n\n"
                        f"व्याख्या: यह विश्वसनीयता स्कोर मौजूदा साक्ष्यों पर आधारित एक प्रोटोटाइप इंडेक्स है, शुद्ध पूर्वानुमान सटीकता की गारंटी नहीं।"
                    )
                elif lang_code == "hinglish":
                    answer = (
                        f"Lead D{lead_day} par reliability band '{rel_band}' (Trust Index: {trust_idx}/100) hai. "
                        f"Ensemble disagreement '{ens_dis}' aur OOD score '{ood_cat}' hai.\n\n"
                        f"Interpretation: Ye Prototype Diagnostic Trust Index hai. Green band ya high score forecast accuracy ki 100% guarantee nahi deta."
                    )
                else:
                    answer = (
                        f"Forecast reliability for lead day D{lead_day} is classified as '{rel_band}' with a Trust Index of {trust_idx}/100. "
                        f"Ensemble disagreement is '{ens_dis}' and OOD category is '{ood_cat}'.\n\n"
                        f"Interpretation: This Trust Index is a prototype diagnostic score. GREEN status indicates strong supporting evidence, not guaranteed accuracy."
                    )

        # FFD / Stress Lab Intent
        elif intent == "FFD_STRESS":
            evidence_used = ["FFD Score", "Fragility Category", "Failure Boundary Found"]
            if detail is None:
                answer = "That diagnostic is not available for the current context."
            else:
                limitations.append("FFD (Fast Failure Direction) is a proposed experimental diagnostic, NOT a validated meteorological standard.")
                if ffd_found == 0:
                    ffd_msg_en = "No failure found within tested perturbation range."
                    ffd_msg_hi = "परीक्षण की गई गड़बड़ी सीमा (perturbation range) के भीतर कोई विफलता नहीं मिली।"
                    ffd_msg_hinglish = "No failure found within tested perturbation range."
                else:
                    ffd_msg_en = f"FFD score is {ffd_val:.2f} ({fragility_cat}). Small perturbations (+1.2°C temp / +15% moisture) push model forecasts across the failure boundary."
                    ffd_msg_hi = f"FFD स्कोर {ffd_val:.2f} ({fragility_cat}) है। छोटे वायुमंडलीय बदलाव पूर्वानुमान को विफलता सीमा के पार धकेल सकते हैं।"
                    ffd_msg_hinglish = f"FFD score {ffd_val:.2f} ({fragility_cat}) hai. Small perturbations forecast ko failure boundary cross kara sakti hain."

                if lang_code == "hi":
                    answer = (
                        f"प्रतिबल परीक्षण (Stress Lab) परिणाम:\n"
                        f"• {ffd_msg_hi}\n\n"
                        f"नोट: FFD एक प्रायोगिक नैदानिक मीट्रिक है, मानक मौसम विज्ञान माप नहीं।"
                    )
                elif lang_code == "hinglish":
                    answer = (
                        f"Stress Lab diagnostic result:\n"
                        f"• {ffd_msg_hinglish}\n\n"
                        f"Note: FFD ek experimental diagnostic metric hai, validated meteorological standard nahi."
                    )
                else:
                    answer = (
                        f"Stress Lab evaluation:\n"
                        f"• {ffd_msg_en}\n\n"
                        f"Note: FFD is a proposed experimental diagnostic and not a validated meteorological standard."
                    )

        # Failure Intelligence Intent
        elif intent == "FAILURE_INTELLIGENCE":
            evidence_used = ["Failure Corridor", "Failure Fingerprint", "Primary Vulnerability"]
            if detail is None:
                answer = "That diagnostic is not available for the current context."
            else:
                if lang_code == "hi":
                    answer = (
                        f"वर्तमान ग्रिड बिंदु के लिए विफलता फिंगरप्रिंट '{fingerprint_lbl}' तथा मुख्य संवेदनशीलता गलियारा '{corridor_lbl}' है।\n"
                        f"यह दर्शाता है कि किन वायुमंडलीय चरों (नमी, तापमान, दबाव, हवा) में त्रुटियों के प्रति मॉडल सबसे अधिक संवेदनशील है।"
                    )
                elif lang_code == "hinglish":
                    answer = (
                        f"Current grid point ke liye failure fingerprint '{fingerprint_lbl}' aur corridor '{corridor_lbl}' hai.\n"
                        f"Ye highlight karta hai ki kis atmospheric variable (humidity, temp, pressure, wind) ki error ke prati model sabse jyada sensitive hai."
                    )
                else:
                    answer = (
                        f"The failure fingerprint for this point is '{fingerprint_lbl}' with corridor sensitivity '{corridor_lbl}'.\n"
                        f"This identifies the atmospheric variables (humidity, temperature, pressure, wind) to which the forecast model exhibits maximum error sensitivity."
                    )

        # Historical Evidence Intent
        elif intent == "HISTORICAL_EVIDENCE":
            evidence_used = ["Failure DNA Similarity", "Analogues Evidence"]
            if detail is None:
                answer = "That diagnostic is not available for the current context."
            else:
                limitations.append("Failure DNA provides supporting historical evidence only and cannot guarantee future outcomes.")
                dna_sim_str = f"{dna_sim:.2f}" if dna_sim is not None else "N/A"
                if lang_code == "hi":
                    answer = (
                        f"ऐतिहासिक साक्ष्य:\n"
                        f"• विफलता डीएनए (Failure DNA) अधिकतम समानता: {dna_sim_str}\n"
                        f"• ऐतिहासिक स्थिति: {detail.get('history_evidence', 'N/A')}\n\n"
                        f"यह साक्ष्य दिखाता है कि अतीत में इसी तरह के वायुमंडलीय पैटर्न में मॉडल ने कैसा प्रदर्शन किया था।"
                    )
                elif lang_code == "hinglish":
                    answer = (
                        f"Historical evidence context:\n"
                        f"• Failure DNA max similarity: {dna_sim_str}\n"
                        f"• History status: {detail.get('history_evidence', 'N/A')}\n\n"
                        f"Ye evidence dikhata hai ki past me similar atmospheric conditions me model performance kaisa tha."
                    )
                else:
                    answer = (
                        f"Historical analogues & Failure DNA:\n"
                        f"• Failure DNA max similarity: {dna_sim_str}\n"
                        f"• Historical evidence flag: {detail.get('history_evidence', 'N/A')}\n\n"
                        f"Failure DNA serves as supporting historical pattern match evidence."
                    )

        # Ensemble / OOD Intent
        elif intent == "ENSEMBLE_OOD":
            evidence_used = ["Ensemble Disagreement", "OOD Novelty Score"]
            if detail is None:
                answer = "That diagnostic is not available for the current context."
            else:
                limitations.append("Ensemble disagreement or OOD novelty does NOT automatically mean the forecast is wrong or failed.")
                ens_val_str = f"{ens_score:.2f}" if ens_score is not None else "N/A"
                ood_val_str = f"{ood_score:.2f}" if ood_score is not None else "N/A"
                if lang_code == "hi":
                    answer = (
                        f"एन्सेम्बल तथा अनूठी स्थिति (OOD) विश्लेषण:\n"
                        f"• एन्सेम्बल असहमति: {ens_dis} (स्कोर: {ens_val_str})\n"
                        f"• Out-of-Distribution (OOD): {ood_cat} (स्कोर: {ood_val_str})\n\n"
                        f"व्याख्या: एन्सेम्बल सदस्यों में अंतर या अनूठी वायुमंडलीय स्थिति अनिश्चितता बढ़ाती है, पर इसका अर्थ निश्चित विफलता नहीं है।"
                    )
                elif lang_code == "hinglish":
                    answer = (
                        f"Ensemble & OOD analysis:\n"
                        f"• Ensemble Disagreement: {ens_dis} (score: {ens_val_str})\n"
                        f"• OOD Category: {ood_cat} (score: {ood_val_str})\n\n"
                        f"Interpretation: Ensemble spread ya unusual atmospheric state error risk badhati hai, but ensemble disagreement != bust and OOD != failure."
                    )
                else:
                    answer = (
                        f"Ensemble Disagreement & Out-of-Distribution (OOD):\n"
                        f"• Ensemble Disagreement: {ens_dis} (score: {ens_val_str})\n"
                        f"• OOD Novelty Category: {ood_cat} (score: {ood_val_str})\n\n"
                        f"Note: Ensemble disagreement or OOD status indicates atmospheric state complexity; it does NOT imply definite forecast failure."
                    )

        # Self-Audit Intent
        elif intent == "SELF_AUDIT":
            evidence_used = ["Self-Audit Verdict", "Audit Reason", "Trust Index", "Evidence Conflict Count"]
            if detail is None:
                answer = "That diagnostic is not available for the current context."
            else:
                limitations.append("Self-Audit flags (Conflict / Possible Blind Spot) indicate AI/evidence mismatch, NOT a confirmed model blind spot.")
                if lang_code == "hi":
                    answer = (
                        f"Self-Audit परिणाम:\n"
                        f"• स्थिति: {audit_status}\n"
                        f"• कारण: {audit_reason}\n"
                        f"• ट्रस्ट इंडेक्स: {trust_idx}/100\n\n"
                        f"व्याख्या: 'Conflict' स्थिति AI मॉडल बस्ट जोखिम और ऐतिहासिक/प्रतिबल साक्ष्यों के बीच विसंगति दर्शाती है, न कि पुष्ट विफलता।"
                    )
                elif lang_code == "hinglish":
                    answer = (
                        f"Self-Audit verdict for current point:\n"
                        f"• Status: {audit_status}\n"
                        f"• Reason: {audit_reason}\n"
                        f"• Trust Index: {trust_idx}/100\n\n"
                        f"Note: 'Conflict / Possible Blind Spot' status AI risk score aur stress/history evidence ke disagreement ko represent karta hai, confirmed blind spot ko nahi."
                    )
                else:
                    answer = (
                        f"Self-Audit synthesis verdict:\n"
                        f"• Status: {audit_status}\n"
                        f"• Reason: {audit_reason}\n"
                        f"• Trust Index: {trust_idx}/100\n\n"
                        f"Note: 'Conflict / Possible Blind Spot' indicates disagreement between AI risk prediction and supporting evidence lines, not a confirmed blind spot."
                    )

        # Trust Intent
        elif intent == "TRUST":
            evidence_used = ["Trust Horizon Day", "Breaking Point Day", "Lead Timeline"]
            if detail is None:
                answer = "That diagnostic is not available for the current context."
            else:
                brk_str = f"Day {breaking_day}" if breaking_day else "None in 10-day window"
                limitations.append("Trust Horizon is an indicator of sustained reliability, NOT a absolute guarantee of forecast accuracy up to that day.")
                if lang_code == "hi":
                    answer = (
                        f"विश्वास सीमा (Trust Horizon) विश्लेषण:\n"
                        f"• Trust Horizon: दिन D{horizon_day} तक विश्वसनीय\n"
                        f"• Breaking Point (सस्टेन्ड RED): {brk_str}\n\n"
                        f"पूर्वाभास D{horizon_day} तक स्थिर रहता है जिसके बाद अनिश्चितता बढ़ जाती है।"
                    )
                elif lang_code == "hinglish":
                    answer = (
                        f"Trust Horizon & Breaking Point timeline:\n"
                        f"• Trust Horizon: Day D{horizon_day} tak reliability sustained hai.\n"
                        f"• Breaking Point (sustained RED): {brk_str}.\n\n"
                        f"Interpretation: D{horizon_day} ke baad reliability degrade hone lagti hai."
                    )
                else:
                    answer = (
                        f"Trust Horizon & Breaking Point assessment:\n"
                        f"• Trust Horizon: Reliable up to Lead Day D{horizon_day}.\n"
                        f"• Breaking Point: {brk_str}.\n\n"
                        f"Note: Trust Horizon indicates sustained acceptable reliability; it is not an absolute guarantee of zero error."
                    )

        # Reservoir Intent
        elif intent == "RESERVOIR":
            evidence_used = ["Reservoir Context", "Bust Risk Context", "Decision Support Status"]
            res_ds = reservoir_service.get_decision_support("RES_MEJA", forecast_init, lead_day)
            res_status = res_ds.get("decision_status", "NORMAL_MONITORING") if res_ds else "NORMAL_MONITORING"
            limitations.append("FORTRESS provides decision-support information and cannot issue dam gate opening instructions or release quantities.")
            if lang_code == "hi":
                answer = (
                    f"जलाशय (Reservoir) निर्णय सहायता स्थिति: '{res_status}'.\n\n"
                    f"FORTRESS मौसम पूर्वानुमान विश्वसनीयता और इनफ्लो अनिश्चितता संदर्भ प्रदान करता है। "
                    f"यह बाँध के फाटक खोलने (dam gate release) या जल निकासी की मात्रा तय करने का आदेश नहीं देता।"
                )
            elif lang_code == "hinglish":
                answer = (
                    f"Reservoir decision support status: '{res_status}'.\n\n"
                    f"FORTRESS forecast reliability aur inflow risk context provide karta hai. "
                    f"Ye dam gate release ya exact outflow quantity issue nahi kar sakta. Official water authority decisions authoritative hain."
                )
            else:
                answer = (
                    f"Reservoir Decision Support status: '{res_status}'.\n\n"
                    f"FORTRESS evaluates atmospheric forecast reliability to provide reservoir decision context. "
                    f"It does NOT issue dam gate opening instructions or release quantity commands."
                )

        # Agriculture Intent
        elif intent == "AGRICULTURE":
            evidence_used = ["Agricultural Advisory Context", "Dry Spell Diagnostic"]
            agri_ds = agriculture_service.get_decision_support("AGRI_EUP_01", forecast_init, lead_day)
            agri_status = agri_ds.get("decision_status", "NORMAL_MONITORING") if agri_ds else "NORMAL_MONITORING"
            limitations.append("FORTRESS provides weather reliability context and is NOT an official agricultural advisory or pesticide recommendation.")
            if lang_code == "hi":
                answer = (
                    f"कृषि (Agriculture) निर्णय सहायता स्थिति: '{agri_status}'.\n\n"
                    f"यह प्रणाली मौसम पूर्वाभास की विश्वसनीयता और शुष्क अवधि (dry-spell) जोखिम का मूल्यांकन करती है। "
                    f"यह आधिकारिक कृषि परामर्श (official advisory) या कीटनाशक छिड़काव का आदेश नहीं है।"
                )
            elif lang_code == "hinglish":
                answer = (
                    f"Agriculture decision support status: '{agri_status}'.\n\n"
                    f"Ye view weather forecast reliability aur dry-spell window risk ko assess karta hai. "
                    f"Ye official agricultural advisory ya pesticide/irrigation command nahi hai."
                )
            else:
                answer = (
                    f"Agriculture Decision Support status: '{agri_status}'.\n\n"
                    f"FORTRESS assesses forecast reliability during weather-sensitive farming windows. "
                    f"It is a decision-support tool, not an official government agricultural advisory."
                )

        # Disaster Intent
        elif intent == "DISASTER":
            evidence_used = ["Disaster Preparedness Mode", "Hazard Exposure Context"]
            dis_ds = disaster_service.get_decision_support("DISASTER_EUP_01", forecast_init, lead_day)
            dis_status = dis_ds.get("decision_status", "NORMAL_MONITORING") if dis_ds else "NORMAL_MONITORING"
            limitations.append("FORTRESS provides reliability context and does NOT issue official flood warnings or evacuation orders.")
            if lang_code == "hi":
                answer = (
                    f"आपदा प्रबंधन स्थिति: '{dis_status}'.\n\n"
                    f"महत्वपूर्ण: वर्षा का पूर्वानुमान सीधे बाढ़ की पुष्टि नहीं करता, और FORTRESS आधिकारिक आपदा चेतावनी (flood warning) "
                    f"या निकासी (evacuation order) के निर्देश जारी नहीं करता। राज्य आपदा प्रबंधन प्राधिकरण (SDMA) के निर्देश ही मान्य हैं।"
                )
            elif lang_code == "hinglish":
                answer = (
                    f"Disaster management preparedness status: '{dis_status}'.\n\n"
                    f"Note: Rainfall forecast != instant flooding. FORTRESS official flood warnings ya evacuation orders issue nahi karta. "
                    f"Official disaster management authorities (SDMA/NDMA) authoritative hain."
                )
            else:
                answer = (
                    f"Disaster Management preparedness status: '{dis_status}'.\n\n"
                    f"Note: Predicted rainfall does not automatically equate to flooding. "
                    f"FORTRESS does NOT issue official flood warnings or evacuation orders. State Emergency Authorities remain authoritative."
                )

        # Renewable Intent
        elif intent == "RENEWABLE":
            evidence_used = ["10m Wind Diagnostic", "Solar Diagnostics Availability", "Grid Preparedness Status"]
            ren_ds = renewable_service.get_decision_support("RENEW_EUP_01", forecast_init, lead_day)
            ren_status = ren_ds.get("decision_status", "NORMAL_MONITORING") if ren_ds else "NORMAL_MONITORING"
            limitations.append("10m wind is vector speed sqrt(u10^2 + v10^2), NOT turbine hub-height wind. Solar generation diagnostic is unavailable.")
            limitations.append("FORTRESS does NOT predict MW generation or issue grid dispatch instructions.")

            if lang_code == "hi":
                answer = (
                    f"अक्षय ऊर्जा / ग्रिड स्थिति: '{ren_status}'.\n\n"
                    f"1. **10m Wind Diagnostic**: 10 मीटर की हवा की गति u10 और v10 वेक्टर घटकों से निष्पादित है (sqrt(u10² + v10²))। यह टर्बाइन हब-ऊंचाई की हवा नहीं है।\n"
                    f"2. **Solar**: वर्तमान प्रोटोटाइप में सौर विकिरण (irradiance) इनपुट एकीकृत न होने के कारण सौर पीढ़ी डायग्नोस्टिक उपलब्ध नहीं है।\n"
                    f"3. **MW / Grid Dispatch**: FORTRESS मौसम विश्वसनीयता संदर्भ देता है; यह MW पावर जेनरेशन का पूर्वानुमान या ग्रिड डिस्पैच निर्देश जारी नहीं करता।"
                )
            elif lang_code == "hinglish":
                answer = (
                    f"Renewable / Grid decision support status: '{ren_status}'.\n\n"
                    f"1. **10m Wind**: Derived from NOAA GEFS 10m vector norm sqrt(u10² + v10²). Ye turbine hub-height wind nahi hai.\n"
                    f"2. **Solar Diagnostic**: Solar generation diagnostic unavailable hai kyunki validated solar irradiance input prototype me integrated nahi hai.\n"
                    f"3. **MW & Dispatch**: FORTRESS plant-level MW power generation forecast ya grid dispatch instructions issue nahi karta."
                )
            else:
                answer = (
                    f"Renewable Energy & Grid Decision Support status: '{ren_status}'.\n\n"
                    f"1. **10m Wind Speed**: Derived from NOAA GEFS 10m vector components sqrt(u10² + v10²). It is NOT turbine hub-height wind.\n"
                    f"2. **Solar Generation**: Solar diagnostic is unavailable in the current prototype as validated surface solar irradiance input is not integrated.\n"
                    f"3. **MW Prediction & Dispatch**: FORTRESS provides weather-reliability context only. It does NOT predict MW generation or issue grid dispatch instructions."
                )

        return {
            "answer": answer,
            "detected_language": detected_lang,
            "intent": intent,
            "context_used": context_used,
            "evidence_used": evidence_used,
            "limitations": limitations,
            "grounded": True
        }

assistant_service = AssistantService()
