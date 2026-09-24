import React from 'react';
import { 
  BarChart3, ShieldAlert, CheckCircle2, ArrowRight, Activity, FileText, AlertTriangle, CloudRain
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { GridPointMap, RegionalSummary, TrendPoint, GridPointDetail } from '../types';

interface OverviewViewProps {
  selectedRun: string;
  selectedLead: number;
  selectedMetric: string;
  gridPoints: GridPointMap[];
  selectedLat: number | null;
  selectedLon: number | null;
  onSelectPoint: (lat: number, lon: number) => void;
  regionalSummary: RegionalSummary | null;
  trendData: TrendPoint[];
  pointDetail?: GridPointDetail | null;
  onOpenPassport: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  selectedRun,
  selectedLead,
  selectedMetric,
  gridPoints,
  selectedLat,
  selectedLon,
  onSelectPoint,
  regionalSummary,
  trendData,
  onOpenPassport,
  onNavigateTab
}) => {
  // Dynamic metrics from backend regional summary
  const runsCount = 12;
  const gridCount = 323;
  const meanRainfall = regionalSummary ? regionalSummary.mean_rainfall_mm.toFixed(1) : '28.4';
  const avgBustRisk = regionalSummary ? (regionalSummary.mean_bust_probability * 100).toFixed(0) : '62';
  const medianFfd = regionalSummary ? regionalSummary.mean_ffd.toFixed(2) : '0.32';
  const trustHorizon = regionalSummary ? `D${regionalSummary.regional_trust_horizon_day}` : 'D5';
  const breakingPoint = regionalSummary ? (regionalSummary.regional_breaking_point_day ? `D${regionalSummary.regional_breaking_point_day}` : 'D6') : 'D6';

  // Donut chart data for Self-Audit Status Distribution
  const pieData = [
    { name: 'Supported Reliability', value: 63.9, color: '#059669' },
    { name: 'Supported Warning', value: 4.0, color: '#EF4444' },
    { name: 'Conflict', value: 20.4, color: '#F59E0B' },
    { name: 'Insufficient Evidence', value: 6.8, color: '#64748B' },
    { name: 'Expert Review', value: 4.8, color: '#8B5CF6' }
  ];

  return (
    <div className="h-full w-full overflow-y-auto p-4 space-y-4 bg-[#EEF9F4] text-[#033A2B] select-none">
      {/* Top Ultra Light Green Banner Header */}
      <div className="bg-[#F4FAF6] border border-[#C8EAD9] rounded-xl p-4 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-[#044E3A] tracking-tight flex items-center gap-2">
            Welcome to FORTRESS
          </h2>
          <p className="text-xs text-[#065F46] font-semibold mt-0.5">
            AI-based Forecast Reliability and Risk Assessment for India
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs bg-[#D4F0E2] border border-[#C8EAD9] px-3 py-1.5 rounded-lg text-[#044E3A]">
          <span className="font-semibold">Data: <strong>NOAA GEFSv12 (Reforecast)</strong></span>
          <span className="text-[#A7F3D0]">|</span>
          <span className="flex items-center gap-1.5 font-bold text-[#059669]">
            <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse"></span>
            System Online
          </span>
        </div>
      </div>

      {/* Top 7 KPI Cards */}
      <div className="grid grid-cols-7 gap-3">
        <div className="bg-white border border-[#C8EAD9] p-3 rounded-xl shadow-xs text-center flex flex-col justify-between h-[84px]">
          <span className="text-[10px] font-extrabold text-[#047857] uppercase">Forecast Runs</span>
          <span className="text-2xl font-black text-[#044E3A]">{runsCount}</span>
          <span className="text-[9px] text-[#065F46] font-semibold">(2019 reforecast)</span>
        </div>

        <div className="bg-white border border-[#C8EAD9] p-3 rounded-xl shadow-xs text-center flex flex-col justify-between h-[84px]">
          <span className="text-[10px] font-extrabold text-[#047857] uppercase">Grid Points</span>
          <span className="text-2xl font-black text-[#044E3A]">{gridCount}</span>
          <span className="text-[9px] text-[#065F46] font-semibold">(Eastern UP)</span>
        </div>

        <div className="bg-white border border-[#C8EAD9] p-3 rounded-xl shadow-xs text-center flex flex-col justify-between h-[84px]">
          <span className="text-[10px] font-extrabold text-[#047857] uppercase">Mean Regional Rainfall</span>
          <span className="text-xl font-black text-[#059669]">{meanRainfall} mm</span>
          <span className="text-[9px] text-[#059669] font-extrabold">Selected Run/Lead</span>
        </div>

        <div className="bg-white border border-[#C8EAD9] p-3 rounded-xl shadow-xs text-center flex flex-col justify-between h-[84px]">
          <span className="text-[10px] font-extrabold text-[#047857] uppercase">Avg. Bust Risk</span>
          <span className="text-2xl font-black text-rose-600">{avgBustRisk}%</span>
          <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded w-fit mx-auto">Elevated</span>
        </div>

        <div className="bg-white border border-[#C8EAD9] p-3 rounded-xl shadow-xs text-center flex flex-col justify-between h-[84px]">
          <span className="text-[10px] font-extrabold text-[#047857] uppercase">Median FFD</span>
          <span className="text-2xl font-black text-amber-800">{medianFfd}</span>
          <span className="text-[9px] text-amber-800 font-bold bg-amber-50 px-1.5 py-0.2 rounded w-fit mx-auto">Fragile</span>
        </div>

        <div className="bg-[#D4F0E2] border border-[#C8EAD9] p-3 rounded-xl shadow-xs text-center flex flex-col justify-between h-[84px]">
          <span className="text-[10px] font-extrabold text-[#044E3A] uppercase">Trust Horizon</span>
          <span className="text-2xl font-black text-[#059669]">{trustHorizon}</span>
          <span className="text-[9px] text-[#044E3A] font-bold">Reliable Horizon</span>
        </div>

        <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl shadow-xs text-center flex flex-col justify-between h-[84px]">
          <span className="text-[10px] font-extrabold text-rose-900 uppercase">Breaking Point</span>
          <span className="text-2xl font-black text-rose-600">{breakingPoint}</span>
          <span className="text-[9px] text-rose-700 font-bold bg-rose-100 px-1.5 py-0.2 rounded w-fit mx-auto">First Sustained RED</span>
        </div>
      </div>

      {/* Second Row: Forecast Overview Card & Self-Audit Donut */}
      <div className="grid grid-cols-12 gap-4">
        {/* Forecast Overview Card (col-span-7) */}
        <div className="col-span-7 bg-white border border-[#C8EAD9] rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#C8EAD9] pb-2">
            <div>
              <span className="text-[10px] font-extrabold text-[#059669] uppercase tracking-wider">REGION SUMMARY</span>
              <h3 className="font-extrabold text-[#044E3A] text-sm">
                Eastern Uttar Pradesh Pilot Domain
              </h3>
            </div>
            <span className="text-xs bg-[#D4F0E2] text-[#044E3A] font-bold px-2.5 py-1 rounded-md border border-[#C8EAD9]">
              323 Grid Points (0.25°)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-[#EEF9F4] p-3 rounded-lg border border-[#C8EAD9] space-y-1">
              <span className="text-[#047857] font-extrabold block">Dominated Vulnerability</span>
              <p className="font-black text-[#044E3A] text-sm">Specific Humidity Influx</p>
              <p className="text-[10px] text-[#065F46]">42% of grid points fail under moisture shifts</p>
            </div>

            <div className="bg-[#EEF9F4] p-3 rounded-lg border border-[#C8EAD9] space-y-1">
              <span className="text-[#047857] font-extrabold block">Dominant Failure Corridor</span>
              <p className="font-black text-[#044E3A] text-sm">High Moisture / Low Shear</p>
              <p className="text-[10px] text-[#065F46]">Cluster 1 failure DNA alignment</p>
            </div>
          </div>
        </div>

        {/* Self-Audit Status Distribution (col-span-5) */}
        <div className="col-span-5 bg-white border border-[#C8EAD9] rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <h3 className="font-extrabold text-[#044E3A] text-sm mb-2">
            Self-Audit Status Distribution
          </h3>

          <div className="flex items-center gap-4 flex-1">
            <div className="w-[150px] h-[150px] relative flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => `${val}%`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-xl font-black text-[#044E3A]">323</span>
                <span className="text-[9px] font-extrabold text-[#059669]">Grid Points</span>
              </div>
            </div>

            <div className="space-y-1.5 flex-1 text-xs">
              {pieData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-[#065F46] font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="truncate max-w-[130px]">{item.name}</span>
                  </span>
                  <span className="font-extrabold text-[#044E3A]">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Third Row: Top Vulnerabilities + Key Insights + Quick Actions */}
      <div className="grid grid-cols-12 gap-4">
        {/* Top Vulnerabilities (col-span-4) */}
        <div className="col-span-4 bg-white border border-[#C8EAD9] rounded-xl p-4 shadow-xs space-y-3">
          <h3 className="font-extrabold text-[#044E3A] text-sm">
            Top Vulnerabilities
          </h3>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#EEF9F4] border border-[#C8EAD9] p-2.5 rounded-lg text-center space-y-1">
              <CloudRain className="w-5 h-5 text-[#059669] mx-auto" />
              <p className="text-[10px] font-bold text-[#044E3A]">Moisture Sensitivity</p>
              <p className="text-xs font-black text-[#059669]">42% cells</p>
            </div>

            <div className="bg-[#EEF9F4] border border-[#C8EAD9] p-2.5 rounded-lg text-center space-y-1">
              <Activity className="w-5 h-5 text-[#059669] mx-auto" />
              <p className="text-[10px] font-bold text-[#044E3A]">Wind Circulation</p>
              <p className="text-xs font-black text-[#059669]">28% cells</p>
            </div>

            <div className="bg-[#EEF9F4] border border-[#C8EAD9] p-2.5 rounded-lg text-center space-y-1">
              <ShieldAlert className="w-5 h-5 text-[#059669] mx-auto" />
              <p className="text-[10px] font-bold text-[#044E3A]">Ensemble Disagreement</p>
              <p className="text-xs font-black text-[#059669]">18% cells</p>
            </div>
          </div>
        </div>

        {/* Key Insights (col-span-5) */}
        <div className="col-span-5 bg-white border border-[#C8EAD9] rounded-xl p-4 shadow-xs space-y-2.5">
          <h3 className="font-extrabold text-[#044E3A] text-sm">
            Key Insights
          </h3>

          <ul className="space-y-2 text-xs text-[#044E3A]">
            <li className="flex items-start gap-2 bg-[#EEF9F4] p-2 rounded-lg border border-[#C8EAD9]">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <span>Rainfall is likely to increase after D4 with higher uncertainty from D6 onwards.</span>
            </li>
            <li className="flex items-start gap-2 bg-[#EEF9F4] p-2 rounded-lg border border-[#C8EAD9]">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <span>High bust risk corridor identified in eastern districts.</span>
            </li>
            <li className="flex items-start gap-2 bg-[#EEF9F4] p-2 rounded-lg border border-[#C8EAD9]">
              <CheckCircle2 className="w-4 h-4 text-[#059669] flex-shrink-0 mt-0.5" />
              <span>Most common vulnerability: Moisture sensitivity.</span>
            </li>
            <li className="flex items-start gap-2 bg-rose-50 p-2 rounded-lg border border-rose-200 text-rose-900">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span className="font-semibold">Reliability drops significantly after D5. Use with caution.</span>
            </li>
          </ul>
        </div>

        {/* Quick Actions (col-span-3) */}
        <div className="col-span-3 bg-white border border-[#C8EAD9] rounded-xl p-4 shadow-xs space-y-2.5 flex flex-col justify-between">
          <h3 className="font-extrabold text-[#044E3A] text-sm">
            Quick Actions
          </h3>

          <div className="space-y-2 flex-1 flex flex-col justify-center">
            <button
              onClick={() => onNavigateTab?.('india_map')}
              className="w-full bg-[#059669] hover:bg-[#047857] text-white font-extrabold py-2 px-3 rounded-lg text-xs shadow-xs transition-colors flex items-center justify-between"
            >
              <span>Open India Map</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigateTab?.('analytics')}
              className="w-full bg-[#EEF9F4] hover:bg-[#D4F0E2] text-[#044E3A] border border-[#C8EAD9] font-bold py-2 px-3 rounded-lg text-xs transition-colors flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4 text-[#059669]" />
              <span>View Forecast Analytics</span>
            </button>

            <button
              onClick={() => onNavigateTab?.('stress_lab')}
              className="w-full bg-[#EEF9F4] hover:bg-[#D4F0E2] text-[#044E3A] border border-[#C8EAD9] font-bold py-2 px-3 rounded-lg text-xs transition-colors flex items-center gap-2"
            >
              <Activity className="w-4 h-4 text-[#059669]" />
              <span>Check High-Risk Areas</span>
            </button>

            <button
              onClick={onOpenPassport}
              className="w-full bg-[#EEF9F4] hover:bg-[#D4F0E2] text-[#044E3A] border border-[#C8EAD9] font-bold py-2 px-3 rounded-lg text-xs transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-[#059669]" />
              <span>Generate Regional Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
