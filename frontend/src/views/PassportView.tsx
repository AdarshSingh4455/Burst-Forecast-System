import React from 'react';
import { FileText, Download, Printer, Share2, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { ReliabilityPassport } from '../types';

interface PassportViewProps {
  passport?: ReliabilityPassport | null;
}

export const PassportView: React.FC<PassportViewProps> = ({ passport }) => {
  const p = passport;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!p) return;
    const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FORTRESS_Passport_${p.forecast_init.slice(0, 10)}_D${p.lead_day}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full w-full overflow-y-auto p-4 space-y-4 bg-[#F5FAF8] text-[#102A2A] select-none">
      {/* Action Bar */}
      <div className="bg-white border border-[#D2E5DF] rounded-xl p-4 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold text-[#00A878] uppercase tracking-wider">RELIABILITY PASSPORT</span>
          <h1 className="text-xl font-extrabold text-[#102A2A] mt-0.5 tracking-tight">FORTRESS Reliability Passport</h1>
          <p className="text-xs text-[#617874] mt-0.5 font-medium">
            Complete diagnostic report card combining AI Bust Risk, Stress FFD, Analogues, DNA, and Self-Audit verdicts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="bg-[#00A878] hover:bg-[#005C4B] text-white font-bold py-2 px-3 rounded-lg text-xs shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Download JSON</span>
          </button>
          <button
            onClick={handlePrint}
            className="bg-white hover:bg-[#EAF8F3] text-[#102A2A] border border-[#D2E5DF] font-bold py-2 px-3 rounded-lg text-xs transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-[#00A878]" />
            <span>Print Passport</span>
          </button>
        </div>
      </div>

      {/* Main Passport Document Card */}
      <div className="bg-white border border-[#D2E5DF] rounded-xl p-6 shadow-sm space-y-6 max-w-4xl mx-auto border-t-4 border-t-[#00A878]">
        {/* Passport Header */}
        <div className="flex justify-between items-start border-b border-[#D2E5DF] pb-4">
          <div>
            <span className="text-xs font-mono font-bold text-[#00A878] uppercase tracking-widest block">SIH26079 // FORTRESS OFFICIAL PASSPORT</span>
            <h2 className="text-2xl font-black text-[#102A2A] tracking-tight mt-1">Forecast Reliability Audit Card</h2>
            <p className="text-xs text-[#617874] mt-0.5">
              Target: <strong className="text-[#102A2A]">{p ? p.region : 'Eastern Uttar Pradesh'}</strong> | Init: <strong className="font-mono text-[#102A2A]">{p ? p.forecast_init : '2019-07-01 00:00:00'}</strong> | Lead: <strong className="text-[#00A878]">D{p ? p.lead_day : 5}</strong>
            </p>
          </div>

          <div className="text-right">
            <span className={`px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-wider block ${
              (p?.self_audit_status || 'SUPPORTED WARNING') === 'SUPPORTED RELIABILITY' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {p?.self_audit_status || 'SUPPORTED WARNING'}
            </span>
            <span className="text-[10px] text-[#617874] font-mono mt-1 block">Trust Index: {p?.trust_index || 78}/100</span>
          </div>
        </div>

        {/* Passport Grid Key Metrics */}
        <div className="grid grid-cols-4 gap-3 text-xs">
          <div className="bg-[#F5FAF8] p-3 rounded-lg border border-[#D2E5DF]">
            <span className="text-[10px] text-[#617874] font-bold uppercase block">Rainfall Forecast</span>
            <span className="text-lg font-black text-[#102A2A] mt-0.5 block">{p?.rainfall_mm ?? 28.4} mm</span>
          </div>

          <div className="bg-[#F5FAF8] p-3 rounded-lg border border-[#D2E5DF]">
            <span className="text-[10px] text-[#617874] font-bold uppercase block">Bust Risk</span>
            <span className="text-lg font-black text-rose-600 mt-0.5 block">{p ? (p.bust_probability * 100).toFixed(0) : '62'}% ({p?.ai_risk_category || 'High Risk'})</span>
          </div>

          <div className="bg-[#F5FAF8] p-3 rounded-lg border border-[#D2E5DF]">
            <span className="text-[10px] text-[#617874] font-bold uppercase block">FFD & Fragility</span>
            <span className="text-lg font-black text-amber-800 mt-0.5 block">{p?.ffd ?? 0.32} ({p?.fragility_category || 'Fragile'})</span>
          </div>

          <div className="bg-[#F5FAF8] p-3 rounded-lg border border-[#D2E5DF]">
            <span className="text-[10px] text-[#617874] font-bold uppercase block">Trust Horizon</span>
            <span className="text-lg font-black text-[#00A878] mt-0.5 block">D{p?.trust_horizon_day ?? 5} (Breaking: D{p?.breaking_point_day ?? 6})</span>
          </div>
        </div>

        {/* Evidence Breakdown */}
        <div className="space-y-3">
          <h3 className="font-extrabold text-[#102A2A] text-sm uppercase tracking-wider border-b border-[#D2E5DF] pb-1.5">
            Independent Evidence Breakdown
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-[#EAF8F3] p-3 rounded-lg border border-[#BDEADB]">
              <span className="font-bold text-[#005C4B] block">Historical Analogues:</span>
              <p className="text-[#102A2A] mt-0.5 font-medium">{p?.analogue_available ? 'Matches found in historical reforecasts' : 'Available'} (Bust Rate: {p ? (p.analogue_bust_rate * 100).toFixed(0) : '25'}%)</p>
            </div>

            <div className="bg-[#EAF8F3] p-3 rounded-lg border border-[#BDEADB]">
              <span className="font-bold text-[#005C4B] block">Failure DNA Match:</span>
              <p className="text-[#102A2A] mt-0.5 font-medium">Similarity score: {p?.dna_similarity ?? 0.78}</p>
            </div>
          </div>
        </div>

        {/* Disclaimer Footer */}
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-[11px] text-[#617874] leading-relaxed">
          <strong className="text-[#102A2A]">Scientific Disclaimer:</strong> FORTRESS Passport is a forecast reliability diagnostic tool. It provides model vulnerability indicators and does not replace official meteorological warnings.
        </div>
      </div>
    </div>
  );
};
