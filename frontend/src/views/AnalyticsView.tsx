import React, { useEffect, useState } from 'react';
import { fetchRegionalTrend } from '../lib/api';
import { RegionalTrendItem, GridPointMap } from '../types';
import { BarChart3, TrendingUp, Layers } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

interface AnalyticsViewProps {
  selectedRun: string;
  selectedLead?: number;
  selectedRegion?: string;
  gridPoints?: GridPointMap[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ selectedRun, selectedRegion = 'ALL' }) => {
  const [regionalTrend, setRegionalTrend] = useState<RegionalTrendItem[]>([]);
  const [activeMetric, setActiveMetric] = useState<'all' | 'bust' | 'rain' | 'ffd' | 'trust'>('all');

  useEffect(() => {
    fetchRegionalTrend(selectedRun, selectedRegion).then(res => setRegionalTrend(res)).catch(() => {});
  }, [selectedRun, selectedRegion]);

  const chartData = regionalTrend.map(r => ({
    name: `D${r.lead_day}`,
    'Bust Risk (%)': parseFloat((r.mean_bust_probability * 100).toFixed(1)),
    'Rainfall (mm)': parseFloat(r.mean_rainfall.toFixed(1)),
    'FFD': parseFloat(r.median_ffd.toFixed(2)),
    'Trust Index': parseFloat(r.median_trust_index.toFixed(1))
  }));

  return (
    <div className="h-full w-full overflow-y-auto p-4 space-y-4 bg-[#EEF9F4] text-[#033A2B] select-none">
      {/* Top Ultra Light Green Banner Header */}
      <div className="bg-[#F4FAF6] border border-[#C8EAD9] rounded-xl p-4 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold text-[#059669] uppercase tracking-wider">FORECAST LEAD ANALYTICS</span>
          <h1 className="text-xl font-extrabold text-[#044E3A] mt-0.5 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#059669]" />
            Forecast Analytics
          </h1>
          <p className="text-xs text-[#065F46] mt-0.5 font-medium">
            Regional and lead-wise forecast reliability analytics across D1–D10 lead days (Run: <span className="font-mono font-bold text-[#044E3A]">{selectedRun}</span>).
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#D4F0E2] border border-[#C8EAD9] px-3 py-1.5 rounded-lg text-xs font-bold text-[#044E3A]">
          <Layers className="w-4 h-4 text-[#059669]" />
          <span>D1–D10 Lead Degradation Engine</span>
        </div>
      </div>

      {/* Top 3 Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-[#C8EAD9] p-4 rounded-xl shadow-xs text-center space-y-1">
          <span className="text-xs font-extrabold text-[#047857] uppercase">Mean Regional Bust Risk</span>
          <p className="text-2xl font-black text-rose-600">
            {regionalTrend.length > 0 ? (regionalTrend.reduce((a, b) => a + b.mean_bust_probability, 0) / regionalTrend.length * 100).toFixed(1) : '48.2'}%
          </p>
          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">D1–D10 Average</span>
        </div>

        <div className="bg-white border border-[#C8EAD9] p-4 rounded-xl shadow-xs text-center space-y-1">
          <span className="text-xs font-extrabold text-[#047857] uppercase">Median Regional FFD</span>
          <p className="text-2xl font-black text-amber-800">
            {regionalTrend.length > 0 ? (regionalTrend.reduce((a, b) => a + b.median_ffd, 0) / regionalTrend.length).toFixed(2) : '0.32'}
          </p>
          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">Fragility Benchmark</span>
        </div>

        <div className="bg-white border border-[#C8EAD9] p-4 rounded-xl shadow-xs text-center space-y-1">
          <span className="text-xs font-extrabold text-[#047857] uppercase">Median Trust Index</span>
          <p className="text-2xl font-black text-[#044E3A]">
            {regionalTrend.length > 0 ? (regionalTrend.reduce((a, b) => a + b.median_trust_index, 0) / regionalTrend.length).toFixed(1) : '78'}
          </p>
          <span className="text-[10px] font-bold text-[#059669] bg-[#E2F5EC] px-2 py-0.5 rounded">Diagnostic Score</span>
        </div>
      </div>

      {/* Multi-Line Degradation Chart (All Lines Show By Default) */}
      <div className="bg-white border border-[#C8EAD9] p-4 rounded-xl shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#C8EAD9] pb-2">
          <h3 className="font-extrabold text-[#044E3A] text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#059669]" />
            Lead-wise Forecast Degradation Trends (D1–D10)
          </h3>
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <button
              onClick={() => setActiveMetric('all')}
              className={`px-3 py-1 rounded-md transition-colors ${activeMetric === 'all' ? 'bg-[#059669] text-white font-extrabold' : 'bg-[#EEF9F4] text-[#044E3A] border border-[#C8EAD9]'}`}
            >
              All Metrics
            </button>
            <button
              onClick={() => setActiveMetric('bust')}
              className={`px-3 py-1 rounded-md transition-colors ${activeMetric === 'bust' ? 'bg-[#059669] text-white font-extrabold' : 'bg-[#EEF9F4] text-[#044E3A] border border-[#C8EAD9]'}`}
            >
              Bust Risk
            </button>
            <button
              onClick={() => setActiveMetric('rain')}
              className={`px-3 py-1 rounded-md transition-colors ${activeMetric === 'rain' ? 'bg-[#059669] text-white font-extrabold' : 'bg-[#EEF9F4] text-[#044E3A] border border-[#C8EAD9]'}`}
            >
              Rainfall
            </button>
            <button
              onClick={() => setActiveMetric('ffd')}
              className={`px-3 py-1 rounded-md transition-colors ${activeMetric === 'ffd' ? 'bg-[#059669] text-white font-extrabold' : 'bg-[#EEF9F4] text-[#044E3A] border border-[#C8EAD9]'}`}
            >
              FFD
            </button>
            <button
              onClick={() => setActiveMetric('trust')}
              className={`px-3 py-1 rounded-md transition-colors ${activeMetric === 'trust' ? 'bg-[#059669] text-white font-extrabold' : 'bg-[#EEF9F4] text-[#044E3A] border border-[#C8EAD9]'}`}
            >
              Trust Index
            </button>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" stroke="#047857" tick={{ fontSize: 11 }} />
              <YAxis stroke="#047857" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#044E3A', color: '#fff', borderRadius: '8px', fontSize: '11px' }} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />

              {(activeMetric === 'all' || activeMetric === 'bust') && (
                <Line type="monotone" dataKey="Bust Risk (%)" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 4 }} />
              )}
              {(activeMetric === 'all' || activeMetric === 'rain') && (
                <Line type="monotone" dataKey="Rainfall (mm)" stroke="#059669" strokeWidth={2.5} dot={{ r: 4 }} />
              )}
              {(activeMetric === 'all' || activeMetric === 'ffd') && (
                <Line type="monotone" dataKey="FFD" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 4 }} />
              )}
              {(activeMetric === 'all' || activeMetric === 'trust') && (
                <Line type="monotone" dataKey="Trust Index" stroke="#0284C7" strokeWidth={2.5} dot={{ r: 4 }} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Regional Lead-wise Metrics Table (D1–D10) */}
      <div className="bg-white border border-[#C8EAD9] rounded-xl shadow-xs overflow-hidden">
        <div className="p-3 border-b border-[#C8EAD9] bg-[#F4FAF6]">
          <h3 className="font-extrabold text-[#044E3A] text-xs uppercase tracking-wider">
            Lead-wise Metrics Breakdown Table (D1–D10)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-[#044E3A]">
            <thead className="bg-[#044E3A] text-white uppercase text-[10px] font-bold">
              <tr>
                <th className="py-2.5 px-3">Lead Day</th>
                <th className="py-2.5 px-3">Mean Rain</th>
                <th className="py-2.5 px-3">Mean Bust P</th>
                <th className="py-2.5 px-3">Median FFD</th>
                <th className="py-2.5 px-3">Median Trust</th>
                <th className="py-2.5 px-3">Green %</th>
                <th className="py-2.5 px-3">Yellow %</th>
                <th className="py-2.5 px-3">Red %</th>
                <th className="py-2.5 px-3">Regional Band</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C8EAD9] font-mono">
              {regionalTrend.map((row) => (
                <tr key={row.lead_day} className="hover:bg-[#EEF9F4]">
                  <td className="py-2.5 px-3 font-bold font-sans text-[#044E3A]">Lead D{row.lead_day}</td>
                  <td className="py-2.5 px-3">{row.mean_rainfall.toFixed(1)} mm</td>
                  <td className="py-2.5 px-3">{(row.mean_bust_probability * 100).toFixed(1)}%</td>
                  <td className="py-2.5 px-3">{row.median_ffd.toFixed(2)}</td>
                  <td className="py-2.5 px-3 font-bold text-[#059669]">{row.median_trust_index.toFixed(1)}</td>
                  <td className="py-2.5 px-3 text-[#059669] font-bold">{(row.green_fraction * 100).toFixed(0)}%</td>
                  <td className="py-2.5 px-3 text-amber-700 font-bold">{(row.yellow_fraction * 100).toFixed(0)}%</td>
                  <td className="py-2.5 px-3 text-rose-600 font-bold">{(row.red_fraction * 100).toFixed(0)}%</td>
                  <td className="py-2.5 px-3 font-sans">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      row.regional_reliability_band === 'GREEN' ? 'bg-[#D4F0E2] text-[#044E3A]' :
                      row.regional_reliability_band === 'YELLOW' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {row.regional_reliability_band}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
