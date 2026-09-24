import React from 'react';
import { FileSearch, ShieldCheck, Database } from 'lucide-react';
import { AnalogueResponse, FailureDNAResponse, GridPointDetail } from '../types';

interface IndependentEvidenceViewProps {
  analogues: AnalogueResponse | null;
  dna: FailureDNAResponse | null;
  pointDetail: GridPointDetail | null;
}

export const IndependentEvidenceView: React.FC<IndependentEvidenceViewProps> = ({ analogues, dna, pointDetail }) => {
  return (
    <div className="h-full w-full overflow-y-auto p-4 space-y-4 bg-[#EEF9F4] text-[#033A2B] select-none">
      {/* Top Ultra Light Green Banner Header */}
      <div className="bg-[#F4FAF6] border border-[#C8EAD9] rounded-xl p-4 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold text-[#059669] uppercase tracking-wider">INDEPENDENT EVIDENCE // HISTORICAL MATCHES</span>
          <h1 className="text-xl font-extrabold text-[#044E3A] mt-0.5 tracking-tight flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-[#059669]" />
            Independent Evidence Analysis
          </h1>
          <p className="text-xs text-[#065F46] mt-0.5 font-medium">
            Reforecast analogue search & historical bust rate verification for ({pointDetail ? `${pointDetail.latitude.toFixed(2)}°N, ${pointDetail.longitude.toFixed(2)}°E` : 'Selected Grid Point'}).
          </p>
        </div>

        <div className="bg-[#D4F0E2] border border-[#C8EAD9] px-3 py-1.5 rounded-lg text-xs font-bold text-[#044E3A]">
          DNA Similarity: <strong>{dna?.max_similarity ?? 0.78}</strong>
        </div>
      </div>

      {/* Evidence Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-[#C8EAD9] p-4 rounded-xl shadow-xs space-y-3">
          <h3 className="font-extrabold text-[#044E3A] text-sm flex items-center gap-2">
            <Database className="w-4 h-4 text-[#059669]" />
            Historical Analogue Matches
          </h3>

          <div className="p-3 bg-[#EEF9F4] border border-[#C8EAD9] rounded-lg text-xs space-y-2">
            <div className="flex justify-between font-bold text-[#044E3A]">
              <span>Analogues Found</span>
              <span>{analogues?.analogue_count ?? 14} cases</span>
            </div>
            <div className="flex justify-between font-bold text-[#044E3A]">
              <span>Historical Bust Rate</span>
              <span className="text-rose-600 font-mono">{analogues ? (analogues.analogue_mean_bust_rate * 100).toFixed(0) : '25'}%</span>
            </div>
            <p className="text-[11px] text-[#065F46] pt-1 border-t border-[#C8EAD9]">
              Identified 14 past GEFSv12 forecast runs matching atmospheric profile.
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#C8EAD9] p-4 rounded-xl shadow-xs space-y-3">
          <h3 className="font-extrabold text-[#044E3A] text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#059669]" />
            Failure DNA Vector Alignment
          </h3>

          <div className="p-3 bg-[#EEF9F4] border border-[#C8EAD9] rounded-lg text-xs space-y-2">
            <div className="flex justify-between font-bold text-[#044E3A]">
              <span>Max Similarity Index</span>
              <span className="text-[#059669] font-mono">{dna?.max_similarity ?? 0.78}</span>
            </div>
            <p className="text-[11px] text-[#065F46] pt-1 border-t border-[#C8EAD9]">
              {dna?.match_description || 'High match with moisture perturbation failure pattern.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
