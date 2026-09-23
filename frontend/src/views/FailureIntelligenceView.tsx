import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { GridDetail, FailureCorridor, FingerprintResponse } from '../types';

interface FailureIntelligenceViewProps {
  fingerprint?: FingerprintResponse | null;
  corridors?: FailureCorridor[];
  pointDetail?: GridDetail | null;
  selectedDetail?: GridDetail | null;
}

export const FailureIntelligenceView: React.FC<FailureIntelligenceViewProps> = ({
  fingerprint,
  corridors,
  pointDetail,
  selectedDetail
}) => {
  const detail = pointDetail || selectedDetail;

  if (!detail) {
    return (
      <div className="p-8 text-center bg-slate-900 rounded-xl border border-slate-800 m-6">
        <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto mb-2" />
        <h3 className="font-bold text-slate-200">No Grid Point Selected</h3>
        <p className="text-xs text-slate-400 mt-1">Please select a grid point on the map to inspect Failure Corridors and Fingerprints.</p>
      </div>
    );
  }

  const fingerprintData = [
    { name: 'Moisture', value: fingerprint?.features?.moisture ?? detail.fingerprint_moisture, fill: '#3b82f6' },
    { name: 'Temp', value: fingerprint?.features?.temperature ?? detail.fingerprint_temperature, fill: '#ef4444' },
    { name: 'Pressure', value: fingerprint?.features?.pressure ?? detail.fingerprint_pressure, fill: '#64748b' },
    { name: 'Wind', value: fingerprint?.features?.wind ?? detail.fingerprint_wind, fill: '#14b8a6' },
    { name: 'Ensemble', value: fingerprint?.features?.ensemble ?? detail.fingerprint_ensemble, fill: '#8b5cf6' },
    { name: 'Novelty', value: fingerprint?.features?.novelty ?? detail.fingerprint_novelty, fill: '#f59e0b' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-2xl shadow-xl flex items-center justify-between">
        <div>
          <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">PHASE 5 — FAILURE INTELLIGENCE</span>
          <h1 className="text-2xl font-extrabold mt-1">Failure Corridors & 6D Fingerprints</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Identifies dominant atmospheric sensitivity clusters (K=2 KMeans Corridors) and constructs 6-dimensional diagnostic Failure Fingerprints (0–100 percentile scale).
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400 block">Corridor Cluster</span>
          <span className="text-xl font-bold text-emerald-400 font-mono">{detail.failure_corridor_label}</span>
        </div>
      </div>

      {corridors && corridors.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {corridors.map((c) => (
            <div key={c.corridor_id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-200">Corridor {c.corridor_id}: {c.corridor_name}</span>
                <span className="text-xs font-mono font-bold text-emerald-400">{c.percentage.toFixed(1)}% ({c.case_count} cases)</span>
              </div>
              <p className="text-xs text-slate-400">{c.description}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-200 border-b border-slate-800 pb-2">6D Failure Fingerprint Profile</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fingerprintData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} formatter={(val: number) => [`${val.toFixed(1)} / 100`, 'Percentile Rank']} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-200 border-b border-slate-800 pb-2">Corridor & Fingerprint Diagnostics</h3>
          <div className="space-y-3 text-xs">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="font-bold text-emerald-400 block">Fingerprint Dominant Label:</span>
              <p className="text-slate-200 font-bold text-sm mt-0.5">{fingerprint?.fingerprint_label || detail.failure_fingerprint_label}</p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="font-bold text-slate-400 block">Primary Vulnerability Classification:</span>
              <p className="text-slate-200 font-semibold mt-0.5">{detail.primary_vulnerability}</p>
            </div>

            <div className="bg-amber-950/20 p-3 rounded-xl border border-amber-800/40 text-amber-300">
              <span className="font-bold block">Scientific Corridor Note:</span>
              <p className="mt-0.5 text-[11px]">
                The corridor imbalance is observed in the current Eastern UP prototype dataset and stress-test configuration; broader physical interpretation requires multi-year validation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
