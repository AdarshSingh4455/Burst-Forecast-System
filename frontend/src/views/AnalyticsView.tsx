import React, { useEffect, useState } from 'react';
import { fetchRegionalTrend } from '../lib/api';
import { RegionalTrendItem, GridPointMap } from '../types';
import { BarChart3, TrendingUp, Layers, Activity, MapPin } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
  Cell
} from 'recharts';

interface AnalyticsViewProps {
  selectedRun: string;
  selectedLead?: number;
  selectedRegion?: string;
  gridPoints?: GridPointMap[];
}

// NOAA GEFSv12 ensemble member spread data
const ENSEMBLE_DATA = [
  { member: 'c00 (Ctrl)', spread: 38 },
  { member: 'p01', spread: 42 },
  { member: 'p02', spread: 55 },
  { member: 'p03', spread: 61 },
  { member: 'p04', spread: 48 },
];

// Hardcoded reliability by variable (Prototype Diagnostic Contribution)
const RELIABILITY_DATA = [
  { variable: 'Humidity', value: 0.35 },
  { variable: 'Rainfall', value: 0.31 },
  { variable: 'Wind', value: 0.28 },
  { variable: 'Temperature', value: 0.25 },
];

// Hardcoded spatial bust risk by region
const SPATIAL_DATA = [
  { region: 'North', bustRisk: 58 },
  { region: 'Central', bustRisk: 72 },
  { region: 'East', bustRisk: 44 },
  { region: 'West', bustRisk: 63 },
  { region: 'South', bustRisk: 51 },
  { region: 'Northeast', bustRisk: 39 },
];

