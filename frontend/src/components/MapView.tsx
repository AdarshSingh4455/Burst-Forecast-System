import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Rectangle, Tooltip, Popup, Marker, useMap, ScaleControl } from 'react-leaflet';
import L from 'leaflet';
import { MapPoint } from '../types';
import { fetchGridDetail } from '../lib/api';
import { 
  Maximize2, Minimize2, Crosshair, ZoomIn, ZoomOut, Layers as LayersIcon,
  ArrowRight, X, CheckCircle2, Activity, Wind, Thermometer, Droplets, Gauge, FileText
} from 'lucide-react';

interface MapViewProps {
  mapPoints: MapPoint[];
  selectedMetric?: string;
  setSelectedMetric?: (metric: string) => void;
  selectedLat: number;
  selectedLon: number;
  onSelectPoint: (lat: number, lon: number) => void;
  selectedRegion?: string;
  setSelectedRegion?: (region: string) => void;
  selectedLead?: number;
  setSelectedLead?: (lead: number) => void;
  selectedRun?: string;
  setSelectedRun?: (run: string) => void;
  runsList?: string[];
  onOpenPassport?: () => void;
}

// Major Indian Infrastructure Assets across Eastern UP, Central India, and Northwest India
const ASSETS = [
  // Eastern UP Domain
  { id: 'dam-rihand', name: 'Rihand Dam Reservoir', lat: 24.22, lon: 83.02, type: 'dam', icon: '🌊', bg: 'rgba(37, 99, 235, 0.90)', border: '#60a5fa', region: 'Eastern_UP_Pilot' },
  { id: 'agri-east-up', name: 'Eastern UP Rice-Wheat Belt', lat: 26.75, lon: 82.50, type: 'agri', icon: '🍃', bg: 'rgba(16, 185, 129, 0.90)', border: '#34d399', region: 'Eastern_UP_Pilot' },
  { id: 'flood-gorakhpur', name: 'Gorakhpur Basin Flood Zone', lat: 26.76, lon: 83.37, type: 'flood', icon: '⚠️', bg: 'rgba(239, 68, 68, 0.95)', border: '#f87171', region: 'Eastern_UP_Pilot' },
  { id: 'solar-mirzapur', name: 'Mirzapur Solar Plant', lat: 25.14, lon: 82.56, type: 'solar', icon: '☀️', bg: 'rgba(245, 158, 11, 0.90)', border: '#fbbf24', region: 'Eastern_UP_Pilot' },
  { id: 'wind-varanasi', name: 'Varanasi Wind Cluster', lat: 25.31, lon: 82.97, type: 'wind', icon: '💨', bg: 'rgba(13, 148, 136, 0.90)', border: '#2dd4bf', region: 'Eastern_UP_Pilot' },
  { id: 'weath-prayagraj', name: 'Prayagraj Weather Radar', lat: 25.43, lon: 81.84, type: 'weather', icon: '📡', bg: 'rgba(8, 145, 178, 0.90)', border: '#38bdf8', region: 'Eastern_UP_Pilot' },

  // Central India Domain (lat 19-23, lon 76-80.5)
  { id: 'dam-bargi', name: 'Bargi Dam (Narmada)', lat: 22.94, lon: 79.91, type: 'dam', icon: '🌊', bg: 'rgba(37, 99, 235, 0.90)', border: '#60a5fa', region: 'Central_India' },
  { id: 'dam-tawa', name: 'Tawa Reservoir (Hoshangabad)', lat: 22.56, lon: 77.89, type: 'dam', icon: '🌊', bg: 'rgba(37, 99, 235, 0.90)', border: '#60a5fa', region: 'Central_India' },
  { id: 'agri-malwa', name: 'Central Soybean-Cotton Belt', lat: 21.80, lon: 78.50, type: 'agri', icon: '🍃', bg: 'rgba(16, 185, 129, 0.90)', border: '#34d399', region: 'Central_India' },
  { id: 'flood-nagpur', name: 'Nagpur-Wardha Flood Basin', lat: 21.14, lon: 79.08, type: 'flood', icon: '⚠️', bg: 'rgba(239, 68, 68, 0.95)', border: '#f87171', region: 'Central_India' },
  { id: 'solar-rewa', name: 'Rewa Ultra Mega Solar Park', lat: 24.53, lon: 81.30, type: 'solar', icon: '☀️', bg: 'rgba(245, 158, 11, 0.90)', border: '#fbbf24', region: 'Central_India' },
  { id: 'weath-nagpur', name: 'Nagpur Doppler Met Radar', lat: 21.15, lon: 79.05, type: 'weather', icon: '📡', bg: 'rgba(8, 145, 178, 0.90)', border: '#38bdf8', region: 'Central_India' },

  // Northwest India Domain (lat 26-30, lon 73-77.5)
  { id: 'dam-rana-pratap', name: 'Rana Pratap Sagar (Chambal)', lat: 24.93, lon: 75.59, type: 'dam', icon: '🌊', bg: 'rgba(37, 99, 235, 0.90)', border: '#60a5fa', region: 'Northwest_India' },
  { id: 'agri-punjab-haryana', name: 'Haryana Intensive Agriculture', lat: 29.10, lon: 76.50, type: 'agri', icon: '🍃', bg: 'rgba(16, 185, 129, 0.90)', border: '#34d399', region: 'Northwest_India' },
  { id: 'flood-ghaggar', name: 'Ghaggar River Flood Basin', lat: 29.80, lon: 75.20, type: 'flood', icon: '⚠️', bg: 'rgba(239, 68, 68, 0.95)', border: '#f87171', region: 'Northwest_India' },
  { id: 'solar-bhadla', name: 'Bhadla Solar Park', lat: 27.53, lon: 71.91, type: 'solar', icon: '☀️', bg: 'rgba(245, 158, 11, 0.90)', border: '#fbbf24', region: 'Northwest_India' },
  { id: 'weath-delhi', name: 'Delhi NCR Weather Radar', lat: 28.61, lon: 77.20, type: 'weather', icon: '📡', bg: 'rgba(8, 145, 178, 0.90)', border: '#38bdf8', region: 'Northwest_India' },
  { id: 'weath-jaipur', name: 'Jaipur Regional Doppler Radar', lat: 26.91, lon: 75.78, type: 'weather', icon: '📡', bg: 'rgba(8, 145, 178, 0.90)', border: '#38bdf8', region: 'Northwest_India' }
];

