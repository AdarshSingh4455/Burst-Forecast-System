import React, { useEffect, useState } from 'react';
import { fetchRegionalTrend } from '../lib/api';
import { RegionalTrendItem, GridPointMap } from '../types';

interface AnalyticsViewProps {
  selectedRun: string;
  selectedLead?: number;
  selectedRegion?: string;
  gridPoints?: GridPointMap[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ selectedRun, selectedRegion = 'ALL' }) => {
  const [regionalTrend, setRegionalTrend] = useState<RegionalTrendItem[]>([]);

  useEffect(() => {
    fetchRegionalTrend(selectedRun, selectedRegion).then(res => setRegionalTrend(res)).catch(() => {});
  }, [selectedRun, selectedRegion]);

  return (
    <div className="p-6 space-y-6">
      <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-2xl shadow-xl flex items-center justify-between">
        <div>
          <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">FORECAST LEAD ANALYTICS</span>
          <h1 className="text-2xl font-extrabold mt-1">D1–D10 Regional Lead Time Performance</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Multi-lead breakdown across Eastern UP pilot region (Init: <span className="font-mono text-slate-200">{selectedRun}</span>).
          </p>
        </div>
      </div>

      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm overflow-x-auto">
        <h3 className="font-bold text-sm text-slate-200 mb-3 border-b border-slate-800 pb-2">Regional Lead-wise Reliability Breakdown</h3>
        <table className="w-full text-xs text-left text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3">Lead Day</th>
              <th className="py-2.5 px-3">Mean Rain</th>
              <th className="py-2.5 px-3">Mean Bust P</th>
              <th className="py-2.5 px-3">Median FFD</th>
              <th className="py-2.5 px-3">Median Trust</th>
              <th className="py-2.5 px-3">Green %</th>
              <th className="py-2.5 px-3">Yellow %</th>
              <th className="py-2.5 px-3">Red %</th>
              <th className="py-2.5 px-3">Regional Band</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 font-mono">
            {regionalTrend.map((row) => (
              <tr key={row.lead_day} className="hover:bg-slate-800/50">
                <td className="py-2.5 px-3 font-bold font-sans text-slate-100">Lead D{row.lead_day}</td>
                <td className="py-2.5 px-3">{row.mean_rainfall.toFixed(1)} mm</td>
                <td className="py-2.5 px-3">{(row.mean_bust_probability * 100).toFixed(1)}%</td>
                <td className="py-2.5 px-3">{row.median_ffd.toFixed(2)}</td>
                <td className="py-2.5 px-3 font-bold text-emerald-400">{row.median_trust_index.toFixed(1)}</td>
                <td className="py-2.5 px-3 text-emerald-400 font-bold">{(row.green_fraction * 100).toFixed(0)}%</td>
                <td className="py-2.5 px-3 text-amber-400 font-bold">{(row.yellow_fraction * 100).toFixed(0)}%</td>
                <td className="py-2.5 px-3 text-rose-400 font-bold">{(row.red_fraction * 100).toFixed(0)}%</td>
                <td className="py-2.5 px-3 font-sans">
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    row.regional_reliability_band === 'GREEN' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    row.regional_reliability_band === 'YELLOW' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {row.regional_reliability_band}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
