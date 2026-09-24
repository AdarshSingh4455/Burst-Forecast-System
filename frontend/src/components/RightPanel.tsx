import React, { useState } from 'react';
import { 
  ShieldAlert, Droplets, Wind, X, 
  Waves, Sprout, Sun, ArrowRight, AlertTriangle
} from 'lucide-react';
import { GridPointDetail, RegionalSummary } from '../types';

interface RightPanelProps {
  pointDetail: GridPointDetail | null;
  regionalSummary?: RegionalSummary | null;
  onOpenPassport: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({ pointDetail, regionalSummary, onOpenPassport }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'assets' | 'insights'>('overview');

  const detail = pointDetail;

  const leadDayStr = detail ? `D${detail.lead_day}` : 'D5';
  const bustRiskPct = detail ? (detail.baseline_p_bust * 100).toFixed(0) : '62';
  const rainfallVal = detail ? detail.ensemble_mean_mm.toFixed(1) : '28.4';
  const ffdVal = detail ? (detail.ffd_failure_found === 0 ? 'No boundary' : detail.ffd.toFixed(2)) : '0.32';
  const oodVal = detail ? (detail.ood_score ? detail.ood_score.toFixed(0) : '78') : '78';
  const ensembleStatus = detail ? detail.ensemble_disagreement_category : 'High';
  const oodStatus = detail ? detail.ood_category : 'Unusual';
  const fragilityCat = detail ? detail.fragility_category : 'Fragile';

  const bustRiskNum = parseFloat(bustRiskPct);
  const bustBadgeColor = bustRiskNum > 60 ? 'bg-red-100 text-red-700' : bustRiskNum > 30 ? 'bg-amber-100 text-amber-800' : 'bg-[#D4F0E2] text-[#044E3A]';

  return (
    <aside className="w-[320px] bg-[#EEF9F4] border-l border-[#C8EAD9] flex flex-col h-full overflow-y-auto select-none flex-shrink-0 text-[#033A2B]">
      {/* Header - Ultra Light Green */}
      <div className="px-4 py-3 border-b border-[#C8EAD9] flex items-center justify-between bg-[#F4FAF6]">
        <h2 className="text-[16px] font-extrabold text-[#044E3A] tracking-tight">
          {detail ? `${detail.latitude.toFixed(2)}°N, ${detail.longitude.toFixed(2)}°E` : 'Grid Point Details'}
        </h2>
        <span className="text-[10px] font-mono font-bold text-[#059669] bg-[#D4F0E2] px-2 py-0.5 rounded">
          {detail ? (detail.region || 'Eastern UP').replace('_', ' ') : 'Eastern UP'}
        </span>
      </div>

      {/* Underline Tabs */}
      <div className="flex border-b border-[#C8EAD9] bg-white text-xs font-semibold px-2">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-2 text-center text-xs font-extrabold border-b-2 transition-all ${activeTab === 'overview' ? 'border-[#059669] text-[#059669]' : 'border-transparent text-[#065F46] hover:text-[#044E3A]'}`}
        >
          Overview
        </button>
        <button 
          onClick={() => setActiveTab('assets')}
          className={`px-3 py-2 text-center text-xs font-extrabold border-b-2 transition-all ${activeTab === 'assets' ? 'border-[#059669] text-[#059669]' : 'border-transparent text-[#065F46] hover:text-[#044E3A]'}`}
        >
          Assets (DEMO)
        </button>
        <button 
          onClick={() => setActiveTab('insights')}
          className={`px-3 py-2 text-center text-xs font-extrabold border-b-2 transition-all ${activeTab === 'insights' ? 'border-[#059669] text-[#059669]' : 'border-transparent text-[#065F46] hover:text-[#044E3A]'}`}
        >
          Key Insights
        </button>
      </div>

      {/* Body Content */}
      <div className="p-3 space-y-3 flex-1 overflow-y-auto text-xs">
        {activeTab === 'overview' && (
          <>
            {/* Landscape Region Info Card */}
            <div className="bg-white border border-[#C8EAD9] rounded-lg p-2 flex gap-2.5 shadow-xs items-center">
              <div className="w-[72px] h-[58px] rounded-md overflow-hidden bg-gradient-to-tr from-teal-700 via-emerald-600 to-teal-800 flex-shrink-0 relative flex items-center justify-center">
                <svg className="w-full h-full opacity-60 absolute inset-0" viewBox="0 0 100 50" preserveAspectRatio="none">
                  <path d="M0,25 Q25,10 50,25 T100,20 L100,50 L0,50 Z" fill="#059669" />
                  <path d="M0,35 Q35,15 70,35 T100,30 L100,50 L0,50 Z" fill="#047857" />
                </svg>
                <span className="text-[9px] font-bold text-white relative z-10 bg-slate-900/60 px-1 py-0.5 rounded">Rihand</span>
              </div>
              <div className="text-[10px] space-y-0.5 text-[#065F46] leading-tight">
                <p><span className="font-semibold text-[#047857]">State:</span> <strong className="text-[#044E3A]">Uttar Pradesh</strong></p>
                <p><span className="font-semibold text-[#047857]">Region:</span> <strong className="text-[#044E3A]">Eastern UP (Pilot)</strong></p>
                <p><span className="font-semibold text-[#047857]">Grid Point:</span> <strong className="text-[#044E3A]">{detail ? `${detail.latitude.toFixed(2)}°N, ${detail.longitude.toFixed(2)}°E` : '26.75°N, 83.25°E'}</strong></p>
                <p className="text-[9px] text-[#059669] font-mono">
                  Init: {detail?.forecast_init || '2019-07-01 00:00'} | Lead: {leadDayStr}
                </p>
              </div>
            </div>

            {/* Current Forecast Cards Grid */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-[#044E3A] text-[11px] uppercase tracking-wider">
                  Current Telemetry ({leadDayStr})
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <div className="bg-white border border-[#C8EAD9] p-2 rounded-md text-center shadow-xs flex flex-col justify-between h-[64px]">
                  <span className="text-[9px] font-bold text-[#047857] uppercase">Bust Risk</span>
                  <span className="text-[17px] font-extrabold text-red-600 leading-none">{bustRiskPct}%</span>
                  <div className="mt-0.5">
                    <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded inline-block ${bustBadgeColor}`}>
                      {detail ? detail.ai_risk_category : 'High Risk'}
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-[#C8EAD9] p-2 rounded-md text-center shadow-xs flex flex-col justify-between h-[64px]">
                  <span className="text-[9px] font-bold text-[#047857] uppercase">Rainfall</span>
                  <span className="text-[15px] font-extrabold text-[#044E3A] leading-none">{rainfallVal} mm</span>
                  <div className="mt-0.5">
                    <span className="text-[8px] font-bold text-[#059669] bg-[#E2F5EC] px-1 py-0.2 rounded inline-block">
                      Mean
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-[#C8EAD9] p-2 rounded-md text-center shadow-xs flex flex-col justify-between h-[64px]">
                  <span className="text-[9px] font-bold text-[#047857] uppercase">FFD</span>
                  <span className="text-[14px] font-extrabold text-amber-800 leading-none truncate">{ffdVal}</span>
                  <div className="mt-0.5">
                    <span className="text-[8px] font-bold text-amber-800 bg-amber-100 px-1 py-0.2 rounded inline-block">
                      {fragilityCat}
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-[#C8EAD9] p-2 rounded-md text-center shadow-xs flex flex-col justify-between h-[64px]">
                  <span className="text-[9px] font-bold text-[#047857] uppercase">Ensemble</span>
                  <span className="text-[13px] font-extrabold text-[#044E3A] leading-none">{ensembleStatus}</span>
                  <div className="mt-0.5">
                    <span className="text-[8px] font-bold text-red-700 bg-red-100 px-1 py-0.2 rounded inline-block">
                      Spread
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-[#C8EAD9] p-2 rounded-md text-center shadow-xs flex flex-col justify-between h-[64px]">
                  <span className="text-[9px] font-bold text-[#047857] uppercase">OOD</span>
                  <span className="text-[15px] font-extrabold text-purple-900 leading-none">{oodVal}</span>
                  <div className="mt-0.5">
                    <span className="text-[8px] font-bold text-purple-700 bg-purple-100 px-1 py-0.2 rounded inline-block">
                      {oodStatus}
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-[#C8EAD9] p-2 rounded-md text-center shadow-xs flex flex-col justify-between h-[64px]">
                  <span className="text-[9px] font-bold text-[#047857] uppercase">Trust Index</span>
                  <span className="text-[15px] font-extrabold text-[#059669] leading-none">{detail ? detail.trust_index.toFixed(0) : '72'}</span>
                  <div className="mt-0.5">
                    <span className="text-[8px] font-bold text-[#044E3A] bg-[#D4F0E2] px-1 py-0.2 rounded inline-block">
                      {detail ? detail.reliability_band : 'GREEN'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'assets' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-[#C8EAD9] pb-1">
              <h3 className="font-extrabold text-[#044E3A] text-[11px] uppercase tracking-wider">
                Infrastructure Assets (DEMO)
              </h3>
              <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">DEMO DATA</span>
            </div>
            <p className="text-[10px] text-[#065F46]">
              Infrastructure assets near selected grid coordinate ({detail ? `${detail.latitude.toFixed(2)}°N, ${detail.longitude.toFixed(2)}°E` : '26.75°N, 83.25°E'}):
            </p>
            <div className="space-y-1.5 text-[10px]">
              <div className="p-2 bg-white rounded-md border border-[#C8EAD9] shadow-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-[#044E3A]">
                  <span className="flex items-center gap-1.5"><Waves className="w-3.5 h-3.5 text-blue-500" /> Rihand Dam (DEMO)</span>
                  <span className="text-[#065F46] font-mono text-[9px]">Hydroelectric</span>
                </div>
                <p className="text-[#065F46] text-[9px]">Capacity: 300 MW | Status: Operational</p>
              </div>

              <div className="p-2 bg-white rounded-md border border-[#C8EAD9] shadow-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-[#044E3A]">
                  <span className="flex items-center gap-1.5"><Sprout className="w-3.5 h-3.5 text-emerald-500" /> Gorakhpur Agri Belt (DEMO)</span>
                  <span className="text-[#065F46] font-mono text-[9px]">Agriculture</span>
                </div>
                <p className="text-[#065F46] text-[9px]">Paddy/Wheat Cultivation | High Flood Vulnerability</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-2">
            <div className="border-b border-[#C8EAD9] pb-1">
              <h3 className="font-extrabold text-[#044E3A] text-[11px] uppercase tracking-wider">
                Point Diagnostics & Insights
              </h3>
            </div>
            
            <div className="bg-white border border-[#C8EAD9] p-2.5 rounded-lg space-y-2 shadow-xs">
              <div>
                <span className="text-[9px] font-bold text-[#047857] uppercase">Primary Vulnerability</span>
                <p className="font-extrabold text-[#044E3A] text-xs mt-0.5">
                  {detail?.primary_vulnerability || 'High Specific Humidity Delta (&gt;1.8 g/kg)'}
                </p>
              </div>

              <div className="border-t border-[#C8EAD9] pt-1.5">
                <span className="text-[9px] font-bold text-[#047857] uppercase">Self-Audit Verdict</span>
                <p className="font-bold text-rose-600 text-xs mt-0.5">
                  {detail?.self_audit_status || 'FLAGGED'} — {detail?.self_audit_reason || 'Ensemble disagreement exceeding 0.45'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="p-3 border-t border-[#C8EAD9] bg-white">
        <button
          onClick={onOpenPassport}
          className="w-full bg-[#059669] hover:bg-[#047857] text-white font-extrabold py-2.5 px-3 rounded-md shadow-sm transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
        >
          <span>Open Detailed Analysis</span>
          <ArrowRight className="w-4 h-4 text-white" />
        </button>
      </div>
    </aside>
  );
};
