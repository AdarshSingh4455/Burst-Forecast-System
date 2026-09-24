import React, { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Rectangle } from 'react-leaflet';
import { MapPoint } from '../types';
import { 
  Layers, Waves, Sprout, AlertTriangle, Sun, Wind, Radio, 
  Plus, Minus, Navigation, Maximize2 
} from 'lucide-react';

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
  const [mapStyle, setMapStyle] = useState<'map' | 'satellite' | 'hybrid'>('satellite');
  const [layersOpen, setLayersOpen] = useState(true);

  // Layer toggles
  const [showRisk, setShowRisk] = useState(true);
  const [showRainfall, setShowRainfall] = useState(false);
  const [showDams, setShowDams] = useState(true);
  const [showAgri, setShowAgri] = useState(true);
  const [showFlood, setShowFlood] = useState(true);
  const [showRenewable, setShowRenewable] = useState(true);
  const [showWeather, setShowWeather] = useState(false);
  const [showStateBounds, setShowStateBounds] = useState(false);
  const [showDistrictBounds, setShowDistrictBounds] = useState(false);

  const easternUpBounds: [ [number, number], [number, number] ] = [
    [24.5, 80.0],
    [28.5, 84.5]
  ];

  const getColor = (point: MapPoint): string => {
    const v = point.value;
    if (selectedMetric === 'bust_probability' || selectedMetric === 'bust_risk_probability') {
      if (v < 0.20) return '#22C55E'; // Green (Very Low)
      if (v < 0.40) return '#84CC16'; // Lime/Yellow-Green (Low)
      if (v < 0.60) return '#F59E0B'; // Orange/Yellow (Moderate)
      if (v < 0.80) return '#F97316'; // Red-Orange (High)
      return '#EF4444'; // Red (Very High)
    } else if (selectedMetric === 'trust_index') {
      if (v >= 80) return '#22C55E';
      if (v >= 60) return '#F59E0B';
      return '#EF4444';
    } else {
      if (point.reliability_band === 'GREEN') return '#22C55E';
      if (point.reliability_band === 'YELLOW') return '#F59E0B';
      return '#EF4444';
    }
  };

  const tileUrls = {
    map: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    hybrid: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  };

  // Assets in Eastern UP
  const assets = [
    { name: 'Rihand Reservoir', lat: 24.22, lon: 83.02, type: 'dam' },
    { name: 'Agriculture Zone (East UP)', lat: 26.75, lon: 82.50, type: 'agri' },
    { name: 'Flood Prone Area (Gorakhpur)', lat: 26.76, lon: 83.37, type: 'flood' },
    { name: 'Solar Plant (Mirzapur)', lat: 25.14, lon: 82.56, type: 'solar' },
    { name: 'Wind Site (Varanasi)', lat: 25.31, lon: 82.97, type: 'wind' },
    { name: 'Weather Station (Prayagraj)', lat: 25.43, lon: 81.84, type: 'weather' }
  ];

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden border border-[#0A2D4D] bg-[#071C30] shadow-md flex flex-col select-none">
      {/* Top Left Segmented Map Style Controls */}
      <div className="absolute top-3 left-3 z-[1000] bg-[#071C30]/90 backdrop-blur-md p-0.5 rounded-md border border-[#0A2D4D] shadow-lg flex items-center h-[34px]">
        <button
          onClick={() => setMapStyle('map')}
          className={`px-3 py-1 text-xs font-bold rounded transition-colors ${mapStyle === 'map' ? 'bg-[#0B4D7D] text-white' : 'text-slate-300 hover:text-white'}`}
        >
          Map
        </button>
        <button
          onClick={() => setMapStyle('satellite')}
          className={`px-3 py-1 text-xs font-bold rounded transition-colors ${mapStyle === 'satellite' ? 'bg-[#0B4D7D] text-white' : 'text-slate-300 hover:text-white'}`}
        >
          Satellite
        </button>
        <button
          onClick={() => setMapStyle('hybrid')}
          className={`px-3 py-1 text-xs font-bold rounded transition-colors ${mapStyle === 'hybrid' ? 'bg-[#0B4D7D] text-white' : 'text-slate-300 hover:text-white'}`}
        >
          Hybrid
        </button>
      </div>

      {/* Leaflet Map */}
      <MapContainer
        center={[26.2, 82.5]}
        zoom={7}
        className="w-full h-full z-0"
        scrollWheelZoom={true}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; ESRI / OpenStreetMap'
          url={tileUrls[mapStyle]}
        />

        {/* Eastern UP Pilot Bounding Box */}
        <Rectangle
          bounds={easternUpBounds}
          pathOptions={{ color: '#3b82f6', weight: 1.5, dashArray: '5, 5', fillOpacity: 0.02 }}
        />

        {/* Forecast Grid Points */}
        {showRisk && mapPoints.map((pt, idx) => {
          const isSelected = Math.abs(pt.latitude - selectedLat) < 0.05 && Math.abs(pt.longitude - selectedLon) < 0.05;
          const color = getColor(pt);
          return (
            <CircleMarker
              key={idx}
              center={[pt.latitude, pt.longitude]}
              radius={isSelected ? 8 : 4.5}
              pathOptions={{
                fillColor: color,
                color: isSelected ? '#ffffff' : '#000000',
                weight: isSelected ? 2.5 : 0.8,
                fillOpacity: 0.85
              }}
              eventHandlers={{
                click: () => onSelectPoint(pt.latitude, pt.longitude)
              }}
            >
              <Tooltip direction="top" offset={[0, -5]} opacity={0.95}>
                <div className="text-xs p-1.5 space-y-1 bg-[#071C30] text-white rounded-md border border-[#0A2D4D]">
                  <p className="font-extrabold border-b border-slate-700 pb-1 text-slate-100">
                    Eastern Uttar Pradesh
                  </p>
                  <p><span className="text-slate-400">Avg. Bust Risk:</span> <span className="font-mono font-bold text-red-400">{(pt.value * 100).toFixed(0)}%</span></p>
                  <p><span className="text-slate-400">Avg. Rainfall:</span> <span className="font-bold text-blue-300">28.4 mm</span></p>
                  <p><span className="text-slate-400">Condition:</span> <span className="font-bold text-red-400">{pt.reliability_band === 'RED' ? 'Fragile' : 'Monitor'}</span></p>
                  <p className="text-[10px] text-slate-400">Grid Points: 323</p>
                  <p className="text-[10px] text-blue-400 font-bold mt-1">Click to view details →</p>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}

        {/* Asset Markers */}
        {showDams && assets.filter(a => a.type === 'dam').map((a, i) => (
          <CircleMarker key={`dam-${i}`} center={[a.lat, a.lon]} radius={6} pathOptions={{ fillColor: '#2563eb', color: '#ffffff', weight: 1.5, fillOpacity: 1 }}>
            <Tooltip><span className="font-bold text-xs">🌊 {a.name} (DEMO)</span></Tooltip>
          </CircleMarker>
        ))}
        {showAgri && assets.filter(a => a.type === 'agri').map((a, i) => (
          <CircleMarker key={`agri-${i}`} center={[a.lat, a.lon]} radius={6} pathOptions={{ fillColor: '#16a34a', color: '#ffffff', weight: 1.5, fillOpacity: 1 }}>
            <Tooltip><span className="font-bold text-xs">🌱 {a.name} (DEMO)</span></Tooltip>
          </CircleMarker>
        ))}
        {showFlood && assets.filter(a => a.type === 'flood').map((a, i) => (
          <CircleMarker key={`flood-${i}`} center={[a.lat, a.lon]} radius={6} pathOptions={{ fillColor: '#dc2626', color: '#ffffff', weight: 1.5, fillOpacity: 1 }}>
            <Tooltip><span className="font-bold text-xs">⚠️ {a.name} (DEMO)</span></Tooltip>
          </CircleMarker>
        ))}
        {showRenewable && assets.filter(a => a.type === 'solar' || a.type === 'wind').map((a, i) => (
          <CircleMarker key={`ren-${i}`} center={[a.lat, a.lon]} radius={6} pathOptions={{ fillColor: '#d97706', color: '#ffffff', weight: 1.5, fillOpacity: 1 }}>
            <Tooltip><span className="font-bold text-xs">⚡ {a.name} (DEMO)</span></Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Floating Layers Panel on Top Right */}
      <div className="absolute top-3 right-3 z-[1000] bg-[#071C30]/95 backdrop-blur-md text-white text-xs rounded-lg border border-[#0A2D4D] shadow-2xl overflow-hidden w-[215px]">
        <button
          onClick={() => setLayersOpen(!layersOpen)}
          className="w-full px-3 py-2 bg-[#06213A] font-extrabold text-slate-100 flex items-center justify-between border-b border-[#0A2D4D]"
        >
          <span className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            Layers
          </span>
          <span className="text-[10px] text-slate-400">{layersOpen ? '▲' : '▼'}</span>
        </button>

        {layersOpen && (
          <div className="p-2.5 space-y-2 text-slate-300 text-[11px]">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Forecast Risk</span>
              <input type="checkbox" checked={showRisk} onChange={(e) => setShowRisk(e.target.checked)} className="rounded border-slate-700 accent-blue-600 cursor-pointer" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyan-500"></span> Rainfall (mm)</span>
              <input type="checkbox" checked={showRainfall} onChange={(e) => setShowRainfall(e.target.checked)} className="rounded border-slate-700 accent-blue-600 cursor-pointer" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-1.5"><Waves className="w-3 h-3 text-blue-400" /> Dams / Reservoirs</span>
              <input type="checkbox" checked={showDams} onChange={(e) => setShowDams(e.target.checked)} className="rounded border-slate-700 accent-blue-600 cursor-pointer" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-1.5"><Sprout className="w-3 h-3 text-emerald-400" /> Agriculture Zones</span>
              <input type="checkbox" checked={showAgri} onChange={(e) => setShowAgri(e.target.checked)} className="rounded border-slate-700 accent-blue-600 cursor-pointer" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-1.5"><AlertTriangle className="w-3 h-3 text-rose-400" /> Flood / Disaster Zones</span>
              <input type="checkbox" checked={showFlood} onChange={(e) => setShowFlood(e.target.checked)} className="rounded border-slate-700 accent-blue-600 cursor-pointer" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-1.5"><Sun className="w-3 h-3 text-amber-400" /> Renewable Sites</span>
              <input type="checkbox" checked={showRenewable} onChange={(e) => setShowRenewable(e.target.checked)} className="rounded border-slate-700 accent-blue-600 cursor-pointer" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-1.5"><Radio className="w-3 h-3 text-teal-400" /> Weather Stations</span>
              <input type="checkbox" checked={showWeather} onChange={(e) => setShowWeather(e.target.checked)} className="rounded border-slate-700 accent-blue-600 cursor-pointer" />
            </label>
            <label className="flex items-center justify-between cursor-pointer text-slate-400">
              <span>State Boundaries</span>
              <input type="checkbox" checked={showStateBounds} onChange={(e) => setShowStateBounds(e.target.checked)} className="rounded border-slate-700 accent-blue-600 cursor-pointer" />
            </label>
            <label className="flex items-center justify-between cursor-pointer text-slate-400">
              <span>District Boundaries</span>
              <input type="checkbox" checked={showDistrictBounds} onChange={(e) => setShowDistrictBounds(e.target.checked)} className="rounded border-slate-700 accent-blue-600 cursor-pointer" />
            </label>
          </div>
        )}
      </div>

      {/* Floating Legend Bottom-Left: Bust Risk Scale */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-[#071C30]/95 backdrop-blur-md text-white text-[10px] p-2.5 rounded-lg border border-[#0A2D4D] shadow-2xl space-y-1 w-[200px]">
        <p className="font-extrabold text-slate-200 border-b border-slate-800 pb-1 uppercase tracking-wider text-[9px]">
          Forecast Reliability (Bust Risk)
        </p>
        <div className="space-y-0.5 pt-0.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#22C55E]"></span> Very Low</span>
            <span className="text-slate-400 font-mono text-[9px]">(0–20%)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#84CC16]"></span> Low</span>
            <span className="text-slate-400 font-mono text-[9px]">(20–40%)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span> Moderate</span>
            <span className="text-slate-400 font-mono text-[9px]">(40–60%)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#F97316]"></span> High</span>
            <span className="text-slate-400 font-mono text-[9px]">(60–80%)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#EF4444]"></span> Very High</span>
            <span className="text-slate-400 font-mono text-[9px]">(80–100%)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-500"></span> No Data</span>
            <span className="text-slate-400 font-mono text-[9px]">—</span>
          </div>
        </div>
      </div>

      {/* Floating Legend Bottom-Right: Asset Symbols */}
      <div className="absolute bottom-3 right-12 z-[1000] bg-[#071C30]/95 backdrop-blur-md text-white text-[10px] p-2.5 rounded-lg border border-[#0A2D4D] shadow-2xl space-y-1 w-[180px]">
        <p className="font-extrabold text-slate-200 border-b border-slate-800 pb-1 uppercase tracking-wider text-[9px]">
          Asset Symbols
        </p>
        <div className="space-y-1 text-slate-300 pt-0.5">
          <div className="flex items-center gap-1.5"><Waves className="w-3 h-3 text-blue-400" /> Dam / Reservoir</div>
          <div className="flex items-center gap-1.5"><Sprout className="w-3 h-3 text-emerald-400" /> Agriculture Zone</div>
          <div className="flex items-center gap-1.5"><AlertTriangle className="w-3 h-3 text-rose-400" /> Disaster / Flood Zone</div>
          <div className="flex items-center gap-1.5"><Sun className="w-3 h-3 text-amber-400" /> Solar Site</div>
          <div className="flex items-center gap-1.5"><Wind className="w-3 h-3 text-teal-400" /> Wind Site</div>
          <div className="flex items-center gap-1.5"><Radio className="w-3 h-3 text-cyan-400" /> Weather Station</div>
        </div>
      </div>

      {/* Far Right Zoom & Action Control Stack */}
      <div className="absolute right-3 bottom-12 z-[1000] flex flex-col gap-1 text-white">
        <button className="bg-[#071C30]/90 border border-[#0A2D4D] p-1.5 rounded-md hover:bg-slate-800 shadow-md">
          <Plus className="w-3.5 h-3.5 text-slate-200" />
        </button>
        <button className="bg-[#071C30]/90 border border-[#0A2D4D] p-1.5 rounded-md hover:bg-slate-800 shadow-md">
          <Minus className="w-3.5 h-3.5 text-slate-200" />
        </button>
        <button className="bg-[#071C30]/90 border border-[#0A2D4D] p-1.5 rounded-md hover:bg-slate-800 shadow-md mt-1">
          <Navigation className="w-3.5 h-3.5 text-blue-400" />
        </button>
        <button className="bg-[#071C30]/90 border border-[#0A2D4D] p-1.5 rounded-md hover:bg-slate-800 shadow-md">
          <Maximize2 className="w-3.5 h-3.5 text-slate-200" />
        </button>
      </div>
    </div>
  );
};
