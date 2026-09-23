import React from 'react';
import { 
  ShieldAlert, Activity, CheckCircle, AlertTriangle, HelpCircle, FileText, 
  ChevronRight, Thermometer, Droplets, Gauge, Wind
} from 'lucide-react';
import { GridPointDetail, RegionalSummary } from '../types';

interface RightPanelProps {
  pointDetail: GridPointDetail | null;
  regionalSummary?: RegionalSummary | null;
  onOpenPassport: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({ pointDetail, regionalSummary, onOpenPassport }) => {
  if (!pointDetail) {
    return (
      <aside className="w-80 bg-slate-900 border-l border-slate-800 p-5 text-center flex flex-col justify-center items-center text-slate-400 flex-shrink-0">
        <HelpCircle className="w-10 h-10 text-slate-600 mb-2" />
        <p className="text-sm font-semibold text-slate-200">No Grid Point Selected</p>
        <p className="text-xs text-slate-400 mt-1">Click a marker on the map to inspect telemetry & reliability passport.</p>
        {regionalSummary && (
          <div className="mt-6 w-full bg-slate-950 p-4 rounded-xl border border-slate-800 text-left text-xs space-y-2">
            <p className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Regional Summary ({regionalSummary.region})</p>
            <div className="flex justify-between text-slate-400">
              <span>Bust Risk:</span>
              <span className="font-bold text-red-400">{(regionalSummary.mean_bust_probability * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Trust Index:</span>
              <span className="font-bold text-emerald-400">{regionalSummary.median_trust_index} / 100</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Reliability Band:</span>
              <span className={`font-bold ${regionalSummary.regional_reliability_band === 'GREEN' ? 'text-emerald-400' : regionalSummary.regional_reliability_band === 'YELLOW' ? 'text-amber-400' : 'text-rose-400'}`}>{regionalSummary.regional_reliability_band}</span>
            </div>
          </div>
        )}
      </aside>
    );
  }

  const detail = pointDetail;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUPPORTED RELIABILITY':
        return <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-bold border border-emerald-500/30 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> RELIABLE</span>;
      case 'SUPPORTED WARNING':
        return <span className="bg-amber-500/10 text-amber-400 text-xs px-2.5 py-1 rounded-full font-bold border border-amber-500/30 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> WARNING</span>;
      case 'CONFLICT / POSSIBLE BLIND SPOT':
        return <span className="bg-rose-500/10 text-rose-400 text-xs px-2.5 py-1 rounded-full font-bold border border-rose-500/30 flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> BLIND SPOT</span>;
      default:
        return <span className="bg-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-full font-bold border border-slate-700">{status}</span>;
    }
  };

  const getBandBadge = (band: 'GREEN' | 'YELLOW' | 'RED') => {
    if (band === 'GREEN') return <span className="bg-emerald-500 text-slate-950 text-xs px-2 py-0.5 rounded font-bold">GREEN</span>;
    if (band === 'YELLOW') return <span className="bg-amber-500 text-slate-950 text-xs px-2 py-0.5 rounded font-bold">YELLOW</span>;
    return <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded font-bold">RED</span>;
  };

  return (
    <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-y-auto flex-shrink-0 shadow-xl text-slate-200">
      <div className="p-4 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-emerald-400 font-semibold tracking-wide uppercase">{detail.region.replace('_', ' ')}</span>
          {getBandBadge(detail.reliability_band)}
        </div>
        <h2 className="text-lg font-bold font-mono text-slate-100">
          {detail.latitude.toFixed(2)}°N, {detail.longitude.toFixed(2)}°E
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Init: <span className="font-mono text-slate-300">{detail.forecast_init}</span> | Lead D{detail.lead_day}
        </p>
      </div>

      <div className="p-4 space-y-4 flex-1">
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-400 uppercase">Self-Audit Status</span>
            <span className="text-xs font-bold text-emerald-400 font-mono">Score: {detail.trust_index}/100</span>
          </div>
          <div className="my-2">{getStatusBadge(detail.self_audit_status)}</div>
          <p className="text-xs text-slate-300 mt-2 bg-slate-900 p-2 rounded border border-slate-800 italic">
            "{detail.self_audit_reason}"
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Bust Risk</p>
            <p className="text-xl font-bold text-red-400 font-mono mt-1">{(detail.baseline_p_bust * 100).toFixed(1)}%</p>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded mt-1 inline-block">
              {detail.ai_risk_category}
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Rainfall Mean</p>
            <p className="text-xl font-bold text-cyan-400 font-mono mt-1">{detail.ensemble_mean_mm.toFixed(1)} mm</p>
            <span className="text-[10px] text-slate-400 mt-1 inline-block">Spread: {detail.ensemble_spread_mm.toFixed(1)}mm</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Stress FFD</p>
            <p className="text-xl font-bold text-purple-400 font-mono mt-1">{detail.ffd.toFixed(2)}</p>
            <span className="text-[10px] text-slate-400 mt-1 block truncate">
              {detail.ffd_failure_found === 1 ? 'Boundary Found' : 'Robust Range'}
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Fragility AUC</p>
            <p className="text-xl font-bold text-amber-400 font-mono mt-1">{detail.fragility_auc.toFixed(2)}</p>
            <span className="text-[10px] text-slate-400 mt-1 block truncate">
              {detail.fragility_category}
            </span>
          </div>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-semibold text-slate-400">Trust Horizon:</span>
            <span className="font-bold text-emerald-400 font-mono">D1 – D{detail.trust_horizon_day}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-400">Breaking Point:</span>
            <span className="font-bold text-rose-400 font-mono">
              {detail.breaking_point_day ? `Day D${detail.breaking_point_day}` : 'None Detected'}
            </span>
          </div>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Atmospheric Baseline</p>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {(detail.temperature_c !== undefined || detail.temp_2m_c_mean !== undefined) && (
              <div className="flex items-center gap-1.5 text-slate-300">
                <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                {(detail.temperature_c ?? detail.temp_2m_c_mean ?? 0).toFixed(1)}°C
              </div>
            )}
            {(detail.humidity_gkg !== undefined || detail.specific_humidity_gkg_mean !== undefined) && (
              <div className="flex items-center gap-1.5 text-slate-300">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                {(detail.humidity_gkg ?? detail.specific_humidity_gkg_mean ?? 0).toFixed(1)} g/kg
              </div>
            )}
            {(detail.pressure_hpa !== undefined || detail.mslp_hpa_mean !== undefined) && (
              <div className="flex items-center gap-1.5 text-slate-300">
                <Gauge className="w-3.5 h-3.5 text-slate-400" />
                {(detail.pressure_hpa ?? detail.mslp_hpa_mean ?? 0).toFixed(0)} hPa
              </div>
            )}
            {(detail.wind_speed_ms !== undefined || detail.wind_speed_mean_ms !== undefined) && (
              <div className="flex items-center gap-1.5 text-slate-300">
                <Wind className="w-3.5 h-3.5 text-emerald-400" />
                {(detail.wind_speed_ms ?? detail.wind_speed_mean_ms ?? 0).toFixed(1)} m/s
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Independent Verification</p>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Analogues:</span>
              <span className="font-semibold text-slate-200">{detail.analogue_available === 1 ? `${(detail.analogue_mean_bust_rate * 100).toFixed(0)}% Hist Bust` : 'No History'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Failure DNA:</span>
              <span className="font-semibold text-slate-200">{(detail.failure_dna_max_sim * 100).toFixed(0)}% Match</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Ensemble Spread:</span>
              <span className="font-semibold text-cyan-400">{detail.ensemble_disagreement_category}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">OOD Novelty:</span>
              <span className="font-semibold text-purple-400">{detail.ood_category}</span>
            </div>
          </div>
        </div>

        <div className="bg-emerald-950/20 p-3 rounded-xl border border-emerald-800/40 text-xs">
          <p className="font-bold text-emerald-400">Primary Vulnerability:</p>
          <p className="text-emerald-300 mt-0.5">{detail.primary_vulnerability}</p>
          <p className="text-[10px] text-emerald-400/70 mt-1 italic">Corridor: {detail.failure_corridor_label}</p>
        </div>
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-950">
        <button
          onClick={onOpenPassport}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <FileText className="w-4 h-4" />
          <span>Reliability Passport</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