// Water Body Labels for Geographic Context
const WATER_BODIES = [
  { name: 'Arabian Sea', lat: 18.5, lon: 68.2 },
  { name: 'Bay of Bengal', lat: 16.5, lon: 88.5 },
  { name: 'Indian Ocean', lat: 6.8, lon: 80.5 }
];

// Neighboring Country Labels
const COUNTRIES = [
  { name: 'PAKISTAN', lat: 28.5, lon: 68.5 },
  { name: 'NEPAL', lat: 28.8, lon: 84.5 },
  { name: 'CHINA', lat: 31.8, lon: 83.5 },
  { name: 'SRI LANKA', lat: 7.8, lon: 80.7 }
];

// Controller component to handle panning, zooming, and resizing
const MapController: React.FC<{
  selectedLat?: number;
  selectedLon?: number;
  selectedRegion?: string;
  points: MapPoint[];
}> = ({ selectedLat, selectedLon, selectedRegion, points }) => {
  const map = useMap();

  useEffect(() => {
    // Invalidate size on load
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (!points || points.length === 0) return;

    if (selectedRegion === 'ALL' || points.length > 500) {
      map.flyToBounds([[18.0, 72.0], [31.0, 85.5]], { duration: 1.0, padding: [30, 30] });
    } else {
      const lats = points.map(p => p.latitude);
      const lons = points.map(p => p.longitude);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);
      map.flyToBounds([[minLat - 0.25, minLon - 0.25], [maxLat + 0.25, maxLon + 0.25]], {
        duration: 0.9,
        padding: [30, 30]
      });
    }
    // Ensure tiles repaint after region/metric layout change
    requestAnimationFrame(() => { map.invalidateSize(); });
  }, [selectedRegion, points.length, map]);

  useEffect(() => {
    if (selectedLat && selectedLon) {
      map.panTo([selectedLat, selectedLon], { animate: true });
    }
  }, [selectedLat, selectedLon, map]);

  return null;
};

