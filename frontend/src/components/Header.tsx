import React, { useState } from 'react';
import { Search, Info } from 'lucide-react';
import { Metadata } from '../types';

interface HeaderProps {
  metadata: Metadata | null;
  selectedRun: string;
  setSelectedRun: (run: string) => void;
  selectedLead: number;
  setSelectedLead: (lead: number) => void;
  selectedMetric: string;
  setSelectedMetric: (metric: string) => void;
  selectedRegion: string;
  setSelectedRegion: (region: string) => void;
  onSelectPoint?: (lat: number, lon: number) => void;
}

export const Header: React.FC<HeaderProps> = ({
  metadata,
  selectedRun,
  setSelectedRun,
  selectedLead,
  setSelectedLead,
  selectedMetric,
  setSelectedMetric,
  selectedRegion,
  setSelectedRegion,
  onSelectPoint
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);

  const regionsList = metadata?.regions || ['ALL', 'Eastern_UP_Pilot'];
  const runList = metadata?.forecast_init_dates || ['2019-07-01 00:00:00'];
  const leadList = metadata?.lead_days || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const metricOptions = [
    { id: 'bust_probability', label: 'Bust Risk' },
    { id: 'rainfall', label: 'Rainfall' },
    { id: 'ffd', label: 'FFD' },
    { id: 'fragility_auc', label: 'Fragility' },
    { id: 'trust_index', label: 'Trust Index' },
    { id: 'ood_score', label: 'OOD Score' },
    { id: 'ensemble_disagreement_score', label: 'Ensemble Disagreement' },
  ];

  const formatRunDate = (dateStr: string) => {
    if (!dateStr) return '01 Jul 2019, 00Z';
    try {
      const d = new Date(dateStr.replace(' ', 'T'));
      if (isNaN(d.getTime())) return dateStr.slice(0, 10) + ', 00Z';
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = String(d.getDate()).padStart(2, '0');
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      return `${day} ${month} ${year}, 00Z`;
    } catch {
      return dateStr;
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchFeedback(null);
    const query = searchQuery.trim();
    if (!query) return;

    const coordMatch = query.match(/^([-+]?\d*\.?\d+)[,\s]+([-+]?\d*\.?\d+)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lon = parseFloat(coordMatch[2]);
      if (lat >= 24.0 && lat <= 28.5 && lon >= 80.0 && lon <= 84.5) {
        onSelectPoint?.(lat, lon);
        setSearchFeedback(`Selected coordinate (${lat.toFixed(2)}, ${lon.toFixed(2)})`);
        setTimeout(() => setSearchFeedback(null), 3000);
      } else {
        setSearchFeedback("Outside current Eastern UP pilot coverage.");
        setTimeout(() => setSearchFeedback(null), 4000);
      }
      return;
    }

    const lower = query.toLowerCase();
    if (lower.includes('rihand') || lower.includes('dam') || lower.includes('reservoir')) {
      onSelectPoint?.(24.22, 83.02);
      setSearchFeedback("Snapped to Rihand Reservoir (24.22°N, 83.02°E)");
      setTimeout(() => setSearchFeedback(null), 3000);
    } else if (lower.includes('agri') || lower.includes('farm')) {
      onSelectPoint?.(26.75, 82.50);
      setSearchFeedback("Snapped to Agriculture Zone (26.75°N, 82.50°E)");
      setTimeout(() => setSearchFeedback(null), 3000);
    } else if (lower.includes('flood') || lower.includes('gorakhpur')) {
      onSelectPoint?.(26.76, 83.37);
      setSearchFeedback("Snapped to Flood Prone Area (26.76°N, 83.37°E)");
      setTimeout(() => setSearchFeedback(null), 3000);
    } else if (lower.includes('solar') || lower.includes('mirzapur')) {
      onSelectPoint?.(25.14, 82.56);
      setSearchFeedback("Snapped to Solar Plant (25.14°N, 82.56°E)");
      setTimeout(() => setSearchFeedback(null), 3000);
    } else if (lower.includes('wind') || lower.includes('varanasi')) {
      onSelectPoint?.(25.31, 82.97);
      setSearchFeedback("Snapped to Wind Site (25.31°N, 82.97°E)");
      setTimeout(() => setSearchFeedback(null), 3000);
    } else if (lower.includes('eastern') || lower.includes('up')) {
      setSelectedRegion('Eastern_UP_Pilot');
      setSearchFeedback("Region set to Eastern UP Pilot");
      setTimeout(() => setSearchFeedback(null), 3000);
    } else {
      setSearchFeedback("Search lat,lon or asset (e.g. 26.75, 83.25 or Rihand)");
      setTimeout(() => setSearchFeedback(null), 3000);
    }
  };

  return (
    <div className="flex flex-col select-none flex-shrink-0">
      {/* Top Ultra Light Green Header */}
      <header className="bg-[#F4FAF6] border-b border-[#C8EAD9] px-5 py-2 flex items-center justify-between gap-4 h-[60px]">
        {/* Title & Tagline */}
        <div>
          <h1 className="text-[19px] font-extrabold text-[#044E3A] tracking-tight leading-none">
            FORTRESS
          </h1>
          <p className="text-[11px] text-[#065F46] font-semibold leading-tight mt-0.5">
            Forecast Reliability | Stress-Testing & Self-Audit System
          </p>
        </div>

        {/* Global Controls & Filters */}
        <div className="flex items-center gap-2">
          {/* Region */}
          <div className="bg-white border border-[#C8EAD9] rounded-md px-2.5 py-1 flex flex-col justify-center min-w-[95px] h-[40px] shadow-xs">
            <span className="text-[9px] font-extrabold text-[#047857] uppercase leading-tight">Region</span>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-transparent font-extrabold text-[#044E3A] text-xs focus:outline-none cursor-pointer p-0 -mt-0.5"
            >
              <option value="ALL">India</option>
              {regionsList.map(r => (
                <option key={r} value={r}>{r === 'Eastern_UP_Pilot' ? 'Eastern UP' : r.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          {/* Forecast Run */}
          <div className="bg-white border border-[#C8EAD9] rounded-md px-2.5 py-1 flex flex-col justify-center min-w-[135px] h-[40px] shadow-xs">
            <span className="text-[9px] font-extrabold text-[#047857] uppercase leading-tight">Forecast Run</span>
            <select
              value={selectedRun}
              onChange={(e) => setSelectedRun(e.target.value)}
              className="bg-transparent font-bold text-[#044E3A] text-xs font-mono focus:outline-none cursor-pointer p-0 -mt-0.5"
            >
              {runList.map(d => (
                <option key={d} value={d}>{d.slice(0, 10)} 00Z</option>
              ))}
            </select>
          </div>

          {/* Lead Day */}
          <div className="bg-white border border-[#C8EAD9] rounded-md px-2.5 py-1 flex flex-col justify-center min-w-[80px] h-[40px] shadow-xs">
            <span className="text-[9px] font-extrabold text-[#047857] uppercase leading-tight">Lead Day</span>
            <select
              value={selectedLead}
              onChange={(e) => setSelectedLead(parseInt(e.target.value))}
              className="bg-transparent font-extrabold text-[#059669] text-xs focus:outline-none cursor-pointer p-0 -mt-0.5"
            >
              {leadList.map(l => (
                <option key={l} value={l}>D{l}</option>
              ))}
            </select>
          </div>

          {/* Variable / Metric Selector */}
          <div className="bg-white border border-[#C8EAD9] rounded-md px-2.5 py-1 flex flex-col justify-center min-w-[125px] h-[40px] shadow-xs">
            <span className="text-[9px] font-extrabold text-[#047857] uppercase leading-tight">Variable</span>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="bg-transparent font-extrabold text-[#044E3A] text-xs focus:outline-none cursor-pointer p-0 -mt-0.5"
            >
              {metricOptions.map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Functional Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative ml-1">
            <Search className="w-3.5 h-3.5 text-[#047857] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search lat,lon or asset (e.g. 26.75,83.25)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-2 bg-white border border-[#C8EAD9] rounded-md text-xs text-[#044E3A] focus:outline-none focus:border-[#059669] w-[240px] placeholder-[#047857]/60 shadow-xs h-[40px]"
            />
            {searchFeedback && (
              <div className="absolute top-11 left-0 bg-[#044E3A] text-white text-[10px] py-1 px-2 rounded shadow-lg z-[2000] whitespace-nowrap">
                {searchFeedback}
              </div>
            )}
          </form>

          {/* User Avatar */}
          <div className="w-[38px] h-[38px] rounded-full bg-[#059669] text-white font-bold text-xs flex items-center justify-center shadow-xs ml-1 flex-shrink-0">
            AS
          </div>
        </div>
      </header>

      {/* Soft Light Green Info Strip */}
      <div className="bg-[#D4F0E2] border-b border-[#C8EAD9] px-5 py-1 flex items-center justify-between text-[11px] text-[#044E3A] h-[30px]">
        <div className="flex items-center gap-1.5 font-medium">
          <Info className="w-3.5 h-3.5 text-[#059669] flex-shrink-0" />
          <span>From Data to Decisions — For a Safer Tomorrow</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-semibold">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse"></span>
            <span className="text-[#065F46]">Data:</span>
            <strong className="text-[#033A2B]">NOAA GEFSv12 (Reforecast)</strong>
          </span>
          <span className="text-[#A7F3D0]">|</span>
          <span>
            <span className="text-[#065F46]">Last Updated:</span>{' '}
            <strong className="text-[#033A2B]">{formatRunDate(selectedRun)}</strong>
          </span>
          <span className="text-[#A7F3D0]">|</span>
          <span className="font-mono text-[#059669] font-bold">SIH26079</span>
        </div>
      </div>
    </div>
  );
};
