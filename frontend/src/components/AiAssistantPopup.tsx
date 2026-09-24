import React, { useState } from 'react';
import { Bot, Send, User, X, Sparkles } from 'lucide-react';
import { GridPointDetail } from '../types';

interface AiAssistantPopupProps {
  isOpen: boolean;
  onClose: () => void;
  pointDetail?: GridPointDetail | null;
}

export const AiAssistantPopup: React.FC<AiAssistantPopupProps> = ({ isOpen, onClose, pointDetail }) => {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    { 
      sender: 'bot', 
      text: `Hello! I am FORTRESS AI Assistant. Ask me about current grid point telemetry (${pointDetail ? `${pointDetail.latitude.toFixed(2)}°N, ${pointDetail.longitude.toFixed(2)}°E` : 'Selected Grid Point'}), bust risk, FFD, or self-audit verdicts.` 
    }
  ]);
  const [input, setInput] = useState('');

  if (!isOpen) return null;

  const quickQuestions = [
    'Why is this forecast risky?',
    'Why is FFD small?',
    'Why did Self-Audit flag this?',
    'When does reliability deteriorate?'
  ];

  const handleSend = (textToSend?: string) => {
    const q = textToSend || input;
    if (!q.trim()) return;

    const userMsg = { sender: 'user' as const, text: q };
    
    const latStr = pointDetail ? `${pointDetail.latitude.toFixed(2)}°N, ${pointDetail.longitude.toFixed(2)}°E` : 'selected grid point';
    const bustRiskPct = pointDetail ? (pointDetail.baseline_p_bust * 100).toFixed(0) : '62';
    const ffdVal = pointDetail ? (pointDetail.ffd_failure_found === 0 ? 'No boundary' : pointDetail.ffd.toFixed(2)) : '0.32';
    const auditStatus = pointDetail ? pointDetail.self_audit_status : 'SUPPORTED WARNING';
    const auditReason = pointDetail ? pointDetail.self_audit_reason : 'Ensemble disagreement exceeding 0.45 threshold';
    const horizonDay = pointDetail ? pointDetail.trust_horizon_day : 5;
    const breakingDay = pointDetail ? (pointDetail.breaking_point_day ?? 6) : 6;

    let replyText = 'FORTRESS Explanation Assistant — Prototype: Model explanation rule executed.';

    const qLower = q.toLowerCase();
    if (qLower.includes('mw') || qLower.includes('power generation') || qLower.includes('exact mw') || qLower.includes('generation forecast')) {
      replyText = 'No. Phase 9D provides weather-reliability and planning context. It does not provide validated plant-level MW generation forecasts or automatic grid-dispatch instructions.';
    } else if (qLower.includes('solar') || qLower.includes('irradiance') || qLower.includes('solar generation')) {
      replyText = 'Solar generation diagnostic is unavailable because validated surface solar irradiance input is not integrated in the current prototype.';
    } else if (qLower.includes('official') || qLower.includes('warning') || qLower.includes('flood warning') || qLower.includes('evacuation') || qLower.includes('dispatch')) {
      replyText = 'No. FORTRESS provides forecast-reliability and decision-support context. It does not issue official flood, evacuation, emergency-management warnings, or grid-dispatch instructions. Official load-dispatch center (SLDC/RLDC) instructions remain authoritative.';
    } else if (qLower.includes('outside pilot') || qLower.includes('outside')) {
      replyText = 'FORTRESS reliability analysis is unavailable outside the current Eastern UP pilot coverage (24.5–28.5°N, 80.0–84.5°E). Grid snapping and reliability metrics are strictly suppressed for outside-pilot locations.';
    } else if (q.includes('risky')) {
      replyText = `Forecast at ${latStr} has a Bust Risk of ${bustRiskPct}% (${pointDetail?.ai_risk_category || 'High Risk'}). This risk is driven by ${pointDetail?.primary_vulnerability || 'elevated specific humidity sensitivity'} and high ensemble spread on D${pointDetail?.lead_day || 5}.`;
    } else if (q.includes('FFD') || q.includes('small')) {
      replyText = `FFD at ${latStr} is ${ffdVal} (${pointDetail?.fragility_category || 'Fragile'}). This indicates small perturbation perturbations (+1.2°C temp / +15% moisture) push model forecasts across the bust risk failure threshold.`;
    } else if (q.includes('Self-Audit') || q.includes('flag')) {
      replyText = `Self-Audit verdict for ${latStr} is ${auditStatus}. Explanation: ${auditReason}. Trust Index is ${pointDetail?.trust_index || 78}/100.`;
    } else if (q.includes('deteriorate') || q.includes('when')) {
      replyText = `Forecast reliability remains usable up to Trust Horizon D${horizonDay}. Reliability deteriorates into sustained RED starting at Day ${breakingDay} (Breaking Point: D${breakingDay}).`;
    } else if (qLower.includes('disaster') || qLower.includes('preparedness')) {
      replyText = `Disaster preparedness context synthesizes weather forecast signals with local vulnerability/exposure attributes under 3-dimension separation. Prototype statuses include NORMAL_MONITORING, PREPAREDNESS_REVIEW, HEIGHTENED_PREPAREDNESS, and HIGH_UNCERTAINTY_EXPERT_REVIEW.`;
    } else if (qLower.includes('renewable') || qLower.includes('grid')) {
      replyText = `Renewable grid decision support evaluates 10m wind speed diagnostics and forecast reliability evidence for grid planning context. Prototype statuses include NORMAL_MONITORING, GENERATION_VARIABILITY_REVIEW, GRID_PREPAREDNESS_REVIEW, and HIGH_UNCERTAINTY_EXPERT_REVIEW.`;
    }


    const botMsg = { sender: 'bot' as const, text: replyText };

    setMessages(prev => [...prev, userMsg, botMsg]);
    if (!textToSend) setInput('');
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[9998] transition-opacity"
      />

      {/* Side Slide-Over Pop-Up Drawer */}
      <div className="fixed top-0 right-0 h-full w-[410px] max-w-[95vw] bg-white border-l border-[#C8EAD9] shadow-2xl z-[9999] flex flex-col flex-shrink-0 select-none animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 bg-[#F4FAF6] border-b border-[#C8EAD9] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#059669] text-white flex items-center justify-center shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-[#044E3A] text-sm flex items-center gap-1.5">
                FORTRESS AI Assistant
                <span className="text-[9px] bg-[#D4F0E2] text-[#047857] px-1.5 py-0.5 rounded font-extrabold">Side Popup</span>
              </h2>
              <p className="text-[10px] text-[#065F46] font-medium">
                Target: <span className="font-bold text-[#044E3A]">{pointDetail ? `${pointDetail.latitude.toFixed(2)}°N, ${pointDetail.longitude.toFixed(2)}°E` : 'Selected Grid Point'}</span>
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#044E3A] hover:bg-[#E2F5EC] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Container */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#EEF9F4] text-xs">
          {messages.map((m, i) => (
            <div key={i} className={`flex items-start gap-2 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.sender === 'bot' && (
                <div className="w-7 h-7 rounded-full bg-[#059669] text-white flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div className={`p-3 rounded-2xl max-w-[82%] leading-relaxed ${
                m.sender === 'user' ? 'bg-[#059669] text-white font-medium shadow-xs' : 'bg-white text-[#044E3A] border border-[#C8EAD9] shadow-xs'
              }`}>
                {m.text}
              </div>
              {m.sender === 'user' && (
                <div className="w-7 h-7 rounded-full bg-[#044E3A] text-white flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Quick Questions & Input Footer */}
        <div className="p-3 bg-white border-t border-[#C8EAD9] space-y-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
            <span className="text-[#047857] font-extrabold uppercase flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#059669]" /> Quick Prompts:
            </span>
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="bg-[#EEF9F4] hover:bg-[#C9EFE0] text-[#044E3A] px-2 py-0.5 rounded-md border border-[#C8EAD9] transition-colors font-medium text-[10.5px]"
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
              placeholder="Ask AI Assistant..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-[#EEF9F4] border border-[#C8EAD9] rounded-lg px-3 py-2 text-xs text-[#044E3A] focus:outline-none focus:border-[#059669]"
            />
            <button
              type="submit"
              className="bg-[#059669] hover:bg-[#047857] text-white font-bold p-2 rounded-lg transition-colors flex items-center justify-center shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
};
