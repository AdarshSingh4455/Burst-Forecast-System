import React from 'react';
import { 
  BarChart3, ShieldAlert, CheckCircle2, ArrowRight, Activity, FileText, AlertTriangle, CloudRain, ShieldCheck, MapPin, Gauge
} from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { GridPointMap, RegionalSummary, TrendPoint } from '../types';

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
    { name: 'Supported Reliability', value: 63.9, color: '#22C55E' },
    { name: 'Supported Warning', value: 4.0, color: '#EF4444' },
    { name: 'Conflict', value: 20.4, color: '#F59E0B' },
    { name: 'Insufficient Evidence', value: 6.8, color: '#64748B' },
    { name: 'Expert Review', value: 4.8, color: '#8B5CF6' }
  ];

  return (
    <div className="h-full w-full overflow-y-auto p-4 space-y-4 bg-[#F5FAF8] text-[#102A2A] select-none">
      {/* Top Banner Header */}
      <div className="bg-white border border-[#D2E5DF] rounded-xl p-4 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-[#102A2A] tracking-tight flex items-center gap-2">
            Welcome to FORTRESS
          </h2>
          <p className="text-xs text-[#617874] font-medium mt-0.5">
            AI-based Forecast Reliability and Risk Assessment for India
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs bg-[#EAF8F3] border border-[#BDEADB] px-3 py-1.5 rounded-lg text-[#005C4B]">
          <span className="font-medium">Data: <strong>NOAA GEFSv12 (Reforecast)</strong></span>
          <span className="text-[#BDEADB]">|</span>
          <span className="flex items-center gap-1.5 font-bold text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            System Online
          </span>
        </div>
      </div>

      {/* Top 7 KPI Cards */}
      <div className="grid grid-cols-7 gap-3">
        {/* 1. Forecast Runs */}
        <div className="bg-white border border-[#D2E5DF] p-3 rounded-xl shadow-xs text-center flex flex-col justify-between h-[84px]">
          <span className="text-[10px] font-extrabold text-[#617874] uppercase">Forecast Runs</span>
          <span className="text-2xl font-black text-[#102A2A]">{runsCount}</span>
          <span className="text-[9px] text-[#617874] font-semibold">(2019 reforecast)</span>
        </div>

        {/* 2. Grid Points */}
        <div className="bg-white border border-[#D2E5DF] p-3 rounded-xl shadow-xs text-center flex flex-col justify-between h-[84px]">
          <span className="text-[10px] font-extrabold text-[#617874] uppercase">Grid Points</span>
          <span className="text-2xl font-black text-[#102A2A]">{gridCount}</span>
          <span className="text-[9px] text-[#617874] font-semibold">(Eastern UP)</span>
        </div>

        {/* 3. Mean Regional Rainfall */}
        <div className="bg-white border border-[#D2E5DF] p-3 rounded-xl shadow-xs text-center flex flex-col justify-between h-[84px]">
          <span className="text-[10px] font-extrabold text-[#617874] uppercase">Mean Regional Rainfall</span>
          <span className="text-xl font-black text-emerald-700">{meanRainfall} mm</span>
          <span className="text-[9px] text-emerald-600 font-bold">Selected Run/Lead</span>
        </div>

        {/* 4. Average Bust Risk */}
        <div className="bg-white border border-[#D2E5DF] p-3 rounded-xl shadow-xs text-center flex flex-col justify-between h-[84px]">
          <span className="text-[10px] font-extrabold text-[#617874] uppercase">Avg. Bust Risk</span>
          <span className="text-2xl font-black text-rose-600">{avgBustRisk}%</span>
          <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded w-fit mx-auto">Elevated</span>
        </div>

        {/* 5. Median FFD */}
        <div className="bg-white border border-[#D2E5DF] p-3 rounded-xl shadow-xs text-center flex flex-col justify-between h-[84px]">
          <span className="text-[10px] font-extrabold text-[#617874] uppercase">Median FFD</span>
          <span className="text-2xl font-black text-amber-800">{medianFfd}</span>
          <span className="text-[9px] text-amber-800 font-bold bg-amber-50 px-1.5 py-0.2 rounded w-fit mx-auto">Fragile</span>
        </div>

        {/* 6. Trust Horizon */}
        <div className="bg-[#EAF8F3] border border-[#BDEADB] p-3 rounded-xl shadow-xs text-center flex flex-col justify-between h-[84px]">
          <span className="text-[10px] font-extrabold text-[#005C4B] uppercase">Trust Horizon</span>
          <span className="text-2xl font-black text-[#00A878]">{trustHorizon}</span>
          <span className="text-[9px] text-[#005C4B] font-bold">Reliable Horizon</span>
        </div>

        {/* 7. Breaking Point */}
        <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl shadow-xs text-center flex flex-col justify-between h-[84px]">
          <span className="text-[10px] font-extrabold text-rose-900 uppercase">Breaking Point</span>
          <span className="text-2xl font-black text-rose-600">{breakingPoint}</span>
          <span className="text-[9px] text-rose-700 font-bold">Sustained RED</span>
        </div>
      </div>

      {/* Second Row: Regional Map + Self-Audit Donut Chart */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left Column: Regional Risk Overview (Eastern UP) (~55% width = col-span-7) */}
        <div className="col-span-7 bg-white border border-[#D2E5DF] rounded-xl p-4 shadow-xs space-y-3 flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-[#102A2A] text-sm">
              Regional Risk Overview (Eastern UP)
            </h3>
            <span className="text-xs font-bold text-[#00A878] cursor-pointer hover:underline" onClick={() => onNavigateTab?.('india_map')}>
              View Full Map →
            </span>
          </div>

          <div className="flex-1 min-h-[220px] rounded-lg overflow-hidden border border-[#D2E5DF] relative">
            <MapContainer
              center={[26.2, 82.5]}
              zoom={7}
              className="w-full h-full z-0"
              scrollWheelZoom={false}
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; ESRI'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
              {gridPoints.map((pt, idx) => (
                <CircleMarker
                  key={idx}
                  center={[pt.latitude, pt.longitude]}
                  radius={4}
                  pathOptions={{
                    fillColor: pt.value > 0.6 ? '#EF4444' : pt.value > 0.4 ? '#F97316' : pt.value > 0.2 ? '#F59E0B' : '#22C55E',
                    color: '#000',
                    weight: 0.5,
                    fillOpacity: 0.85
                  }}
                  eventHandlers={{
                    click: () => onSelectPoint(pt.latitude, pt.longitude)
                  }}
                />
              ))}
            </MapContainer>

            {/* Floating Legend */}
            <div className="absolute bottom-2 left-2 z-[1000] bg-white/95 backdrop-blur-md text-[10px] p-2 rounded-lg border border-[#D2E5DF] shadow-md space-y-1">
              <p className="font-bold text-[#102A2A] text-[9px] uppercase">Bust Risk</p>
              <div className="space-y-0.5 font-medium text-[#617874]">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#22C55E]"></span> Very Low (0–20%)</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#84CC16]"></span> Low (20–40%)</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span> Moderate (40–60%)</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#F97316]"></span> High (60–80%)</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#EF4444]"></span> Very High (80–100%)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Self-Audit Status Distribution (~45% width = col-span-5) */}
        <div className="col-span-5 bg-white border border-[#D2E5DF] rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <h3 className="font-extrabold text-[#102A2A] text-sm mb-2">
            Self-Audit Status Distribution
          </h3>

          <div className="flex items-center gap-4 flex-1">
            <div className="w-[170px] h-[170px] relative flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-xl font-black text-[#102A2A]">323</span>
                <span className="text-[9px] font-extrabold text-[#617874]">Grid Points</span>
              </div>
            </div>

            <div className="space-y-2 flex-1 text-xs">
              {pieData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-[#617874] font-medium">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="truncate max-w-[130px]">{item.name}</span>
                  </span>
                  <span className="font-extrabold text-[#102A2A]">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Third Row: Top Vulnerabilities + Key Insights + Quick Actions */}
      <div className="grid grid-cols-12 gap-4">
        {/* Top Vulnerabilities (col-span-4) */}
        <div className="col-span-4 bg-white border border-[#D2E5DF] rounded-xl p-4 shadow-xs space-y-3">
          <h3 className="font-extrabold text-[#102A2A] text-sm">
            Top Vulnerabilities
          </h3>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#EAF8F3] border border-[#BDEADB] p-2.5 rounded-lg text-center space-y-1">
              <CloudRain className="w-5 h-5 text-[#00A878] mx-auto" />
              <p className="text-[10px] font-bold text-[#102A2A]">Moisture Sensitivity</p>
              <p className="text-xs font-black text-[#00A878]">42% cells</p>
            </div>

            <div className="bg-[#EAF8F3] border border-[#BDEADB] p-2.5 rounded-lg text-center space-y-1">
              <Activity className="w-5 h-5 text-[#00A878] mx-auto" />
              <p className="text-[10px] font-bold text-[#102A2A]">Wind Circulation</p>
              <p className="text-xs font-black text-[#00A878]">28% cells</p>
            </div>

            <div className="bg-[#EAF8F3] border border-[#BDEADB] p-2.5 rounded-lg text-center space-y-1">
              <ShieldAlert className="w-5 h-5 text-[#00A878] mx-auto" />
              <p className="text-[10px] font-bold text-[#102A2A]">Ensemble Disagreement</p>
              <p className="text-xs font-black text-[#00A878]">18% cells</p>
            </div>
          </div>
        </div>

        {/* Key Insights (col-span-5) */}
        <div className="col-span-5 bg-white border border-[#D2E5DF] rounded-xl p-4 shadow-xs space-y-2.5">
          <h3 className="font-extrabold text-[#102A2A] text-sm">
            Key Insights
          </h3>

          <ul className="space-y-2 text-xs text-[#102A2A]">
            <li className="flex items-start gap-2 bg-[#F5FAF8] p-2 rounded-lg border border-[#D2E5DF]">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <span>Rainfall is likely to increase after D4 with higher uncertainty from D6 onwards.</span>
            </li>
            <li className="flex items-start gap-2 bg-[#F5FAF8] p-2 rounded-lg border border-[#D2E5DF]">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <span>High bust risk corridor identified in eastern districts.</span>
            </li>
            <li className="flex items-start gap-2 bg-[#F5FAF8] p-2 rounded-lg border border-[#D2E5DF]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>Most common vulnerability: Moisture sensitivity.</span>
            </li>
            <li className="flex items-start gap-2 bg-rose-50 p-2 rounded-lg border border-rose-200 text-rose-900">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span className="font-semibold">Reliability drops significantly after D5. Use with caution.</span>
            </li>
          </ul>
        </div>

        {/* Quick Actions (col-span-3) */}
        <div className="col-span-3 bg-white border border-[#D2E5DF] rounded-xl p-4 shadow-xs space-y-2.5 flex flex-col justify-between">
          <h3 className="font-extrabold text-[#102A2A] text-sm">
            Quick Actions
          </h3>

          <div className="space-y-2 flex-1 flex flex-col justify-center">
            <button
              onClick={() => onNavigateTab?.('india_map')}
              className="w-full bg-[#00A878] hover:bg-[#005C4B] text-white font-extrabold py-2 px-3 rounded-lg text-xs shadow-xs transition-colors flex items-center justify-between"
            >
              <span>Open India Map</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigateTab?.('analytics')}
              className="w-full bg-[#F5FAF8] hover:bg-[#EAF8F3] text-[#102A2A] border border-[#D2E5DF] font-bold py-2 px-3 rounded-lg text-xs transition-colors flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4 text-[#00A878]" />
              <span>View Forecast Analytics</span>
            </button>

            <button
              onClick={() => onNavigateTab?.('stress_lab')}
              className="w-full bg-[#F5FAF8] hover:bg-[#EAF8F3] text-[#102A2A] border border-[#D2E5DF] font-bold py-2 px-3 rounded-lg text-xs transition-colors flex items-center gap-2"
            >
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Check High-Risk Areas</span>
            </button>

            <button
              onClick={onOpenPassport}
              className="w-full bg-[#F5FAF8] hover:bg-[#EAF8F3] text-[#102A2A] border border-[#D2E5DF] font-bold py-2 px-3 rounded-lg text-xs transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-purple-600" />
              <span>Generate Regional Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
