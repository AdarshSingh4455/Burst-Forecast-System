import React from 'react';
import { Clock, Info } from 'lucide-react';
import { TrustHorizonResponse, GridPointDetail } from '../types';

interface TrustHorizonViewProps {
  trustHorizon: TrustHorizonResponse | null;
  pointDetail: GridPointDetail | null;
}

export const TrustHorizonView: React.FC<TrustHorizonViewProps> = ({ trustHorizon, pointDetail }) => {
  const horizonDay = pointDetail?.trust_horizon_day ?? trustHorizon?.trust_horizon_day ?? 5;
  const breakingDay = pointDetail?.breaking_point_day ?? trustHorizon?.breaking_point_day ?? 6;

  const leadDays = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div className="h-full w-full overflow-y-auto p-4 space-y-4 bg-[#EEF9F4] text-[#033A2B] select-none">
      {/* Top Ultra Light Green Banner Header */}
      <div className="bg-[#F4FAF6] border border-[#C8EAD9] rounded-xl p-4 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-[#044E3A] tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-[#059669]" />
            Trust Horizon Analysis
          </h2>
          <p className="text-xs text-[#065F46] font-semibold mt-0.5">
            Maximum reliable lead time evaluation & sequence-level degradation boundary ({pointDetail ? `${pointDetail.latitude.toFixed(2)}°N, ${pointDetail.longitude.toFixed(2)}°E` : 'Selected Grid Point'})
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs bg-[#D4F0E2] border border-[#C8EAD9] px-3 py-1.5 rounded-lg text-[#044E3A] font-bold">
          <span>Trust Horizon: <strong className="text-[#059669]">D{horizonDay}</strong></span>
          <span>|</span>
          <span>Breaking Point: <strong className="text-rose-600">D{breakingDay}</strong></span>
        </div>
      </div>

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-[#C8EAD9] p-4 rounded-xl shadow-xs text-center space-y-1">
          <span className="text-xs font-extrabold text-[#047857] uppercase">Trust Horizon</span>
          <p className="text-3xl font-black text-[#059669]">D{horizonDay}</p>
          <span className="text-[10px] font-bold text-[#059669] bg-[#E2F5EC] px-2 py-0.5 rounded">Usable Lead Limit</span>
        </div>

        <div className="bg-white border border-[#C8EAD9] p-4 rounded-xl shadow-xs text-center space-y-1">
          <span className="text-xs font-extrabold text-[#047857] uppercase">Breaking Point</span>
          <p className="text-3xl font-black text-rose-600">D{breakingDay}</p>
          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">First Sustained RED</span>
        </div>

        <div className="bg-white border border-[#C8EAD9] p-4 rounded-xl shadow-xs text-center space-y-1">
          <span className="text-xs font-extrabold text-[#047857] uppercase">Trust Index</span>
          <p className="text-3xl font-black text-[#044E3A]">{pointDetail ? pointDetail.trust_index.toFixed(0) : '78'}</p>
          <span className="text-[10px] font-bold text-[#059669] bg-[#E2F5EC] px-2 py-0.5 rounded">Sequence Score</span>
        </div>

        <div className="bg-white border border-[#C8EAD9] p-4 rounded-xl shadow-xs text-center space-y-1">
          <span className="text-xs font-extrabold text-[#047857] uppercase">Sequence Status</span>
          <p className="text-xl font-black text-amber-700 mt-1">{trustHorizon?.stability_status || `Degrades D${breakingDay}+`}</p>
          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">Monitored Sequence</span>
        </div>
      </div>

      {/* D1-D10 Lead Sequence Timeline Card */}
      <div className="bg-white border border-[#C8EAD9] p-4 rounded-xl shadow-xs space-y-3">
        <h3 className="font-extrabold text-[#044E3A] text-sm flex items-center justify-between">
          <span>D1–D10 Lead Sequence Reliability Timeline</span>
          <span className="text-xs text-[#065F46] font-semibold">GREEN (Reliable) → YELLOW (Fragile) → RED (Unreliable)</span>
        </h3>

        <div className="grid grid-cols-10 gap-2 pt-2">
          {leadDays.map((d) => {
            const isGreen = d <= horizonDay;
            const isRed = d >= breakingDay;
            const isYellow = !isGreen && !isRed;
            const colorClass = isGreen ? 'bg-[#059669] text-white border-[#047857]' : isYellow ? 'bg-amber-400 text-slate-900 border-amber-500' : 'bg-rose-500 text-white border-rose-600';
            const label = isGreen ? 'RELIABLE' : isYellow ? 'MONITOR' : 'UNRELIABLE';

            return (
              <div key={d} className={`p-3 rounded-xl border text-center space-y-1.5 shadow-xs transition-transform hover:scale-105 ${colorClass}`}>
                <span className="text-xs font-black block">D{d}</span>
                <span className="text-[9px] font-extrabold uppercase block">{label}</span>
                {d === horizonDay && (
                  <span className="text-[8px] bg-slate-900 text-white px-1 py-0.2 rounded font-mono font-bold block mt-1">
                    HORIZON
                  </span>
                )}
                {d === breakingDay && (
                  <span className="text-[8px] bg-rose-950 text-white px-1 py-0.2 rounded font-mono font-bold block mt-1">
                    BREAKING
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Explanation Box */}
      <div className="bg-[#D4F0E2] border border-[#C8EAD9] p-4 rounded-xl flex items-start gap-3 text-xs text-[#044E3A]">
        <Info className="w-5 h-5 text-[#059669] flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-[#033A2B] text-sm">Trust Horizon Calculation Logic</p>
          <p className="text-[#065F46]">
            The Trust Horizon (D{horizonDay}) represents the final consecutive lead day where the forecast maintains acceptable model confidence and low ensemble disagreement. Beyond D{horizonDay}, model uncertainty expands significantly into D{breakingDay} (Breaking Point).
          </p>
        </div>
      </div>
    </div>
  );
};