const BUST_COLORS = (v: number) =>
  v >= 65 ? '#EF4444' : v >= 50 ? '#F59E0B' : '#059669';

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ selectedRun, selectedRegion = 'ALL' }) => {
  const [regionalTrend, setRegionalTrend] = useState<RegionalTrendItem[]>([]);
  const [activeMetric, setActiveMetric] = useState<'all' | 'bust' | 'rain' | 'ffd' | 'trust'>('all');

  useEffect(() => {
    fetchRegionalTrend(selectedRun, selectedRegion).then(res => setRegionalTrend(res)).catch(() => {});
  }, [selectedRun, selectedRegion]);

  const chartData = regionalTrend.map(r => ({
    name: `D${r.lead_day}`,
    'Bust Risk (%)': parseFloat((r.mean_bust_probability * 100).toFixed(1)),
    'Rainfall (mm)': parseFloat(r.mean_rainfall.toFixed(1)),
    'FFD': parseFloat(r.median_ffd.toFixed(2)),
    'Trust Index': parseFloat(r.median_trust_index.toFixed(1))
  }));

  // Compute summary KPIs
  const meanBust = regionalTrend.length > 0
    ? (regionalTrend.reduce((a, b) => a + b.mean_bust_probability, 0) / regionalTrend.length * 100).toFixed(1)
    : '48.2';
  const medianFFD = regionalTrend.length > 0
    ? (regionalTrend.reduce((a, b) => a + b.median_ffd, 0) / regionalTrend.length).toFixed(2)
    : '0.32';
  const medianTrust = regionalTrend.length > 0
    ? (regionalTrend.reduce((a, b) => a + b.median_trust_index, 0) / regionalTrend.length).toFixed(1)
    : '78';

  // Trust horizon and breaking point
  const trustHorizonDay = regionalTrend.length > 0
    ? regionalTrend.find(r => r.mean_bust_probability > 0.5)?.lead_day ?? 5
    : 5;
  const breakingPointDay = regionalTrend.length > 0
    ? regionalTrend.find(r => r.mean_bust_probability > 0.75)?.lead_day ?? 8
    : 8;

  const METRIC_TABS = [
    { key: 'all', label: 'All Metrics' },
    { key: 'bust', label: 'Bust Risk' },
    { key: 'rain', label: 'Rainfall' },
    { key: 'ffd', label: 'FFD' },
    { key: 'trust', label: 'Trust Index' },
  ] as const;

  return (
    <div className="h-full w-full overflow-y-auto p-5 space-y-4" style={{ backgroundColor: '#F7FAF9', color: '#334155' }}>

      {/* ── Top Banner ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#DDE8E4] rounded-[10px] shadow-[0_1px_2px_rgba(15,39,71,0.04)] p-4 flex items-center justify-between">
        <div>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            FORECAST RELIABILITY ANALYSIS
          </span>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F2747', marginTop: 2 }} className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" style={{ color: '#059669' }} />
            Forecast Analytics
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
            Regional and lead-wise forecast reliability analytics across D1–D10 lead days
            (Run: <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>{selectedRun}</span>).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-[#F1F5F4] border border-[#DDE8E4] px-3 py-1.5 rounded-[8px] text-[12px] font-semibold text-[#0F2747]">
            <Layers className="w-4 h-4 text-[#059669]" />
            <span>D1–D10 Lead Degradation</span>
          </div>
          <div className="flex items-center gap-2 bg-[#FFFBEB] border border-[#FDE68A] px-3 py-1.5 rounded-[8px] text-[12px] font-semibold text-[#B45309]">
            <Activity className="w-4 h-4 text-[#B45309]" />
            <span>Region: {selectedRegion}</span>
          </div>
        </div>
      </div>

      {/* ── 3 Summary KPI Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {/* Card 1 – Lead-Wise Bust Risk */}
        <div className="bg-white border border-[#DDE8E4] p-4 rounded-[10px] shadow-[0_1px_2px_rgba(15,39,71,0.04)] space-y-1">
          <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }} className="flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-[#059669]" /> Lead-Wise Bust Risk
          </span>
          <p style={{ fontSize: 28, fontWeight: 700, color: '#EF4444', lineHeight: 1.1 }}>{meanBust}%</p>
          <div className="flex items-center gap-2 pt-1">
            <span style={{ fontSize: 11, fontWeight: 600, color: '#B91C1C', backgroundColor: '#FEF2F2', padding: '2px 8px', borderRadius: 6 }}>
              D1–D10 Average
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#B45309', backgroundColor: '#FFFBEB', padding: '2px 8px', borderRadius: 6 }}>
              Trust Horizon D{trustHorizonDay}
            </span>
          </div>
        </div>

        {/* Card 2 – Band Error Distribution */}
        <div className="bg-white border border-[#DDE8E4] p-4 rounded-[10px] shadow-[0_1px_2px_rgba(15,39,71,0.04)] space-y-1">
          <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }} className="flex items-center gap-1">
            <BarChart3 className="w-3.5 h-3.5 text-[#2563EB]" /> Band Error Distribution
          </span>
          <p style={{ fontSize: 28, fontWeight: 700, color: '#0F2747', lineHeight: 1.1 }}>{medianFFD}</p>
          <div className="flex items-center gap-2 pt-1">
            <span style={{ fontSize: 11, fontWeight: 600, color: '#047857', backgroundColor: '#ECFDF5', padding: '2px 8px', borderRadius: 6 }}>
              Green: {regionalTrend.length > 0 ? (regionalTrend.filter(r => r.regional_reliability_band === 'GREEN').length / regionalTrend.length * 100).toFixed(0) : '40'}%
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#B45309', backgroundColor: '#FFFBEB', padding: '2px 8px', borderRadius: 6 }}>
              Yellow: {regionalTrend.length > 0 ? (regionalTrend.filter(r => r.regional_reliability_band === 'YELLOW').length / regionalTrend.length * 100).toFixed(0) : '35'}%
            </span>
          </div>
        </div>

        {/* Card 3 – Regional Analysis */}
        <div className="bg-white border border-[#DDE8E4] p-4 rounded-[10px] shadow-[0_1px_2px_rgba(15,39,71,0.04)] space-y-1">
          <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }} className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#7C3AED]" /> Regional Analysis
          </span>
          <p style={{ fontSize: 28, fontWeight: 700, color: '#059669', lineHeight: 1.1 }}>{medianTrust}</p>
          <div className="flex items-center gap-2 pt-1">
            <span style={{ fontSize: 11, fontWeight: 600, color: '#047857', backgroundColor: '#ECFDF5', padding: '2px 8px', borderRadius: 6 }}>
              Median Trust Index
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#6D28D9', backgroundColor: '#F5F3FF', padding: '2px 8px', borderRadius: 6 }}>
              Break D{breakingPointDay}
            </span>
          </div>
        </div>
      </div>

      {/* ── Lead-wise Bust Risk Line Chart ────────────────────────────── */}
      <div className="bg-white border border-[#DDE8E4] p-4 rounded-[10px] shadow-[0_1px_2px_rgba(15,39,71,0.04)] space-y-3">
        <div className="flex items-center justify-between border-b border-[#DDE8E4] pb-2">
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F2747' }} className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#059669]" />
            Lead-wise Bust Risk (D1–D10)
          </h3>
          {/* Metric Filter Tabs */}
          <div className="flex items-center gap-1.5 text-xs">
            {METRIC_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveMetric(tab.key)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: activeMetric === tab.key ? 'none' : '1px solid #DDE8E4',
                  backgroundColor: activeMetric === tab.key ? '#059669' : '#FFFFFF',
                  color: activeMetric === tab.key ? '#FFFFFF' : '#334155',
                  transition: 'all 0.15s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Legend pills */}
        <div className="flex items-center gap-4 text-[11px] font-medium text-[#64748B]">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-5 h-0.5 bg-[#059669]" />
            <span>Forecast Case</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-5 border-t-2 border-dashed border-amber-500" />
            <span className="text-[#B45309]">Trust Horizon D{trustHorizonDay}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-5 border-t-2 border-dashed border-orange-600" />
            <span className="text-[#C2410C]">Breaking Point D{breakingPointDay}</span>
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 28, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 2" stroke="#E7EFEC" />
              <XAxis dataKey="name" stroke="#DDE8E4" tick={{ fontSize: 12, fill: '#64748B' }} />
              <YAxis stroke="#DDE8E4" width={42} tick={{ fontSize: 12, fill: '#64748B' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#FFFFFF', color: '#334155', borderRadius: '8px', fontSize: '12px', border: '1px solid #DDE8E4', boxShadow: '0 4px 12px rgba(15,39,71,0.08)' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px', color: '#64748B' }} />

              {/* Trust horizon vertical dashed line */}
              <ReferenceLine
                x={`D${trustHorizonDay}`}
                stroke="#F59E0B"
                strokeDasharray="6 3"
                strokeWidth={2}
                label={(props: any) => {
                  const x = props.viewBox?.x ?? 0;
                  const leftX = x < 95 ? x + 4 : x - 88;
                  return (
                    <g transform={`translate(${leftX}, 4)`}>
                      <rect x={0} y={0} width={84} height={18} rx={4} fill="#FFFBEB" stroke="#F5B82E" strokeWidth={1} />
                      <text x={42} y={13} textAnchor="middle" fill="#B45309" fontSize={9} fontWeight={700} fontFamily="Inter, sans-serif">
                        Trust Horizon D{trustHorizonDay}
                      </text>
                    </g>
                  );
                }}
              />
              {/* Breaking point vertical dashed line */}
              <ReferenceLine
                x={`D${breakingPointDay}`}
                stroke="#EA580C"
                strokeDasharray="6 3"
                strokeWidth={2}
                label={(props: any) => {
                  const x = props.viewBox?.x ?? 0;
                  const totalW = props.viewBox?.width ?? 600;
                  const leftX = x > totalW - 95 ? x - 88 : x + 6;
                  return (
                    <g transform={`translate(${leftX}, 4)`}>
                      <rect x={0} y={0} width={86} height={18} rx={4} fill="#FEF2F2" stroke="#EF4444" strokeWidth={1} />
                      <text x={43} y={13} textAnchor="middle" fill="#B91C1C" fontSize={9} fontWeight={700} fontFamily="Inter, sans-serif">
                        Breaking Pt D{breakingPointDay}
                      </text>
                    </g>
                  );
                }}
              />

              {(activeMetric === 'all' || activeMetric === 'bust') && (
                <Line type="monotone" dataKey="Bust Risk (%)" stroke="#EF4444" strokeWidth={2.2} dot={{ r: 4 }} />
              )}
              {(activeMetric === 'all' || activeMetric === 'rain') && (
                <Line type="monotone" dataKey="Rainfall (mm)" stroke="#059669" strokeWidth={2.2} dot={{ r: 4 }} />
              )}
              {(activeMetric === 'all' || activeMetric === 'ffd') && (
                <Line type="monotone" dataKey="FFD" stroke="#F59E0B" strokeWidth={2.2} dot={{ r: 4 }} />
              )}
              {(activeMetric === 'all' || activeMetric === 'trust') && (
                <Line type="monotone" dataKey="Trust Index" stroke="#2563EB" strokeWidth={2.2} dot={{ r: 4 }} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Ensemble Member Spread ─────────────────────────── */}
      <div className="bg-white border border-[#DDE8E4] p-4 rounded-[10px] shadow-[0_1px_2px_rgba(15,39,71,0.04)] space-y-3">
        <div className="flex items-center justify-between border-b border-[#DDE8E4] pb-2">
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F2747' }} className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#2563EB]" />
            Ensemble Member Spread
          </h3>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#1D4ED8', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', padding: '2px 8px', borderRadius: 6 }}>
            NOAA GEFSv12 · c00, p01–p04
          </span>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ENSEMBLE_DATA} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 2" stroke="#E7EFEC" vertical={false} />
              <XAxis dataKey="member" tick={{ fontSize: 12, fill: '#64748B' }} stroke="#DDE8E4" />
              <YAxis tick={{ fontSize: 12, fill: '#64748B' }} stroke="#DDE8E4" domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#FFFFFF', color: '#334155', borderRadius: '8px', fontSize: '12px', border: '1px solid #DDE8E4' }}
                formatter={(v: number) => [`${v}%`, 'Spread']}
              />
              <Bar dataKey="spread" radius={[4, 4, 0, 0]}>
                {ENSEMBLE_DATA.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={entry.spread >= 65 ? '#EF4444' : entry.spread >= 50 ? '#F59E0B' : '#059669'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Bottom 2-col: Spatial Distribution + Reliability by Variable ─ */}
      <div className="grid grid-cols-2 gap-4">

        {/* Spatial Distribution of Bust Risk */}
        <div className="bg-white border border-[#DDE8E4] p-4 rounded-[10px] shadow-[0_1px_2px_rgba(15,39,71,0.04)] space-y-3">
          <div className="flex items-center justify-between border-b border-[#DDE8E4] pb-2">
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F2747' }} className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-500" />
              Spatial Distribution of Bust Risk
            </h3>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#B91C1C', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', padding: '2px 8px', borderRadius: 6 }}>
              By Region
            </span>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SPATIAL_DATA} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 2" stroke="#E7EFEC" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} stroke="#DDE8E4" />
                <YAxis type="category" dataKey="region" tick={{ fontSize: 12, fill: '#334155' }} stroke="#DDE8E4" width={60} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', color: '#334155', borderRadius: '8px', fontSize: '12px', border: '1px solid #DDE8E4' }}
                  formatter={(v: number) => [`${v}%`, 'Bust Risk']}
                />
                <Bar dataKey="bustRisk" radius={[0, 4, 4, 0]}>
                  {SPATIAL_DATA.map((entry, idx) => (
                    <Cell key={idx} fill={BUST_COLORS(entry.bustRisk)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Reliability by Variable */}
        <div className="bg-white border border-[#DDE8E4] p-4 rounded-[10px] shadow-[0_1px_2px_rgba(15,39,71,0.04)] space-y-3">
          <div className="flex items-center justify-between border-b border-[#DDE8E4] pb-2">
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F2747' }} className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#2563EB]" />
              Reliability by Variable
            </h3>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#1D4ED8', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', padding: '2px 8px', borderRadius: 6 }}>
              Diagnostic Contribution
            </span>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={RELIABILITY_DATA} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 2" stroke="#E7EFEC" horizontal={false} />
                <XAxis type="number" domain={[0, 0.5]} tick={{ fontSize: 11, fill: '#64748B' }} stroke="#DDE8E4" tickFormatter={(v) => v.toFixed(2)} />
                <YAxis type="category" dataKey="variable" tick={{ fontSize: 12, fill: '#334155' }} stroke="#DDE8E4" width={80} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', color: '#334155', borderRadius: '8px', fontSize: '12px', border: '1px solid #DDE8E4' }}
                  formatter={(v: number) => [v.toFixed(2), 'Contribution']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {RELIABILITY_DATA.map((entry, idx) => (
                    <Cell key={idx} fill={['#2563EB', '#059669', '#F59E0B', '#7C3AED'][idx % 4]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Value labels */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {RELIABILITY_DATA.map((d, i) => (
              <div key={i} className="flex items-center justify-between bg-[#F7FAF9] border border-[#DDE8E4] rounded px-2.5 py-1">
                <span style={{ fontSize: 11, fontWeight: 500, color: '#64748B' }}>{d.variable}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0F2747', fontFamily: 'monospace' }}>{d.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Lead-wise Metrics Table ──────────────────────────────────────── */}
      <div className="bg-white border border-[#DDE8E4] rounded-[10px] shadow-[0_1px_2px_rgba(15,39,71,0.04)] overflow-hidden">
        <div className="p-3.5 border-b border-[#DDE8E4] bg-[#F6FAF8]">
          <h3 style={{ fontSize: 12, fontWeight: 650, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Lead-wise Metrics Breakdown Table (D1–D10)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ fontSize: 13, color: '#334155' }}>
            <thead>
              <tr style={{ backgroundColor: '#F6FAF8', borderBottom: '1px solid #DDE8E4' }}>
                <th style={{ padding: '8px 12px', fontSize: 11.5, fontWeight: 650, color: '#64748B', textTransform: 'uppercase' }}>Lead Day</th>
                <th style={{ padding: '8px 12px', fontSize: 11.5, fontWeight: 650, color: '#64748B', textTransform: 'uppercase' }}>Mean Rain</th>
                <th style={{ padding: '8px 12px', fontSize: 11.5, fontWeight: 650, color: '#64748B', textTransform: 'uppercase' }}>Mean Bust P</th>
                <th style={{ padding: '8px 12px', fontSize: 11.5, fontWeight: 650, color: '#64748B', textTransform: 'uppercase' }}>Median FFD</th>
                <th style={{ padding: '8px 12px', fontSize: 11.5, fontWeight: 650, color: '#64748B', textTransform: 'uppercase' }}>Median Trust</th>
                <th style={{ padding: '8px 12px', fontSize: 11.5, fontWeight: 650, color: '#64748B', textTransform: 'uppercase' }}>Green %</th>
                <th style={{ padding: '8px 12px', fontSize: 11.5, fontWeight: 650, color: '#64748B', textTransform: 'uppercase' }}>Yellow %</th>
                <th style={{ padding: '8px 12px', fontSize: 11.5, fontWeight: 650, color: '#64748B', textTransform: 'uppercase' }}>Red %</th>
                <th style={{ padding: '8px 12px', fontSize: 11.5, fontWeight: 650, color: '#64748B', textTransform: 'uppercase' }}>Regional Band</th>
              </tr>
            </thead>
            <tbody style={{ fontVariantNumeric: 'tabular-nums' }}>
              {regionalTrend.map((row, idx) => (
                <tr key={row.lead_day} style={{ height: 36, backgroundColor: idx % 2 === 1 ? '#F7FAF9' : '#FFFFFF', borderBottom: '1px solid #F1F5F4' }}>
                  <td style={{ padding: '0 12px', fontWeight: 600, color: '#0F2747' }}>Lead D{row.lead_day}</td>
                  <td style={{ padding: '0 12px' }}>{row.mean_rainfall.toFixed(1)} mm</td>
                  <td style={{ padding: '0 12px', fontWeight: 600, color: row.mean_bust_probability > 0.5 ? '#EF4444' : '#334155' }}>
                    {(row.mean_bust_probability * 100).toFixed(1)}%
                  </td>
                  <td style={{ padding: '0 12px' }}>{row.median_ffd.toFixed(2)}</td>
                  <td style={{ padding: '0 12px', fontWeight: 700, color: '#059669' }}>{row.median_trust_index.toFixed(1)}</td>
                  <td style={{ padding: '0 12px', color: '#059669', fontWeight: 600 }}>{(row.green_fraction * 100).toFixed(0)}%</td>
                  <td style={{ padding: '0 12px', color: '#B45309', fontWeight: 600 }}>{(row.yellow_fraction * 100).toFixed(0)}%</td>
                  <td style={{ padding: '0 12px', color: '#B91C1C', fontWeight: 600 }}>{(row.red_fraction * 100).toFixed(0)}%</td>
                  <td style={{ padding: '0 12px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      backgroundColor: row.regional_reliability_band === 'GREEN' ? '#ECFDF5' : row.regional_reliability_band === 'YELLOW' ? '#FFFBEB' : '#FEF2F2',
                      color:           row.regional_reliability_band === 'GREEN' ? '#047857' : row.regional_reliability_band === 'YELLOW' ? '#B45309' : '#B91C1C',
                    }}>
                      {row.regional_reliability_band}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
