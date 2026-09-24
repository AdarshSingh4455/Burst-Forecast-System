import React, { useState } from 'react';
import { Bot, Send, User } from 'lucide-react';
import { GridPointDetail } from '../types';

interface AIAssistantViewProps {
  pointDetail?: GridPointDetail | null;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({ pointDetail }) => {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    { 
      sender: 'bot', 
      text: `Hello! I am FORTRESS Explanation Assistant — Prototype. Ask me why the current point (${pointDetail ? `${pointDetail.latitude.toFixed(2)}°N, ${pointDetail.longitude.toFixed(2)}°E` : 'Selected Grid Point'}) is risky, why FFD is small, or why Self-Audit flagged this.` 
    }
  ]);
  const [input, setInput] = useState('');

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
    if (qLower.includes('official') || qLower.includes('warning') || qLower.includes('flood warning') || qLower.includes('evacuation')) {
      replyText = 'No. FORTRESS provides forecast-reliability and decision-support context. It does not issue official flood, evacuation, or emergency-management warnings. Official IMD/CWC/NDMA warnings remain authoritative.';
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
          <span className="text-[10px] font-extrabold text-[#00A878] uppercase tracking-wider">EXPLANATION ASSISTANT</span>
          <h1 className="text-xl font-extrabold text-[#102A2A] mt-0.5 tracking-tight flex items-center gap-2">
            <Bot className="w-5 h-5 text-[#00A878]" />
            FORTRESS Explanation Assistant — Prototype
          </h1>
          <p className="text-xs text-[#617874] mt-0.5 font-medium">
            Prototype rule-based explanation assistant for current grid point telemetry ({pointDetail ? `${pointDetail.latitude.toFixed(2)}°N, ${pointDetail.longitude.toFixed(2)}°E` : 'Selected Grid Point'}).
          </p>
        </div>

        <div className="bg-[#EAF8F3] border border-[#BDEADB] px-3 py-1.5 rounded-lg text-xs font-bold text-[#005C4B]">
          FORTRESS Explanation Assistant — Prototype
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
              placeholder="Ask FORTRESS Explanation Assistant about current point bust risk or FFD..."
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
