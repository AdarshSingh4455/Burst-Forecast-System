import React, { useState } from 'react';
import { 
  ShieldAlert, Droplets, Wind, X, 
  Waves, Sprout, Sun, ArrowRight, AlertTriangle, Radio
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
  const bustBadgeColor = bustRiskNum > 60 ? 'bg-red-100 text-red-700' : bustRiskNum > 30 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800';

  return (
    <aside className="w-[320px] bg-[#F8FAFC] border-l border-[#D9E2EA] flex flex-col h-full overflow-y-auto select-none flex-shrink-0 text-slate-800">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#D9E2EA] flex items-center justify-between bg-white">
        <h2 className="text-[17px] font-extrabold text-[#0B2545] tracking-tight">
          {detail ? `${detail.latitude.toFixed(2)}°N, ${detail.longitude.toFixed(2)}°E` : 'Grid Point Details'}
        </h2>
        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
          {detail ? (detail.region || 'Eastern UP').replace('_', ' ') : 'Eastern UP'}
        </span>
      </div>

      {/* Underline Tabs */}
      <div className="flex border-b border-[#D9E2EA] bg-white text-xs font-semibold px-2">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-2 text-center text-xs font-bold border-b-2 transition-all ${activeTab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Overview
        </button>
        <button 
          onClick={() => setActiveTab('assets')}
          className={`px-3 py-2 text-center text-xs font-bold border-b-2 transition-all ${activeTab === 'assets' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Assets (DEMO)
        </button>
        <button 
          onClick={() => setActiveTab('insights')}
          className={`px-3 py-2 text-center text-xs font-bold border-b-2 transition-all ${activeTab === 'insights' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Key Insights
        </button>
      </div>

      {/* Body Content */}
      <div className="p-3 space-y-3 flex-1 overflow-y-auto text-xs">
        {activeTab === 'overview' && (
          <>
            {/* Landscape Region Info Card */}
            <div className="bg-white border border-[#D9E2EA] rounded-lg p-2 flex gap-2.5 shadow-xs items-center">
              <div className="w-[72px] h-[58px] rounded-md overflow-hidden bg-gradient-to-tr from-sky-700 via-teal-600 to-emerald-700 flex-shrink-0 relative flex items-center justify-center">
                <svg className="w-full h-full opacity-60 absolute inset-0" viewBox="0 0 100 50" preserveAspectRatio="none">
                  <path d="M0,25 Q25,10 50,25 T100,20 L100,50 L0,50 Z" fill="#0284c7" />
                  <path d="M0,35 Q35,15 70,35 T100,30 L100,50 L0,50 Z" fill="#0369a1" />
                </svg>
                <span className="text-[9px] font-bold text-white relative z-10 bg-slate-900/60 px-1 py-0.5 rounded">Rihand</span>
              </div>
              <div className="text-[10px] space-y-0.5 text-slate-600 leading-tight">
                <p><span className="font-semibold text-slate-400">State:</span> <strong className="text-slate-800">Uttar Pradesh</strong></p>
                <p><span className="font-semibold text-slate-400">Region:</span> <strong className="text-slate-800">Eastern UP (Pilot)</strong></p>
                <p><span className="font-semibold text-slate-400">Grid Point:</span> <strong className="text-slate-800">{detail ? `${detail.latitude.toFixed(2)}°N, ${detail.longitude.toFixed(2)}°E` : '26.75°N, 83.25°E'}</strong></p>
                <p className="text-[9px] text-slate-500 font-mono">
                  Init: {detail?.forecast_init || '2019-07-01 00:00'} | Lead: {leadDayStr}
                </p>
              </div>
            </div>

            {/* Current Forecast Cards Grid */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider">
                  Current Telemetry ({leadDayStr})
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <div className="bg-white border border-[#D9E2EA] p-2 rounded-md text-center shadow-xs flex flex-col justify-between h-[64px]">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Bust Risk</span>
                  <span className="text-[17px] font-extrabold text-red-600 leading-none">{bustRiskPct}%</span>
                  <div className="mt-0.5">
                    <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded inline-block ${bustBadgeColor}`}>
                      {detail ? detail.ai_risk_category : 'High Risk'}
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-[#D9E2EA] p-2 rounded-md text-center shadow-xs flex flex-col justify-between h-[64px]">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Rainfall</span>
                  <span className="text-[15px] font-extrabold text-slate-900 leading-none">{rainfallVal} mm</span>
                  <div className="mt-0.5">
                    <span className="text-[8px] font-bold text-blue-700 bg-blue-100 px-1 py-0.2 rounded inline-block">
                      Mean
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-[#D9E2EA] p-2 rounded-md text-center shadow-xs flex flex-col justify-between h-[64px]">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">FFD</span>
                  <span className="text-[14px] font-extrabold text-slate-800 leading-none truncate">{ffdVal}</span>
                  <div className="mt-0.5">
                    <span className="text-[8px] font-bold text-amber-800 bg-amber-100 px-1 py-0.2 rounded inline-block">
                      {fragilityCat}
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-[#D9E2EA] p-2 rounded-md text-center shadow-xs flex flex-col justify-between h-[64px]">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Ensemble</span>
                  <span className="text-[13px] font-extrabold text-slate-900 leading-none">{ensembleStatus}</span>
                  <div className="mt-0.5">
                    <span className="text-[8px] font-bold text-red-700 bg-red-100 px-1 py-0.2 rounded inline-block">
                      Spread
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-[#D9E2EA] p-2 rounded-md text-center shadow-xs flex flex-col justify-between h-[64px]">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">OOD</span>
                  <span className="text-[15px] font-extrabold text-purple-900 leading-none">{oodVal}</span>
                  <div className="mt-0.5">
                    <span className="text-[8px] font-bold text-purple-700 bg-purple-100 px-1 py-0.2 rounded inline-block">
                      {oodStatus}
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-[#D9E2EA] p-2 rounded-md text-center shadow-xs flex flex-col justify-between h-[64px]">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Trust Index</span>
                  <span className="text-[15px] font-extrabold text-emerald-700 leading-none">{detail ? detail.trust_index.toFixed(0) : '72'}</span>
                  <div className="mt-0.5">
                    <span className="text-[8px] font-bold text-emerald-800 bg-emerald-100 px-1 py-0.2 rounded inline-block">
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
            <div className="flex items-center justify-between border-b border-slate-200 pb-1">
              <h3 className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider">
                Infrastructure Assets (DEMO)
              </h3>
              <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">DEMO DATA</span>
            </div>
            <p className="text-[10px] text-slate-500">
              Infrastructure assets near selected grid coordinate ({detail ? `${detail.latitude.toFixed(2)}°N, ${detail.longitude.toFixed(2)}°E` : '26.75°N, 83.25°E'}):
            </p>
            <div className="space-y-1.5 text-[10px]">
              <div className="p-2 bg-white rounded-md border border-[#D9E2EA] shadow-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="flex items-center gap-1.5"><Waves className="w-3.5 h-3.5 text-blue-500" /> Rihand Dam (DEMO)</span>
                  <span className="text-slate-500 font-mono text-[9px]">Hydroelectric</span>
                </div>
                <p className="text-slate-500 text-[9px]">Capacity: 300 MW | Status: Operational</p>
              </div>

              <div className="p-2 bg-white rounded-md border border-[#D9E2EA] shadow-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="flex items-center gap-1.5"><Sprout className="w-3.5 h-3.5 text-emerald-500" /> Gorakhpur Agri Belt (DEMO)</span>
                  <span className="text-slate-500 font-mono text-[9px]">Agriculture</span>
                </div>
                <p className="text-slate-500 text-[9px]">Paddy/Wheat Cultivation | High Flood Vulnerability</p>
              </div>

              <div className="p-2 bg-white rounded-md border border-[#D9E2EA] shadow-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Rapti River Catchment (DEMO)</span>
                  <span className="text-slate-500 font-mono text-[9px]">Disaster Zone</span>
                </div>
                <p className="text-slate-500 text-[9px]">Historical Inundation Risk: High</p>
              </div>

              <div className="p-2 bg-white rounded-md border border-[#D9E2EA] shadow-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="flex items-center gap-1.5"><Sun className="w-3.5 h-3.5 text-amber-500" /> Mirzapur Solar Park (DEMO)</span>
                  <span className="text-slate-500 font-mono text-[9px]">Solar Energy</span>
                </div>
                <p className="text-slate-500 text-[9px]">Grid Integration Point: 132kV Substation</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-2">
            <div className="border-b border-slate-200 pb-1">
              <h3 className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider">
                Point Diagnostics & Insights
              </h3>
            </div>
            
            <div className="bg-white border border-[#D9E2EA] p-2.5 rounded-lg space-y-2 shadow-xs">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Primary Vulnerability</span>
                <p className="font-extrabold text-slate-800 text-xs mt-0.5">
                  {detail?.primary_vulnerability || 'High Specific Humidity Delta (&gt;1.8 g/kg)'}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Self-Audit Verdict</span>
                <p className="font-bold text-rose-600 text-xs mt-0.5">
                  {detail?.self_audit_status || 'FLAGGED'} — {detail?.self_audit_reason || 'Ensemble disagreement exceeding 0.45'}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Failure DNA Corridor</span>
                <p className="font-semibold text-slate-700 text-xs mt-0.5">
                  {detail?.failure_corridor_label || 'High Moisture / Weak Shear Corridor'}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Stress Test Evidence</span>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  {detail?.stress_evidence || 'Fragility boundary detected at -1.2°C temperature shift.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="p-3 border-t border-[#D9E2EA] bg-white">
        <button
          onClick={onOpenPassport}
          className="w-full bg-[#0B2545] hover:bg-[#071C30] text-white font-extrabold py-2.5 px-3 rounded-md shadow-sm transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
        >
          <span>Open Detailed Analysis</span>
          <ArrowRight className="w-4 h-4 text-white" />
        </button>
      </div>
    </aside>
  );
};
