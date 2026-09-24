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

  const leadDayStr = detail ? `D${detail.lead_day}` : 'D6';
  const bustRiskPct = detail ? (detail.baseline_p_bust * 100).toFixed(0) : '62';
  const rainfallVal = detail ? detail.ensemble_mean_mm.toFixed(1) : '28.4';
  
  // FFD logic per spec: if ffd_failure_found == 0, show "No boundary"
  const ffdVal = detail ? (detail.ffd_failure_found === 0 ? 'No boundary' : detail.ffd.toFixed(2)) : '0.32';
  const oodVal = detail ? (detail.ood_score ? detail.ood_score.toFixed(0) : '78') : '78';
  const ensembleStatus = detail ? detail.ensemble_disagreement_category : 'High';
  const oodStatus = detail ? detail.ood_category : 'Unusual';
  const fragilityCat = detail ? detail.fragility_category : 'Fragile';

  // Dynamic colors based on risk
  const bustRiskNum = parseFloat(bustRiskPct);
  const bustBadgeColor = bustRiskNum > 60 ? 'bg-red-100 text-red-700' : bustRiskNum > 30 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800';

  return (
    <aside className="w-[320px] bg-[#F8FAFC] border-l border-[#D9E2EA] flex flex-col h-full overflow-y-auto select-none flex-shrink-0 text-slate-800">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#D9E2EA] flex items-center justify-between bg-white">
        <h2 className="text-[17px] font-extrabold text-[#0B2545] tracking-tight">
          {detail ? (detail.region || 'Eastern Uttar Pradesh').replace('_', ' ') : 'Eastern Uttar Pradesh'}
        </h2>
        <button className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors">
          <X className="w-4 h-4" />
        </button>
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
          Assets
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
        {/* Landscape Region Info Card */}
        <div className="bg-white border border-[#D9E2EA] rounded-lg p-2 flex gap-2.5 shadow-xs items-center">
          {/* Simulated Reservoir Thumbnail */}
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
            <p><span className="font-semibold text-slate-400">Grid Points:</span> <strong className="text-slate-800">323</strong></p>
            <p className="text-[9px] text-slate-500 font-mono">
              Lat: {detail ? detail.latitude.toFixed(1) : '24.5'}°N – 28.5°N | Lon: {detail ? detail.longitude.toFixed(1) : '80.0'}°E – 84.5°E
            </p>
          </div>
        </div>

        {/* Current Forecast (D#) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider">
              Current Forecast ({leadDayStr})
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {/* Bust Risk Card */}
            <div className="bg-white border border-[#D9E2EA] p-2 rounded-md text-center shadow-xs flex flex-col justify-between h-[64px]">
              <span className="text-[9px] font-bold text-slate-400 uppercase">Bust Risk</span>
              <span className="text-[17px] font-extrabold text-red-600 leading-none">{bustRiskPct}%</span>
              <div className="mt-0.5">
                <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded inline-block ${bustBadgeColor}`}>
                  {detail ? detail.ai_risk_category : 'High Risk'}
                </span>
              </div>
            </div>

            {/* Rainfall Card */}
            <div className="bg-white border border-[#D9E2EA] p-2 rounded-md text-center shadow-xs flex flex-col justify-between h-[64px]">
              <span className="text-[9px] font-bold text-slate-400 uppercase">Rainfall</span>
              <span className="text-[15px] font-extrabold text-slate-900 leading-none">{rainfallVal} mm</span>
              <div className="mt-0.5">
                <span className="text-[8px] font-bold text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded inline-block">
                  ↑ 12%
                </span>
              </div>
            </div>

            {/* FFD Card */}
            <div className="bg-white border border-[#D9E2EA] p-2 rounded-md text-center shadow-xs flex flex-col justify-between h-[64px]">
              <span className="text-[9px] font-bold text-slate-400 uppercase">FFD</span>
              <span className="text-[14px] font-extrabold text-slate-800 leading-none truncate">{ffdVal}</span>
              <div className="mt-0.5">
                <span className="text-[8px] font-bold text-amber-800 bg-amber-100 px-1 py-0.2 rounded inline-block">
                  {fragilityCat}
                </span>
              </div>
            </div>

            {/* Ensemble Card */}
            <div className="bg-white border border-[#D9E2EA] p-2 rounded-md text-center shadow-xs flex flex-col justify-between h-[64px]">
              <span className="text-[9px] font-bold text-slate-400 uppercase">Ensemble</span>
              <span className="text-[13px] font-extrabold text-slate-900 leading-none">{ensembleStatus}</span>
              <div className="mt-0.5">
                <span className="text-[8px] font-bold text-red-700 bg-red-100 px-1 py-0.2 rounded inline-block">
                  Disagreement
                </span>
              </div>
            </div>

            {/* OOD Card */}
            <div className="bg-white border border-[#D9E2EA] p-2 rounded-md text-center shadow-xs flex flex-col justify-between h-[64px]">
              <span className="text-[9px] font-bold text-slate-400 uppercase">OOD</span>
              <span className="text-[15px] font-extrabold text-purple-900 leading-none">{oodVal}</span>
              <div className="mt-0.5">
                <span className="text-[8px] font-bold text-purple-700 bg-purple-100 px-1 py-0.2 rounded inline-block">
                  {oodStatus}
                </span>
              </div>
            </div>

            {/* Condition Card */}
            <div className="bg-white border border-[#D9E2EA] p-2 rounded-md text-center shadow-xs flex flex-col justify-between h-[64px]">
              <span className="text-[9px] font-bold text-slate-400 uppercase">Condition</span>
              <span className="text-[13px] font-extrabold text-red-600 leading-none">{fragilityCat}</span>
              <div className="mt-0.5">
                <span className="text-[8px] font-bold text-amber-800 bg-amber-200 px-1 py-0.2 rounded inline-block">
                  Monitor
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Key Vulnerabilities */}
        <div className="bg-white border border-[#D9E2EA] p-2.5 rounded-lg space-y-1.5 shadow-xs">
          <h3 className="font-extrabold text-slate-800 text-[10px] uppercase tracking-wider">
            Key Vulnerabilities
          </h3>
          <ul className="space-y-1.5 text-slate-700 text-[11px]">
            <li className="flex items-center gap-2">
              <Droplets className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              <span>High Moisture Sensitivity</span>
            </li>
            <li className="flex items-center gap-2">
              <Wind className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
              <span>Wind Circulation Influence</span>
            </li>
            <li className="flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
              <span>Matches 3 Historical Busts</span>
            </li>
          </ul>
        </div>

        {/* Nearby Assets */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-800 text-[10px] uppercase tracking-wider">
              Nearby Assets
            </h3>
            <span className="text-[10px] font-bold text-blue-600 cursor-pointer hover:underline">View All</span>
          </div>

          <div className="space-y-1 text-[10px]">
            <div className="flex items-center justify-between p-1.5 bg-white rounded-md border border-[#D9E2EA] shadow-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-800">
                <Waves className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" /> Rihand Reservoir
              </span>
              <span className="text-slate-500 font-mono">~ 112 km</span>
            </div>

            <div className="flex items-center justify-between p-1.5 bg-white rounded-md border border-[#D9E2EA] shadow-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-800">
                <Sprout className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" /> Agriculture Zone (East UP)
              </span>
              <span className="text-slate-500 font-mono">~ 24 km</span>
            </div>

            <div className="flex items-center justify-between p-1.5 bg-white rounded-md border border-[#D9E2EA] shadow-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-800">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" /> Flood Prone Area
              </span>
              <span className="text-slate-500 font-mono">~ 37 km</span>
            </div>

            <div className="flex items-center justify-between p-1.5 bg-white rounded-md border border-[#D9E2EA] shadow-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-800">
                <Sun className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" /> Solar Plant (Mirzapur)
              </span>
              <span className="text-slate-500 font-mono">~ 98 km</span>
            </div>

            <div className="flex items-center justify-between p-1.5 bg-white rounded-md border border-[#D9E2EA] shadow-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-800">
                <Wind className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" /> Wind Site (Varanasi)
              </span>
              <span className="text-slate-500 font-mono">~ 76 km</span>
            </div>
          </div>
        </div>
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
