import React from 'react';
import { ShieldAlert, Activity, CheckCircle2 } from 'lucide-react';
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
      <div className="h-full w-full p-8 text-center bg-white border border-[#D2E5DF] rounded-xl m-4 space-y-2">
        <ShieldAlert className="w-12 h-12 text-[#00A878] mx-auto" />
        <h3 className="font-bold text-[#102A2A]">No Grid Point Selected</h3>
        <p className="text-xs text-[#617874]">Please select a grid point on the map to inspect Failure Corridors and Fingerprints.</p>
      </div>
    );
  }

  const fingerprintData = [
    { name: 'Moisture', value: fingerprint?.features?.moisture ?? detail.fingerprint_moisture, fill: '#00A878' },
    { name: 'Temp', value: fingerprint?.features?.temperature ?? detail.fingerprint_temperature, fill: '#EF4444' },
    { name: 'Pressure', value: fingerprint?.features?.pressure ?? detail.fingerprint_pressure, fill: '#64748B' },
    { name: 'Wind', value: fingerprint?.features?.wind ?? detail.fingerprint_wind, fill: '#14B8A6' },
    { name: 'Ensemble', value: fingerprint?.features?.ensemble ?? detail.fingerprint_ensemble, fill: '#8B5CF6' },
    { name: 'Novelty', value: fingerprint?.features?.novelty ?? detail.fingerprint_novelty, fill: '#F59E0B' },
  ];

  return (
    <div className="h-full w-full overflow-y-auto p-4 space-y-4 bg-[#F5FAF8] text-[#102A2A] select-none">
      {/* Top Banner Header */}
      <div className="bg-white border border-[#D2E5DF] rounded-xl p-4 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold text-[#00A878] uppercase tracking-wider">PHASE 5 — FAILURE INTELLIGENCE</span>
          <h1 className="text-xl font-extrabold text-[#102A2A] mt-0.5 tracking-tight">Failure Corridors & 6D Fingerprints</h1>
          <p className="text-xs text-[#617874] mt-0.5 font-medium">
            Identifies dominant atmospheric sensitivity clusters (K=2 KMeans Corridors) and constructs 6-dimensional diagnostic Failure Fingerprints.
          </p>
        </div>

        <div className="text-right bg-[#EAF8F3] border border-[#BDEADB] px-4 py-2 rounded-xl text-[#005C4B]">
          <span className="text-[10px] font-bold text-[#617874] uppercase block">Corridor Cluster</span>
          <span className="text-lg font-black text-[#00A878] font-mono">{detail.failure_corridor_label}</span>
        </div>
      </div>

      {corridors && corridors.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {corridors.map((c) => (
            <div key={c.corridor_id} className="bg-white border border-[#D2E5DF] p-4 rounded-xl shadow-xs space-y-2">
              <div className="flex justify-between items-center border-b border-[#D2E5DF] pb-1.5">
                <span className="text-sm font-extrabold text-[#102A2A]">Corridor {c.corridor_id}: {c.corridor_name}</span>
                <span className="text-xs font-mono font-bold text-[#00A878]">{c.percentage.toFixed(1)}% ({c.case_count} cases)</span>
              </div>
              <p className="text-xs text-[#617874]">{c.description}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-12 gap-4">
        {/* Bar Chart 6D Profile (col-span-7) */}
        <div className="col-span-7 bg-white border border-[#D2E5DF] rounded-xl p-4 shadow-xs space-y-3">
          <h3 className="font-extrabold text-[#102A2A] text-sm border-b border-[#D2E5DF] pb-2">
            6D Failure Fingerprint Profile (Percentile Ranks)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fingerprintData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#64748B" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} stroke="#64748B" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#003B32', color: '#fff', borderRadius: '8px' }} formatter={(val: number) => [`${val.toFixed(1)} / 100`, 'Percentile Rank']} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Diagnostic Values Table (col-span-5) */}
        <div className="col-span-5 bg-white border border-[#D2E5DF] rounded-xl p-4 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="font-extrabold text-[#102A2A] text-sm border-b border-[#D2E5DF] pb-2">
              Fingerprint Diagnostics & Values
            </h3>
            <div className="space-y-2 text-xs">
              <div className="bg-[#EAF8F3] p-2.5 rounded-lg border border-[#BDEADB]">
                <span className="font-bold text-[#005C4B] block uppercase text-[10px]">Dominant Label</span>
                <p className="text-[#00A878] font-black text-sm mt-0.5">{fingerprint?.fingerprint_label || detail.failure_fingerprint_label}</p>
              </div>

              <div className="bg-[#F5FAF8] p-2.5 rounded-lg border border-[#D2E5DF]">
                <span className="font-bold text-[#617874] block uppercase text-[10px]">Primary Vulnerability</span>
                <p className="text-[#102A2A] font-bold mt-0.5">{detail.primary_vulnerability}</p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-950">
            <span className="font-bold block text-amber-900">Scientific Corridor Note</span>
            <p className="mt-0.5 text-[10px] text-amber-800">
              Fingerprint percentile values reflect sensitivity patterns derived from Eastern UP historical reforecasts and perturbation tests.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
