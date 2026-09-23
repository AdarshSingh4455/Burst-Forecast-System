import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { GridDetail, SelfAuditResponse, TrustHorizonResponse } from '../types';

interface SelfAuditViewProps {
  selfAudit?: SelfAuditResponse | null;
  trustHorizon?: TrustHorizonResponse | null;
  pointDetail?: GridDetail | null;
  selectedDetail?: GridDetail | null;
}

export const SelfAuditView: React.FC<SelfAuditViewProps> = ({
  selfAudit,
  trustHorizon,
  pointDetail,
  selectedDetail
}) => {
  const detail = pointDetail || selectedDetail;

  if (!detail) {
    return (
      <div className="p-8 text-center bg-slate-900 rounded-xl border border-slate-800 m-6">
        <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto mb-2" />
        <h3 className="font-bold text-slate-200">No Grid Point Selected</h3>
        <p className="text-xs text-slate-400 mt-1">Please select a grid point on the map to inspect Self-Audit diagnostic reasoning.</p>
      </div>
    );
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'SUPPORTED RELIABILITY': return 'bg-emerald-600/90 text-white border-emerald-500';
      case 'SUPPORTED WARNING': return 'bg-amber-600/90 text-white border-amber-500';
      case 'CONFLICT / POSSIBLE BLIND SPOT': return 'bg-rose-600/90 text-white border-rose-500';
      case 'EXPERT REVIEW': return 'bg-purple-600/90 text-white border-purple-500';
      default: return 'bg-slate-700 text-white border-slate-600';
    }
  };

  const supportingCount = selfAudit?.supporting_evidence_count ?? detail.supporting_evidence_count ?? 3;
  const contradictingCount = selfAudit?.contradicting_evidence_count ?? detail.contradicting_evidence_count ?? 1;

  return (
    <div className="p-6 space-y-6">
      <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-2xl shadow-xl flex items-center justify-between">
        <div>
          <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">PHASE 7 — AI SELF-AUDIT ENGINE</span>
          <h1 className="text-2xl font-extrabold mt-1">Multi-Stream Trust Verification Matrix</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Deterministically evaluates whether independent evidence streams support or contradict the main Bust Risk AI prediction without data leakage.
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400 block">Diagnostic Trust Index</span>
          <span className="text-3xl font-extrabold text-emerald-400 font-mono">{detail.trust_index} / 100</span>
        </div>
      </div>

      <div className={`p-6 rounded-2xl shadow-lg border ${getStatusBadgeClass(detail.self_audit_status)} flex items-center justify-between`}>
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-white/80">Self-Audit Final Classification</span>
          <h2 className="text-2xl font-black mt-0.5 tracking-wide">{detail.self_audit_status}</h2>
          <p className="text-xs mt-2 text-white/90 italic">"{detail.self_audit_reason}"</p>
        </div>
        <div className="text-right bg-slate-950/40 p-4 rounded-xl border border-white/20 backdrop-blur-sm">
          <span className="text-xs font-bold block text-slate-200 uppercase">Reliability Band</span>
          <span className="text-xl font-extrabold font-mono">{detail.reliability_band}</span>
        </div>
      </div>

      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-slate-200 border-b border-slate-800 pb-2">Evidence Stream Alignment Matrix</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <span className="font-semibold text-slate-400 uppercase">1. Bust Risk AI:</span>
            <p className="font-bold text-slate-100 text-sm font-mono">{detail.ai_risk_category} ({(detail.baseline_p_bust * 100).toFixed(1)}%)</p>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <span className="font-semibold text-slate-400 uppercase">2. Stress / FFD Evidence:</span>
            <p className="font-bold text-purple-400 text-sm font-mono">{detail.stress_evidence}</p>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <span className="font-semibold text-slate-400 uppercase">3. Historical Analogues:</span>
            <p className="font-bold text-slate-100 text-sm font-mono">{detail.analogue_available === 1 ? `${(detail.analogue_mean_bust_rate * 100).toFixed(0)}% Hist Bust` : 'No Prior History'}</p>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <span className="font-semibold text-slate-400 uppercase">4. Failure DNA Match:</span>
            <p className="font-bold text-purple-400 text-sm font-mono">{(detail.failure_dna_max_sim * 100).toFixed(0)}% Similarity</p>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <span className="font-semibold text-slate-400 uppercase">5. Ensemble Disagreement:</span>
            <p className="font-bold text-cyan-400 text-sm font-mono">{detail.ensemble_disagreement_category}</p>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <span className="font-semibold text-slate-400 uppercase">6. OOD / Novelty:</span>
            <p className="font-bold text-amber-400 text-sm font-mono">{detail.ood_category}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-3 text-xs">
          <h3 className="font-bold text-sm text-slate-200 border-b border-slate-800 pb-2">Sequence Level Horizon & Breaking Point</h3>
          <div className="flex justify-between items-center py-1 font-mono">
            <span className="text-slate-400">Sequence Trust Horizon:</span>
            <span className="font-bold text-emerald-400 text-sm">D1 – D{trustHorizon?.trust_horizon_day ?? detail.trust_horizon_day}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-t border-slate-800 font-mono">
            <span className="text-slate-400">Sequence Breaking Point:</span>
            <span className="font-bold text-rose-400 text-sm">
              {(trustHorizon?.breaking_point_day ?? detail.breaking_point_day) ? `Day D${trustHorizon?.breaking_point_day ?? detail.breaking_point_day}` : 'None Detected'}
            </span>
          </div>
          <div className="flex justify-between items-center py-1 border-t border-slate-800">
            <span className="text-slate-400">Supporting Votes:</span>
            <span className="font-bold text-emerald-400 font-mono">{supportingCount} Votes</span>
          </div>
          <div className="flex justify-between items-center py-1 border-t border-slate-800">
            <span className="text-slate-400">Contradicting Votes:</span>
            <span className="font-bold text-rose-400 font-mono">{contradictingCount} Votes</span>
          </div>
        </div>

        <div className="bg-amber-950/20 p-5 rounded-2xl border border-amber-800/40 text-xs text-amber-300 space-y-2">
          <h3 className="font-bold text-sm text-amber-400 border-b border-amber-800/40 pb-1">Blind Spot Conflict Warning</h3>
          <p>
            When Bust Risk AI predicts LOW risk but 2 or more independent evidence streams indicate elevated stress fragility or ensemble disagreement, FORTRESS flags a <strong>CONFLICT / POSSIBLE BLIND SPOT</strong> to prevent silent operational failure.
          </p>
          <p className="text-[11px] text-amber-400/80 italic">
            Conflict status measures AI/evidence disagreement, NOT confirmed forecast failure.
          </p>
        </div>
      </div>
    </div>
  );
};
