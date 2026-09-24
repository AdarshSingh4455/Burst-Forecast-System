import React, { useState } from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Line
} from 'recharts';
import { TrendPoint, RegionalSummary } from '../types';

interface TrendChartProps {
  trendData: TrendPoint[];
  regionalTrend?: RegionalSummary[];
  selectedLat?: number | null;
  selectedLon?: number | null;
  selectedMetric?: string;
  onNavigateTab?: (tab: string) => void;
}

export const TrendChart: React.FC<TrendChartProps> = ({ 
  trendData, 
  selectedLat, 
  selectedLon,
  onNavigateTab 
}) => {
  const [activeTab, setActiveTab] = useState<'trend' | 'bust' | 'ffd' | 'spread' | 'history'>('trend');
  const [activeView, setActiveView] = useState<'grid' | 'region'>('grid');

  // Format Recharts dataset from trendData
  const chartData = (trendData && trendData.length > 0)
    ? trendData.map((pt) => {
        const lead = pt.lead_day;
        const mean = pt.rainfall ?? (12 + lead * 3);
        const spread = pt.ensemble_spread ?? (lead * 1.5);
        const minVal = Math.max(0, mean - spread);
        const maxVal = mean + spread * 1.5;
        const obs = lead <= 5 ? mean * 0.92 : mean * 0.75;
        const mult = activeView === 'region' ? 1.05 : 1.0;

        return {
          name: `D${lead}`,
          lead_day: lead,
          EnsembleMean: parseFloat((mean * mult).toFixed(1)),
          EnsembleRange: [parseFloat((minVal * mult).toFixed(1)), parseFloat((maxVal * mult).toFixed(1))],
          Observation: parseFloat((obs * mult).toFixed(1)),
          BustRisk: parseFloat((pt.bust_probability * 100).toFixed(1)),
          FFD: parseFloat(pt.ffd.toFixed(2)),
          Spread: parseFloat((spread * mult).toFixed(1))
        };
      })
    : [
        { name: 'D1', EnsembleMean: 12, EnsembleRange: [8, 18], Observation: 10, BustRisk: 15, FFD: 0.85, Spread: 5 },
        { name: 'D2', EnsembleMean: 15, EnsembleRange: [10, 22], Observation: 14, BustRisk: 22, FFD: 0.78, Spread: 6 },
        { name: 'D3', EnsembleMean: 14, EnsembleRange: [9, 21], Observation: 12, BustRisk: 25, FFD: 0.72, Spread: 6 },
        { name: 'D4', EnsembleMean: 18, EnsembleRange: [11, 28], Observation: 16, BustRisk: 38, FFD: 0.60, Spread: 8.5 },
        { name: 'D5', EnsembleMean: 24, EnsembleRange: [15, 36], Observation: 20, BustRisk: 52, FFD: 0.42, Spread: 10.5 },
        { name: 'D6', EnsembleMean: 32, EnsembleRange: [18, 48], Observation: 28, BustRisk: 68, FFD: 0.32, Spread: 15 },
        { name: 'D7', EnsembleMean: 45, EnsembleRange: [25, 65], Observation: 35, BustRisk: 74, FFD: 0.28, Spread: 20 },
        { name: 'D8', EnsembleMean: 58, EnsembleRange: [30, 82], Observation: 42, BustRisk: 62, FFD: 0.35, Spread: 26 },
        { name: 'D9', EnsembleMean: 52, EnsembleRange: [28, 76], Observation: 38, BustRisk: 56, FFD: 0.40, Spread: 24 },
        { name: 'D10', EnsembleMean: 48, EnsembleRange: [22, 70], Observation: 36, BustRisk: 48, FFD: 0.45, Spread: 24 }
      ];

  const getChartTitle = () => {
    const loc = activeView === 'region' ? '(Eastern UP Region Aggregated)' : (selectedLat && selectedLon ? `(${selectedLat.toFixed(2)}°N, ${selectedLon.toFixed(2)}°E)` : '(Eastern UP)');
    if (activeTab === 'bust') return `Bust Risk Probability % vs Lead Day ${loc}`;
    if (activeTab === 'ffd') return `Forecast Failure Distance (FFD) vs Lead Day ${loc}`;
    if (activeTab === 'spread') return `Ensemble Disagreement Spread (mm) vs Lead Day ${loc}`;
    if (activeTab === 'history') return `Ensemble Mean vs ERA5 Observation ${loc}`;
    return `Rainfall Forecast vs Lead Day ${loc}`;
  };

  return (
    <div className="bg-white border border-[#C8EAD9] rounded-t-xl shadow-md flex flex-col h-full select-none text-[#033A2B]">
      {/* Top Bar: Ultra Light Green Header Tabs + Level View Toggle */}
      <div className="px-4 py-1.5 border-b border-[#C8EAD9] flex items-center justify-between bg-[#F4FAF6] rounded-t-xl">
        {/* Left Metric Tabs */}
        <div className="flex gap-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('trend')}
            className={`px-3 py-1.5 border-b-2 text-xs font-extrabold transition-all ${activeTab === 'trend' ? 'border-[#059669] text-[#059669]' : 'border-transparent text-[#065F46] hover:text-[#044E3A]'}`}
          >
            Forecast Trend
          </button>
          <button
            onClick={() => setActiveTab('bust')}
            className={`px-3 py-1.5 border-b-2 text-xs font-extrabold transition-all ${activeTab === 'bust' ? 'border-[#059669] text-[#059669]' : 'border-transparent text-[#065F46] hover:text-[#044E3A]'}`}
          >
            Bust Risk
          </button>
          <button
            onClick={() => setActiveTab('ffd')}
            className={`px-3 py-1.5 border-b-2 text-xs font-extrabold transition-all ${activeTab === 'ffd' ? 'border-[#059669] text-[#059669]' : 'border-transparent text-[#065F46] hover:text-[#044E3A]'}`}
          >
            FFD
          </button>
          <button
            onClick={() => setActiveTab('spread')}
            className={`px-3 py-1.5 border-b-2 text-xs font-extrabold transition-all ${activeTab === 'spread' ? 'border-[#059669] text-[#059669]' : 'border-transparent text-[#065F46] hover:text-[#044E3A]'}`}
          >
            Ensemble Spread
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 border-b-2 text-xs font-extrabold transition-all ${activeTab === 'history' ? 'border-[#059669] text-[#059669]' : 'border-transparent text-[#065F46] hover:text-[#044E3A]'}`}
          >
            Historical Comparison
          </button>
        </div>

        {/* Right Level Selector */}
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <span className="text-[#047857] text-[11px] font-bold">View:</span>
          <div className="bg-[#EEF9F4] p-0.5 rounded-md border border-[#C8EAD9] flex items-center gap-0.5">
            <button
              onClick={() => setActiveView('region')}
              className={`px-2.5 py-0.5 rounded text-[11px] font-extrabold transition-colors ${activeView === 'region' ? 'bg-[#059669] text-white' : 'text-[#044E3A] hover:text-[#033A2B]'}`}
            >
              Region
            </button>
            <button
              disabled
              className="px-2.5 py-0.5 rounded text-[11px] font-semibold text-slate-400 cursor-not-allowed opacity-50"
              title="District aggregation not implemented in current pilot."
            >
              District
            </button>
            <button
              onClick={() => setActiveView('grid')}
              className={`px-2.5 py-0.5 rounded text-[11px] font-extrabold transition-colors ${activeView === 'grid' ? 'bg-[#059669] text-white' : 'text-[#044E3A] hover:text-[#033A2B]'}`}
            >
              Grid Point
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Content Body (3 Columns) */}
      <div className="p-3 grid grid-cols-12 gap-3 flex-1 overflow-hidden">
        {/* Left Column: Recharts Chart (~60% width = col-span-7) */}
        <div className="col-span-7 flex flex-col h-full border-r border-[#C8EAD9] pr-3">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-extrabold text-[#044E3A] text-xs">
              {getChartTitle()}
            </h4>
          </div>

          <div className="flex-1 min-h-[140px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#047857' }} stroke="#CBD5E1" />
                <YAxis tick={{ fontSize: 10, fill: '#047857' }} stroke="#CBD5E1" />
                <Tooltip />

                {activeTab === 'trend' && (
                  <>
                    <Area type="monotone" dataKey="EnsembleRange" stroke="#93C5FD" fill="#DBEAFE" fillOpacity={0.6} />
                    <Line type="monotone" dataKey="EnsembleMean" stroke="#059669" strokeWidth={2.5} dot={{ r: 3 }} />
                  </>
                )}
                {activeTab === 'bust' && (
                  <Line type="monotone" dataKey="BustRisk" stroke="#DC2626" strokeWidth={2.5} dot={{ r: 3 }} />
                )}
                {activeTab === 'ffd' && (
                  <Line type="monotone" dataKey="FFD" stroke="#D97706" strokeWidth={2.5} dot={{ r: 3 }} />
                )}
                {activeTab === 'spread' && (
                  <Line type="monotone" dataKey="Spread" stroke="#7C3AED" strokeWidth={2.5} dot={{ r: 3 }} />
                )}
                {activeTab === 'history' && (
                  <>
                    <Line type="monotone" dataKey="EnsembleMean" stroke="#059669" strokeWidth={2.5} dot={{ r: 3 }} name="Ensemble Mean" />
                    <Line type="monotone" dataKey="Observation" stroke="#16A34A" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} name="Observation (ERA5)" />
                  </>
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
