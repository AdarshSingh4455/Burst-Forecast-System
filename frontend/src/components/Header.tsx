import React, { useState } from 'react';
import { Search, Info, Wifi, Cloud, Sun, Moon } from 'lucide-react';
import { Metadata } from '../types';
import { useTheme } from '../context/ThemeContext';

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
  demoMode?: boolean;
  setDemoMode?: (demo: boolean) => void;
  onSelectDemoCase?: (caseKey: string) => void;
}

// Compact control widget
const ControlWidget: React.FC<{
  label: string;
  children: React.ReactNode;
  minWidth?: number;
}> = ({ label, children, minWidth = 100 }) => (
  <div
    className="flex flex-col justify-center bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 focus-within:border-[var(--primary)] focus-within:ring-1 focus-within:ring-[var(--primary)]/20 transition-all"
    style={{ height: 40, minWidth, flexShrink: 0 }}
  >
    <span
      className="text-[var(--text-muted)] uppercase block leading-none"
      style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 2 }}
    >
      {label}
    </span>
    {children}
  </div>
);

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
  onSelectPoint,
  onSelectDemoCase,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);

  const regionsList = metadata?.regions || ['ALL', 'Eastern_UP_Pilot'];
  const runList = metadata?.forecast_init_dates || ['2019-07-01 00:00:00'];
  const leadList = metadata?.lead_days || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const metricOptions = [
    { id: 'bust_probability',           label: 'Bust Risk' },
    { id: 'rainfall',                   label: 'Rainfall' },
    { id: 'ffd',                        label: 'FFD' },
    { id: 'fragility_auc',              label: 'Fragility' },
    { id: 'trust_index',                label: 'Trust Index' },
    { id: 'ood_score',                  label: 'OOD Score' },
    { id: 'ensemble_disagreement_score',label: 'Ensemble Disagree.' },
  ];

  const demoCases = [
    { id: 'CASE_A', name: 'Scenario A — Supported Reliability (D2)', lat: 24.50, lon: 80.00, lead: 2 },
    { id: 'CASE_B', name: 'Scenario B — Supported Warning (D4)',     lat: 26.50, lon: 82.50, lead: 4 },
    { id: 'CASE_C', name: 'Scenario C — Blind Spot / Conflict (D5)', lat: 26.75, lon: 83.25, lead: 5 },
    { id: 'CASE_D', name: 'Scenario D — Expert Review / High OOD (D7)', lat: 28.25, lon: 84.00, lead: 7 },
  ];

  const showFeedback = (msg: string, ms = 3000) => {
    setSearchFeedback(msg);
    setTimeout(() => setSearchFeedback(null), ms);
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
      if (lat >= 18.0 && lat <= 31.0 && lon >= 72.0 && lon <= 85.0) {
        onSelectPoint?.(lat, lon);
        showFeedback(`Navigated to (${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E)`);
      } else {
        showFeedback('Outside monitored regions (Eastern UP, Central India, Northwest India).', 4000);
      }
      return;
    }

    const lower = query.toLowerCase();
    if (lower.includes('rihand')) {
      onSelectPoint?.(24.22, 83.02);
      showFeedback('Snapped to Rihand Reservoir (24.22°N, 83.02°E)');
    } else if (lower.includes('bargi') || lower.includes('narmada')) {
      onSelectPoint?.(22.94, 79.91);
      showFeedback('Snapped to Bargi Dam (22.94°N, 79.91°E)');
    } else if (lower.includes('bhadla') || lower.includes('solar')) {
      onSelectPoint?.(27.53, 71.91);
      showFeedback('Snapped to Bhadla Solar Park (27.53°N, 71.91°E)');
    } else if (lower.includes('agri') || lower.includes('farm')) {
      onSelectPoint?.(26.75, 82.50);
      showFeedback('Snapped to Agriculture Zone (26.75°N, 82.50°E)');
    } else if (lower.includes('flood') || lower.includes('gorakhpur')) {
      onSelectPoint?.(26.76, 83.37);
      showFeedback('Snapped to Flood-Prone Area (26.76°N, 83.37°E)');
    } else if (lower.includes('central')) {
      setSelectedRegion('Central_India');
      showFeedback('Region → Central India');
    } else if (lower.includes('northwest') || lower.includes('nw')) {
      setSelectedRegion('Northwest_India');
      showFeedback('Region → Northwest India');
    } else if (lower.includes('eastern') || lower.includes('up')) {
      setSelectedRegion('Eastern_UP_Pilot');
      showFeedback('Region → Eastern UP Pilot');
    } else {
      showFeedback('Try: lat,lon (e.g. 26.75, 83.25) or asset name (Bargi, Rihand, Bhadla)');
    }
  };

  const handleSelectCase = (caseId: string) => {
    const found = demoCases.find(c => c.id === caseId);
    if (found) {
      onSelectPoint?.(found.lat, found.lon);
      setSelectedLead(found.lead);
      onSelectDemoCase?.(caseId);
      showFeedback(`Loaded: ${found.name}`);
    }
  };

  const selectStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    outline: 'none',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--heading)',
    cursor: 'pointer',
    padding: 0,
    width: '100%',
    fontFamily: 'inherit',
  };

  return (
    <div className="flex flex-col flex-shrink-0">
      {/* Main Header Bar */}
      <header
        className="bg-[var(--header-bg)] border-b border-[var(--border)] px-5 flex items-center justify-between gap-3"
        style={{ height: 64, flexShrink: 0 }}
      >
        {/* Brand Identity */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div
            className="rounded-lg flex items-center justify-center"
            style={{ width: 36, height: 36, background: 'var(--primary)', flexShrink: 0 }}
          >
            <Cloud className="w-5 h-5 text-white" strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--heading)', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
              FORTRESS
            </div>
            <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-secondary)', lineHeight: 1.2 }}>
              Forecast Reliability Intelligence Platform
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1" style={{ maxWidth: 300 }}>
          <Search
            style={{ width: 14, height: 14, position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
          />
          <input
            type="text"
            placeholder="Search location, lat/lon or asset..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              height: 40,
              paddingLeft: 30,
              paddingRight: 12,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 400,
              color: 'var(--text-body)',
              fontFamily: 'inherit',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--primary)';
              e.target.style.boxShadow = '0 0 0 2px rgba(22,119,184,0.14)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border)';
              e.target.style.boxShadow = 'none';
            }}
          />
          {searchFeedback && (
            <div
              style={{
                position: 'absolute',
                top: 44,
                left: 0,
                background: 'var(--heading)',
                color: 'var(--surface)',
                fontSize: 11,
                fontWeight: 500,
                padding: '5px 10px',
                borderRadius: 6,
                whiteSpace: 'nowrap',
                zIndex: 2000,
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              }}
            >
              {searchFeedback}
            </div>
          )}
        </form>

        {/* Global Context Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Validated Cases */}
          <ControlWidget label="Validated Cases" minWidth={170}>
            <select
              defaultValue=""
              onChange={(e) => handleSelectCase(e.target.value)}
              style={{ ...selectStyle, color: 'var(--primary)' }}
            >
              <option value="" disabled>Select scenario...</option>
              {demoCases.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </ControlWidget>

          {/* Region */}
          <ControlWidget label="Region" minWidth={120}>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              style={selectStyle}
            >
              {regionsList.map(r => (
                <option key={r} value={r}>
                  {r === 'ALL'             ? 'All Regions'      :
                   r === 'Eastern_UP_Pilot' ? 'Eastern UP'       :
                   r === 'Central_India'    ? 'Central India'    :
                   r === 'Northwest_India'  ? 'Northwest India'  : r.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </ControlWidget>

          {/* Forecast Run */}
          <ControlWidget label="Forecast Run" minWidth={120}>
            <select
              value={selectedRun}
              onChange={(e) => setSelectedRun(e.target.value)}
              style={{ ...selectStyle, fontFamily: '"SF Mono", "Fira Code", monospace' }}
            >
              {runList.map(d => (
                <option key={d} value={d}>{d.slice(0, 10)} 00Z</option>
              ))}
            </select>
          </ControlWidget>

          {/* Lead Day */}
          <ControlWidget label="Lead Day" minWidth={70}>
            <select
              value={selectedLead}
              onChange={(e) => setSelectedLead(parseInt(e.target.value))}
              style={{ ...selectStyle, color: 'var(--primary)' }}
            >
              {leadList.map(l => (
                <option key={l} value={l}>D{l}</option>
              ))}
            </select>
          </ControlWidget>

          {/* Variable */}
          <ControlWidget label="Variable" minWidth={115}>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              style={selectStyle}
            >
              {metricOptions.map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </ControlWidget>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-body)] hover:bg-[var(--surface-soft)] hover:text-[var(--primary)] hover:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 transition-all cursor-pointer flex-shrink-0"
            style={{ width: 36, height: 36 }}
          >
            {theme === 'dark' ? (
              <Sun className="w-[18px] h-[18px] text-[#FBBF24]" strokeWidth={2.2} />
            ) : (
              <Moon className="w-[18px] h-[18px] text-[var(--text-body)]" strokeWidth={2.2} />
            )}
          </button>

          {/* Connection Status */}
          <div
            className="flex items-center gap-1.5 border border-[var(--border)] rounded-lg px-3 bg-[var(--surface)]"
            style={{ height: 40, flexShrink: 0 }}
          >
            <Wifi style={{ width: 13, height: 13, color: 'var(--status-green)' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Connected</span>
          </div>
        </div>
      </header>

      {/* Info Strip */}
      <div
        className="bg-[var(--surface)] border-b border-[var(--border-soft)] px-5 flex items-center justify-between"
        style={{ height: 28, flexShrink: 0 }}
      >
        <div className="flex items-center gap-1.5 truncate">
          <Info style={{ width: 12, height: 12, color: 'var(--text-muted)', flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-secondary)' }}>
            Stress-testing, evidence-based self-audit and reliability diagnostics for medium-range weather forecasts.
          </span>
        </div>
      </div>
    </div>
  );
};
