import React from 'react';
import { Calendar, Layers, MapPin, SlidersHorizontal } from 'lucide-react';
import { Metadata } from '../types';

interface HeaderProps {
  metadata: Metadata | null;
  selectedRun: string;
  setSelectedRun: (run: string) => void;
  selectedLead: number;
  setSelectedLead: (lead: number) => void;
  selectedMetric: 'bust_risk_probability' | 'fragility_score' | 'trust_index';
  setSelectedMetric: (metric: 'bust_risk_probability' | 'fragility_score' | 'trust_index') => void;
  selectedRegion: string;
  setSelectedRegion: (region: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  metadata,
  selectedRun,
  setSelectedRun,
  selectedLead,
  setSelectedLead,
  selectedMetric,
  setSelectedMetric,
  selectedRegion,
  setSelectedRegion
}) => {
  const regionsList = metadata?.regions || ['ALL', 'GORAKHPUR', 'VARANASI', 'PRAYAGRAJ', 'AYODHYA', 'AZAMGARH'];
  const runList = metadata?.forecast_runs || metadata?.forecast_init_dates || ['2019070100', '2019070200', '2019070300'];
  const leadList = metadata?.lead_days || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const metricOptions: Array<{ id: 'bust_risk_probability' | 'fragility_score' | 'trust_index'; label: string }> = [
    { id: 'bust_risk_probability', label: 'Bust Risk Probability' },
    { id: 'fragility_score', label: 'FFD Fragility Score' },
    { id: 'trust_index', label: 'Trust Index (0-100)' },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 shadow-md flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Region Selector */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-300">
          <MapPin className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-500 font-semibold uppercase">Region:</span>
          <select 
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="bg-transparent font-medium text-slate-100 focus:outline-none cursor-pointer"
          >
            {regionsList.map(r => (
              <option key={r} value={r} className="bg-slate-900 text-slate-100">{r.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        {/* Forecast Run Selector */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-300">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-500 font-semibold uppercase">Run:</span>
          <select 
            value={selectedRun}
            onChange={(e) => setSelectedRun(e.target.value)}
            className="bg-transparent font-medium text-slate-100 focus:outline-none cursor-pointer font-mono"
          >
            {runList.map(d => (
              <option key={d} value={d} className="bg-slate-900 text-slate-100">{d}</option>
            ))}
          </select>
        </div>

        {/* Lead Day Selector */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-300">
          <Layers className="w-4 h-4 text-amber-400" />
          <span className="text-slate-500 font-semibold uppercase">Lead:</span>
          <select 
            value={selectedLead}
            onChange={(e) => setSelectedLead(parseInt(e.target.value))}
            className="bg-transparent font-bold text-amber-400 focus:outline-none cursor-pointer"
          >
            {leadList.map(l => (
              <option key={l} value={l} className="bg-slate-900 text-slate-100">Lead D{l}</option>
            ))}
          </select>
        </div>

        {/* Metric Selector */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-300">
          <SlidersHorizontal className="w-4 h-4 text-purple-400" />
          <span className="text-slate-500 font-semibold uppercase">Metric Overlay:</span>
          <select 
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as any)}
            className="bg-transparent font-medium text-slate-100 focus:outline-none cursor-pointer"
          >
            {metricOptions.map(m => (
              <option key={m.id} value={m.id} className="bg-slate-900 text-slate-100">{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[11px] text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700 font-mono">
          Domain: Eastern UP Pilot (323 points)
        </span>
      </div>
    </header>
  );
};
