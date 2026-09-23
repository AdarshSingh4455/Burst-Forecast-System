import React from 'react';
import { Shield, Printer, Download, ArrowLeft, CheckCircle, AlertTriangle, HelpCircle, ShieldAlert } from 'lucide-react';
import { Passport } from '../types';

interface PassportViewProps {
  passport: Passport | null;
  onBack?: () => void;
}

export const PassportView: React.FC<PassportViewProps> = ({ passport, onBack }) => {
  if (!passport) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-slate-500">No Reliability Passport selected. Please select a grid point first.</p>
        <button onClick={onBack} className="bg-blue-600 text-white font-bold px-4 py-2 rounded-lg text-sm">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    const jsonStr = JSON.stringify(passport, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FORTRESS_PASSPORT_${passport.forecast_init.slice(0, 10)}_${passport.latitude}_${passport.longitude}_D${passport.lead_day}.json`;
    a.click();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleDownloadJSON}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold px-4 py-2 rounded-xl shadow-md transition-colors"
          >
            <Download className="w-4 h-4" /> JSON Export
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-xl shadow-md transition-colors"
          >
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border-2 border-slate-900 shadow-2xl p-8 space-y-6 print:shadow-none print:border-slate-800">
        <div className="border-b-2 border-slate-900 pb-6 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg">
              <Shield className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-wider text-slate-900">FORTRESS RELIABILITY PASSPORT</h1>
              <p className="text-xs font-semibold text-blue-600 tracking-wide uppercase">
                Ministry of Earth Sciences (MoES) — NCMRWF | SIH26079
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
              passport.reliability_band === 'GREEN' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
              passport.reliability_band === 'YELLOW' ? 'bg-amber-100 text-amber-800 border-amber-300' :
              'bg-rose-100 text-rose-800 border-rose-300'
            }`}>
              BAND: {passport.reliability_band}
            </span>
            <p className="text-xs font-bold text-slate-500 mt-2">Trust Index: {passport.trust_index} / 100</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 font-semibold uppercase">Location / Region:</span>
            <p className="text-sm font-bold text-slate-900">{passport.region.replace('_', ' ')} ({passport.latitude.toFixed(2)}°N, {passport.longitude.toFixed(2)}°E)</p>
          </div>
          <div>
            <span className="text-slate-500 font-semibold uppercase">Initialization / Valid Time:</span>
            <p className="text-sm font-bold text-slate-900">{passport.forecast_init} | Valid: {passport.valid_time} (D{passport.lead_day})</p>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3 text-center">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] text-slate-500 font-semibold uppercase block">Rainfall</span>
            <span className="text-base font-bold text-blue-600">{passport.rainfall_mm} mm</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] text-slate-500 font-semibold uppercase block">Temp</span>
            <span className="text-base font-bold text-slate-800">{passport.temperature_c}°C</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] text-slate-500 font-semibold uppercase block">Humidity</span>
            <span className="text-base font-bold text-slate-800">{passport.humidity_gkg} g/kg</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] text-slate-500 font-semibold uppercase block">Pressure</span>
            <span className="text-base font-bold text-slate-800">{passport.pressure_hpa} hPa</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] text-slate-500 font-semibold uppercase block">Wind</span>
            <span className="text-base font-bold text-slate-800">{passport.wind_speed_ms} m/s</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-800 border-b pb-1">AI Risk & Stress Vulnerability</h3>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-slate-600">Bust Risk P(Bust):</span><span className="font-bold font-mono">{(passport.bust_probability * 100).toFixed(1)}% ({passport.ai_risk_category})</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Stress FFD:</span><span className="font-bold text-purple-700 font-mono">{passport.ffd.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Fragility Category:</span><span className="font-bold">{passport.fragility_category}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Failure Corridor:</span><span className="font-bold text-blue-700">{passport.failure_corridor}</span></div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-800 border-b pb-1">Independent Evidence Layer</h3>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-slate-600">Historical Analogues:</span><span className="font-bold">{passport.analogue_available ? `${(passport.analogue_bust_rate * 100).toFixed(0)}% Hist Bust` : 'No History'}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Failure DNA Match:</span><span className="font-bold">{(passport.dna_similarity * 100).toFixed(0)}% Similarity</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Ensemble Disagreement:</span><span className="font-bold text-blue-600">{passport.ensemble_disagreement}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">OOD Novelty:</span><span className="font-bold text-purple-600">{passport.ood_category}</span></div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <span className="text-xs text-blue-400 font-bold uppercase">Self-Audit Final Result</span>
              <h2 className="text-xl font-extrabold tracking-wide mt-0.5">{passport.self_audit_status}</h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Trust Horizon</span>
              <span className="text-lg font-bold text-blue-400">D1 – D{passport.trust_horizon_day}</span>
            </div>
          </div>
          <p className="text-xs text-slate-300 italic">"{passport.self_audit_reason}"</p>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800">
            <span>Primary Vulnerability: <strong className="text-white">{passport.primary_vulnerability}</strong></span>
            <span>Breaking Point: <strong className="text-rose-400">{passport.breaking_point_day ? `Day D${passport.breaking_point_day}` : 'None Detected'}</strong></span>
          </div>
        </div>

        <div className="border-t pt-4 text-center space-y-1 text-[11px] text-slate-500">
          <p className="font-semibold text-slate-700">{passport.disclaimer}</p>
          <p>Generated by FORTRESS Self-Audit Engine — NCMRWF Reforecast Verification Layer</p>
        </div>
      </div>
    </div>
  );
};
