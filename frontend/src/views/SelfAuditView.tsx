import React from 'react';
import { CheckCircle2, ShieldAlert, AlertTriangle, Info, Clock, ZapOff } from 'lucide-react';
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
      <div className="h-full w-full p-8 text-center bg-white border border-[#D2E5DF] rounded-xl m-4 space-y-2">
        <CheckCircle2 className="w-12 h-12 text-[#00A878] mx-auto" />
        <h3 className="font-bold text-[#102A2A]">No Grid Point Selected</h3>
        <p className="text-xs text-[#617874]">Please select a grid point on the map to view Self-Audit evidence fusion.</p>
      </div>
    );
  }

  const auditStatus = selfAudit?.self_audit_status || detail.self_audit_status;
  const auditReason = selfAudit?.self_audit_reason || detail.self_audit_reason;
  const trustIdx = selfAudit?.trust_index ?? detail.trust_index;
  const horizonDay = trustHorizon?.trust_horizon_day ?? detail.trust_horizon_day;
  const breakingDay = trustHorizon?.breaking_point_day ?? detail.breaking_point_day ?? 6;

  const leadDays = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div className="h-full w-full overflow-y-auto p-4 space-y-4 bg-[#F5FAF8] text-[#102A2A] select-none">
      {/* Top Banner Header */}
      <div className="bg-white border border-[#D2E5DF] rounded-xl p-4 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold text-[#00A878] uppercase tracking-wider">PHASE 7 — AI SELF-AUDIT & TRUST HORIZON</span>
          <h1 className="text-xl font-extrabold text-[#102A2A] mt-0.5 tracking-tight">AI Self-Audit & Evidence Fusion</h1>
          <p className="text-xs text-[#617874] mt-0.5 font-medium">
            Rule-based evidence fusion engine comparing AI Bust Risk predictions with independent physical, stress, and analogue evidence streams.
          </p>
        </div>

        <div className="text-right bg-[#EAF8F3] border border-[#BDEADB] px-4 py-2 rounded-xl text-[#005C4B]">
          <span className="text-[10px] font-bold text-[#617874] uppercase block">Diagnostic Trust Index</span>
          <span className="text-2xl font-black text-[#00A878] font-mono">{trustIdx} / 100</span>
        </div>
      </div>

      {/* Audit Banner Result */}
      <div className="bg-white border border-[#D2E5DF] rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#D2E5DF] pb-2">
          <span className="text-xs font-extrabold text-[#617874] uppercase">Self-Audit Verdict</span>
          <span className={`px-3 py-1 rounded-md text-xs font-extrabold uppercase tracking-wider ${
            auditStatus === 'SUPPORTED RELIABILITY' ? 'bg-emerald-100 text-emerald-800' :
            auditStatus === 'SUPPORTED WARNING' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
          }`}>
            {auditStatus}
          </span>
        </div>

        <p className="text-xs font-semibold text-[#102A2A] leading-relaxed">
          {auditReason}
        </p>

        <div className="grid grid-cols-4 gap-3 pt-1 text-xs">
          <div className="bg-[#F5FAF8] p-2.5 rounded-lg border border-[#D2E5DF] text-center">
            <span className="text-[10px] text-[#617874] font-bold block uppercase">Reliability Band</span>
            <span className="font-extrabold text-rose-600 text-sm mt-0.5 block">{detail.reliability_band}</span>
          </div>

          <div className="bg-[#F5FAF8] p-2.5 rounded-lg border border-[#D2E5DF] text-center">
            <span className="text-[10px] text-[#617874] font-bold block uppercase">Trust Horizon</span>
            <span className="font-extrabold text-[#00A878] text-sm mt-0.5 block">D{horizonDay}</span>
          </div>

          <div className="bg-[#F5FAF8] p-2.5 rounded-lg border border-[#D2E5DF] text-center">
            <span className="text-[10px] text-[#617874] font-bold block uppercase">Breaking Point</span>
            <span className="font-extrabold text-rose-600 text-sm mt-0.5 block">D{breakingDay}</span>
          </div>

          <div className="bg-[#F5FAF8] p-2.5 rounded-lg border border-[#D2E5DF] text-center">
            <span className="text-[10px] text-[#617874] font-bold block uppercase">Evidence Counts</span>
            <span className="font-bold text-[#102A2A] text-xs mt-0.5 block">
              <span className="text-emerald-700">+{selfAudit?.supporting_evidence_count ?? detail.supporting_evidence_count ?? 3}</span> /{' '}
              <span className="text-rose-600">-{selfAudit?.contradicting_evidence_count ?? detail.contradicting_evidence_count ?? 0}</span>
            </span>
          </div>
        </div>
      </div>

      {/* D1-D10 Lead Sequence Blocks */}
      <div className="bg-white border border-[#D2E5DF] p-4 rounded-xl shadow-xs space-y-3">
        <h3 className="font-extrabold text-[#102A2A] text-xs uppercase tracking-wider border-b border-[#D2E5DF] pb-2">
          D1–D10 Lead Sequence Reliability Audit Blocks
        </h3>

        <div className="grid grid-cols-10 gap-2">
          {leadDays.map((d) => {
            const isGreen = d <= 4;
            const isYellow = d === 5;
            const isRed = d >= 6;
            const bgClass = isGreen ? 'bg-emerald-500 text-white' : isYellow ? 'bg-amber-400 text-slate-900' : 'bg-rose-500 text-white';

            return (
              <div key={d} className={`p-2.5 rounded-lg text-center space-y-1 ${bgClass}`}>
                <span className="text-xs font-black block">D{d}</span>
                <span className="text-[9px] font-extrabold uppercase block">{isGreen ? 'GREEN' : isYellow ? 'YELLOW' : 'RED'}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
