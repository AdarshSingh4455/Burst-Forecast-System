import React from 'react';
import { Activity } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { GridDetail, StressTestResponse } from '../types';

interface StressLabViewProps {
  stressData?: StressTestResponse | null;
  pointDetail?: GridDetail | null;
  selectedDetail?: GridDetail | null;
}

export const StressLabView: React.FC<StressLabViewProps> = ({ stressData, pointDetail, selectedDetail }) => {
  const detail = pointDetail || selectedDetail;

  if (!detail) {
    return (
      <div className="p-8 text-center bg-slate-900 rounded-xl border border-slate-800 m-6">
        <Activity className="w-12 h-12 text-slate-600 mx-auto mb-2" />
        <h3 className="font-bold text-slate-200">No Grid Point Selected</h3>
        <p className="text-xs text-slate-400 mt-1">Please select a grid point on the map to run Stress Lab vulnerability analysis.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-2xl shadow-xl flex items-center justify-between">
        <div>
          <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">PHASE 4 — FORECAST STRESS LAB & FFD</span>
          <h1 className="text-2xl font-extrabold mt-1">Meteorological Perturbation Engine</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Evaluates meteorologically constrained stress scenarios across humidity, temperature, MSLP, and wind vector perturbations to test model stability boundaries.
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400 block">Forecast failure distance (FFD)</span>
          <span className="text-3xl font-extrabold text-purple-400 font-mono">{detail.ffd.toFixed(2)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm">
          <span className="text-xs text-slate-400 font-semibold uppercase">Baseline Bust Risk</span>
          <p className="text-xl font-bold text-red-400 font-mono mt-1">{(detail.baseline_p_bust * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm">
          <span className="text-xs text-slate-400 font-semibold uppercase">Stress Status</span>
          <p className="text-xl font-bold text-emerald-400 font-mono mt-1">{detail.ffd_failure_found === 1 ? 'Boundary Found' : 'Robust Range'}</p>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm">
          <span className="text-xs text-slate-400 font-semibold uppercase">Fragility AUC</span>
          <p className="text-xl font-bold text-amber-400 font-mono mt-1">{detail.fragility_auc.toFixed(2)}</p>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm">
          <span className="text-xs text-slate-400 font-semibold uppercase">Fragility Category</span>
          <p className="text-xl font-bold text-cyan-400 font-mono mt-1">{detail.fragility_category}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-200 border-b border-slate-800 pb-2">Fragility Curve (Stress Perturbation vs Bust Probability)</h3>
          <div className="h-64">
            {stressData?.stress_curve ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stressData.stress_curve}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="delta" stroke="#94a3b8" tickFormatter={(v) => `Δ=${v}`} />
                  <YAxis domain={[0, 1]} stroke="#94a3b8" tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} formatter={(val: number) => [`${(val * 100).toFixed(1)}%`, 'Bust Risk']} />
                  <Line type="monotone" dataKey="p_bust" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                Stress perturbation data active for Lead D{detail.lead_day}
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-200 border-b border-slate-800 pb-2">Stress Evaluation Diagnostics</h3>
          <div className="space-y-3 text-xs">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="font-bold text-slate-400 block">Stress Evidence:</span>
              <p className="text-slate-200 font-semibold mt-0.5">{detail.stress_evidence}</p>
            </div>

            <div className="bg-purple-950/20 p-3 rounded-xl border border-purple-800/40">
              <span className="font-bold text-purple-400 block">Fragility AUC & Category:</span>
              <p className="text-purple-300 mt-0.5 font-bold text-sm">{detail.fragility_auc.toFixed(3)} ({detail.fragility_category})</p>
            </div>

            <div className="bg-amber-950/20 p-3 rounded-xl border border-amber-800/40 text-amber-300">
              <span className="font-bold block">Scientific Disclaimer:</span>
              <p className="mt-0.5 text-[11px]">
                Nearest tested vulnerability scenario — prototype metric. Scenarios evaluate perturbation stability; they do not imply physical event certainty.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
