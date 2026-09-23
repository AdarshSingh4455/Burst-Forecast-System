import React from 'react';
import { FileSearch, Dna, Users, Sparkles, Database } from 'lucide-react';
import { GridDetail, AnalogueResponse, FailureDNAResponse, AnalogueRecord } from '../types';

interface IndependentEvidenceViewProps {
  analogues?: AnalogueResponse | null;
  dna?: FailureDNAResponse | null;
  pointDetail?: GridDetail | null;
  selectedDetail?: GridDetail | null;
}

export const IndependentEvidenceView: React.FC<IndependentEvidenceViewProps> = ({
  analogues,
  dna,
  pointDetail,
  selectedDetail
}) => {
  const detail = pointDetail || selectedDetail;

  if (!detail) {
    return (
      <div className="p-8 text-center bg-slate-900 rounded-xl border border-slate-800 m-6">
        <FileSearch className="w-12 h-12 text-slate-600 mx-auto mb-2" />
        <h3 className="font-bold text-slate-200">No Grid Point Selected</h3>
        <p className="text-xs text-slate-400 mt-1">Please select a grid point on the map to inspect Independent Evidence streams.</p>
      </div>
    );
  }

  const analogueData = analogues || {
    available: detail.analogue_available === 1,
    analogue_count: detail.analogue_count,
    analogue_mean_bust_rate: detail.analogue_mean_bust_rate,
    analogues: []
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-2xl shadow-xl flex items-center justify-between">
        <div>
          <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">PHASE 6 — INDEPENDENT EVIDENCE LAYER</span>
          <h1 className="text-2xl font-extrabold mt-1">4 Decoupled Evidence Streams</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Provides leak-free historical analogues, Failure DNA pattern matching, lead-wise ensemble disagreement, and training-referenced OOD novelty detection.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-cyan-400">
            <Database className="w-5 h-5" />
            <h3 className="font-bold text-sm text-slate-100">Historical Analogues</h3>
          </div>
          <p className="text-xs text-slate-400">KNN search over prior forecast dates (T_prior &lt; T).</p>
          <div className="pt-2 border-t border-slate-800 text-xs">
            <span className="text-slate-400 block">Status:</span>
            <span className="font-bold text-slate-100 font-mono">
              {detail.analogue_available === 1 
                ? `${(detail.analogue_mean_bust_rate * 100).toFixed(0)}% Hist Bust Rate` 
                : 'No Prior History Available'}
            </span>
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-purple-400">
            <Dna className="w-5 h-5" />
            <h3 className="font-bold text-sm text-slate-100">Failure DNA Match</h3>
          </div>
          <p className="text-xs text-slate-400">6D fingerprint similarity to verified past busts.</p>
          <div className="pt-2 border-t border-slate-800 text-xs">
            <span className="text-slate-400 block">Max Similarity:</span>
            <span className="font-bold text-purple-400 font-mono">
              {((dna?.max_similarity ?? detail.failure_dna_max_sim) * 100).toFixed(1)}% ({(dna?.risk_flag ?? detail.failure_dna_risk_flag) === 1 ? 'High Risk' : 'Low Risk'})
            </span>
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-emerald-400">
            <Users className="w-5 h-5" />
            <h3 className="font-bold text-sm text-slate-100">Ensemble Disagreement</h3>
          </div>
          <p className="text-xs text-slate-400">Percentile spread & range rank per lead day.</p>
          <div className="pt-2 border-t border-slate-800 text-xs">
            <span className="text-slate-400 block">Category:</span>
            <span className="font-bold text-emerald-400 font-mono">
              {detail.ensemble_disagreement_category} ({detail.ensemble_disagreement_score.toFixed(1)}/100)
            </span>
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-amber-400">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-bold text-sm text-slate-100">OOD / Novelty</h3>
          </div>
          <p className="text-xs text-slate-400">Training-referenced Isolation Forest.</p>
          <div className="pt-2 border-t border-slate-800 text-xs">
            <span className="text-slate-400 block">Category:</span>
            <span className="font-bold text-amber-400 font-mono">
              {detail.ood_category} ({detail.ood_score.toFixed(1)}/100)
            </span>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-slate-200 border-b border-slate-800 pb-2">Top Prior Historical Analogues</h3>
        {analogueData?.analogues && analogueData.analogues.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Rank</th>
                  <th className="py-2 px-3">Analogue Init Date</th>
                  <th className="py-2 px-3">Location</th>
                  <th className="py-2 px-3">Euclidean Dist</th>
                  <th className="py-2 px-3">Past Bust Label</th>
                  <th className="py-2 px-3">Corridor ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {analogueData.analogues.map((rec: AnalogueRecord, i: number) => (
                  <tr key={i} className="hover:bg-slate-800/50">
                    <td className="py-2 px-3 font-bold">#{rec.analogue_rank}</td>
                    <td className="py-2 px-3 font-mono">{rec.analogue_forecast_init}</td>
                    <td className="py-2 px-3">{rec.analogue_latitude.toFixed(2)}°N, {rec.analogue_longitude.toFixed(2)}°E</td>
                    <td className="py-2 px-3 font-mono">{rec.analogue_dist.toFixed(3)}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded font-bold ${rec.analogue_bust_label === 1 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                        {rec.analogue_bust_label === 1 ? 'BUST' : 'NO BUST'}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono">Corridor #{rec.analogue_corridor_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic p-3 bg-slate-950 rounded-lg border border-slate-800">
            {detail.analogue_available === 1 ? 'Analogues verified for current forecast step.' : 'First available initialization date (2019-07-01 00Z) in pilot sequence: strictly 0 prior historical analogue candidates available.'}
          </p>
        )}
      </div>
    </div>
  );
};
