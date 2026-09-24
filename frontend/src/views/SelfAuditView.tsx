import React from 'react';
import { CheckCircle2, ShieldAlert, AlertTriangle } from 'lucide-react';
import { SelfAuditResponse, TrustHorizonResponse, GridPointDetail } from '../types';

interface SelfAuditViewProps {
  selfAudit: SelfAuditResponse | null;
  trustHorizon: TrustHorizonResponse | null;
  pointDetail: GridPointDetail | null;
}

export const SelfAuditView: React.FC<SelfAuditViewProps> = ({ selfAudit, pointDetail }) => {
  const status = pointDetail?.self_audit_status || selfAudit?.self_audit_status || 'SUPPORTED WARNING';
  const reason = pointDetail?.self_audit_reason || selfAudit?.self_audit_reason || 'Ensemble disagreement exceeding 0.45 threshold';
  const score = pointDetail?.trust_index || selfAudit?.trust_index || 78;

  return (
    <div className="h-full w-full overflow-y-auto p-4 space-y-4 bg-[#EEF9F4] text-[#033A2B] select-none">
      {/* Top Ultra Light Green Banner Header */}
      <div className="bg-[#F4FAF6] border border-[#C8EAD9] rounded-xl p-4 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold text-[#059669] uppercase tracking-wider">SELF-AUDIT ENGINE // AUTOMATED VERDICT</span>
          <h1 className="text-xl font-extrabold text-[#044E3A] mt-0.5 tracking-tight flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#059669]" />
            Self-Audit Verdict & Reasoning
          </h1>
          <p className="text-xs text-[#065F46] mt-0.5 font-medium">
            Automated verdict for target point ({pointDetail ? `${pointDetail.latitude.toFixed(2)}°N, ${pointDetail.longitude.toFixed(2)}°E` : 'Selected Grid Point'}).
          </p>
        </div>

        <div className="bg-[#D4F0E2] border border-[#C8EAD9] px-3 py-1.5 rounded-lg text-xs font-bold text-[#044E3A]">
          Trust Score: <strong>{score}/100</strong>
        </div>
      </div>

      {/* Verdict Card */}
      <div className="bg-white border border-[#C8EAD9] rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#C8EAD9] pb-3">
          <div>
            <span className="text-[10px] font-extrabold text-[#047857] uppercase">Self-Audit Classification</span>
            <h2 className="text-2xl font-black text-rose-600 mt-0.5">{status}</h2>
          </div>

          <span className="text-xs bg-rose-100 text-rose-800 font-extrabold px-3 py-1 rounded-lg border border-rose-200">
            {pointDetail?.reliability_band || 'YELLOW'} BAND
          </span>
        </div>

        <div className="bg-[#EEF9F4] border border-[#C8EAD9] p-4 rounded-xl space-y-1 text-xs text-[#044E3A]">
          <span className="font-extrabold text-[#059669] block uppercase">System Audit Explanation</span>
          <p className="text-sm font-semibold text-[#033A2B]">{reason}</p>
        </div>
      </div>
    </div>
  );
};
