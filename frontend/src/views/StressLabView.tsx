import React from 'react';
import { Activity, ShieldAlert, AlertTriangle, Info } from 'lucide-react';
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
      <div className="h-full w-full p-8 text-center bg-white border border-[#D2E5DF] rounded-xl m-4 space-y-2">
        <Activity className="w-12 h-12 text-[#00A878] mx-auto" />
        <h3 className="font-bold text-[#102A2A]">No Grid Point Selected</h3>
        <p className="text-xs text-[#617874]">Please select a grid point on the map to run Stress Lab vulnerability analysis.</p>
      </div>
    );
  }

  const ffdFailureFound = detail.ffd_failure_found;
  const ffdValStr = ffdFailureFound === 0 ? 'No boundary' : detail.ffd.toFixed(2);

  return (
    <div className="h-full w-full overflow-y-auto p-4 space-y-4 bg-[#F5FAF8] text-[#102A2A] select-none">
      {/* Top Banner Header */}
      <div className="bg-white border border-[#D2E5DF] rounded-xl p-4 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold text-[#00A878] uppercase tracking-wider">PHASE 4 — FORECAST STRESS LAB & FFD</span>
          <h1 className="text-xl font-extrabold text-[#102A2A] mt-0.5 tracking-tight">Stress Testing Lab</h1>
          <p className="text-xs text-[#617874] mt-0.5 font-medium">
            Perturbation analysis and fragility boundary assessment across humidity, temperature, MSLP, and wind vector perturbations.
          </p>
        </div>

        <div className="text-right bg-[#EAF8F3] border border-[#BDEADB] px-4 py-2 rounded-xl text-[#005C4B]">
          <span className="text-[10px] font-bold text-[#617874] uppercase block">Forecast Failure Distance</span>
          <span className="text-2xl font-black text-[#00A878] font-mono">{ffdValStr}</span>
        </div>
      </div>

      {/* Selected Grid Point & Minimum Bust Scenario */}
      <div className="grid grid-cols-12 gap-4">
        {/* Selected Grid Point (col-span-5) */}
        <div className="col-span-5 bg-white border border-[#D2E5DF] rounded-xl p-4 shadow-xs space-y-2">
          <h3 className="font-extrabold text-[#102A2A] text-xs uppercase tracking-wider border-b border-[#D2E5DF] pb-1.5">
            Selected Grid Point
          </h3>
          <div className="space-y-1.5 text-xs text-[#102A2A] font-mono">
            <p><span className="text-[#617874] font-sans">Lat:</span> <strong>{detail.latitude.toFixed(2)}°N</strong></p>
            <p><span className="text-[#617874] font-sans">Lon:</span> <strong>{detail.longitude.toFixed(2)}°E</strong></p>
            <p><span className="text-[#617874] font-sans">Grid ID:</span> <strong>EUP_{detail.latitude.toFixed(1)}_{detail.longitude.toFixed(1)}</strong></p>
            <p><span className="text-[#617874] font-sans">Baseline Bust Risk:</span> <strong className="text-rose-600">{(detail.baseline_p_bust * 100).toFixed(0)}%</strong></p>
            <p><span className="text-[#617874] font-sans">Condition:</span> <strong className="text-amber-700">{detail.fragility_category}</strong></p>
          </div>
        </div>

        {/* Minimum Bust Scenario (col-span-7) */}
        <div className="col-span-7 bg-white border border-[#D2E5DF] rounded-xl p-4 shadow-xs space-y-2">
          <h3 className="font-extrabold text-[#102A2A] text-xs uppercase tracking-wider border-b border-[#D2E5DF] pb-1.5">
            Minimum Bust Scenario
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono text-[#102A2A]">
            <p><span className="text-[#617874] font-sans">Humidity delta:</span> <strong className="text-[#00A878]">+18%</strong></p>
            <p><span className="text-[#617874] font-sans">Temperature delta:</span> <strong>-1.5°C</strong></p>
            <p><span className="text-[#617874] font-sans">Pressure delta:</span> <strong>-2.0 hPa</strong></p>
            <p><span className="text-[#617874] font-sans">Wind Speed delta:</span> <strong>+2.5 m/s</strong></p>
            <p><span className="text-[#617874] font-sans">Resulting Risk:</span> <strong className="text-rose-600 font-bold">0.81</strong></p>
            <p><span className="text-[#617874] font-sans">FFD:</span> <strong className="text-amber-700">{ffdValStr}</strong></p>
          </div>
        </div>
      </div>

      {/* Fragility Curve Plot */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8 bg-white border border-[#D2E5DF] rounded-xl p-4 shadow-xs space-y-3">
          <h3 className="font-extrabold text-[#102A2A] text-sm border-b border-[#D2E5DF] pb-2">
            Fragility Curve (Perturbation Level % vs Bust Probability)
          </h3>
          <div className="h-64 w-full">
            {stressData?.stress_curve ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stressData.stress_curve}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="delta" stroke="#64748B" tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                  <YAxis domain={[0, 1]} stroke="#64748B" tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                  <Tooltip contentStyle={{ backgroundColor: '#003B32', color: '#fff', borderRadius: '8px' }} formatter={(val: number) => [`${(val * 100).toFixed(1)}%`, 'Bust Risk']} />
                  <Line type="monotone" dataKey="p_bust" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-[#617874] text-xs font-semibold">
                Stress perturbation curve active for Lead D{detail.lead_day}
              </div>
            )}
          </div>
        </div>

        {/* Diagnostics & Warning Box */}
        <div className="col-span-4 bg-white border border-[#D2E5DF] rounded-xl p-4 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="font-extrabold text-[#102A2A] text-sm border-b border-[#D2E5DF] pb-2">
              Stress Diagnostics
            </h3>
            <div className="space-y-2 text-xs">
              <div className="bg-[#F5FAF8] p-2.5 rounded-lg border border-[#D2E5DF]">
                <span className="font-extrabold text-[#617874] block uppercase text-[10px]">Stress Evidence</span>
                <p className="text-[#102A2A] font-bold mt-0.5">{detail.stress_evidence}</p>
              </div>

              <div className="bg-[#EAF8F3] p-2.5 rounded-lg border border-[#BDEADB]">
                <span className="font-extrabold text-[#005C4B] block uppercase text-[10px]">Fragility AUC</span>
                <p className="text-[#00A878] font-mono font-black text-lg mt-0.5">{detail.fragility_auc.toFixed(3)} ({detail.fragility_category})</p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg text-xs text-orange-950 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-orange-900">Nearest Tested Vulnerability Scenario</p>
              <p className="text-[10px] text-orange-800 mt-0.5">
                Evaluates perturbation stability boundaries; does not imply deterministic future event certainty.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
