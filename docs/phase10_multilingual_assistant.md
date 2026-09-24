# FORTRESS Phase 10A — Context-Grounded Multilingual Explanation Assistant

## Overview
Phase 10A upgrades the FORTRESS prototype explanation assistant into a context-aware, grounded multilingual explanation engine. It provides plain-language interpretations of complex scientific reliability outputs, stress lab metrics, self-audit verdicts, and domain-specific decision support contexts without inventing values or making unsupported claims.

---

## Key Features & Supported Languages

### Supported Languages
1. **English (`en`)**: Direct, clear, technical explanations.
2. **Hindi (`hi`)**: Native Devanagari script explanations.
3. **Hinglish (`hinglish`)**: Conversational Romanized Hindi/English explanations commonly used by operational stakeholders.
4. **Auto-Detect (`auto`)**: Automatic script and keyword-based language detection.

---

## Architecture & Data Flow

```
User Query
    ↓
Language Detection (Auto / Script / Keywords)
    ↓
Intent Classification (Rules & Keyword Analysis)
    ↓
Context Grounding (Run, Lead, Lat/Lon, Active View, Domain Bounds)
    ↓
FORTRESS Backend Retrieval (Data Service & Decision Support Services)
    ↓
Grounded Explanation Engine (Deterministic, zero fake values)
    ↓
Safety Guard Enforcement (Disclaimer, refusal of operational commands)
    ↓
Multilingual Output Response + Evidence Chips
```

---

## Supported Intents

- **GENERAL**: System purpose, non-weather forecasting model definition.
- **BUST_RISK**: Model-estimated bust probability and primary vulnerability corridors.
- **CONFIDENCE**: Prototype Diagnostic Trust Index and reliability band explanations.
- **FFD_STRESS**: Fast Failure Direction score, perturbation thresholds, and sensitivity.
- **FAILURE_INTELLIGENCE**: Failure corridors and atmospheric error fingerprints.
- **HISTORICAL_EVIDENCE**: Failure DNA similarity and historical analogue pattern matching.
- **ENSEMBLE_OOD**: Ensemble disagreement spread and IsolationForest OOD novelty scores.
- **SELF_AUDIT**: Self-Audit verdicts, conflict reasons, and evidence mismatch.
- **TRUST**: Trust Horizon timeline, Breaking Point (sustained RED) lead days.
- **RESERVOIR**: Downstream reservoir inflow uncertainty and gate release refusal.
- **AGRICULTURE**: Farming window sensitivity, dry-spell diagnostics, and official advisory refusal.
- **DISASTER**: Rainfall/flooding distinction and evacuation order refusal.
- **RENEWABLE**: 10m wind vector norm ($\sqrt{u_{10}^2 + v_{10}^2}$), solar diagnostic unavailability, MW forecast refusal, grid dispatch refusal.
- **PILOT_COVERAGE**: Outside-pilot location detection and scientific data suppression.

---

## Grounding & Scientific Safety Rules

1. **Zero Fabrication**: Every response uses real backend numbers for the selected run and grid location. If data is unavailable or out of bounds, the assistant explicitly states diagnostic unavailability.
2. **Operational Command Refusal**: The assistant explicitly states that FORTRESS provides decision support and does not issue dam gate commands, flood warnings, evacuation orders, agricultural advisories, or grid dispatch instructions.
3. **Domain Boundary Control**: Scientific diagnostics are strictly suppressed outside the canonical Eastern UP pilot ($24.5^\circ\text{N} \le \text{lat} \le 28.5^\circ\text{N}$, $80.0^\circ\text{E} \le \text{lon} \le 84.5^\circ\text{E}$).
4. **Scientific Wording Safeguards**:
   - Bust Probability $\neq$ Rain probability, $\neq$ Guaranteed failure.
   - Ensemble disagreement $\neq$ Forecast bust.
   - OOD $\neq$ Forecast error.
   - Failure DNA = Supporting historical pattern match only.
   - GREEN band = Prototype diagnostic score, $\neq$ 100% accuracy guarantee.
   - FFD = Proposed experimental diagnostic, $\neq$ Validated meteorological standard.
   - 10m Wind = $\sqrt{u_{10}^2 + v_{10}^2}$, $\neq$ Hub-height wind.
   - Solar Diagnostic = Unavailable (solar irradiance input not integrated).

---

## Offline / Zero External LLM Dependency
Phase 10A operates completely offline without requiring third-party cloud LLM APIs (OpenAI, Gemini, Anthropic) or external API keys. It runs as a deterministic, ultra-fast grounded engine designed for reliable, reproducible prototype demonstrations.

---

## Scope Boundary (Future Expansion)
Voice input (microphone, STT, TTS), audio streaming, and LLM fine-tuning belong to Phase 10B / Phase 10C.