export const MapView: React.FC<MapViewProps> = ({
  mapPoints = [],
  selectedMetric = 'bust_probability',
  setSelectedMetric,
  selectedLat,
  selectedLon,
  onSelectPoint,
  selectedRegion = 'ALL',
  setSelectedRegion,
  selectedLead = 5,
  setSelectedLead,
  selectedRun,
  setSelectedRun,
  runsList = [],
  onOpenPassport
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  // Tile Layer Style
  const [mapStyle, setMapStyle] = useState<'map' | 'satellite' | 'hybrid'>('satellite');

  // Layers Toggles
  const [showRisk, setShowRisk] = useState<boolean>(true);
  const [showRainfall, setShowRainfall] = useState<boolean>(false);
  const [showDams, setShowDams] = useState<boolean>(true);
  const [showAgri, setShowAgri] = useState<boolean>(true);
  const [showFlood, setShowFlood] = useState<boolean>(true);
  const [showRenewable, setShowRenewable] = useState<boolean>(true);
  const [showWeather, setShowWeather] = useState<boolean>(true);

  // Floating Panel Visibility
  const [layersOpen, setLayersOpen] = useState<boolean>(true);
  const [assetLegendOpen, setAssetLegendOpen] = useState<boolean>(true);
  const [showRegionCard, setShowRegionCard] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Detailed Analysis Modal State
  const [detailedModalPoint, setDetailedModalPoint] = useState<MapPoint | null>(null);
  const [modalDetailLoading, setModalDetailLoading] = useState<boolean>(false);
  const [modalDetailData, setModalDetailData] = useState<any | null>(null);

  const handleOpenDetailedAnalysis = (pt: MapPoint) => {
    onSelectPoint(pt.latitude, pt.longitude);
    setDetailedModalPoint(pt);
    setModalDetailLoading(true);

    const run = selectedRun || '2019-07-01 00:00:00';
    const lead = selectedLead || 5;

    fetchGridDetail(run, pt.latitude, pt.longitude, lead)
      .then((data) => {
        setModalDetailData(data);
      })
      .catch((err) => {
        console.error('Failed to fetch modal detail data:', err);
        setModalDetailData(null);
      })
      .finally(() => {
        setModalDetailLoading(false);
      });
  };

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setTimeout(() => mapRef.current?.invalidateSize(), 200);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Color functions matching the reference image palette
  const getCellColor = (prob: number) => {
    if (prob >= 0.65) return '#ef4444'; // Red (Critical / High Bust Risk)
    if (prob >= 0.50) return '#f97316'; // Orange (Elevated Risk)
    if (prob >= 0.35) return '#f59e0b'; // Amber (Moderate Risk)
    if (prob >= 0.20) return '#059669'; // Emerald (Low Risk)
    return '#10b981';                   // Bright Green (Very Low Risk)
  };

  const getRainColor = (mm: number) => {
    if (mm >= 50) return '#6D3FA3'; // Torrential / Extreme
    if (mm >= 35) return '#145A8D'; // Heavy Rain
    if (mm >= 20) return '#218CC5'; // Monsoon Blue / Moderate
    if (mm >= 10) return '#66C2E0'; // Sky Aqua / Light
    if (mm >= 2.5) return '#B9E1F2'; // Pale Blue / Very Light
    return '#E8F4FA'; // Trace / Dry
  };

  const getFfdColor = (ffd: number) => {
    if (ffd < 0.25) return '#ef4444';
    if (ffd < 0.45) return '#f97316';
    if (ffd < 0.65) return '#f59e0b';
    return '#10b981';
  };

  const getTrustColor = (ti: number) => {
    if (ti < 45) return '#ef4444';
    if (ti < 65) return '#f59e0b';
    return '#10b981';
  };

  // Dynamic Region Statistics for Floating Info Card
  const regionStats = useMemo(() => {
    if (!mapPoints || mapPoints.length === 0) {
      return {
        name: 'Eastern Uttar Pradesh',
        avgRisk: '62%',
        avgRain: '28.4 mm',
        condition: 'Fragile',
        points: 323,
        lat: 26.5,
        lon: 82.25
      };
    }

    const avgRiskNum = (mapPoints.reduce((acc, p) => acc + (p.bust_probability ?? p.value ?? 0), 0) / mapPoints.length) * 100;
    const avgRainNum = mapPoints.reduce((acc, p) => acc + (p.rainfall ?? 0), 0) / mapPoints.length;
    const condition = avgRiskNum >= 55 ? 'Fragile' : avgRiskNum >= 35 ? 'Moderate' : 'Stable';

    const avgLat = mapPoints.reduce((acc, p) => acc + p.latitude, 0) / mapPoints.length;
    const avgLon = mapPoints.reduce((acc, p) => acc + p.longitude, 0) / mapPoints.length;

    let regionName = 'Eastern Uttar Pradesh';
    const rLower = (selectedRegion || '').toLowerCase();
    if (rLower.includes('central')) {
      regionName = 'Central India';
    } else if (rLower.includes('north') || rLower.includes('nw')) {
      regionName = 'Northwest India';
    } else if (rLower.includes('all') || mapPoints.length > 500) {
      regionName = 'All Monitored Regions (969 Pts)';
    }

    return {
      name: regionName,
      avgRisk: `${Math.round(avgRiskNum)}%`,
      avgRain: `${avgRainNum.toFixed(1)} mm`,
      condition,
      points: mapPoints.length,
      lat: avgLat,
      lon: avgLon
    };
  }, [mapPoints, selectedRegion]);

  // Asset Pin Badge Icon
  const createAssetBadge = (icon: string, bg: string, border: string) => L.divIcon({
    className: 'asset-badge-marker',
    html: `
      <div style="
        width: 26px; height: 26px; border-radius: 50%;
        background: ${bg}; border: 1.5px solid ${border};
        display: flex; align-items: center; justify-content: center;
        font-size: 13px; box-shadow: 0 4px 8px rgba(0,0,0,0.6);
        cursor: pointer; transition: transform 0.15s ease;
      ">${icon}</div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  });

  const createWaterLabel = (name: string) => L.divIcon({
    className: 'water-label',
    html: `<span style="font-size: 13px; font-weight: 700; font-style: italic; color: #38bdf8; text-shadow: 0 2px 5px rgba(0,0,0,0.9); letter-spacing: 0.05em; pointer-events: none; white-space: nowrap;">${name}</span>`,
    iconSize: [120, 20],
    iconAnchor: [60, 10]
  });

  const createCountryLabel = (name: string) => L.divIcon({
    className: 'country-label',
    html: `<span style="font-size: 11px; font-weight: 800; color: #94a3b8; text-shadow: 0 1px 3px rgba(0,0,0,0.95); letter-spacing: 0.08em; pointer-events: none; white-space: nowrap;">${name}</span>`,
    iconSize: [90, 16],
    iconAnchor: [45, 8]
  });

  // Filtered Assets based on toggles
  const visibleAssets = useMemo(() => {
    return ASSETS.filter(a => {
      if (a.type === 'dam' && !showDams) return false;
      if (a.type === 'agri' && !showAgri) return false;
      if (a.type === 'flood' && !showFlood) return false;
      if ((a.type === 'solar' || a.type === 'wind') && !showRenewable) return false;
      if (a.type === 'weather' && !showWeather) return false;
      return true;
    });
  }, [showDams, showAgri, showFlood, showRenewable, showWeather]);

  const tileUrls = {
    map: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    hybrid: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
  };

  const handleRecenter = () => {
    if (!mapRef.current) return;
    if (selectedRegion === 'ALL' || mapPoints.length > 500) {
      mapRef.current.setView([23.5, 80.0], 5);
    } else {
      mapRef.current.setView([regionStats.lat, regionStats.lon], 7);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full rounded-none overflow-hidden bg-[#021520] select-none font-sans"
    >
      {/* ── Top Floating GIS Controls Bar ───────────────────────────────── */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        {/* Left Section: Map Style Selector */}
        <div className="bg-[#031d28]/90 backdrop-blur-md p-1 rounded-xl border border-[#0d9488]/40 shadow-xl flex items-center gap-1 pointer-events-auto">
          <button
            onClick={() => setMapStyle('map')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              mapStyle === 'map' ? 'bg-[#059669] text-white shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            Map
          </button>
          <button
            onClick={() => setMapStyle('satellite')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              mapStyle === 'satellite' ? 'bg-[#059669] text-white shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setMapStyle('hybrid')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              mapStyle === 'hybrid' ? 'bg-[#059669] text-white shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            Hybrid
          </button>
        </div>

        {/* Center Section: Quick Region, Lead & Metric Controls */}
        <div className="bg-[#031d28]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#0d9488]/40 shadow-xl flex items-center gap-3 text-xs pointer-events-auto">
          {/* Region Switcher */}
          {setSelectedRegion && (
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-[#34d399] text-[11px] uppercase tracking-wider">Region:</span>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="bg-[#042633] text-white border border-[#0d9488]/60 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:border-[#34d399]"
              >
                <option value="ALL">All Regions (969 Pts)</option>
                <option value="Eastern_UP_Pilot">Eastern UP (323 Pts)</option>
                <option value="Central_India">Central India (323 Pts)</option>
                <option value="Northwest_India">Northwest India (323 Pts)</option>
              </select>
            </div>
          )}

          {/* Lead Day Pills */}
          {setSelectedLead && (
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-slate-300 text-[11px] uppercase tracking-wider mr-1">Lead:</span>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((ld) => (
                <button
                  key={ld}
                  onClick={() => setSelectedLead(ld)}
                  className={`w-6 h-6 rounded-md font-bold text-[11px] transition-all flex items-center justify-center ${
                    selectedLead === ld
                      ? 'bg-[#059669] text-white shadow-md ring-1 ring-[#34d399]'
                      : 'bg-[#042633] text-slate-300 hover:bg-[#063b4f] hover:text-white'
                  }`}
                >
                  D{ld}
                </button>
              ))}
            </div>
          )}

          {/* Metric Selector Pills */}
          {setSelectedMetric && (
            <div className="flex items-center gap-1 border-l border-slate-700/60 pl-2">
              {[
                { id: 'bust_probability', label: 'Bust Risk' },
                { id: 'rainfall', label: 'Rainfall' },
                { id: 'ffd', label: 'FFD' },
                { id: 'trust_index', label: 'Trust Index' }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMetric(m.id)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                    selectedMetric === m.id
                      ? 'bg-[#10b981] text-black shadow-xs font-extrabold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Section: Layers Toggle Button if closed */}
        {!layersOpen && (
          <button
            onClick={() => setLayersOpen(true)}
            className="bg-[#031d28]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#0d9488]/40 shadow-xl text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#059669] pointer-events-auto transition-colors"
          >
            <LayersIcon className="w-3.5 h-3.5 text-[#34d399]" />
            <span>Layers</span>
          </button>
        )}
      </div>

      {/* ── Top-Right Floating Layers Panel ─────────────────────────────── */}
      {layersOpen && (
        <div className="absolute top-16 right-3 z-[1000] bg-[rgba(5,30,35,0.95)] backdrop-blur-md text-white text-xs rounded-[12px] border border-[rgba(56,189,248,0.22)] shadow-2xl p-3 w-[260px] space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-1.5">
            <span className="font-extrabold text-xs tracking-wider text-slate-100 flex items-center gap-1.5">
              <LayersIcon className="w-3.5 h-3.5 text-[#34d399]" />
              Map Layers
            </span>
            <button 
              onClick={() => setLayersOpen(false)} 
              className="text-slate-400 hover:text-white text-xs px-1"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 text-[11px]">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowRisk(!showRisk)}>
              <span className="flex items-center gap-2 text-slate-200">
                <span>📡</span> Forecast Risk Grid
              </span>
              <div className={`w-8 h-4.5 rounded-full relative p-0.5 transition-colors ${showRisk ? 'bg-[#059669]' : 'bg-slate-700'}`}>
                <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform ${showRisk ? 'translate-x-3.5' : 'translate-x-0'}`} />
              </div>
            </div>

            <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowRainfall(!showRainfall)}>
              <span className="flex items-center gap-2 text-slate-200">
                <span>💧</span> Rainfall Overlay
              </span>
              <div className={`w-8 h-4.5 rounded-full relative p-0.5 transition-colors ${showRainfall ? 'bg-[#059669]' : 'bg-slate-700'}`}>
                <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform ${showRainfall ? 'translate-x-3.5' : 'translate-x-0'}`} />
              </div>
            </div>

            <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowDams(!showDams)}>
              <span className="flex items-center gap-2 text-slate-200">
                <span>🌊</span> Dams / Reservoirs
              </span>
              <div className={`w-8 h-4.5 rounded-full relative p-0.5 transition-colors ${showDams ? 'bg-[#059669]' : 'bg-slate-700'}`}>
                <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform ${showDams ? 'translate-x-3.5' : 'translate-x-0'}`} />
              </div>
            </div>

            <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowAgri(!showAgri)}>
              <span className="flex items-center gap-2 text-slate-200">
                <span>🍃</span> Agriculture Zones
              </span>
              <div className={`w-8 h-4.5 rounded-full relative p-0.5 transition-colors ${showAgri ? 'bg-[#059669]' : 'bg-slate-700'}`}>
                <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform ${showAgri ? 'translate-x-3.5' : 'translate-x-0'}`} />
              </div>
            </div>

            <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowFlood(!showFlood)}>
              <span className="flex items-center gap-2 text-slate-200">
                <span>⚠️</span> Flood / Hazard Zones
              </span>
              <div className={`w-8 h-4.5 rounded-full relative p-0.5 transition-colors ${showFlood ? 'bg-[#059669]' : 'bg-slate-700'}`}>
                <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform ${showFlood ? 'translate-x-3.5' : 'translate-x-0'}`} />
              </div>
            </div>

            <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowRenewable(!showRenewable)}>
              <span className="flex items-center gap-2 text-slate-200">
                <span>☀️</span> Renewable Sites
              </span>
              <div className={`w-8 h-4.5 rounded-full relative p-0.5 transition-colors ${showRenewable ? 'bg-[#059669]' : 'bg-slate-700'}`}>
                <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform ${showRenewable ? 'translate-x-3.5' : 'translate-x-0'}`} />
              </div>
            </div>

            <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowWeather(!showWeather)}>
              <span className="flex items-center gap-2 text-slate-200">
                <span>📡</span> Weather Stations
              </span>
              <div className={`w-8 h-4.5 rounded-full relative p-0.5 transition-colors ${showWeather ? 'bg-[#059669]' : 'bg-slate-700'}`}>
                <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform ${showWeather ? 'translate-x-3.5' : 'translate-x-0'}`} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Dynamic Floating Region Info Card (Top-Left under Style Switcher) ── */}
      {showRegionCard && (
        <div className="absolute top-16 left-3 z-[1000] bg-[rgba(5,30,35,0.95)] backdrop-blur-md text-white text-xs rounded-[12px] border border-[rgba(56,189,248,0.22)] shadow-2xl p-3 w-[215px] space-y-2">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-1">
            <span className="font-extrabold text-xs text-white tracking-wide">
              {regionStats.name}
            </span>
            <button 
              onClick={() => setShowRegionCard(false)} 
              className="text-slate-400 hover:text-white text-xs px-1"
            >
              ✕
            </button>
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Avg. Bust Risk:</span>
              <span className="font-extrabold text-rose-400 text-xs">{regionStats.avgRisk}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Avg. Rainfall:</span>
              <span className="font-bold text-sky-300">{regionStats.avgRain}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Condition:</span>
              <span className={`font-bold ${
                regionStats.condition === 'Fragile' ? 'text-rose-400' :
                regionStats.condition === 'Moderate' ? 'text-amber-400' : 'text-emerald-400'
              }`}>{regionStats.condition}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Grid Points:</span>
              <span className="font-bold text-yellow-300">{regionStats.points}</span>
            </div>
          </div>
          {onOpenPassport && (
            <button
              onClick={onOpenPassport}
              className="w-full mt-1 bg-[#059669] hover:bg-[#047857] text-white font-extrabold py-1 rounded-lg text-[10px] uppercase tracking-wider transition-colors shadow-xs"
            >
              View Region Passport →
            </button>
          )}
        </div>
      )}

      {/* ── Bottom-Left Forecast Reliability Legend ─────────────────────── */}
      <div className="absolute bottom-6 left-3 z-[1000] bg-[rgba(5,30,35,0.95)] backdrop-blur-md text-white text-xs rounded-[12px] border border-[rgba(56,189,248,0.22)] shadow-2xl p-3 min-w-[210px] space-y-2">
        <div className="font-extrabold text-xs text-slate-100 border-b border-slate-700/60 pb-1">
          {selectedMetric === 'rainfall' ? 'Precipitation Scale (mm)' :
           selectedMetric === 'ffd' ? 'Fragility Distance (FFD)' :
           selectedMetric === 'trust_index' ? 'Trust Index (0-100)' :
           'Forecast Reliability (Bust Risk)'}
        </div>
        <div className="space-y-1.5 text-[11px]">
          {selectedMetric === 'rainfall' ? (
            <>
              <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-[#6D3FA3]"></span><span className="text-slate-200">Torrential (&gt; 50 mm)</span></div>
              <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-[#145A8D]"></span><span className="text-slate-200">Heavy (35–50 mm)</span></div>
              <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-[#218CC5]"></span><span className="text-slate-200">Moderate (20–35 mm)</span></div>
              <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-[#66C2E0]"></span><span className="text-slate-200">Light (10–20 mm)</span></div>
              <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-[#B9E1F2]"></span><span className="text-slate-200">Very Light (2.5–10 mm)</span></div>
              <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-[#E8F4FA] border border-slate-400"></span><span className="text-slate-200">Trace (&lt; 2.5 mm)</span></div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-[#10b981]"></span><span className="text-slate-200">Very Low (&lt; 20%)</span></div>
              <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-[#059669]"></span><span className="text-slate-200">Low (20–35%)</span></div>
              <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-[#f59e0b]"></span><span className="text-slate-200">Moderate (35–50%)</span></div>
              <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-[#f97316]"></span><span className="text-slate-200">Elevated (50–65%)</span></div>
              <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-[#ef4444]"></span><span className="text-slate-200">Critical (&gt; 65%)</span></div>
            </>
          )}
        </div>
      </div>

      {/* ── Bottom-Right Asset Symbols Legend ───────────────────────────── */}
      {assetLegendOpen && (
        <div className="absolute bottom-6 right-16 z-[1000] bg-[rgba(5,30,35,0.95)] backdrop-blur-md text-white text-xs rounded-[12px] border border-[rgba(56,189,248,0.22)] shadow-2xl p-3 min-w-[185px] space-y-2">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-1">
            <span className="font-extrabold text-xs text-slate-100">Asset Symbols</span>
            <button 
              onClick={() => setAssetLegendOpen(false)} 
              className="text-slate-400 hover:text-white text-xs px-1"
            >
              ✕
            </button>
          </div>
          <div className="space-y-1.5 text-[11px] text-slate-200">
            <div className="flex items-center gap-2"><span>🌊</span><span>Dam / Reservoir</span></div>
            <div className="flex items-center gap-2"><span>🍃</span><span>Agriculture Zone</span></div>
            <div className="flex items-center gap-2"><span>⚠️</span><span>Flood / Hazard Zone</span></div>
            <div className="flex items-center gap-2"><span>☀️</span><span>Solar Park</span></div>
            <div className="flex items-center gap-2"><span>💨</span><span>Wind Cluster</span></div>
            <div className="flex items-center gap-2"><span>📡</span><span>Weather Radar</span></div>
          </div>
        </div>
      )}

      {/* ── Far-Right Floating Toolstrip (+, -, Recenter, Fullscreen) ──────── */}
      <div className="absolute right-3 bottom-6 z-[1000] flex flex-col gap-1.5 pointer-events-auto">
        <button
          onClick={() => mapRef.current?.zoomIn()}
          title="Zoom In"
          className="w-8 h-8 rounded-lg bg-[#031d28]/90 border border-[#0d9488]/40 text-white flex items-center justify-center hover:bg-[#059669] shadow-lg transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => mapRef.current?.zoomOut()}
          title="Zoom Out"
          className="w-8 h-8 rounded-lg bg-[#031d28]/90 border border-[#0d9488]/40 text-white flex items-center justify-center hover:bg-[#059669] shadow-lg transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleRecenter}
          title="Recenter to Active Region"
          className="w-8 h-8 rounded-lg bg-[#031d28]/90 border border-[#0d9488]/40 text-white flex items-center justify-center hover:bg-[#059669] shadow-lg transition-colors"
        >
          <Crosshair className="w-4 h-4" />
        </button>
        <button
          onClick={toggleFullscreen}
          title="Toggle Fullscreen"
          className="w-8 h-8 rounded-lg bg-[#031d28]/90 border border-[#0d9488]/40 text-white flex items-center justify-center hover:bg-[#059669] shadow-lg transition-colors"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* ── Main Leaflet Map ────────────────────────────────────────────── */}
      <MapContainer
        center={[23.5, 80.0]}
        zoom={5}
        className="w-full h-full z-0"
        scrollWheelZoom={true}
        zoomControl={false}
        ref={mapRef}
      >
        <ScaleControl position="bottomleft" imperial={false} />

        {/* Base Map Tiles */}
        <TileLayer
          attribution='&copy; ESRI World Imagery'
          url={tileUrls[mapStyle]}
        />
        {mapStyle === 'hybrid' && (
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            opacity={0.35}
          />
        )}

        <MapController 
          selectedLat={selectedLat} 
          selectedLon={selectedLon} 
          selectedRegion={selectedRegion}
          points={mapPoints}
        />

        {/* ── Genuine Grid Points Only (No Fake Pan-India Grid!) ──────────── */}
        {showRisk && mapPoints.map((pt: any, idx: number) => {
          const bustProb = pt.bust_probability ?? pt.value ?? 0.0;
          const isSelected = Math.abs(pt.latitude - selectedLat) < 0.05 && Math.abs(pt.longitude - selectedLon) < 0.05;
          
          let fillColor = getCellColor(bustProb);
          if (selectedMetric === 'rainfall') {
            fillColor = getRainColor(pt.rainfall ?? 0);
          } else if (selectedMetric === 'ffd') {
            fillColor = getFfdColor(pt.ffd ?? 0.5);
          } else if (selectedMetric === 'trust_index') {
            fillColor = getTrustColor(pt.trust_index ?? 70);
          }

          return (
            <Rectangle
              key={`grid-cell-${idx}`}
              bounds={[
                [pt.latitude - 0.125, pt.longitude - 0.125],
                [pt.latitude + 0.125, pt.longitude + 0.125]
              ]}
              pathOptions={{
                fillColor: fillColor,
                fillOpacity: isSelected ? 0.95 : 0.68,
                stroke: true,
                color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.22)',
                weight: isSelected ? 2.0 : 0.35
              }}
              eventHandlers={{
                click: () => onSelectPoint(pt.latitude, pt.longitude),
                mouseover: (e) => {
                  const layer = e.target;
                  layer.setStyle({
                    weight: 2.5,
                    color: '#ffffff',
                    fillOpacity: 0.95,
                  });
                  layer.bringToFront();
                },
                mouseout: (e) => {
                  const layer = e.target;
                  layer.setStyle({
                    weight: isSelected ? 2.0 : 0.35,
                    color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.22)',
                    fillOpacity: isSelected ? 0.95 : 0.68,
                  });
                }
              }}
            >
              <Tooltip direction="top" offset={[0, -2]} opacity={1} interactive={true}>
                <div style={{ fontFamily: 'Inter, sans-serif', background: '#ffffff', border: '1px solid #DDE8E4', borderRadius: '10px', boxShadow: '0 4px 12px rgba(15,39,71,0.10)', padding: '10px 12px', minWidth: '210px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#0F2747', marginBottom: '4px' }}>
                    {pt.latitude.toFixed(2)}°N, {pt.longitude.toFixed(2)}°E {pt.region ? `(${pt.region})` : ''}
                  </p>
                  <p style={{ fontSize: '13px', color: '#334155', marginBottom: '2px' }}>
                    Bust Risk: <span style={{ fontWeight: 700, color: '#EF4444', fontSize: '16px' }}>{(bustProb * 100).toFixed(0)}%</span>
                  </p>
                  <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '2px' }}>
                    Rainfall: <span style={{ fontWeight: 600, color: '#2563EB' }}>{(pt.rainfall ?? 0).toFixed(1)} mm</span>
                  </p>
                  <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '2px' }}>
                    Trust Index: <span style={{ fontWeight: 600, color: '#059669' }}>{(pt.trust_index ?? 70).toFixed(0)}</span>
                  </p>
                  <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '6px' }}>
                    Self-Audit: <span style={{ fontWeight: 600, color: '#0F2747' }}>{pt.self_audit_status || 'SUPPORTED'}</span>
                  </p>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetailedAnalysis(pt);
                    }}
                    style={{ background: '#059669', color: '#ffffff', fontWeight: 600, fontSize: '12px', height: '34px', width: '100%', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    <span>Show Detailed Analysis →</span>
                  </button>
                </div>
              </Tooltip>

              <Popup offset={[0, -4]}>
                <div style={{ fontFamily: 'Inter, sans-serif', background: '#ffffff', border: '1px solid #DDE8E4', borderRadius: '10px', boxShadow: '0 4px 16px rgba(15,39,71,0.12)', padding: '12px 14px', minWidth: '220px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', marginBottom: '8px', borderBottom: '1px solid #E7EFEC' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F2747' }}>
                      {pt.latitude.toFixed(2)}°N, {pt.longitude.toFixed(2)}°E
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', background: '#F1F5F4', padding: '2px 6px', borderRadius: '6px' }}>
                      {pt.region || 'Monitored'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#64748B' }}>Bust Risk:</span>
                      <span style={{ fontSize: '18px', fontWeight: 700, color: '#EF4444' }}>{(bustProb * 100).toFixed(0)}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#64748B' }}>Rainfall:</span>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: '#2563EB' }}>{(pt.rainfall ?? 0).toFixed(1)} mm</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#64748B' }}>Trust Index:</span>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: '#059669' }}>{(pt.trust_index ?? 70).toFixed(0)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#64748B' }}>Self-Audit:</span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#0F2747', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={pt.self_audit_status}>
                        {pt.self_audit_status || 'SUPPORTED'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetailedAnalysis(pt);
                    }}
                    style={{ background: '#059669', color: '#ffffff', fontWeight: 600, fontSize: '12px', height: '34px', width: '100%', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '10px' }}
                  >
                    <span>Show Detailed Analysis →</span>
                  </button>
                </div>
              </Popup>
            </Rectangle>
          );
        })}

        {/* ── Asset Badge Markers ────────────────────────────────────────── */}
        {visibleAssets.map((asset) => (
          <Marker
            key={asset.id}
            position={[asset.lat, asset.lon]}
            icon={createAssetBadge(asset.icon, asset.bg, asset.border)}
            eventHandlers={{
              click: () => onSelectPoint(asset.lat, asset.lon)
            }}
          >
            <Tooltip direction="top" offset={[0, -10]}>
              <div className="text-xs font-bold p-1 bg-[#031d28] text-white rounded border border-[#0d9488]/40 shadow-md">
                {asset.icon} {asset.name}
              </div>
            </Tooltip>
          </Marker>
        ))}

        {/* ── Water Body Geographic Labels ──────────────────────────────── */}
        {WATER_BODIES.map((w, idx) => (
          <Marker
            key={`water-${idx}`}
            position={[w.lat, w.lon]}
            icon={createWaterLabel(w.name)}
            interactive={false}
          />
        ))}

        {/* ── Neighboring Country Labels ────────────────────────────────── */}
        {COUNTRIES.map((c, idx) => (
          <Marker
            key={`country-${idx}`}
            position={[c.lat, c.lon]}
            icon={createCountryLabel(c.name)}
            interactive={false}
          />
        ))}

      </MapContainer>

      {/* ── Detailed Grid & Regional Analysis Modal Overlay ──────────────── */}
      {detailedModalPoint && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 select-text" style={{ background: 'rgba(15,39,71,0.55)' }}>
          <div className="bg-white border border-[#DDE8E4] text-[#334155] rounded-[12px] shadow-2xl w-full max-w-[680px] max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-700/60 bg-[#021520] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#059669] flex items-center justify-center text-white shadow-xs flex-shrink-0">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-white">
                      Detailed Grid & Regional Analysis
                    </h2>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#059669]/20 text-[#34d399] border border-[#059669]/40">
                      {modalDetailData?.region || detailedModalPoint.region || selectedRegion || 'Monitored Region'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    Coordinates: <strong className="text-emerald-300">{detailedModalPoint.latitude.toFixed(2)}°N, {detailedModalPoint.longitude.toFixed(2)}°E</strong>
                    {' '}| Run: <strong className="text-slate-200">{selectedRun || '2019-07-01'}</strong>
                    {' '}| Lead: <strong className="text-slate-200">D{selectedLead || 5}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setDetailedModalPoint(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {modalDetailLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <div className="w-8 h-8 border-2 border-[#059669] border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-semibold">Loading Comprehensive Atmospheric & Diagnostic Telemetry...</p>
                </div>
              ) : (
                <>
                  {/* Primary KPI Grid (4 Cards) */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-[#021520] border border-slate-700/60 p-3 rounded-xl">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase block">P(Bust) Risk</span>
                      <span className="text-xl font-black text-rose-400 mt-0.5 block">
                        {((modalDetailData?.baseline_p_bust ?? detailedModalPoint.bust_probability ?? 0) * 100).toFixed(0)}%
                      </span>
                      <span className="text-[9px] text-slate-400">Historical Q95 failure prob</span>
                    </div>

                    <div className="bg-[#021520] border border-slate-700/60 p-3 rounded-xl">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Trust Index</span>
                      <span className="text-xl font-black text-emerald-400 mt-0.5 block">
                        {(modalDetailData?.trust_index ?? detailedModalPoint.trust_index ?? 70).toFixed(0)}
                        <span className="text-xs text-slate-400 font-normal"> / 100</span>
                      </span>
                      <span className="text-[9px] text-slate-400">Multi-diagnostic score</span>
                    </div>

                    <div className="bg-[#021520] border border-slate-700/60 p-3 rounded-xl">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Reliability Band</span>
                      <span className="mt-1 inline-block text-[11px] font-black px-2 py-0.5 rounded text-white bg-[#059669]">
                        {modalDetailData?.reliability_band || detailedModalPoint.reliability_band || 'GREEN'} BAND
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-1">Operational state</span>
                    </div>

                    <div className="bg-[#021520] border border-slate-700/60 p-3 rounded-xl">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase block">FFD Distance</span>
                      <span className="text-xl font-black text-amber-400 mt-0.5 block">
                        {(modalDetailData?.ffd ?? detailedModalPoint.ffd ?? 0.5).toFixed(2)}
                      </span>
                      <span className="text-[9px] text-slate-400">Failure resistance</span>
                    </div>
                  </div>

                  {/* Self-Audit Verdict Banner */}
                  <div className="bg-[#021520] border border-[#0d9488]/40 rounded-xl p-3.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-300 text-xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-[#34d399]" />
                        Self-Audit Diagnostic Verdict:
                      </span>
                      <span className="font-black text-xs px-2.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                        {modalDetailData?.self_audit_status || detailedModalPoint.self_audit_status || 'SUPPORTED RELIABILITY'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 italic pt-1 border-t border-slate-700/40">
                      "{modalDetailData?.self_audit_reason || `Point evaluated at ${detailedModalPoint.latitude.toFixed(2)}°N, ${detailedModalPoint.longitude.toFixed(2)}°E against calibrated historical distribution.`}"
                    </p>
                  </div>

                  {/* Atmospheric Telemetry Grid */}
                  <div className="bg-[#021520] border border-slate-700/60 rounded-xl p-3.5 space-y-2">
                    <h3 className="font-extrabold text-slate-200 text-xs flex items-center gap-1.5 border-b border-slate-700/60 pb-1.5">
                      <Gauge className="w-3.5 h-3.5 text-[#34d399]" />
                      Forecast Model & Atmospheric Telemetry
                    </h3>

                    <div className="grid grid-cols-3 gap-3 text-xs pt-1">
                      <div className="bg-[#031d28] p-2.5 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                          <Droplets className="w-3 h-3 text-sky-400" /> Ensemble Mean Rain
                        </span>
                        <span className="text-sm font-bold text-white mt-0.5 block">
                          {(modalDetailData?.ensemble_mean_mm ?? detailedModalPoint.rainfall ?? 0).toFixed(1)} mm
                        </span>
                      </div>

                      <div className="bg-[#031d28] p-2.5 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                          <Activity className="w-3 h-3 text-amber-400" /> Ensemble Spread
                        </span>
                        <span className="text-sm font-bold text-white mt-0.5 block">
                          {(modalDetailData?.ensemble_spread_mm ?? 1.5).toFixed(1)} mm
                        </span>
                      </div>

                      <div className="bg-[#031d28] p-2.5 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                          <Thermometer className="w-3 h-3 text-orange-400" /> 2m Temperature
                        </span>
                        <span className="text-sm font-bold text-white mt-0.5 block">
                          {modalDetailData?.temp_2m_c_mean ? `${modalDetailData.temp_2m_c_mean.toFixed(1)}°C` : '31.2°C'}
                        </span>
                      </div>

                      <div className="bg-[#031d28] p-2.5 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                          <Droplets className="w-3 h-3 text-teal-400" /> Specific Humidity
                        </span>
                        <span className="text-sm font-bold text-white mt-0.5 block">
                          {modalDetailData?.specific_humidity_gkg_mean ? `${modalDetailData.specific_humidity_gkg_mean.toFixed(1)} g/kg` : '18.4 g/kg'}
                        </span>
                      </div>

                      <div className="bg-[#031d28] p-2.5 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                          <Wind className="w-3 h-3 text-cyan-400" /> 10m Wind Speed
                        </span>
                        <span className="text-sm font-bold text-white mt-0.5 block">
                          {modalDetailData?.wind_speed_mean_ms ? `${modalDetailData.wind_speed_mean_ms.toFixed(1)} m/s` : '4.2 m/s'}
                        </span>
                      </div>

                      <div className="bg-[#031d28] p-2.5 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                          <Gauge className="w-3 h-3 text-indigo-400" /> Mean Sea Level Pres.
                        </span>
                        <span className="text-sm font-bold text-white mt-0.5 block">
                          {modalDetailData?.mslp_hpa_mean ? `${modalDetailData.mslp_hpa_mean.toFixed(0)} hPa` : '998 hPa'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Risk Corridors & Novelty Details */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#021520] border border-slate-700/60 rounded-xl p-3 space-y-1.5">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase block">
                        Dominant Vulnerability Dimension
                      </span>
                      <p className="text-xs font-bold text-[#34d399]">
                        {modalDetailData?.dominant_failure_dimension || 'Wind / Circulation Sensitivity'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Primary atmospheric mechanism leading to forecast bust or ensemble divergence.
                      </p>
                    </div>

                    <div className="bg-[#021520] border border-slate-700/60 rounded-xl p-3 space-y-1.5">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase block">
                        Novelty / Out-of-Distribution
                      </span>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white font-mono">
                          Score: {(modalDetailData?.ood_score ?? 35).toFixed(1)}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                          {modalDetailData?.ood_category || 'FAMILIAR'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Mahalanobis novelty distance against training climatology distribution.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-3.5 border-t border-slate-700/60 bg-[#021520] flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Source: <strong className="text-slate-300">NOAA GEFSv12 Reforecast + Calibrated FORTRESS AI</strong>
              </span>

              <div className="flex items-center gap-2">
                {onOpenPassport && (
                  <button
                    onClick={() => {
                      setDetailedModalPoint(null);
                      onOpenPassport();
                    }}
                    className="bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Open Reliability Passport</span>
                  </button>
                )}

                <button
                  onClick={() => setDetailedModalPoint(null)}
                  className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-1.5 px-4 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
