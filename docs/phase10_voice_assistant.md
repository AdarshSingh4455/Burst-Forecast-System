# FORTRESS Phase 10B — Voice Input & Spoken Assistant Output

## Overview
Phase 10B equips the FORTRESS Multilingual Explanation Assistant with browser-native speech input (Web Speech Recognition API) and spoken output (Web Speech Synthesis API). It allows users to ask questions by voice, review/edit transcripts, and listen to grounded explanation responses aloud while preserving 100% of Phase 10A's scientific grounding and safety rules.

---

## Key Features

### 1. Browser-Native Voice Recognition (STT)
- Uses `window.SpeechRecognition` or `window.webkitSpeechRecognition`.
- Push-to-talk microphone control (`🎤` / `■ Stop`).
- Real-time speech-to-text transcript sync directly into input field for user review and editing before sending.
- Handles recognition events, permission denial, no-speech detection, and network errors gracefully.

### 2. Browser-Native Speech Synthesis (TTS)
- Uses `window.speechSynthesis` and `SpeechSynthesisUtterance`.
- **Listen / Stop** buttons on bot messages to read answers aloud on demand.
- **Auto-Speak Toggle**: Optional setting to automatically speak new bot responses.
- Language-aware voice selection (`hi-IN`, `en-IN`, `en-US`).
- Cleans markdown symbols and formatting for smooth audio reading.

### 3. Zero External Dependencies & Zero Audio Persistence
- Requires **NO API keys** (No OpenAI Audio, No Whisper, No Google Speech, No ElevenLabs).
- **Zero Backend Audio Storage**: FORTRESS does not create, record, or write audio files to disk.
- **Zero Audio Endpoints**: Voice transcripts enter the existing `POST /api/assistant/explain` endpoint as text.
- Privacy note rendered in UI: *"Voice input uses your browser's speech capabilities. FORTRESS does not store microphone audio."*

---

## Voice Data Flow Architecture

```
User Microhpone Input
      ↓
Browser Web Speech Recognition API (SpeechRecognition / webkitSpeechRecognition)
      ↓
Transcript Displayed in Input Box (User can review / edit)
      ↓
Existing POST /api/assistant/explain (Validated Grounded Engine)
      ↓
Phase 10A Grounded Answer Response
      ↓
Browser Web Speech Synthesis API (speechSynthesis)
      ↓
Optional Spoken Response (Listen Button or Auto-Speak)
```

---

## Language & Locale Mapping

| Selected Assistant Language | Web Speech Recognition Locale | Web Speech Synthesis Target Locale |
| :--- | :--- | :--- |
| **English** | `en-IN` / `en-US` | `en-IN` / `en-US` |
| **Hindi** | `hi-IN` | `hi-IN` |
| **Hinglish** | `en-IN` (Romanized transcript) | `en-IN` (Retains Hinglish text) |
| **Auto-Detect** | Browser Default (`navigator.language`) | Detected Response Language (`hi-IN` or `en-IN`) |

---

## Fallback & Graceful Degradation

1. **Unsupported Speech Recognition**: Microphone button is disabled/hidden. Text assistant remains 100% functional with warning banner: *"Voice input is not supported in this browser. You can continue using the text assistant."*
2. **Unsupported Speech Synthesis**: Listen/Stop buttons are hidden. Text answers display normally without errors.
3. **Permission Denied**: Displays clear message: *"Microphone access was not granted. You can continue using text."*

---

## Safety Inheritance
Voice queries inherit all Phase 10A safety and domain bounds checks:
- Refuses operational dam gate commands or release quantities.
- Refuses official flood warnings or evacuation orders.
- Refuses official agricultural prescriptions or pesticide advice.
- Refuses plant-level MW forecasts and grid dispatch instructions.
- Suppresses scientific diagnostics outside Eastern UP pilot ($24.5^\circ\text{N} \le \text{lat} \le 28.5^\circ\text{N}, 80.0^\circ\text{E} \le \text{lon} \le 84.5^\circ\text{E}$).

---

## Scope Boundary (Phase 10C / Future Expansion)
Wake-word activation ("Hey FORTRESS"), continuous background audio listening, server-side Whisper audio processing, user voice profiles, and audio storage are out of scope for Phase 10B.
