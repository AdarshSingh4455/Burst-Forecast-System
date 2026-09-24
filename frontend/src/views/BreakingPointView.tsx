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
    <div className="h-full w-full overflow-y-auto p-4 space-y-4 bg-[#EEF9F4] text-[#033A2B] select-none">
      {/* Top Ultra Light Green Banner Header */}
      <div className="bg-[#F4FAF6] border border-[#C8EAD9] rounded-xl p-4 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-[#044E3A] tracking-tight flex items-center gap-2">
            <ZapOff className="w-6 h-6 text-rose-600" />
            Breaking Point Analysis
          </h2>
          <p className="text-xs text-[#065F46] font-semibold mt-0.5">
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
        <div className="bg-white border border-[#C8EAD9] p-4 rounded-xl shadow-xs text-center space-y-1">
          <span className="text-xs font-extrabold text-[#047857] uppercase">First Sustained RED Day</span>
          <p className="text-3xl font-black text-rose-600">D{breakingDay}</p>
          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">Breaking Boundary</span>
        </div>

        <div className="bg-white border border-[#C8EAD9] p-4 rounded-xl shadow-xs text-center space-y-1">
          <span className="text-xs font-extrabold text-[#047857] uppercase">Trust Horizon Boundary</span>
          <p className="text-3xl font-black text-[#059669]">D{horizonDay}</p>
          <span className="text-[10px] font-bold text-[#059669] bg-[#E2F5EC] px-2 py-0.5 rounded">Last Reliable Lead</span>
        </div>

        <div className="bg-white border border-[#C8EAD9] p-4 rounded-xl shadow-xs text-center space-y-1">
          <span className="text-xs font-extrabold text-[#047857] uppercase">Persistence Rule Status</span>
          <p className="text-xl font-black text-rose-600 mt-1">Sustained Failure</p>
          <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">D{breakingDay} & D{breakingDay + 1} Consecutively RED</span>
        </div>
      </div>

      {/* Sequence Breakdown Card */}
      <div className="bg-white border border-[#C8EAD9] p-4 rounded-xl shadow-xs space-y-3">
        <h3 className="font-extrabold text-[#044E3A] text-sm">
          Sequence-Level Persistence Evaluation (D1–D10)
        </h3>

        <div className="space-y-2 text-xs">
          {leadDays.map((d) => {
            const isRed = d >= breakingDay;
            const isYellow = d > horizonDay && d < breakingDay;
            const statusText = isRed ? 'RED (Unreliable / High Failure Risk)' : isYellow ? 'YELLOW (Fragile / Elevated Disagreement)' : 'GREEN (Reliable)';

            return (
              <div key={d} className={`p-3 rounded-lg border flex items-center justify-between font-medium ${isRed ? 'bg-rose-50 border-rose-200 text-rose-900' : isYellow ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-[#EEF9F4] border-[#C8EAD9] text-[#044E3A]'}`}>
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
    </div>
  );
};
