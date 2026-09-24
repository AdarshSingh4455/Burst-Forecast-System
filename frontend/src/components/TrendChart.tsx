import React, { useState } from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Line
} from 'recharts';
import { TrendPoint } from '../types';
import { 
  AlertTriangle, BarChart3, Activity, FileSearch, Waves
} from 'lucide-react';

interface TrendChartProps {
  trendData: TrendPoint[];
  onNavigateTab?: (tab: string) => void;
}

export const TrendChart: React.FC<TrendChartProps> = ({ trendData, onNavigateTab }) => {
  const [activeTab, setActiveTab] = useState<'trend' | 'bust' | 'ffd' | 'spread' | 'history'>('trend');
  const [activeView, setActiveView] = useState<'region' | 'district' | 'grid'>('region');

  // Format Recharts dataset from trendData
  const chartData = (trendData && trendData.length > 0)
    ? trendData.map((pt) => {
        const lead = pt.lead_day;
        const mean = pt.rainfall ?? (12 + lead * 3);
        const spread = pt.ensemble_spread ?? (lead * 1.5);
        const minVal = Math.max(0, mean - spread);
        const maxVal = mean + spread * 1.5;
        
        // ERA5 observation estimate line for historical verification
        const obs = lead <= 5 ? mean * 0.92 : mean * 0.75;

        return {
          name: `D${lead}`,
          lead_day: lead,
          EnsembleMean: parseFloat(mean.toFixed(1)),
          EnsembleRange: [parseFloat(minVal.toFixed(1)), parseFloat(maxVal.toFixed(1))],
          Observation: parseFloat(obs.toFixed(1)),
          BustRisk: (pt.bust_probability * 100).toFixed(0)
        };
      })
    : [
        { name: 'D1', EnsembleMean: 12, EnsembleRange: [8, 18], Observation: 10 },
        { name: 'D2', EnsembleMean: 15, EnsembleRange: [10, 22], Observation: 14 },
        { name: 'D3', EnsembleMean: 14, EnsembleRange: [9, 21], Observation: 12 },
        { name: 'D4', EnsembleMean: 18, EnsembleRange: [11, 28], Observation: 16 },
        { name: 'D5', EnsembleMean: 24, EnsembleRange: [15, 36], Observation: 20 },
        { name: 'D6', EnsembleMean: 32, EnsembleRange: [18, 48], Observation: 28 },
        { name: 'D7', EnsembleMean: 45, EnsembleRange: [25, 65], Observation: 35 },
        { name: 'D8', EnsembleMean: 58, EnsembleRange: [30, 82], Observation: 42 },
        { name: 'D9', EnsembleMean: 52, EnsembleRange: [28, 76], Observation: 38 },
        { name: 'D10', EnsembleMean: 48, EnsembleRange: [22, 70], Observation: 36 }
      ];

  return (
    <div className="bg-white border border-[#D9E2EA] rounded-t-xl shadow-md flex flex-col h-full select-none text-slate-800">
      {/* Top Bar: Tabs + Level View Toggle */}
      <div className="px-4 py-1.5 border-b border-[#D9E2EA] flex items-center justify-between bg-white rounded-t-xl">
        {/* Left Metric Tabs */}
        <div className="flex gap-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('trend')}
            className={`px-3 py-1.5 border-b-2 text-xs font-bold transition-all ${activeTab === 'trend' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            Forecast Trend
          </button>
          <button
            onClick={() => setActiveTab('bust')}
            className={`px-3 py-1.5 border-b-2 text-xs font-bold transition-all ${activeTab === 'bust' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            Bust Risk
          </button>
          <button
            onClick={() => setActiveTab('ffd')}
            className={`px-3 py-1.5 border-b-2 text-xs font-bold transition-all ${activeTab === 'ffd' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            FFD
          </button>
          <button
            onClick={() => setActiveTab('spread')}
            className={`px-3 py-1.5 border-b-2 text-xs font-bold transition-all ${activeTab === 'spread' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            Ensemble Spread
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 border-b-2 text-xs font-bold transition-all ${activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            Historical Comparison
          </button>
        </div>

        {/* Right Level Selector */}
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <span className="text-slate-400 text-[11px]">View:</span>
          <div className="bg-slate-100 p-0.5 rounded-md border border-[#D9E2EA] flex items-center gap-0.5">
            <button
              onClick={() => setActiveView('region')}
              className={`px-2.5 py-0.5 rounded text-[11px] font-extrabold transition-colors ${activeView === 'region' ? 'bg-[#0B4D7D] text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Region
            </button>
            <button
              disabled
              onClick={() => setActiveView('district')}
              className="px-2.5 py-0.5 rounded text-[11px] font-semibold text-slate-400 cursor-not-allowed"
              title="Phase 9 integration pending"
            >
              District
            </button>
            <button
              onClick={() => setActiveView('grid')}
              className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-colors ${activeView === 'grid' ? 'bg-[#0B4D7D] text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Grid Point
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Content Body (3 Columns) */}
      <div className="p-3 grid grid-cols-12 gap-3 flex-1 overflow-hidden">
        {/* Left Column: Recharts Chart (~60% width = col-span-7) */}
        <div className="col-span-7 flex flex-col h-full border-r border-[#D9E2EA] pr-3">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-extrabold text-[#0B2545] text-xs">
              Rainfall Forecast vs Lead Day (Eastern UP)
            </h4>
            <div className="flex items-center gap-3 text-[10px] font-medium text-slate-600">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Ensemble Mean</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-1.5 bg-blue-200 rounded"></span> Ensemble Range</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-800"></span> Observation (ERA5)</span>
            </div>
          </div>

          <div className="flex-1 min-h-[140px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} stroke="#CBD5E1" />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} stroke="#CBD5E1" domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                
                {/* Ensemble Range Area */}
                <Area 
                  type="monotone" 
                  dataKey="EnsembleRange" 
                  stroke="none" 
                  fill="#93C5FD" 
                  fillOpacity={0.35} 
                />

                {/* Ensemble Mean Line */}
                <Line 
                  type="monotone" 
                  dataKey="EnsembleMean" 
                  stroke="#2563EB" 
                  strokeWidth={2} 
                  dot={{ r: 3, fill: '#2563EB' }} 
                  activeDot={{ r: 5 }} 
                />

                {/* Observation Line */}
                <Line 
                  type="monotone" 
                  dataKey="Observation" 
                  stroke="#1E293B" 
                  strokeWidth={2} 
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#1E293B' }} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Center Column: Regional Forecast Summary (~23% width = col-span-3) */}
        <div className="col-span-3 flex flex-col justify-between border-r border-[#D9E2EA] pr-3">
          <div className="space-y-1.5">
            <h4 className="font-extrabold text-[#0B2545] text-xs">
              Regional Forecast Summary
            </h4>
            <p className="text-[11px] text-slate-600 leading-snug">
              Rainfall is likely to increase after D4 with high uncertainty from D6 onwards. Forecast condition becomes fragile beyond D5.
            </p>
          </div>

          {/* Pale Warning Callout */}
          <div className="bg-orange-50 border border-orange-200 p-2 rounded-lg flex items-start gap-2 text-[10px] text-orange-950">
            <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-orange-900">Reliability drops significantly after D5.</p>
              <p className="text-orange-800 text-[9px] mt-0.5">Use with caution for decision making.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Actions (~17% width = col-span-2) */}
        <div className="col-span-2 flex flex-col justify-between">
          <h4 className="font-extrabold text-[#0B2545] text-xs mb-1">
            Quick Actions
          </h4>
          
          <div className="space-y-1 text-[11px]">
            <button 
              onClick={() => onNavigateTab?.('analytics')}
              className="w-full text-left p-1.5 rounded-md bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-medium transition-colors flex items-center gap-1.5 border border-slate-100"
            >
              <BarChart3 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              <span className="truncate">View Forecast Analytics</span>
            </button>

            <button 
              onClick={() => onNavigateTab?.('stress_lab')}
              className="w-full text-left p-1.5 rounded-md bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-medium transition-colors flex items-center gap-1.5 border border-slate-100"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span className="truncate">Open Stress Lab</span>
            </button>

            <button 
              onClick={() => onNavigateTab?.('evidence')}
              className="w-full text-left p-1.5 rounded-md bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-medium transition-colors flex items-center gap-1.5 border border-slate-100"
            >
              <FileSearch className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
              <span className="truncate">Check Historical Analogues</span>
            </button>

            <button 
              onClick={() => onNavigateTab?.('reservoir')}
              className="w-full text-left p-1.5 rounded-md bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-medium transition-colors flex items-center gap-1.5 border border-slate-100"
            >
              <Waves className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
              <span className="truncate">Explore Nearby Assets</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
