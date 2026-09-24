import React from 'react';
import { ZapOff, AlertTriangle } from 'lucide-react';
import { TrustHorizonResponse, GridPointDetail } from '../types';

interface BreakingPointViewProps {
  trustHorizon: TrustHorizonResponse | null;
  pointDetail: GridPointDetail | null;
}

export const BreakingPointView: React.FC<BreakingPointViewProps> = ({ trustHorizon, pointDetail }) => {
  const breakingDay = pointDetail?.breaking_point_day ?? trustHorizon?.breaking_point_day ?? 6;
  const horizonDay = pointDetail?.trust_horizon_day ?? trustHorizon?.trust_horizon_day ?? 5;

  const leadDays = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div className="h-full w-full overflow-y-auto p-4 space-y-4 bg-[#F5FAF8] text-[#102A2A] select-none">
      {/* Header Banner */}
      <div className="bg-white border border-[#D2E5DF] rounded-xl p-4 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-[#102A2A] tracking-tight flex items-center gap-2">
            <ZapOff className="w-6 h-6 text-rose-600" />
            Breaking Point Analysis
          </h2>
          <p className="text-xs text-[#617874] font-medium mt-0.5">
            Sequence-level failure threshold identification & sustained RED persistence rule ({pointDetail ? `${pointDetail.latitude.toFixed(2)}°N, ${pointDetail.longitude.toFixed(2)}°E` : 'Selected Grid Point'})
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg text-rose-900 font-bold">
          <span>Breaking Point: <strong className="text-rose-600">D{breakingDay}</strong></span>
          <span>|</span>
          <span>Rule: <strong>First RED + Consecutive RED</strong></span>
        </div>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-[#D2E5DF] p-4 rounded-xl shadow-xs text-center space-y-1">
          <span className="text-xs font-extrabold text-[#617874] uppercase">First Sustained RED Day</span>
          <p className="text-3xl font-black text-rose-600">D{breakingDay}</p>
          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">Breaking Boundary</span>
        </div>

        <div className="bg-white border border-[#D2E5DF] p-4 rounded-xl shadow-xs text-center space-y-1">
          <span className="text-xs font-extrabold text-[#617874] uppercase">Trust Horizon Boundary</span>
          <p className="text-3xl font-black text-[#00A878]">D{horizonDay}</p>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Last Reliable Lead</span>
        </div>

        <div className="bg-white border border-[#D2E5DF] p-4 rounded-xl shadow-xs text-center space-y-1">
          <span className="text-xs font-extrabold text-[#617874] uppercase">Persistence Rule Status</span>
          <p className="text-xl font-black text-rose-600 mt-1">Sustained Failure</p>
          <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">D{breakingDay} & D{breakingDay + 1} Consecutively RED</span>
        </div>
      </div>

      {/* Sequence Breakdown Card */}
      <div className="bg-white border border-[#D2E5DF] p-4 rounded-xl shadow-xs space-y-3">
        <h3 className="font-extrabold text-[#102A2A] text-sm">
          Sequence-Level Persistence Evaluation (D1–D10)
        </h3>

        <div className="space-y-2 text-xs">
          {leadDays.map((d) => {
            const isRed = d >= breakingDay;
            const isYellow = d > horizonDay && d < breakingDay;
            const statusText = isRed ? 'RED (Unreliable / High Failure Risk)' : isYellow ? 'YELLOW (Fragile / Elevated Disagreement)' : 'GREEN (Reliable)';

            return (
              <div key={d} className={`p-3 rounded-lg border flex items-center justify-between font-medium ${isRed ? 'bg-rose-50 border-rose-200 text-rose-900' : isYellow ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-[#EAF8F3] border-[#BDEADB] text-[#005C4B]'}`}>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-sm w-8">D{d}</span>
                  <span>{statusText}</span>
                </div>
                {d === breakingDay && (
                  <span className="text-xs font-extrabold bg-rose-600 text-white px-2.5 py-1 rounded shadow-xs uppercase tracking-wider">
                    Breaking Point Triggered
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Rule Explanation */}
      <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-start gap-3 text-xs text-rose-900">
        <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-rose-950 text-sm">Sequence Persistence Rule Definition</p>
          <p className="text-rose-800">
            A <strong>Breaking Point</strong> is defined as the first lead day evaluated as RED that is immediately followed by a second consecutive RED lead day. Single-day spikes do not trigger a Breaking Point unless sustained.
          </p>
        </div>
      </div>
    </div>
  );
};
