import React from 'react';
import { Waves, Sprout, AlertTriangle, Zap, Clock } from 'lucide-react';
import { GridDetail } from '../types';

interface DecisionSupportViewProps {
  type?: 'reservoir' | 'agriculture' | 'disaster' | 'grid';
  selectedDetail?: GridDetail | null;
}

export const DecisionSupportView: React.FC<DecisionSupportViewProps> = ({ type = 'reservoir', selectedDetail }) => {
  const configs = {
    reservoir: {
      title: 'Dam & Reservoir Operational Support',
      icon: Waves,
      color: 'bg-cyan-600',
      domainNote: 'Gate opening & inflow forecast reliability.'
    },
    agriculture: {
      title: 'Agricultural Climate Resilience',
      icon: Sprout,
      color: 'bg-emerald-600',
      domainNote: 'Monsoon sowing & irrigation risk mitigation.'
    },
    disaster: {
      title: 'Disaster Management & Flood Warning',
      icon: AlertTriangle,
      color: 'bg-rose-600',
      domainNote: 'Emergency response & flood vulnerability mitigation.'
    },
    grid: {
      title: 'Renewable Power Grid Management',
      icon: Zap,
      color: 'bg-amber-600',
      domainNote: 'Solar/wind ramp rate & hydro-power forecast reliability.'
    }
  };

  const cfg = configs[type];
  const Icon = cfg.icon;

  return (
    <div className="p-6 space-y-6">
      <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-2xl shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
            <Icon className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">PHASE 9 — DECISION-SUPPORT EXTENSIONS (SHELL)</span>
            <h1 className="text-2xl font-extrabold mt-0.5">{cfg.title}</h1>
            <p className="text-xs text-slate-400 mt-1">{cfg.domainNote}</p>
          </div>
        </div>
      </div>

      {selectedDetail ? (
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-200 border-b border-slate-800 pb-2">Current Grid Reliability Context</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 font-semibold uppercase">Bust Risk:</span>
              <p className="text-lg font-bold text-red-400 mt-1">{(selectedDetail.baseline_p_bust * 100).toFixed(1)}%</p>
              <span className="text-[10px] text-slate-400 font-bold">{selectedDetail.ai_risk_category}</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 font-semibold uppercase">Stress FFD:</span>
              <p className="text-lg font-bold text-purple-400 mt-1">{selectedDetail.ffd.toFixed(2)}</p>
              <span className="text-[10px] text-slate-400 font-bold">{selectedDetail.fragility_category}</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 font-semibold uppercase">Trust Horizon:</span>
              <p className="text-lg font-bold text-emerald-400 mt-1">D1 – D{selectedDetail.trust_horizon_day}</p>
              <span className="text-[10px] text-rose-400 font-bold">Breaking: {selectedDetail.breaking_point_day ? `Day D${selectedDetail.breaking_point_day}` : 'None'}</span>
            </div>
          </div>

          <div className="bg-slate-950 text-white p-4 rounded-xl space-y-1 border border-slate-800">
            <span className="text-xs text-emerald-400 font-bold uppercase">Self-Audit Status:</span>
            <p className="text-lg font-bold font-mono">{selectedDetail.self_audit_status}</p>
            <p className="text-xs text-slate-400 italic">"{selectedDetail.self_audit_reason}"</p>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm text-center text-xs text-slate-400">
          Select a grid point on the map to view operational reliability context.
        </div>
      )}

      <div className="bg-amber-950/20 p-6 rounded-2xl border border-amber-800/40 text-amber-300 space-y-2">
        <div className="flex items-center gap-2 font-bold text-sm text-amber-400">
          <Clock className="w-5 h-5 text-amber-400" />
          <span>Domain-Specific Recommendation Engine Integration</span>
        </div>
        <p className="text-xs text-amber-200">
          Domain-specific operational decision recommendation engines (e.g. dam gate release protocols, crop irrigation prescriptions, emergency evacuation alerts, and power ramp schedules) will be integrated in <strong>Phase 9</strong>.
        </p>
        <p className="text-[11px] text-amber-400/80 italic">
          Decision-support information — not an official weather warning.
        </p>
      </div>
    </div>
  );
};
