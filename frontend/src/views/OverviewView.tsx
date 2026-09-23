import React from 'react';
import { ShieldAlert, Activity, AlertTriangle, ShieldCheck } from 'lucide-react';
import { MapView } from '../components/MapView';
import { TrendChart } from '../components/TrendChart';
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
  onOpenPassport
}) => {
  const lat = selectedLat ?? 26.75;
  const lon = selectedLon ?? 83.37;

  const greenCount = gridPoints.filter(p => p.reliability_band === 'GREEN').length;
  const yellowCount = gridPoints.filter(p => p.reliability_band === 'YELLOW').length;
  const redCount = gridPoints.filter(p => p.reliability_band === 'RED').length;
  const totalCount = gridPoints.length || 323;

  return (
    <div className="p-6 space-y-6">
      {/* Top Telemetry Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm flex items-center gap-4">
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Median Trust Index</p>
            <p className="text-2xl font-bold text-slate-100 font-mono mt-0.5">
              {regionalSummary ? `${regionalSummary.median_trust_index} / 100` : '85 / 100'}
            </p>
            <span className="text-[10px] text-emerald-400 font-bold">
              Band: {regionalSummary?.regional_reliability_band || 'GREEN'}
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm flex items-center gap-4">
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Mean Bust Risk P(Bust)</p>
            <p className="text-2xl font-bold text-slate-100 font-mono mt-0.5">
              {regionalSummary ? `${(regionalSummary.mean_bust_probability * 100).toFixed(1)}%` : '12.4%'}
            </p>
            <span className="text-[10px] text-slate-400 font-medium">
              Mean Rain: {(regionalSummary?.mean_rainfall_mm || 0).toFixed(1)} mm
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm flex items-center gap-4">
          <div className="bg-purple-500/10 border border-purple-500/30 text-purple-400 p-3 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Regional Trust Horizon</p>
            <p className="text-2xl font-bold text-purple-400 font-mono mt-0.5">
              D1 – D{regionalSummary?.regional_trust_horizon_day || 5}
            </p>
            <span className="text-[10px] text-rose-400 font-bold">
              Breaking: {regionalSummary?.regional_breaking_point_day ? `Day D${regionalSummary.regional_breaking_point_day}` : 'None'}
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm flex items-center gap-4">
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 p-3 rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Grid Reliability Split</p>
            <div className="flex items-center gap-2 text-xs font-bold font-mono mt-1">
              <span className="text-emerald-400">{greenCount} G</span>
              <span className="text-amber-400">{yellowCount} Y</span>
              <span className="text-rose-400">{redCount} R</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium mt-1 block">
              {totalCount} Eastern UP Grid Points
            </span>
          </div>
        </div>
      </div>

      {/* Main Center Layout: Interactive Leaflet Map & Lead Trend Line */}
      <div className="grid grid-cols-1 gap-6">
        <div className="h-[460px] relative">
          <MapView 
            mapPoints={gridPoints}
            selectedMetric={selectedMetric}
            selectedLat={lat}
            selectedLon={lon}
            onSelectPoint={onSelectPoint}
          />
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <TrendChart trendData={trendData} />
        </div>
      </div>
    </div>
  );
};
