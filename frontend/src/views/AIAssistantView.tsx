import React, { useState, useEffect } from 'react';
import { Bot, Send, User, Sparkles, Trash2, Globe, CheckCircle2, Mic, MicOff, Volume2, VolumeX, Shield, AlertCircle } from 'lucide-react';
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

interface AIAssistantViewProps {
  pointDetail?: GridPointDetail | null;
  selectedRun?: string;
  selectedLead?: number;
  selectedLat?: number | null;
  selectedLon?: number | null;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  pointDetail,
  selectedRun = '2019-07-01 00:00:00',
  selectedLead = 5,
  selectedLat = 26.75,
  selectedLon = 83.37
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

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      cancelListening();
    };
  }, [stopSpeaking, cancelListening]);

  const currentLat = pointDetail ? pointDetail.latitude : (selectedLat ?? 26.75);
  const currentLon = pointDetail ? pointDetail.longitude : (selectedLon ?? 83.37);

  const quickQuestions = [
    'Why is this forecast risky?',
    'How reliable is D5?',
    'Why is FFD small?',
    'Why did Self-Audit flag this?',
    'When does reliability deteriorate?',
    'What does 10 m wind mean?',
    'Does this rainfall mean flooding?'
  ];

  const handleSend = async (textToSend?: string) => {
    const q = textToSend || input;
    if (!q.trim() || isSending) return;

    if (isListening) {
      stopListening();
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsSending(true);

    try {
      const resp = await postAssistantExplain({
        message: q,
        language: language,
        forecastInit: selectedRun,
        leadDay: selectedLead,
        latitude: currentLat,
        longitude: currentLon,
        activeView: 'AI Assistant View'
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

      if (autoSpeak && isSpeechSynthesisSupported) {
        speak(resp.answer, resp.detected_language, botMsgId);
      }
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: `Error connecting to explanation engine: ${err?.message || 'Server unavailable'}.`,
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

  return (
    <div className="h-full w-full overflow-hidden p-4 space-y-3 bg-[#F5FAF8] text-[#102A2A] select-none flex flex-col justify-between">
      {/* Header Bar */}
      <div className="bg-white border border-[#D2E5DF] rounded-xl p-3.5 shadow-xs flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00A878] text-white flex items-center justify-center shadow-xs">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-[#00A878] uppercase tracking-wider">CONTEXT-GROUNDED VOICE & MULTILINGUAL ENGINE</span>
            <h1 className="text-lg font-extrabold text-[#102A2A] mt-0.5 tracking-tight flex items-center gap-2">
              FORTRESS Explanation Assistant — Phase 10B Voice
            </h1>
            <p className="text-xs text-[#617874] mt-0.5 font-medium">
              Multilingual context-grounded forecast reliability explanation with browser-native speech input & synthesis.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Language Control */}
          <div className="flex items-center gap-1 bg-[#EAF8F3] p-1 rounded-lg border border-[#BDEADB]">
            <Globe className="w-4 h-4 text-[#005C4B] ml-1" />
            <span className="text-xs font-bold text-[#005C4B] mr-1">Lang:</span>
            {(['auto', 'en', 'hi', 'hinglish'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                  language === lang
                    ? 'bg-[#00A878] text-white shadow-xs'
                    : 'text-[#005C4B] hover:bg-[#BDEADB]'
                }`}
              >
                {lang === 'auto' ? 'Auto' : lang === 'en' ? 'English' : lang === 'hi' ? 'हिन्दी' : 'Hinglish'}
              </button>
            ))}
          </div>

          {/* Auto Speak Toggle */}
          {isSpeechSynthesisSupported && (
            <button
              onClick={toggleAutoSpeak}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                autoSpeak
                  ? 'bg-[#00A878] text-white border-[#00A878]'
                  : 'bg-white text-[#005C4B] border-[#BDEADB] hover:bg-[#EAF8F3]'
              }`}
              title="Toggle automatic voice playback for bot answers"
            >
              <Volume2 className="w-4 h-4" />
              <span>{autoSpeak ? 'Auto-Speak ON' : 'Auto-Speak OFF'}</span>
            </button>
          )}

          <button
            onClick={clearChat}
            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-colors"
            title="Clear Chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 bg-white border border-[#D2E5DF] rounded-xl p-4 shadow-xs flex flex-col justify-between overflow-hidden min-h-[380px]">
        
        {/* Context Card Bar */}
        <div className="bg-[#EAF8F3] border border-[#BDEADB] rounded-lg p-2.5 mb-2 flex items-center justify-between text-xs text-[#005C4B]">
          <div className="flex items-center gap-4 font-semibold">
            <span className="font-extrabold uppercase text-[10px] text-[#00A878] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> CURRENT TARGET:
            </span>
            <span><strong className="text-[#102A2A]">Run:</strong> {selectedRun.split(' ')[0]}</span>
            <span><strong className="text-[#102A2A]">Lead:</strong> D{selectedLead}</span>
            <span><strong className="text-[#102A2A]">Grid:</strong> {currentLat.toFixed(2)}°N, {currentLon.toFixed(2)}°E</span>
          </div>
          <span className="text-[11px] font-bold bg-[#BDEADB] px-2 py-0.5 rounded text-[#003B32]">
            {((24.5 <= currentLat && currentLat <= 28.5) && (80.0 <= currentLon && currentLon <= 84.5)) ? 'Eastern UP Pilot' : 'Outside Pilot'}
          </span>
        </div>

        {/* Speech Error Banner if any */}
        {speechError && (
          <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start justify-between gap-2">
            <div className="flex items-start gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>{speechError}</span>
            </div>
            <button onClick={resetSpeechError} className="text-amber-500 hover:text-amber-800 text-xs font-bold">×</button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 text-xs">
          {messages.map((m) => (
            <div key={m.id} className={`flex items-start gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.sender === 'bot' && (
                <div className="w-7 h-7 rounded-full bg-[#003B32] text-white flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-xs mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div className={`p-3 rounded-xl max-w-[80%] leading-relaxed ${
                m.sender === 'user' ? 'bg-[#00A878] text-white font-medium shadow-xs' : 'bg-[#F5FAF8] text-[#102A2A] border border-[#D2E5DF]'
              }`}>
                <div className="whitespace-pre-line">{m.text}</div>

                <div className="mt-2 pt-2 border-t border-[#D2E5DF]/60 flex items-center justify-between flex-wrap gap-1">
                  {m.evidenceUsed && m.evidenceUsed.length > 0 ? (
                    <div className="flex flex-wrap gap-1 items-center text-[10px]">
                      <span className="font-bold text-[#00A878] uppercase text-[9px]">Evidence Used:</span>
                      {m.evidenceUsed.map((ev, i) => (
                        <span key={i} className="bg-[#EAF8F3] text-[#005C4B] px-1.5 py-0.5 rounded border border-[#BDEADB] font-semibold text-[9.5px]">
                          {ev}
                        </span>
                      ))}
                    </div>
                  ) : <div />}

                  {/* Listen / Stop TTS button */}
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
                          : 'bg-[#EAF8F3] text-[#005C4B] border-[#BDEADB] hover:bg-[#BDEADB]'
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
                <div className="w-7 h-7 rounded-full bg-[#102A2A] text-white flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-xs mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
          {isSending && (
            <div className="flex items-center gap-2 text-xs text-[#00A878] font-medium italic">
              <Bot className="w-4 h-4 animate-spin" /> Querying FORTRESS backend services & generating grounded explanation...
            </div>
          )}
        </div>

        {/* Footer Input Area */}
        <div className="pt-3 border-t border-[#D2E5DF] space-y-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
            <span className="text-[#617874] font-bold text-[10px] uppercase flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#00A878]" /> Suggested Prompts:
            </span>
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                disabled={isSending}
                className="bg-[#EAF8F3] hover:bg-[#BDEADB] text-[#005C4B] px-2.5 py-1 rounded-md border border-[#BDEADB] transition-colors font-medium text-[11px] disabled:opacity-50"
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
            {/* Microphone Button */}
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
                    : 'bg-[#EAF8F3] hover:bg-[#BDEADB] text-[#005C4B] border-[#BDEADB]'
                }`}
                title={isListening ? 'Stop listening' : 'Start speaking (voice input)'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-[#00A878]" />}
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
                  : "Ask FORTRESS Explanation Assistant..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isSending}
              className={`flex-1 border rounded-lg px-3 py-2 text-xs text-[#102A2A] focus:outline-none transition-colors ${
                isListening
                  ? 'bg-red-50/50 border-red-300 focus:border-red-500'
                  : 'bg-[#F5FAF8] border-[#D2E5DF] focus:border-[#00A878]'
              }`}
            />
            
            <button
              type="submit"
              disabled={isSending || !input.trim()}
              className="bg-[#00A878] hover:bg-[#005C4B] text-white font-bold p-2 rounded-lg transition-colors flex items-center justify-center shadow-xs disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Privacy Note */}
          <div className="flex items-center justify-between text-[9.5px] text-[#617874] px-1 pt-1 border-t border-slate-100">
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-[#00A878]" />
              Voice input uses browser speech capabilities. FORTRESS does not store microphone audio.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
