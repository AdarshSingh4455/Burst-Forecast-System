import React, { useState, useRef } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

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

  // Dynamic color scale based on selectedMetric
  const getColor = (pt: any): string => {
    const v = pt.value ?? pt.bust_probability ?? 0;
    
    if (selectedMetric === 'bust_probability' || selectedMetric === 'bust_risk_probability') {
      if (v < 0.20) return '#22C55E';
      if (v < 0.40) return '#84CC16';
      if (v < 0.60) return '#F59E0B';
      if (v < 0.80) return '#F97316';
      return '#EF4444';
    } else if (selectedMetric === 'rainfall') {
      const rain = pt.rainfall ?? v;
      if (rain < 10) return '#7DD3FC';
      if (rain < 25) return '#3B82F6';
      if (rain < 45) return '#1D4ED8';
      return '#4338CA';
    } else if (selectedMetric === 'ffd' || selectedMetric === 'fragility_score') {
      const ffd = pt.ffd ?? v;
      if (ffd < 0.30) return '#EF4444';
      if (ffd < 0.60) return '#F59E0B';
      return '#10B981';
    } else if (selectedMetric === 'fragility_auc') {
      if (v < 0.40) return '#10B981';
      if (v < 0.70) return '#F59E0B';
      return '#EF4444';
    } else if (selectedMetric === 'trust_index') {
      if (v >= 75) return '#10B981';
      if (v >= 50) return '#F59E0B';
      return '#EF4444';
    } else if (selectedMetric === 'ood_score') {
      if (v < 40) return '#10B981';
      if (v < 75) return '#F59E0B';
      return '#8B5CF6';
    } else if (selectedMetric === 'ensemble_disagreement_score') {
      if (v < 0.30) return '#10B981';
      if (v < 0.60) return '#F59E0B';
      return '#EF4444';
    } else {
      if (pt.reliability_band === 'GREEN') return '#22C55E';
      if (pt.reliability_band === 'YELLOW') return '#F59E0B';
      return '#EF4444';
    }
  };

  const tileUrls = {
    map: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    hybrid: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
  };

  // Demo asset locations (clearly labeled DEMO)
  const assets = [
    { name: 'Rihand Reservoir (DEMO)', lat: 24.22, lon: 83.02, type: 'dam' },
    { name: 'Agriculture Zone (East UP) (DEMO)', lat: 26.75, lon: 82.50, type: 'agri' },
    { name: 'Flood Prone Area (Gorakhpur) (DEMO)', lat: 26.76, lon: 83.37, type: 'flood' },
    { name: 'Solar Plant (Mirzapur) (DEMO)', lat: 25.14, lon: 82.56, type: 'solar' },
    { name: 'Wind Site (Varanasi) (DEMO)', lat: 25.31, lon: 82.97, type: 'wind' },
    { name: 'Weather Station (Prayagraj) (DEMO)', lat: 25.43, lon: 81.84, type: 'weather' }
  ];

  // Leaflet action controls
  const handleZoomIn = () => {
    if (mapRef.current) mapRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapRef.current) mapRef.current.zoomOut();
  };

  const handleLocateReset = () => {
    if (mapRef.current) {
      mapRef.current.setView([26.2, 82.5], 7);
    }
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Metric-specific legend renderer
  const renderMetricLegend = () => {
    if (selectedMetric === 'rainfall') {
      return (
        <div className="space-y-0.5 pt-0.5">
          <div className="flex items-center justify-between"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#7DD3FC]"></span> Light</span><span className="text-slate-400 font-mono text-[9px]">(0–10mm)</span></div>
          <div className="flex items-center justify-between"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#3B82F6]"></span> Moderate</span><span className="text-slate-400 font-mono text-[9px]">(10–25mm)</span></div>
          <div className="flex items-center justify-between"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#1D4ED8]"></span> Heavy</span><span className="text-slate-400 font-mono text-[9px]">(25–45mm)</span></div>
          <div className="flex items-center justify-between"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#4338CA]"></span> Extreme</span><span className="text-slate-400 font-mono text-[9px]">(45+mm)</span></div>
        </div>
      );
    } else if (selectedMetric === 'ffd' || selectedMetric === 'fragility_score') {
      return (
        <div className="space-y-0.5 pt-0.5">
          <div className="flex items-center justify-between"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#EF4444]"></span> High Fragility</span><span className="text-slate-400 font-mono text-[9px] font-bold">(&lt; 0.30)</span></div>
          <div className="flex items-center justify-between"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span> Moderate</span><span className="text-slate-400 font-mono text-[9px]">(0.30–0.60)</span></div>
          <div className="flex items-center justify-between"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#10B981]"></span> Robust</span><span className="text-slate-400 font-mono text-[9px]">(&gt; 0.60)</span></div>
        </div>
      );
    } else if (selectedMetric === 'trust_index') {
      return (
        <div className="space-y-0.5 pt-0.5">
          <div className="flex items-center justify-between"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#10B981]"></span> High Trust</span><span className="text-slate-400 font-mono text-[9px]">(75–100)</span></div>
          <div className="flex items-center justify-between"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span> Moderate</span><span className="text-slate-400 font-mono text-[9px]">(50–75)</span></div>
          <div className="flex items-center justify-between"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#EF4444]"></span> Low Trust</span><span className="text-slate-400 font-mono text-[9px] font-bold">(&lt; 50)</span></div>
        </div>
      );
    } else if (selectedMetric === 'ood_score') {
      return (
        <div className="space-y-0.5 pt-0.5">
          <div className="flex items-center justify-between"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#10B981]"></span> Familiar</span><span className="text-slate-400 font-mono text-[9px]">(&lt; 40)</span></div>
          <div className="flex items-center justify-between"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span> Unusual</span><span className="text-slate-400 font-mono text-[9px]">(40–75)</span></div>
          <div className="flex items-center justify-between"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#8B5CF6]"></span> Highly Novel</span><span className="text-slate-400 font-mono text-[9px]">(&gt; 75)</span></div>
        </div>
      );
    } else {
      return (
        <div className="space-y-0.5 pt-0.5">
          <div className="flex items-center justify-between"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#22C55E]"></span> Very Low</span><span className="text-slate-400 font-mono text-[9px]">(0–20%)</span></div>
          <div className="flex items-center justify-between"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#84CC16]"></span> Low</span><span className="text-slate-400 font-mono text-[9px]">(20–40%)</span></div>
          <div className="flex items-center justify-between"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span> Moderate</span><span className="text-slate-400 font-mono text-[9px]">(40–60%)</span></div>
          <div className="flex items-center justify-between"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#F97316]"></span> High</span><span className="text-slate-400 font-mono text-[9px]">(60–80%)</span></div>
          <div className="flex items-center justify-between"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#EF4444]"></span> Very High</span><span className="text-slate-400 font-mono text-[9px]">(80–100%)</span></div>
        </div>
      );
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full rounded-lg overflow-hidden border border-[#0A2D4D] bg-[#071C30] shadow-md flex flex-col select-none">
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
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; ESRI / OpenStreetMap'
          url={tileUrls[mapStyle]}
        />
        {mapStyle === 'hybrid' && (
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            opacity={0.35}
          />
        )}

        {/* Eastern UP Pilot Bounding Box */}
        <Rectangle
          bounds={easternUpBounds}
          pathOptions={{ color: '#3b82f6', weight: 1.5, dashArray: '5, 5', fillOpacity: 0.02 }}
        />

        {/* Forecast Grid Risk Overlay */}
        {showRisk && mapPoints.map((pt: any, idx) => {
          const isSelected = Math.abs(pt.latitude - selectedLat) < 0.05 && Math.abs(pt.longitude - selectedLon) < 0.05;
          const color = getColor(pt);
          const bustPct = pt.bust_probability !== undefined ? (pt.bust_probability * 100).toFixed(0) : (pt.value !== undefined ? (pt.value * 100).toFixed(0) : 'N/A');
          const rainVal = pt.rainfall !== undefined ? pt.rainfall.toFixed(1) : 'N/A';
          const ffdVal = pt.ffd !== undefined ? pt.ffd.toFixed(2) : 'N/A';

          return (
            <CircleMarker
              key={`risk-${idx}`}
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
              {/* Dynamic Real Tooltip - No Screenshot Hardcoding */}
              <Tooltip direction="top" offset={[0, -5]} opacity={0.95}>
                <div className="text-xs p-1.5 space-y-1 bg-[#071C30] text-white rounded-md border border-[#0A2D4D]">
                  <p className="font-extrabold border-b border-slate-700 pb-1 text-slate-100">
                    {pt.latitude.toFixed(2)}°N, {pt.longitude.toFixed(2)}°E
                  </p>
                  <p><span className="text-slate-400">Bust Risk:</span> <span className="font-mono font-bold text-red-400">{bustPct}%</span></p>
                  <p><span className="text-slate-400">Rainfall:</span> <span className="font-bold text-blue-300">{rainVal} mm</span></p>
                  <p><span className="text-slate-400">FFD:</span> <span className="font-bold text-amber-400">{ffdVal}</span></p>
                  <p><span className="text-slate-400">Band:</span> <span className="font-bold text-emerald-400">{pt.reliability_band}</span></p>
                  <p className="text-[10px] text-blue-400 font-bold mt-1">Click to view details →</p>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}

        {/* Separate Rainfall Visualization Layer */}
        {showRainfall && mapPoints.map((pt: any, idx) => (
          <CircleMarker
            key={`rain-${idx}`}
            center={[pt.latitude, pt.longitude]}
            radius={Math.max(3, Math.min(10, (pt.rainfall || 10) / 5))}
            pathOptions={{ fillColor: '#38bdf8', color: '#0284c7', weight: 1, fillOpacity: 0.6 }}
          />
        ))}

        {/* Asset Markers (Clearly Marked DEMO) */}
        {showDams && assets.filter(a => a.type === 'dam').map((a, i) => (
          <CircleMarker key={`dam-${i}`} center={[a.lat, a.lon]} radius={6} pathOptions={{ fillColor: '#2563eb', color: '#ffffff', weight: 1.5, fillOpacity: 1 }}>
            <Tooltip><span className="font-bold text-xs">🌊 {a.name}</span></Tooltip>
          </CircleMarker>
        ))}
        {showAgri && assets.filter(a => a.type === 'agri').map((a, i) => (
          <CircleMarker key={`agri-${i}`} center={[a.lat, a.lon]} radius={6} pathOptions={{ fillColor: '#16a34a', color: '#ffffff', weight: 1.5, fillOpacity: 1 }}>
            <Tooltip><span className="font-bold text-xs">🌱 {a.name}</span></Tooltip>
          </CircleMarker>
        ))}
        {showFlood && assets.filter(a => a.type === 'flood').map((a, i) => (
          <CircleMarker key={`flood-${i}`} center={[a.lat, a.lon]} radius={6} pathOptions={{ fillColor: '#dc2626', color: '#ffffff', weight: 1.5, fillOpacity: 1 }}>
            <Tooltip><span className="font-bold text-xs">⚠️ {a.name}</span></Tooltip>
          </CircleMarker>
        ))}
        {showRenewable && assets.filter(a => a.type === 'solar' || a.type === 'wind').map((a, i) => (
          <CircleMarker key={`ren-${i}`} center={[a.lat, a.lon]} radius={6} pathOptions={{ fillColor: '#d97706', color: '#ffffff', weight: 1.5, fillOpacity: 1 }}>
            <Tooltip><span className="font-bold text-xs">⚡ {a.name}</span></Tooltip>
          </CircleMarker>
        ))}
        {showWeather && assets.filter(a => a.type === 'weather').map((a, i) => (
          <CircleMarker key={`weather-${i}`} center={[a.lat, a.lon]} radius={6} pathOptions={{ fillColor: '#0891b2', color: '#ffffff', weight: 1.5, fillOpacity: 1 }}>
            <Tooltip><span className="font-bold text-xs">📡 {a.name}</span></Tooltip>
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
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyan-500"></span> Rainfall Overlay</span>
              <input type="checkbox" checked={showRainfall} onChange={(e) => setShowRainfall(e.target.checked)} className="rounded border-slate-700 accent-blue-600 cursor-pointer" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-1.5"><Waves className="w-3 h-3 text-blue-400" /> Dams (DEMO)</span>
              <input type="checkbox" checked={showDams} onChange={(e) => setShowDams(e.target.checked)} className="rounded border-slate-700 accent-blue-600 cursor-pointer" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-1.5"><Sprout className="w-3 h-3 text-emerald-400" /> Agriculture (DEMO)</span>
              <input type="checkbox" checked={showAgri} onChange={(e) => setShowAgri(e.target.checked)} className="rounded border-slate-700 accent-blue-600 cursor-pointer" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-1.5"><AlertTriangle className="w-3 h-3 text-rose-400" /> Flood Zones (DEMO)</span>
              <input type="checkbox" checked={showFlood} onChange={(e) => setShowFlood(e.target.checked)} className="rounded border-slate-700 accent-blue-600 cursor-pointer" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-1.5"><Sun className="w-3 h-3 text-amber-400" /> Renewables (DEMO)</span>
              <input type="checkbox" checked={showRenewable} onChange={(e) => setShowRenewable(e.target.checked)} className="rounded border-slate-700 accent-blue-600 cursor-pointer" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-1.5"><Radio className="w-3 h-3 text-teal-400" /> Weather Stations</span>
              <input type="checkbox" checked={showWeather} onChange={(e) => setShowWeather(e.target.checked)} className="rounded border-slate-700 accent-blue-600 cursor-pointer" />
            </label>
            <label className="flex items-center justify-between cursor-pointer text-slate-400" title="Boundary layer not loaded">
              <span>State Boundaries</span>
              <input type="checkbox" checked={showStateBounds} onChange={(e) => setShowStateBounds(e.target.checked)} className="rounded border-slate-700 accent-blue-600 cursor-pointer" />
            </label>
            <label className="flex items-center justify-between cursor-pointer text-slate-400" title="Boundary layer not loaded">
              <span>District Boundaries</span>
              <input type="checkbox" checked={showDistrictBounds} onChange={(e) => setShowDistrictBounds(e.target.checked)} className="rounded border-slate-700 accent-blue-600 cursor-pointer" />
            </label>
          </div>
        )}
      </div>

      {/* Floating Legend Bottom-Left: Metric Specific Scale */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-[#071C30]/95 backdrop-blur-md text-white text-[10px] p-2.5 rounded-lg border border-[#0A2D4D] shadow-2xl space-y-1 w-[200px]">
        <p className="font-extrabold text-slate-200 border-b border-slate-800 pb-1 uppercase tracking-wider text-[9px]">
          {selectedMetric === 'rainfall' ? 'Rainfall Scale (mm)' : selectedMetric === 'ffd' ? 'FFD Scale (Fragility)' : selectedMetric === 'trust_index' ? 'Trust Index (0-100)' : selectedMetric === 'ood_score' ? 'OOD Score (Novelty)' : 'Forecast Reliability (Bust Risk)'}
        </p>
        {renderMetricLegend()}
      </div>

      {/* Floating Legend Bottom-Right: Asset Symbols */}
      <div className="absolute bottom-3 right-12 z-[1000] bg-[#071C30]/95 backdrop-blur-md text-white text-[10px] p-2.5 rounded-lg border border-[#0A2D4D] shadow-2xl space-y-1 w-[180px]">
        <p className="font-extrabold text-slate-200 border-b border-slate-800 pb-1 uppercase tracking-wider text-[9px]">
          Asset Symbols (DEMO)
        </p>
        <div className="space-y-1 text-slate-300 pt-0.5">
          <div className="flex items-center gap-1.5"><Waves className="w-3 h-3 text-blue-400" /> Dam / Reservoir</div>
          <div className="flex items-center gap-1.5"><Sprout className="w-3 h-3 text-emerald-400" /> Agriculture Zone</div>
          <div className="flex items-center gap-1.5"><AlertTriangle className="w-3 h-3 text-rose-400" /> Disaster / Flood Zone</div>
          <div className="flex items-center gap-1.5"><Sun className="w-3 h-3 text-amber-400" /> Solar / Wind Site</div>
          <div className="flex items-center gap-1.5"><Radio className="w-3 h-3 text-teal-400" /> Weather Station</div>
        </div>
      </div>

      {/* Far Right Zoom & Action Control Stack */}
      <div className="absolute right-3 bottom-12 z-[1000] flex flex-col gap-1 text-white">
        <button onClick={handleZoomIn} title="Zoom In" className="bg-[#071C30]/90 border border-[#0A2D4D] p-1.5 rounded-md hover:bg-slate-800 shadow-md">
          <Plus className="w-3.5 h-3.5 text-slate-200" />
        </button>
        <button onClick={handleZoomOut} title="Zoom Out" className="bg-[#071C30]/90 border border-[#0A2D4D] p-1.5 rounded-md hover:bg-slate-800 shadow-md">
          <Minus className="w-3.5 h-3.5 text-slate-200" />
        </button>
        <button onClick={handleLocateReset} title="Reset View" className="bg-[#071C30]/90 border border-[#0A2D4D] p-1.5 rounded-md hover:bg-slate-800 shadow-md mt-1">
          <Navigation className="w-3.5 h-3.5 text-blue-400" />
        </button>
        <button onClick={handleFullscreen} title="Toggle Fullscreen" className="bg-[#071C30]/90 border border-[#0A2D4D] p-1.5 rounded-md hover:bg-slate-800 shadow-md">
          <Maximize2 className="w-3.5 h-3.5 text-slate-200" />
        </button>
      </div>
    </div>
  );
};
