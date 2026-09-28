import React, { useState, useEffect } from 'react';
import {
  CheckCircle2, ShieldAlert, AlertTriangle, Eye, Activity, Search, Map, Layers, BarChart2, Zap, AlertCircle
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Tooltip as LeafletTooltip, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { SelfAuditResponse, TrustHorizonResponse, GridPointDetail } from '../types';

// Eastern UP Landmark Cities for orientation
const AUDIT_CITIES = [
  { name: 'Varanasi', lat: 25.31, lon: 82.97 },
  { name: 'Gorakhpur', lat: 26.76, lon: 83.37 },
  { name: 'Prayagraj', lat: 25.43, lon: 81.84 },
  { name: 'Ayodhya', lat: 26.79, lon: 82.19 },
  { name: 'Ballia', lat: 25.75, lon: 84.15 }
];

const createAuditCityIcon = (name: string) => L.divIcon({
  className: 'audit-city-label',
  html: `<span style="font-size: 10px; font-weight: 700; color: #cbd5e1; text-shadow: 0 1px 4px rgba(0,0,0,0.9); pointer-events: none; white-space: nowrap;">● ${name}</span>`,
  iconSize: [80, 16],
  iconAnchor: [5, 8]
});

const AuditMapController: React.FC<{ selectedPoint: any }> = ({ selectedPoint }) => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (selectedPoint) {
      map.panTo([selectedPoint.lat, selectedPoint.lon], { animate: true });
    }
  }, [selectedPoint, map]);

  return null;
};

interface SelfAuditViewProps {
  selfAudit: SelfAuditResponse | null;
  trustHorizon: TrustHorizonResponse | null;
  pointDetail: GridPointDetail | null;
}

const pieData = [
  { name: 'Supported Reliability', value: 63.9, color: '#059669' },
  { name: 'Supported Warning',     value: 4.0,  color: '#F5B82E' },
  { name: 'Conflict',              value: 20.4, color: '#EF4444' },
  { name: 'Insufficient Evidence', value: 6.8,  color: '#94A3B8' },
  { name: 'Expert Review',         value: 4.8,  color: '#7C3AED' },
];

