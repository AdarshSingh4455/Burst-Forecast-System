import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Rectangle } from 'react-leaflet';
import { MapPoint } from '../types';

interface MapViewProps {
  mapPoints: MapPoint[];
  selectedMetric: string;
  selectedLat: number;
  selectedLon: number;
  onSelectPoint: (lat: number, lon: number) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  mapPoints,
  selectedMetric,
  selectedLat,
  selectedLon,
  onSelectPoint
}) => {
  const easternUpBounds: [ [number, number], [number, number] ] = [
    [24.5, 80.0],
    [28.5, 84.5]
  ];

  const getColor = (point: MapPoint): string => {
    if (selectedMetric === 'bust_probability') {
      const v = point.value;
      if (v < 0.20) return '#10b981'; // Green
      if (v < 0.40) return '#84cc16'; // Lime
      if (v < 0.60) return '#f59e0b'; // Amber
      if (v < 0.80) return '#f97316'; // Orange
      return '#ef4444'; // Red
    } else if (selectedMetric === 'trust_index') {
      const v = point.value;
      if (v >= 80) return '#10b981';
      if (v >= 60) return '#f59e0b';
      return '#ef4444';
    } else if (selectedMetric === 'ffd') {
      const v = point.value;
      if (v >= 0.85) return '#10b981';
      if (v >= 0.50) return '#f59e0b';
      return '#ef4444';
    } else {
      if (point.reliability_band === 'GREEN') return '#10b981';
      if (point.reliability_band === 'YELLOW') return '#f59e0b';
      return '#ef4444';
    }
  };

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden shadow-inner border border-slate-200 bg-slate-900">
      <MapContainer
        center={[26.5, 82.25]}
        zoom={7}
        className="w-full h-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Rectangle
          bounds={easternUpBounds}
          pathOptions={{ color: '#3b82f6', weight: 2, dashArray: '4, 4', fillOpacity: 0.05 }}
        />

        {mapPoints.map((pt, idx) => {
          const isSelected = Math.abs(pt.latitude - selectedLat) < 0.01 && Math.abs(pt.longitude - selectedLon) < 0.01;
          const color = getColor(pt);
          return (
            <CircleMarker
              key={idx}
              center={[pt.latitude, pt.longitude]}
              radius={isSelected ? 10 : 6}
              pathOptions={{
                fillColor: color,
                color: isSelected ? '#ffffff' : '#1e293b',
                weight: isSelected ? 3 : 1,
                fillOpacity: 0.85
              }}
              eventHandlers={{
                click: () => onSelectPoint(pt.latitude, pt.longitude)
              }}
            >
              <Tooltip direction="top" offset={[0, -5]} opacity={0.95}>
                <div className="text-xs p-1 space-y-1">
                  <p className="font-bold border-b pb-1 text-slate-900">
                    {pt.latitude.toFixed(2)}°N, {pt.longitude.toFixed(2)}°E
                  </p>
                  <p><span className="font-semibold">{selectedMetric}:</span> {pt.value.toFixed(3)}</p>
                  <p><span className="font-semibold">Band:</span> <span className={`font-bold ${pt.reliability_band === 'GREEN' ? 'text-emerald-600' : pt.reliability_band === 'YELLOW' ? 'text-amber-600' : 'text-rose-600'}`}>{pt.reliability_band}</span></p>
                  <p className="text-[10px] text-slate-500">{pt.self_audit_status}</p>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>

      <div className="absolute top-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur-md text-white text-xs px-3 py-2 rounded-lg border border-slate-700 shadow-lg max-w-sm">
        <p className="font-bold text-blue-400">Eastern UP Pilot Domain Active</p>
        <p className="text-[11px] text-slate-300">
          Showing 323 grid points (24.5–28.5°N, 80.0–84.5°E). Click grid point for full reliability audit.
        </p>
      </div>

      <div className="absolute bottom-3 right-3 z-[1000] bg-white/95 backdrop-blur-md text-slate-800 text-xs px-3 py-2 rounded-lg border border-slate-200 shadow-md flex items-center gap-3">
        <span className="font-semibold text-slate-600">Metric Scale:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
          <span>Green / Low</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
          <span>Yellow / Mod</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
          <span>Red / High</span>
        </div>
      </div>
    </div>
  );
};
