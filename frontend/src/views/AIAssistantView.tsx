import React, { useState } from 'react';
import { Bot, Send, User, Info, HelpCircle } from 'lucide-react';

export const AIAssistantView: React.FC = () => {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    { sender: 'bot', text: 'Hello! I am FORTRESS AI Assistant (Phase 10 Prototype). Ask me why bust risk is high, why FFD is fragile, or when reliability breaks down.' }
  ]);
  const [input, setInput] = useState('');

  const quickQuestions = [
    'Why is bust risk high in Eastern UP?',
    'Why is FFD small for D6?',
    'Why did Self-Audit flag conflict?',
    'When does reliability break down?'
  ];

  const handleSend = (textToSend?: string) => {
    const q = textToSend || input;
    if (!q.trim()) return;

    const userMsg = { sender: 'user' as const, text: q };
    let replyText = 'Phase 10 — AI Assistant integration pending. Full natural language generative model will be connected in Phase 10.';

    if (q.includes('bust risk')) {
      replyText = 'Bust risk is high in Eastern UP due to elevated moisture sensitivity (42% cells) and ensemble disagreement on D6–D8 lead days.';
    } else if (q.includes('FFD') || q.includes('fragile')) {
      replyText = 'FFD is 0.32 (fragile) because small moisture (+18%) and wind vector perturbations cross the bust risk failure threshold.';
    } else if (q.includes('conflict') || q.includes('Self-Audit')) {
      replyText = 'Self-Audit flagged SUPPORTED WARNING because AI Bust Risk (62%) is strongly supported by high ensemble spread and historical analogue bust rates (25%).';
    } else if (q.includes('break') || q.includes('horizon')) {
      replyText = 'Forecast reliability undergoes sustained RED degradation starting at Day 6 (Breaking Point: D6). Trust Horizon is D1–D5.';
    }

    const botMsg = { sender: 'bot' as const, text: replyText };

    setMessages(prev => [...prev, userMsg, botMsg]);
    if (!textToSend) setInput('');
  };

  return (
    <div className="h-full w-full overflow-y-auto p-4 space-y-4 bg-[#F5FAF8] text-[#102A2A] select-none flex flex-col justify-between">
      {/* Header */}
      <div className="bg-white border border-[#D2E5DF] rounded-xl p-4 shadow-xs flex items-center justify-between flex-shrink-0">
        <div>
          <span className="text-[10px] font-extrabold text-[#00A878] uppercase tracking-wider">PHASE 10 — NATURAL LANGUAGE ASSISTANT</span>
          <h1 className="text-xl font-extrabold text-[#102A2A] mt-0.5 tracking-tight flex items-center gap-2">
            <Bot className="w-5 h-5 text-[#00A878]" />
            AI Assistant
          </h1>
          <p className="text-xs text-[#617874] mt-0.5 font-medium">
            Natural-language audit assistant explaining model fragility, failure corridors, and self-audit verdicts.
          </p>
        </div>

        <div className="bg-[#EAF8F3] border border-[#BDEADB] px-3 py-1.5 rounded-lg text-xs font-bold text-[#005C4B]">
          Phase 10 Prototype
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 bg-white border border-[#D2E5DF] rounded-xl p-4 shadow-xs flex flex-col justify-between overflow-hidden min-h-[360px]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 text-xs">
          {messages.map((m, i) => (
            <div key={i} className={`flex items-start gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.sender === 'bot' && (
                <div className="w-7 h-7 rounded-full bg-[#003B32] text-white flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div className={`p-3 rounded-xl max-w-[80%] leading-relaxed ${
                m.sender === 'user' ? 'bg-[#00A878] text-white font-medium' : 'bg-[#F5FAF8] text-[#102A2A] border border-[#D2E5DF]'
              }`}>
                {m.text}
              </div>
              {m.sender === 'user' && (
                <div className="w-7 h-7 rounded-full bg-[#102A2A] text-white flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Quick Questions & Input */}
        <div className="pt-3 border-t border-[#D2E5DF] space-y-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
            <span className="text-[#617874] font-bold text-[10px] uppercase">Quick Questions:</span>
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="bg-[#EAF8F3] hover:bg-[#BDEADB] text-[#005C4B] px-2.5 py-1 rounded-md border border-[#BDEADB] transition-colors font-medium text-[11px]"
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
            <input
              type="text"
              placeholder="Ask FORTRESS AI Assistant about forecast reliability, FFD, or audit verdicts..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-[#F5FAF8] border border-[#D2E5DF] rounded-lg px-3 py-2 text-xs text-[#102A2A] focus:outline-none focus:border-[#00A878]"
            />
            <button
              type="submit"
              className="bg-[#00A878] hover:bg-[#005C4B] text-white font-bold p-2 rounded-lg transition-colors flex items-center justify-center shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
