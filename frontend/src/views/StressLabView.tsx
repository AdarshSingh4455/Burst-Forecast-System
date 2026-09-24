import React from 'react';
import { Activity, ShieldAlert, Zap } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { StressTestResponse, GridPointDetail } from '../types';

interface StressLabViewProps {
  stressData: StressTestResponse | null;
  pointDetail: GridPointDetail | null;
}

export const StressLabView: React.FC<StressLabViewProps> = ({ stressData, pointDetail }) => {
  const curveData = stressData?.stress_curve || [
    { delta: -3.0, p_bust: 0.18, variable: 'Temperature' },
    { delta: -2.0, p_bust: 0.22, variable: 'Temperature' },
    { delta: -1.0, p_bust: 0.35, variable: 'Temperature' },
    { delta: 0.0, p_bust: 0.62, variable: 'Baseline' },
    { delta: 1.0, p_bust: 0.78, variable: 'Temperature' },
    { delta: 2.0, p_bust: 0.85, variable: 'Temperature' },
    { delta: 3.0, p_bust: 0.91, variable: 'Temperature' }
  ];

  const chartData = curveData.map(c => ({
    name: `${c.delta > 0 ? '+' : ''}${c.delta}°C`,
    'Bust Risk (%)': parseFloat((c.p_bust * 100).toFixed(1))
  }));

  return (
    <div className="h-full w-full overflow-y-auto p-4 space-y-4 bg-[#EEF9F4] text-[#033A2B] select-none">
      {/* Top Ultra Light Green Banner Header */}
      <div className="bg-[#F4FAF6] border border-[#C8EAD9] rounded-xl p-4 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold text-[#059669] uppercase tracking-wider">STRESS LAB // PERTURBATION TESTING</span>
          <h1 className="text-xl font-extrabold text-[#044E3A] mt-0.5 tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#059669]" />
            Stress Lab & Fragility Analysis
          </h1>
          <p className="text-xs text-[#065F46] mt-0.5 font-medium">
            Forecast Failure Distance (FFD) curve evaluation for target grid point ({pointDetail ? `${pointDetail.latitude.toFixed(2)}°N, ${pointDetail.longitude.toFixed(2)}°E` : 'Selected Grid Point'}).
          </p>
        </div>

        <div className="bg-[#D4F0E2] border border-[#C8EAD9] px-3 py-1.5 rounded-lg text-xs font-bold text-[#044E3A]">
          FFD Score: <strong className="text-amber-800">{pointDetail?.ffd ?? 0.32}</strong> ({pointDetail?.fragility_category || 'Fragile'})
        </div>
      </div>

      {/* Stress Test Curve Chart */}
      <div className="bg-white border border-[#C8EAD9] rounded-xl p-4 shadow-xs space-y-3">
        <h3 className="font-extrabold text-[#044E3A] text-sm flex items-center justify-between">
          <span>Perturbation vs. Bust Probability Curve</span>
          <span className="text-xs text-[#065F46] font-normal">Baseline Bust Risk: {pointDetail ? (pointDetail.baseline_p_bust * 100).toFixed(0) : '62'}%</span>
        </h3>

        <div className="h-[280px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#047857' }} stroke="#CBD5E1" />
              <YAxis tick={{ fontSize: 11, fill: '#047857' }} stroke="#CBD5E1" />
              <Tooltip />
              <Line type="monotone" dataKey="Bust Risk (%)" stroke="#DC2626" strokeWidth={3} dot={{ r: 5, fill: '#DC2626' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
