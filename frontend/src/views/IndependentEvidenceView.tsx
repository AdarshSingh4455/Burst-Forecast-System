import React from 'react';
import { FileSearch, Layers, Clock, ShieldCheck } from 'lucide-react';
import { GridDetail, AnalogueResponse, FailureDNAResponse } from '../types';

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
      <div className="h-full w-full p-8 text-center bg-white border border-[#D2E5DF] rounded-xl m-4 space-y-2">
        <FileSearch className="w-12 h-12 text-[#00A878] mx-auto" />
        <h3 className="font-bold text-[#102A2A]">No Grid Point Selected</h3>
        <p className="text-xs text-[#617874]">Please select a grid point on the map to evaluate Independent Evidence.</p>
      </div>
    );
  }

  const analogueList = analogues?.analogues || [];

  return (
    <div className="h-full w-full overflow-y-auto p-4 space-y-4 bg-[#F5FAF8] text-[#102A2A] select-none">
      {/* Top Banner Header */}
      <div className="bg-white border border-[#D2E5DF] rounded-xl p-4 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold text-[#00A878] uppercase tracking-wider">PHASE 6 — INDEPENDENT EVIDENCE LAYER</span>
          <h1 className="text-xl font-extrabold text-[#102A2A] mt-0.5 tracking-tight">Independent Evidence & Historical Analogues</h1>
          <p className="text-xs text-[#617874] mt-0.5 font-medium">
            Evaluates non-ML evidence streams: Historical Analogues, Failure DNA similarity, Ensemble Disagreement, and Out-of-Distribution (OOD) Novelty.
          </p>
        </div>

        <div className="text-right bg-[#EAF8F3] border border-[#BDEADB] px-4 py-2 rounded-xl text-[#005C4B]">
          <span className="text-[10px] font-bold text-[#617874] uppercase block">Analogue Matches</span>
          <span className="text-2xl font-black text-[#00A878] font-mono">{analogues?.analogue_count ?? detail.analogue_count}</span>
        </div>
      </div>

      {/* 4 Top Cards */}
      <div className="grid grid-cols-4 gap-4">
        {/* 1. Historical Analogues */}
        <div className="bg-white border border-[#D2E5DF] p-4 rounded-xl shadow-xs space-y-1">
          <span className="text-[10px] font-extrabold text-[#617874] uppercase">Historical Analogues</span>
          <p className="text-2xl font-black text-[#102A2A]">{analogues?.analogue_count ?? detail.analogue_count}</p>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded block w-fit">
            Bust Rate: {((analogues?.analogue_mean_bust_rate ?? detail.analogue_mean_bust_rate) * 100).toFixed(0)}%
          </span>
        </div>

        {/* 2. Failure DNA */}
        <div className="bg-white border border-[#D2E5DF] p-4 rounded-xl shadow-xs space-y-1">
          <span className="text-[10px] font-extrabold text-[#617874] uppercase">Failure DNA</span>
          <p className="text-2xl font-black font-mono text-purple-700">{(dna?.max_similarity ?? detail.failure_dna_max_sim).toFixed(2)}</p>
          <span className="text-[10px] font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded block w-fit">
            Match Similarity
          </span>
        </div>

        {/* 3. Ensemble Disagreement */}
        <div className="bg-white border border-[#D2E5DF] p-4 rounded-xl shadow-xs space-y-1">
          <span className="text-[10px] font-extrabold text-[#617874] uppercase">Ensemble Spread</span>
          <p className="text-2xl font-black text-rose-600">{detail.ensemble_disagreement_category}</p>
          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded block w-fit">
            Disagreement Category
          </span>
        </div>

        {/* 4. OOD Novelty */}
        <div className="bg-white border border-[#D2E5DF] p-4 rounded-xl shadow-xs space-y-1">
          <span className="text-[10px] font-extrabold text-[#617874] uppercase">OOD Score</span>
          <p className="text-2xl font-black text-amber-800 font-mono">{detail.ood_score ? detail.ood_score.toFixed(0) : '78'}</p>
          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded block w-fit">
            {detail.ood_category}
          </span>
        </div>
      </div>

      {/* Top Analogues Table */}
      <div className="bg-white border border-[#D2E5DF] rounded-xl shadow-xs overflow-hidden">
        <div className="p-3 border-b border-[#D2E5DF] bg-[#F5FAF8] flex justify-between items-center">
          <h3 className="font-extrabold text-[#102A2A] text-xs uppercase tracking-wider">
            Top Historical Analogues
          </h3>
          <span className="text-[10px] font-mono text-[#617874]">KNN Atmospheric Match</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-[#102A2A]">
            <thead className="bg-[#003B32] text-white uppercase text-[10px] font-bold">
              <tr>
                <th className="py-2.5 px-3">Rank</th>
                <th className="py-2.5 px-3">Forecast Init Date</th>
                <th className="py-2.5 px-3">Location</th>
                <th className="py-2.5 px-3">Distance</th>
                <th className="py-2.5 px-3">Historical Bust?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D2E5DF] font-mono">
              {analogueList.length > 0 ? (
                analogueList.map((a) => (
                  <tr key={a.analogue_rank} className="hover:bg-[#EAF8F3]">
                    <td className="py-2.5 px-3 font-bold font-sans">#{a.analogue_rank}</td>
                    <td className="py-2.5 px-3">{a.analogue_forecast_init}</td>
                    <td className="py-2.5 px-3">{a.analogue_latitude.toFixed(2)}°N, {a.analogue_longitude.toFixed(2)}°E</td>
                    <td className="py-2.5 px-3">{a.analogue_dist.toFixed(3)}</td>
                    <td className="py-2.5 px-3 font-sans">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        a.analogue_bust_label === 1 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {a.analogue_bust_label === 1 ? 'YES (Bust)' : 'NO (Verified)'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[#617874] font-sans text-xs">
                    No prior historical analogue available for this forecast run.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
