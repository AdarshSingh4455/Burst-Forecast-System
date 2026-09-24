import React, { useState, useEffect } from 'react';
import { Bot, Send, User, X, Sparkles, Trash2, Globe, CheckCircle2, Mic, MicOff, Volume2, VolumeX, Shield, AlertCircle } from 'lucide-react';
import { GridPointDetail } from '../types';
import { postAssistantExplain } from '../lib/api';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  detectedLang?: string;
  intent?: string;
  evidenceUsed?: string[];
  limitations?: string[];
  timestamp: string;
}

interface AiAssistantPopupProps {
  isOpen: boolean;
  onClose: () => void;
  pointDetail?: GridPointDetail | null;
  selectedRun?: string;
  selectedLead?: number;
  selectedLat?: number | null;
  selectedLon?: number | null;
  activeView?: string;
  scenarioId?: string | null;
}

export const AiAssistantPopup: React.FC<AiAssistantPopupProps> = ({
  isOpen,
  onClose,
  pointDetail,
  selectedRun = '2019-07-01 00:00:00',
  selectedLead = 5,
  selectedLat = 26.75,
  selectedLon = 83.37,
  activeView = 'Overview',
  scenarioId = null
}) => {
  const [language, setLanguage] = useState<'auto' | 'en' | 'hi' | 'hinglish'>('auto');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: `Hello! I am FORTRESS Multilingual Explanation Assistant. Ask me by text or microphone about current grid point telemetry (${pointDetail ? `${pointDetail.latitude.toFixed(2)}°N, ${pointDetail.longitude.toFixed(2)}°E` : `${selectedLat?.toFixed(2) || '26.75'}°N, ${selectedLon?.toFixed(2) || '83.37'}°E`}), bust risk, FFD, stress lab, self-audit, or decision support context.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const {
    isSpeechRecognitionSupported,
    isSpeechSynthesisSupported,
    isListening,
    transcript,
    speechError,
    currentlySpeakingId,
    autoSpeak,
    startListening,
    stopListening,
    cancelListening,
    speak,
    stopSpeaking,
    toggleAutoSpeak,
    resetSpeechError
  } = useVoiceAssistant();

  // Sync speech recognition transcript into text input box for user editing/review
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  // Clean up speech on close
  useEffect(() => {
    if (!isOpen) {
      stopSpeaking();
      cancelListening();
    }
  }, [isOpen, stopSpeaking, cancelListening]);

  if (!isOpen) return null;

  // View-based dynamic quick questions
  const getQuickQuestions = () => {
    const v = (activeView || '').toLowerCase();
    if (v.includes('stress')) {
      return ['Why is FFD small?', 'What variable is most sensitive?', 'What happens under stress testing?'];
    } else if (v.includes('audit')) {
      return ['Why did Self-Audit flag this?', 'What does Conflict mean?', 'Why is Expert Review shown?'];
    } else if (v.includes('trust') || v.includes('breaking')) {
      return ['When does reliability deteriorate?', 'What is Trust Horizon?', 'Can I trust Day 5?'];
    } else if (v.includes('reservoir')) {
      return ['Why is reservoir monitoring heightened?', 'Can FORTRESS open dam gates?', 'Why is expert review advised?'];
    } else if (v.includes('agri')) {
      return ['Why is this weather-sensitive?', 'What does dry-spell diagnostic mean?', 'Is this an official advisory?'];
    } else if (v.includes('disaster')) {
      return ['Does this rainfall mean flooding?', 'Should people evacuate?', 'Why is preparedness heightened?'];
    } else if (v.includes('renewable')) {
      return ['Why is solar diagnostic unavailable?', 'What does 10 m wind mean?', 'Can FORTRESS predict MW generation?'];
    }
    return [
      'Why is this forecast risky?',
      'How reliable is D5?',
      'Why is FFD small?',
      'When does reliability deteriorate?'
    ];
  };

  const handleSend = async (textToSend?: string) => {
    const q = textToSend || input;
    if (!q.trim() || isSending) return;

    if (isListening) {
      stopListening();
    }

    const userMsgId = Date.now().toString();
    const userMsg: Message = {
      id: userMsgId,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsSending(true);

    try {
      const lat = pointDetail ? pointDetail.latitude : (selectedLat ?? 26.75);
      const lon = pointDetail ? pointDetail.longitude : (selectedLon ?? 83.37);

      const resp = await postAssistantExplain({
        message: q,
        language: language,
        forecastInit: selectedRun,
        leadDay: selectedLead,
        latitude: lat,
        longitude: lon,
        activeView: activeView,
        scenarioId: scenarioId
      });

      const botMsgId = (Date.now() + 1).toString();
      const botMsg: Message = {
        id: botMsgId,
        sender: 'bot',
        text: resp.answer,
        detectedLang: resp.detected_language,
        intent: resp.intent,
        evidenceUsed: resp.evidence_used,
        limitations: resp.limitations,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);

      // Auto-speak if setting is enabled
      if (autoSpeak && isSpeechSynthesisSupported) {
        speak(resp.answer, resp.detected_language, botMsgId);
      }
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: `Error connecting to explanation engine: ${err?.message || 'Server unavailable'}. Please verify backend is running.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const clearChat = () => {
    stopSpeaking();
    cancelListening();
    setMessages([
      {
        id: Date.now().toString(),
        sender: 'bot',
        text: 'Conversation history cleared. How can I assist you with FORTRESS forecast reliability context?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const currentLat = pointDetail ? pointDetail.latitude : (selectedLat ?? 26.75);
  const currentLon = pointDetail ? pointDetail.longitude : (selectedLon ?? 83.37);

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={() => {
          stopSpeaking();
          onClose();
        }}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[9998] transition-opacity"
      />

      {/* Side Slide-Over Drawer */}
      <div className="fixed top-0 right-0 h-full w-[440px] max-w-[95vw] bg-white border-l border-[#C8EAD9] shadow-2xl z-[9999] flex flex-col flex-shrink-0 select-none animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-3.5 bg-[#F4FAF6] border-b border-[#C8EAD9] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#059669] text-white flex items-center justify-center shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-[#044E3A] text-sm flex items-center gap-1.5">
                FORTRESS Assistant — Prototype
                <span className="text-[9px] bg-[#D4F0E2] text-[#047857] px-1.5 py-0.5 rounded font-extrabold">Phase 10B Voice</span>
              </h2>
              <p className="text-[10px] text-[#065F46] font-medium">
                Context-grounded forecast reliability explanation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={clearChat}
              title="Clear conversation"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => {
                stopSpeaking();
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-[#044E3A] hover:bg-[#E2F5EC] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Language & Voice Controls Bar */}
        <div className="px-3.5 py-2 bg-[#EAF8F3] border-b border-[#C8EAD9] flex items-center justify-between text-xs flex-wrap gap-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-[#047857] flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-[#059669]" /> Lang:
            </span>
            <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-lg border border-[#C8EAD9]">
              {(['auto', 'en', 'hi', 'hinglish'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
                    language === lang
                      ? 'bg-[#059669] text-white shadow-xs'
                      : 'text-[#044E3A] hover:bg-[#EEF9F4]'
                  }`}
                >
                  {lang === 'auto' ? 'Auto' : lang === 'en' ? 'EN' : lang === 'hi' ? 'हिन्दी' : 'Hinglish'}
                </button>
              ))}
            </div>
          </div>

          {/* Auto-Speak Toggle */}
          {isSpeechSynthesisSupported && (
            <button
              onClick={toggleAutoSpeak}
              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors flex items-center gap-1 ${
                autoSpeak
                  ? 'bg-[#059669] text-white border-[#059669]'
                  : 'bg-white text-[#047857] border-[#C8EAD9] hover:bg-[#EEF9F4]'
              }`}
              title="Toggle automatic voice playback for bot answers"
            >
              <Volume2 className="w-3 h-3" />
              <span>{autoSpeak ? 'Auto-Speak ON' : 'Auto-Speak OFF'}</span>
            </button>
          )}
        </div>

        {/* Active Context Card */}
        <div className="mx-3.5 mt-2.5 p-2 bg-[#EEF9F4] border border-[#C8EAD9] rounded-xl text-[11px] space-y-1">
          <div className="flex items-center justify-between text-[#044E3A] font-bold border-b border-[#C8EAD9]/60 pb-1">
            <span className="uppercase text-[9.5px] tracking-wider text-[#059669] font-extrabold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> CURRENT CONTEXT
            </span>
            <span className="text-[10px] text-[#065F46] font-semibold">{activeView || 'Overview'}</span>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[#065F46]">
            <div><span className="font-semibold text-[#044E3A]">Run:</span> {selectedRun.split(' ')[0]}</div>
            <div><span className="font-semibold text-[#044E3A]">Lead:</span> D{selectedLead}</div>
            <div><span className="font-semibold text-[#044E3A]">Grid:</span> {currentLat.toFixed(2)}°N, {currentLon.toFixed(2)}°E</div>
            <div><span className="font-semibold text-[#044E3A]">Domain:</span> {((24.5 <= currentLat && currentLat <= 28.5) && (80.0 <= currentLon && currentLon <= 84.5)) ? 'Eastern UP Pilot' : 'Outside Pilot'}</div>
          </div>
        </div>

        {/* Speech Error Banner if any */}
        {speechError && (
          <div className="mx-3.5 mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-[10.5px] text-amber-800 flex items-start justify-between gap-2">
            <div className="flex items-start gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>{speechError}</span>
            </div>
            <button onClick={resetSpeechError} className="text-amber-500 hover:text-amber-800 text-xs font-bold">×</button>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs bg-slate-50/50">
          {messages.map((m) => (
            <div key={m.id} className={`flex items-start gap-2 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.sender === 'bot' && (
                <div className="w-7 h-7 rounded-full bg-[#059669] text-white flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-xs mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                m.sender === 'user' 
                  ? 'bg-[#059669] text-white font-medium shadow-xs' 
                  : 'bg-white text-[#044E3A] border border-[#C8EAD9] shadow-xs'
              }`}>
                <div className="whitespace-pre-line">{m.text}</div>

                {/* Evidence Chips & TTS Listen Control */}
                <div className="mt-2 pt-2 border-t border-[#C8EAD9]/50 flex items-center justify-between flex-wrap gap-1">
                  {m.evidenceUsed && m.evidenceUsed.length > 0 ? (
                    <div className="flex flex-wrap gap-1 items-center text-[10px]">
                      <span className="font-bold text-[#059669] uppercase text-[9px]">Evidence:</span>
                      {m.evidenceUsed.map((ev, i) => (
                        <span key={i} className="bg-[#EAF8F3] text-[#047857] px-1.5 py-0.5 rounded border border-[#C8EAD9] font-semibold text-[9.5px]">
                          {ev}
                        </span>
                      ))}
                    </div>
                  ) : <div />}

                  {/* Listen / Stop TTS button for bot responses */}
                  {m.sender === 'bot' && isSpeechSynthesisSupported && (
                    <button
                      onClick={() => {
                        if (currentlySpeakingId === m.id) {
                          stopSpeaking();
                        } else {
                          speak(m.text, m.detectedLang || language, m.id);
                        }
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors flex items-center gap-1 ${
                        currentlySpeakingId === m.id
                          ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                          : 'bg-[#EEF9F4] text-[#047857] border-[#C8EAD9] hover:bg-[#C9EFE0]'
                      }`}
                      title={currentlySpeakingId === m.id ? 'Stop reading' : 'Listen to answer'}
                    >
                      {currentlySpeakingId === m.id ? (
                        <>
                          <VolumeX className="w-3 h-3" /> Stop
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3" /> Listen
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
              {m.sender === 'user' && (
                <div className="w-7 h-7 rounded-full bg-[#044E3A] text-white flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-xs mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
          {isSending && (
            <div className="flex items-center gap-2 text-xs text-[#059669] font-medium italic">
              <Bot className="w-4 h-4 animate-spin" /> Retrieving context & generating explanation...
            </div>
          )}
        </div>

        {/* Quick Questions & Voice/Input Footer */}
        <div className="p-3 bg-white border-t border-[#C8EAD9] space-y-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
            <span className="text-[#047857] font-extrabold uppercase flex items-center gap-1 text-[9.5px]">
              <Sparkles className="w-3 h-3 text-[#059669]" /> Suggested:
            </span>
            {getQuickQuestions().map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                disabled={isSending}
                className="bg-[#EEF9F4] hover:bg-[#C9EFE0] text-[#044E3A] px-2 py-0.5 rounded-md border border-[#C8EAD9] transition-colors font-medium text-[10.5px] disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            {/* Microphone Push-to-Talk Button */}
            {isSpeechRecognitionSupported ? (
              <button
                type="button"
                onClick={() => {
                  if (isListening) {
                    stopListening();
                  } else {
                    startListening(language);
                  }
                }}
                disabled={isSending}
                className={`p-2 rounded-lg font-bold transition-all flex items-center justify-center border shadow-xs ${
                  isListening
                    ? 'bg-red-500 text-white border-red-600 animate-pulse ring-2 ring-red-300'
                    : 'bg-[#EEF9F4] hover:bg-[#C9EFE0] text-[#047857] border-[#C8EAD9]'
                }`}
                title={isListening ? 'Stop listening' : 'Start speaking (voice input)'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-[#059669]" />}
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="p-2 rounded-lg bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                title="Voice input is not supported in this browser"
              >
                <MicOff className="w-4 h-4" />
              </button>
            )}

            <input
              type="text"
              placeholder={
                isListening
                  ? "Listening... speak your question"
                  : language === 'hi'
                  ? "प्रश्न पूछें..."
                  : language === 'hinglish'
                  ? "Puchhein..."
                  : "Ask FORTRESS Assistant..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isSending}
              className={`flex-1 border rounded-lg px-3 py-2 text-xs text-[#044E3A] focus:outline-none transition-colors ${
                isListening
                  ? 'bg-red-50/50 border-red-300 focus:border-red-500'
                  : 'bg-[#EEF9F4] border-[#C8EAD9] focus:border-[#059669]'
              }`}
            />
            
            <button
              type="submit"
              disabled={isSending || !input.trim()}
              className="bg-[#059669] hover:bg-[#047857] text-white font-bold p-2 rounded-lg transition-colors flex items-center justify-center shadow-xs disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Privacy Note */}
          <div className="flex items-center justify-between text-[9.5px] text-[#065F46] px-1 pt-1 border-t border-slate-100">
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-[#059669]" />
              Voice input uses browser speech capabilities. FORTRESS does not store microphone audio.
            </span>
          </div>
        </div>
      </div>
    </>
  );
};
