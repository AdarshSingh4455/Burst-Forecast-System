import React, { useState } from 'react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend 
} from 'recharts';
import { PointTrendItem } from '../types';

interface TrendChartProps {
  trendData: PointTrendItem[];
  title?: string;
}

export const TrendChart: React.FC<TrendChartProps> = ({ trendData, title = "D1–D10 Forecast Trend" }) => {
  const [activeTab, setActiveTab] = useState<'rainfall' | 'bust' | 'ffd' | 'trust' | 'ood'>('bust');

  if (!trendData || trendData.length === 0) {
    return (
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center h-48 text-xs text-slate-400">
        No trend data available for selected point.
      </div>
    );
  }

  const chartConfigs = {
    rainfall: { dataKey: 'rainfall', color: '#3b82f6', name: 'Rainfall (mm)', unit: 'mm' },
    bust: { dataKey: 'bust_probability', color: '#ef4444', name: 'Bust Risk P(Bust)', unit: '' },
    ffd: { dataKey: 'ffd', color: '#8b5cf6', name: 'Stress FFD', unit: '' },
    trust: { dataKey: 'trust_index', color: '#10b981', name: 'Trust Index', unit: '/100' },
    ood: { dataKey: 'ood_score', color: '#f59e0b', name: 'OOD Score', unit: '/100' },
  };

  const cfg = chartConfigs[activeTab];

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
        <h3 className="font-bold text-sm text-slate-800 tracking-wide">{title}</h3>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveTab('bust')}
            className={`px-2.5 py-1 rounded transition-colors ${activeTab === 'bust' ? 'bg-white text-rose-600 shadow' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Bust Risk
          </button>
          <button
            onClick={() => setActiveTab('rainfall')}
            className={`px-2.5 py-1 rounded transition-colors ${activeTab === 'rainfall' ? 'bg-white text-blue-600 shadow' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Rainfall
          </button>
          <button
            onClick={() => setActiveTab('ffd')}
            className={`px-2.5 py-1 rounded transition-colors ${activeTab === 'ffd' ? 'bg-white text-purple-600 shadow' : 'text-slate-600 hover:text-slate-900'}`}
          >
            FFD
          </button>
          <button
            onClick={() => setActiveTab('trust')}
            className={`px-2.5 py-1 rounded transition-colors ${activeTab === 'trust' ? 'bg-white text-emerald-600 shadow' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Trust Index
          </button>
          <button
            onClick={() => setActiveTab('ood')}
            className={`px-2.5 py-1 rounded transition-colors ${activeTab === 'ood' ? 'bg-white text-amber-600 shadow' : 'text-slate-600 hover:text-slate-900'}`}
          >
            OOD
          </button>
        </div>
      </div>

      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="lead_day" 
              tickFormatter={(v) => `D${v}`} 
              tick={{ fontSize: 11, fill: '#64748b' }}
            />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
            <Tooltip 
              formatter={(val: number) => [`${val} ${cfg.unit}`, cfg.name]}
              labelFormatter={(lbl) => `Lead Day D${lbl}`}
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
            />
            <Line 
              type="monotone" 
              dataKey={cfg.dataKey} 
              stroke={cfg.color} 
              strokeWidth={2.5} 
              dot={{ r: 4, fill: cfg.color }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
