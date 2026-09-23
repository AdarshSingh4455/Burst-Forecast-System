import React from 'react';
import { Bot, Sparkles, MessageSquare, AlertCircle } from 'lucide-react';

export const AIAssistantView: React.FC = () => {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center space-x-3 mb-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <Bot className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              AI Forecast Audit Assistant
              <span className="text-xs bg-slate-800 text-amber-400 border border-amber-500/30 px-2 text-xs py-0.5 rounded font-mono">
                Phase 10 Preview
              </span>
            </h1>
            <p className="text-sm text-slate-400">
              Interactive natural-language query interface for forecast risk intelligence & diagnostics
            </p>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-start space-x-3 text-amber-300 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Phase 10 Shell Notice</p>
            <p className="text-amber-200/80 text-xs mt-1">
              Natural language conversational audit capabilities will be activated in Phase 10. All raw telemetry, failure corridors, and self-audit flags are currently accessible via the interactive tabs above.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl space-y-2">
          <div className="flex items-center space-x-2 text-slate-300 font-semibold text-sm">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Query Diagnostics</span>
          </div>
          <p className="text-xs text-slate-400">
            Ask queries like "What driven instability is causing busts in Gorakhpur for Day 5?"
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl space-y-2">
          <div className="flex items-center space-x-2 text-slate-300 font-semibold text-sm">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <span>Explainable Failure Corridors</span>
          </div>
          <p className="text-xs text-slate-400">
            Synthesize K-Means failure corridor physics with regional shear & CAPE anomalies.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl space-y-2">
          <div className="flex items-center space-x-2 text-slate-300 font-semibold text-sm">
            <Bot className="w-4 h-4 text-purple-400" />
            <span>Automated Audit Reports</span>
          </div>
          <p className="text-xs text-slate-400">
            Generate executive reliability passports and audit summaries on demand.
          </p>
        </div>
      </div>

      {/* Mock Chat Window */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col h-[350px]">
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Conversation Terminal</span>
          <span className="text-xs text-slate-500 font-mono">Status: Standby</span>
        </div>
        <div className="flex-1 p-4 overflow-y-auto space-y-3 font-mono text-xs">
          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50 max-w-xl text-slate-300">
            <span className="text-emerald-400 font-semibold">FORTRESS AI: </span>
            Welcome to FORTRESS Failure Intelligence. Phase 1–7 self-audit pipeline is online. How can I assist with your forecast audit today?
          </div>
        </div>
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex space-x-2">
          <input
            type="text"
            disabled
            placeholder="AI Assistant chat available in Phase 10... Use active tabs for full telemetry."
            className="flex-1 bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-500 cursor-not-allowed focus:outline-none"
          />
          <button disabled className="bg-slate-800 text-slate-500 text-xs px-4 py-2 rounded font-semibold cursor-not-allowed">
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