const TABS = [
  { id: 'evidence',     label: 'Evidence Consistency', icon: CheckCircle2 },
  { id: 'diagnostics',  label: 'Model Diagnostics',    icon: Activity      },
  { id: 'blindspot',    label: 'Blind Spot Detection',  icon: Search        },
];

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; icon: React.FC<any> }> = {
  'SUPPORTED RELIABILITY':          { color: '#047857', bg: '#ECFDF5', border: '#A7F3D0', icon: CheckCircle2  },
  'SUPPORTED WARNING':              { color: '#B45309', bg: '#FFFBEB', border: '#FDE68A', icon: AlertTriangle  },
  'CONFLICT / POSSIBLE BLIND SPOT': { color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA', icon: ShieldAlert  },
  'INSUFFICIENT EVIDENCE':          { color: '#64748B', bg: '#F1F5F9', border: '#CBD5E1', icon: Eye           },
  'EXPERT REVIEW':                  { color: '#6D28D9', bg: '#F5F3FF', border: '#DDD6FE', icon: ShieldAlert   },
};

const LAYER_OPTIONS = ['All', 'Supported', 'Warning', 'Conflict', 'Insufficient', 'Expert'];

const MOCK_AUDIT_MAP: Array<{ id: number; lat: number; lon: number; status: string; pBust: number }> = [
  { id: 1, lat: 26.25, lon: 82.50, status: 'SUPPORTED WARNING', pBust: 0.62 },
  { id: 2, lat: 24.50, lon: 80.00, status: 'SUPPORTED RELIABILITY', pBust: 0.18 },
  { id: 3, lat: 25.00, lon: 81.00, status: 'SUPPORTED RELIABILITY', pBust: 0.22 },
  { id: 4, lat: 25.50, lon: 82.00, status: 'CONFLICT / POSSIBLE BLIND SPOT', pBust: 0.74 },
  { id: 5, lat: 26.00, lon: 83.00, status: 'SUPPORTED RELIABILITY', pBust: 0.28 },
  { id: 6, lat: 26.50, lon: 83.50, status: 'CONFLICT / POSSIBLE BLIND SPOT', pBust: 0.81 },
  { id: 7, lat: 27.00, lon: 84.00, status: 'INSUFFICIENT EVIDENCE', pBust: 0.45 },
  { id: 8, lat: 27.50, lon: 81.50, status: 'EXPERT REVIEW', pBust: 0.68 },
  { id: 9, lat: 28.00, lon: 82.00, status: 'SUPPORTED RELIABILITY', pBust: 0.15 },
  { id: 10, lat: 28.50, lon: 83.00, status: 'SUPPORTED RELIABILITY', pBust: 0.19 },
  { id: 11, lat: 25.20, lon: 83.80, status: 'SUPPORTED WARNING', pBust: 0.58 },
  { id: 12, lat: 26.80, lon: 80.50, status: 'EXPERT REVIEW', pBust: 0.72 },
  { id: 13, lat: 24.80, lon: 82.80, status: 'SUPPORTED RELIABILITY', pBust: 0.12 },
  { id: 14, lat: 27.20, lon: 83.20, status: 'CONFLICT / POSSIBLE BLIND SPOT', pBust: 0.79 },
  { id: 15, lat: 26.10, lon: 81.20, status: 'INSUFFICIENT EVIDENCE', pBust: 0.42 },
];

const statusShort = (s: string) => {
  if (s.startsWith('SUPPORTED RELIABILITY')) return 'Supported';
  if (s.startsWith('SUPPORTED WARNING'))     return 'Warning';
  if (s.startsWith('CONFLICT'))              return 'Conflict';
  if (s.startsWith('INSUFFICIENT'))          return 'Insufficient';
  return 'Expert';
};

const CustomDonutLabel: React.FC<any> = ({ cx, cy }) => (
  <>
    <text x={cx} y={cy - 8} textAnchor="middle" dominantBaseline="central"
      style={{ fontSize: 24, fontWeight: 700, fill: '#0F2747' }}>323</text>
    <text x={cx} y={cy + 16} textAnchor="middle" dominantBaseline="central"
      style={{ fontSize: 10, fontWeight: 600, fill: '#64748B', letterSpacing: '0.05em' }}>GRID POINTS</text>
  </>
);

const DIAG_METRICS_BAR = [
  { name: 'Model Risk', value: 62, color: '#EF4444' },
  { name: 'Analogues', value: 71, color: '#059669' },
  { name: 'Ensemble Var', value: 38, color: '#F59E0B' },
  { name: 'OOD Distance', value: 43, color: '#2563EB' },
  { name: 'DNA Match', value: 78, color: '#7C3AED' }
];

const BLIND_SPOTS = [
  { region: 'Eastern Districts (26.2°N, 82.5°E)', severity: 'HIGH', cause: 'High moisture influx vs GEFS member disagreement (>0.45)', action: 'Requires Expert Manual Audit' },
  { region: 'Southern Fringe (24.5°N, 81.0°E)', severity: 'MODERATE', cause: 'OOD score > 50 (Novel atmospheric state)', action: 'Monitor Ensemble Spread' },
  { region: 'North-Western Border (27.8°N, 80.2°E)', severity: 'LOW', cause: 'Insufficient historical analogue count (<5 cases)', action: 'Use Climatology Baseline' }
];

export const SelfAuditView: React.FC<SelfAuditViewProps> = ({ selfAudit, pointDetail }) => {
  const [activeTab, setActiveTab] = useState('evidence');
  const [activeLayer, setActiveLayer] = useState('All');
  const [selectedPoint, setSelectedPoint] = useState<typeof MOCK_AUDIT_MAP[0] | null>(MOCK_AUDIT_MAP[0]);
  const [auditMapStyle, setAuditMapStyle] = useState<'satellite' | 'map'>('satellite');

  const status  = pointDetail?.self_audit_status  || selfAudit?.self_audit_status  || 'SUPPORTED WARNING';
  const reason  = (pointDetail as any)?.self_audit_reason || selfAudit?.self_audit_reason
                  || 'Ensemble disagreement exceeding 0.45 threshold';
  const score   = pointDetail?.trust_index ?? selfAudit?.trust_index ?? 78;
  const pBust   = pointDetail?.baseline_p_bust ?? 0.62;
  const ensDisag = pointDetail?.ensemble_disagreement_score ?? 0.38;
  const oodSc   = pointDetail?.ood_score ?? 42.5;
  const riskCat = pointDetail?.ai_risk_category ?? 'High Risk';
  const band    = pointDetail?.reliability_band ?? 'YELLOW';

  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['SUPPORTED WARNING'];
  const StatusIcon = cfg.icon;

  const filteredMap = MOCK_AUDIT_MAP.filter(r =>
    activeLayer === 'All' || statusShort(r.status) === activeLayer
  );

  return (
    <div className="h-full w-full overflow-y-auto bg-[#F7FAF9] text-[#334155] space-y-4 p-5">

      {/* ── Top Header Banner ────────────────────────────────────────────── */}
      <div className="bg-white border border-[#DDE8E4] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(15,39,71,0.04)] flex items-center justify-between">
        <div>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            AUTOMATED SELF-AUDIT ENGINE
          </span>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F2747', marginTop: 2 }} className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#059669]" />
            Self-Audit System &amp; Diagnostic Verdict
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
            Independent verification of AI forecast reliability using 5 consensus components.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#F1F5F4] border border-[#DDE8E4] px-3 py-1.5 rounded-[8px] text-[12px] font-semibold text-[#0F2747]">
            Audit Verdict: <strong style={{ color: cfg.color }}>{status}</strong>
          </div>
          <div className="bg-white border border-[#DDE8E4] px-3 py-1.5 rounded-[8px] text-[12px] font-semibold text-[#0F2747]">
            Trust Score: <strong className="text-[#059669]">{score}/100</strong>
          </div>
        </div>
      </div>

      {/* ── Tab Bar Navigation ───────────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-white border border-[#DDE8E4] p-1 rounded-[10px] w-fit shadow-xs">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: active ? '#059669' : 'transparent',
                color: active ? '#FFFFFF' : '#334155',
                transition: 'all 0.15s'
              }}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: EVIDENCE CONSISTENCY ───────────────────────────────────── */}
      {activeTab === 'evidence' && (
        <div className="grid grid-cols-12 gap-4">

          {/* ═══════ LEFT PANEL col-span-7 ═══════ */}
          <div className="col-span-7 space-y-4">

            {/* Hero Status Card */}
            <div className="bg-white border border-[#DDE8E4] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(15,39,71,0.04)] space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#059669', letterSpacing: '0.06em', textTransform: 'uppercase' }} className="block">
                    FORTRESS SELF-AUDIT // AUTOMATED VERDICT
                  </span>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-sm"
                      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                      <StatusIcon className="w-4 h-4" />
                      {status}
                    </span>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: '#64748B' }} className="block">Reliability Band</span>
                  <span className="px-2.5 py-0.5 rounded-[6px] font-bold text-xs border inline-block"
                    style={{
                      background: band === 'GREEN' ? '#ECFDF5' : band === 'RED' ? '#FEF2F2' : '#FFFBEB',
                      color:      band === 'GREEN' ? '#047857' : band === 'RED' ? '#B91C1C' : '#B45309',
                      borderColor:band === 'GREEN' ? '#A7F3D0' : band === 'RED' ? '#FECACA' : '#FDE68A',
                    }}>
                    {band} BAND
                  </span>
                  <span style={{ fontSize: 11, color: '#64748B', fontFamily: 'monospace' }} className="block">Trust Index: {score}/100</span>
                </div>
              </div>

              {/* 2-col: AI Signal vs Independent Evidence */}
              <div className="grid grid-cols-2 gap-4">
                {/* AI Signal */}
                <div className="bg-[#F7FAF9] border border-[#DDE8E4] rounded-[8px] p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-[#DDE8E4] pb-2">
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#0F2747', textTransform: 'uppercase', letterSpacing: '0.04em' }}>AI Signal</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#B91C1C', backgroundColor: '#FEF2F2', padding: '1px 6px', borderRadius: 4 }}>Model Risk Output</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center bg-white p-2 rounded border border-[#DDE8E4]">
                      <span style={{ color: '#64748B', fontWeight: 500 }}>Bust Risk P(Bust):</span>
                      <span style={{ color: '#EF4444', fontWeight: 700, fontFamily: 'monospace', fontSize: 14 }}>
                        {(pBust * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-2 rounded border border-[#DDE8E4]">
                      <span style={{ color: '#64748B', fontWeight: 500 }}>Risk Category:</span>
                      <span style={{ color: '#0F2747', fontWeight: 600 }}>{riskCat}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-2 rounded border border-[#DDE8E4]">
                      <span style={{ color: '#64748B', fontWeight: 500 }}>Trust Index:</span>
                      <span style={{ color: '#059669', fontWeight: 700 }}>{score}/100</span>
                    </div>
                  </div>
                </div>

                {/* Independent Evidence */}
                <div className="bg-[#F7FAF9] border border-[#DDE8E4] rounded-[8px] p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-[#DDE8E4] pb-2">
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#0F2747', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Independent Evidence</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#047857', backgroundColor: '#ECFDF5', padding: '1px 6px', borderRadius: 4 }}>5 Components</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    {[
                      { label: 'Analogues',       val: '14 Matched', color: '#0F2747' },
                      { label: 'Failure DNA',     val: 'Sim 0.78',   color: '#059669' },
                      { label: 'Ensemble Var',    val: `${(ensDisag * 100).toFixed(0)}% Var`, color: '#B45309' },
                      { label: 'OOD / Novelty',   val: oodSc.toFixed(1), color: '#2563EB' },
                    ].map(item => (
                      <div key={item.label} className="bg-white p-2 rounded border border-[#DDE8E4]">
                        <span style={{ fontSize: 9, color: '#64748B', fontFamily: 'Inter, sans-serif' }} className="block">{item.label}:</span>
                        <span style={{ fontWeight: 700, color: item.color }}>{item.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Verdict Box */}
              <div className="bg-[#F7FAF9] border border-[#DDE8E4] rounded-[8px] p-3.5 space-y-1">
                <span style={{ fontSize: 10, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }} className="block">
                  VERDICT SUMMARY
                </span>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#334155', lineHeight: 1.5 }}>
                  "{reason} — Case classified under <strong style={{ color: cfg.color }}>{status}</strong> to ensure explicit forecast verification."
                </p>
              </div>
            </div>

            {/* Visual Spatial Grid-wise Audit Map */}
            <div className="bg-white border border-[#DDE8E4] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(15,39,71,0.04)] space-y-3">
              <div className="flex items-center justify-between border-b border-[#DDE8E4] pb-2">
                <div className="flex items-center gap-2">
                  <Map className="w-4 h-4 text-[#059669]" />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#0F2747' }}>Grid-wise Audit Spatial Map (Eastern UP)</span>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {LAYER_OPTIONS.map(l => (
                    <button key={l}
                      onClick={() => setActiveLayer(l)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: activeLayer === l ? 'none' : '1px solid #DDE8E4',
                        backgroundColor: activeLayer === l ? '#059669' : '#FFFFFF',
                        color: activeLayer === l ? '#FFFFFF' : '#334155',
                        transition: 'all 0.15s'
                      }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive Visual Leaflet Audit Map */}
              <div className="relative border border-[#DDE8E4] rounded-[8px] h-64 overflow-hidden bg-[#021520]">
                {/* Region Boundary Title Overlay */}
                <div className="absolute top-2 left-2 z-[1000] flex items-center gap-1.5 pointer-events-none">
                  <span className="text-[10px] font-bold font-mono text-[#0F2747] bg-white/95 border border-[#DDE8E4] px-2 py-0.5 rounded shadow-sm">
                    Eastern UP Domain (24.5°N–28.5°N, 80.0°E–84.5°E)
                  </span>
                </div>

                {/* Map Style Selector Overlay */}
                <div className="absolute top-2 right-2 z-[1000] bg-[#031d28]/90 p-0.5 rounded-lg border border-[#0d9488]/40 shadow-md flex items-center gap-1">
                  <button
                    onClick={() => setAuditMapStyle('satellite')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                      auditMapStyle === 'satellite' ? 'bg-[#059669] text-white' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Satellite
                  </button>
                  <button
                    onClick={() => setAuditMapStyle('map')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                      auditMapStyle === 'map' ? 'bg-[#059669] text-white' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Terrain
                  </button>
                </div>

                {/* Real Leaflet Map */}
                <MapContainer
                  center={[26.4, 82.3]}
                  zoom={7}
                  className="w-full h-full z-0"
                  scrollWheelZoom={true}
                  zoomControl={false}
                >
                  <TileLayer
                    attribution='&copy; ESRI World Imagery'
                    url={auditMapStyle === 'satellite' 
                      ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
                  />

                  <AuditMapController selectedPoint={selectedPoint} />

                  {/* Reference Landmark Cities */}
                  {AUDIT_CITIES.map((city, idx) => (
                    <Marker
                      key={`city-${idx}`}
                      position={[city.lat, city.lon]}
                      icon={createAuditCityIcon(city.name)}
                      interactive={false}
                    />
                  ))}

                  {/* Spatial Audit Grid Points */}
                  {filteredMap.map((pt) => {
                    const c = STATUS_CONFIG[pt.status] ?? STATUS_CONFIG['INSUFFICIENT EVIDENCE'];
                    const isSelected = selectedPoint?.id === pt.id;

                    return (
                      <CircleMarker
                        key={pt.id}
                        center={[pt.lat, pt.lon]}
                        radius={isSelected ? 9 : 6.5}
                        pathOptions={{
                          fillColor: c.color,
                          fillOpacity: isSelected ? 1.0 : 0.90,
                          color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.85)',
                          weight: isSelected ? 2.5 : 1.2
                        }}
                        eventHandlers={{
                          click: () => setSelectedPoint(pt)
                        }}
                      >
                        <LeafletTooltip direction="top" offset={[0, -6]} opacity={0.95}>
                          <div className="text-xs p-1 font-sans bg-[#031d28] text-white rounded border border-[#0d9488]/60 shadow-lg">
                            <div className="font-extrabold text-[#34d399] font-mono">{pt.lat.toFixed(2)}°N, {pt.lon.toFixed(2)}°E</div>
                            <div className="text-[10px] text-slate-200">
                              P(Bust): <span className="font-bold text-rose-400">{(pt.pBust * 100).toFixed(0)}%</span>
                            </div>
                            <div className="text-[9px] font-bold mt-0.5" style={{ color: c.color }}>
                              {pt.status}
                            </div>
                          </div>
                        </LeafletTooltip>
                      </CircleMarker>
                    );
                  })}
                </MapContainer>

                {/* Selected Point Details Footer Overlay */}
                {selectedPoint && (
                  <div className="absolute bottom-2 left-2 right-2 z-[1000] bg-white border border-[#DDE8E4] rounded-lg p-2 flex items-center justify-between text-xs shadow-md">
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono text-[#0F2747]">{selectedPoint.lat.toFixed(2)}°N, {selectedPoint.lon.toFixed(2)}°E</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#B91C1C', backgroundColor: '#FEF2F2', padding: '1px 6px', borderRadius: 4 }}>
                        P(Bust): {(selectedPoint.pBust * 100).toFixed(0)}%
                      </span>
                    </div>
                    <span 
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: (STATUS_CONFIG[selectedPoint.status] || STATUS_CONFIG['INSUFFICIENT EVIDENCE']).bg,
                        color: (STATUS_CONFIG[selectedPoint.status] || STATUS_CONFIG['INSUFFICIENT EVIDENCE']).color
                      }}
                    >
                      {selectedPoint.status}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ═══════ RIGHT PANEL col-span-5 ═══════ */}
          <div className="col-span-5 space-y-4">

            {/* Donut Chart Card */}
            <div className="bg-white border border-[#DDE8E4] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(15,39,71,0.04)] space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#059669]" />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0F2747' }}>Self-Audit Status Distribution</span>
              </div>

              <div className="h-52 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={88}
                      paddingAngle={2}
                      dataKey="value"
                      labelLine={false}
                      label={<CustomDonutLabel />}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${value}%`, '']}
                      contentStyle={{
                        background: '#fff',
                        border: '1px solid #DDE8E4',
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="space-y-1.5">
                {pieData.map(item => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                      <span style={{ fontSize: 11, fontWeight: 500, color: '#334155' }}>{item.name}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: item.color }}>
                      {item.value}%
                    </span>
                  </div>
                ))}
              </div>

              {/* Forecast Reliability Badge */}
              <div className="bg-[#059669] text-white rounded-[8px] p-3 text-center">
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }} className="block opacity-90">Forecast Reliability</span>
                <span style={{ fontSize: 16, fontWeight: 800 }} className="block">323 Grid Points</span>
                <span style={{ fontSize: 11, fontWeight: 700, backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 10px', borderRadius: 6, display: 'inline-block', marginTop: 4 }}>
                  HIGHLY BLEND
                </span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Reliable Grids',    val: '206', sub: '63.9%', color: '#047857', bg: '#ECFDF5' },
                { label: 'Conflict Grids',    val: '66',  sub: '20.4%', color: '#B45309', bg: '#FFFBEB' },
                { label: 'Warning Grids',     val: '13',  sub: '4.0%',  color: '#B91C1C', bg: '#FEF2F2' },
                { label: 'Expert Review',     val: '16',  sub: '4.8%',  color: '#6D28D9', bg: '#F5F3FF' },
              ].map(s => (
                <div key={s.label}
                  className="bg-white border border-[#DDE8E4] rounded-[10px] p-3 text-center space-y-1 shadow-[0_1px_2px_rgba(15,39,71,0.04)]">
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }} className="block">{s.label}</span>
                  <span style={{ fontSize: 24, fontWeight: 700, color: s.color }} className="block">{s.val}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: s.bg, color: s.color, display: 'inline-block' }}>{s.sub}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: MODEL DIAGNOSTICS ─────────────────────────────────────── */}
      {activeTab === 'diagnostics' && (
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-7 bg-white border border-[#DDE8E4] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(15,39,71,0.04)] space-y-4">
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F2747' }} className="flex items-center gap-2 border-b border-[#DDE8E4] pb-2">
              <BarChart2 className="w-4 h-4 text-[#059669]" />
              Model Diagnostics &amp; Metric Breakdown
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={DIAG_METRICS_BAR} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 2" stroke="#E7EFEC" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} stroke="#DDE8E4" />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} stroke="#DDE8E4" domain={[0, 100]} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={(v: number) => [`${v}%`, 'Value']} contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #DDE8E4' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {DIAG_METRICS_BAR.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-[#F7FAF9] border border-[#DDE8E4] rounded-lg p-3 text-xs text-[#334155] space-y-1">
              <span style={{ fontSize: 11, fontWeight: 700, color: '#059669' }} className="block">Model Diagnostics Summary:</span>
              <p style={{ lineHeight: 1.5 }}>
                Self-Audit component agreement shows 5-part alignment. High model bust risk (62%) is cross-verified against 14 historical analogue reforecasts (71% bust rate).
              </p>
            </div>
          </div>

          <div className="col-span-5 space-y-4">
            <div className="bg-white border border-[#DDE8E4] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(15,39,71,0.04)] space-y-3">
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F2747' }} className="border-b border-[#DDE8E4] pb-2">Diagnostic Component Scores</h3>
              <div className="space-y-2.5 text-xs">
                {[
                  { label: 'P(Bust) Model Confidence', val: `${(pBust * 100).toFixed(0)}%`, color: '#EF4444' },
                  { label: 'Analogue Mean Bust Rate', val: '71%', color: '#059669' },
                  { label: 'GEFS Disagreement Variance', val: `${(ensDisag * 100).toFixed(0)}%`, color: '#F59E0B' },
                  { label: 'Mahalanobis OOD Score', val: oodSc.toFixed(1), color: '#2563EB' },
                  { label: 'DNA Fingerprint Similarity', val: '0.78', color: '#7C3AED' }
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center bg-[#F7FAF9] border border-[#DDE8E4] p-2.5 rounded-lg">
                    <span style={{ fontWeight: 500, color: '#334155' }}>{item.label}</span>
                    <span style={{ fontWeight: 700, fontFamily: 'monospace', color: item.color }}>{item.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: BLIND SPOT DETECTION ───────────────────────────────────── */}
      {activeTab === 'blindspot' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#DDE8E4] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(15,39,71,0.04)] space-y-4">
            <div className="flex items-center justify-between border-b border-[#DDE8E4] pb-2">
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F2747' }} className="flex items-center gap-2">
                <Search className="w-4 h-4 text-rose-600" />
                Blind Spot &amp; High Uncertainty Corridor Detection
              </h3>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#B91C1C', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase' }}>
                3 Potential Blind Spots Flagged
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {BLIND_SPOTS.map((bs, idx) => (
                <div key={idx} className="p-4 rounded-[10px] border border-[#DDE8E4] bg-white space-y-2.5 shadow-[0_1px_2px_rgba(15,39,71,0.04)]">
                  <div className="flex items-center justify-between">
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 4,
                      backgroundColor: bs.severity === 'HIGH' ? '#FEF2F2' : bs.severity === 'MODERATE' ? '#FFFBEB' : '#F1F5F9',
                      color:           bs.severity === 'HIGH' ? '#B91C1C' : bs.severity === 'MODERATE' ? '#B45309' : '#64748B',
                    }}>{bs.severity} RISK</span>
                    <AlertCircle className="w-4 h-4" style={{ color: bs.severity === 'HIGH' ? '#EF4444' : '#F59E0B' }} />
                  </div>
                  <h4 style={{ fontSize: 12, fontWeight: 700, color: '#0F2747' }}>{bs.region}</h4>
                  <p style={{ fontSize: 11, color: '#64748B', lineHeight: 1.45 }}>{bs.cause}</p>
                  <div className="pt-2 border-t border-[#DDE8E4] text-[11px] font-semibold text-[#334155]">
                    Action: <span className="text-[#059669]">{bs.action}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#F7FAF9] border border-[#DDE8E4] rounded-[10px] p-4 text-xs text-[#334155] flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p style={{ lineHeight: 1.5 }}>
              Blind spots are flagged automatically when independent evidence components conflict with the primary calibrated Random Forest P(Bust) model or when OOD novelty scores exceed historical safety boundaries.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
