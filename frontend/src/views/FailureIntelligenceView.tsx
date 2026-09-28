import React, { useState } from 'react';
import { 
  ShieldAlert, Fingerprint, Layers, TrendingDown, Map, 
  Droplets, Thermometer, Gauge, Wind, Users, Sparkles, 
  Activity, AlertTriangle, ArrowUpRight, ArrowDownRight 
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, ReferenceLine,
  RadialBarChart, RadialBar
} from 'recharts';
import { FingerprintResponse, FailureCorridor, GridPointDetail } from '../types';

interface FailureIntelligenceViewProps {
  fingerprint: FingerprintResponse | null;
  corridors: FailureCorridor[];
  pointDetail: GridPointDetail | null;
}

const TABS = ['Failure Bits', 'Failure Cluster', 'Historical Analogues', 'Risk Patterns'];

// Static cluster data (prototype)
const clusterData = [
  { label: 'Cluster #1 — High Moisture Rain', x: 38, y: 62, size: 45, color: '#EF4444', current: true },
  { label: 'Cluster #2 — Dry Intrusion Bust', x: 68, y: 35, size: 30, color: '#F59E0B', current: false },
  { label: 'Cluster #3 — Wind Shear', x: 22, y: 45, size: 20, color: '#0284C7', current: false },
];

const clusterCharacteristics = [
  { label: 'Count', value: '45' },
  { label: 'Patterns', value: 'Monsoon Heavy Rain' },
  { label: 'Bust Rate', value: '54' },
  { label: 'Key Season', value: 'JAS' },
  { label: 'Lead Focus', value: 'D4–D7' },
  { label: 'Dominant Error', value: 'Moisture Influx' },
];

const historicalSim = [
  { year: 'Case 1 (2011)', sim: 0.82 },
  { year: 'Case 2 (2013)', sim: 0.74 },
  { year: 'Case 3 (2015)', sim: 0.68 },
  { year: 'Case 4 (2016)', sim: 0.45 },
];

export const FailureIntelligenceView: React.FC<FailureIntelligenceViewProps> = ({ fingerprint, corridors, pointDetail }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [chartMode, setChartMode] = useState<'radial' | 'deviation'>('radial');

  const feat = fingerprint?.features || {
    moisture: 0.82,
    temperature: 0.45,
    pressure: 0.38,
    wind: 0.64,
    ensemble: 0.78,
    novelty: 0.52
  };

  // Radar data — 6D axes EXACTLY: Moisture, Temperature, Pressure, Wind, Ensemble, Novelty
  const radarData = [
    { axis: 'Moisture',    current: parseFloat((feat.moisture    * 100).toFixed(0)), median: 50 },
    { axis: 'Temperature', current: parseFloat((feat.temperature * 100).toFixed(0)), median: 60 },
    { axis: 'Pressure',    current: parseFloat((feat.pressure    * 100).toFixed(0)), median: 45 },
    { axis: 'Wind',        current: parseFloat((feat.wind        * 100).toFixed(0)), median: 40 },
    { axis: 'Ensemble',    current: parseFloat((feat.ensemble    * 100).toFixed(0)), median: 52 },
    { axis: 'Novelty',     current: parseFloat((feat.novelty     * 100).toFixed(0)), median: 42 },
  ];

  // Concentric Radial Bar Data (inner to outer radius)
  const radialData = [
    { name: 'Pressure',    value: parseFloat((feat.pressure    * 100).toFixed(0)), fill: '#8B5CF6' },
    { name: 'Temperature', value: parseFloat((feat.temperature * 100).toFixed(0)), fill: '#0284C7' },
    { name: 'Novelty',     value: parseFloat((feat.novelty     * 100).toFixed(0)), fill: '#10B981' },
    { name: 'Wind',        value: parseFloat((feat.wind        * 100).toFixed(0)), fill: '#F59E0B' },
    { name: 'Ensemble',    value: parseFloat((feat.ensemble    * 100).toFixed(0)), fill: '#EF4444' },
    { name: 'Moisture',    value: parseFloat((feat.moisture    * 100).toFixed(0)), fill: '#059669' },
  ];

  // Baseline Deviation Data (Threshold at 50%)
  const deviationData = [
    { name: 'Moisture',    delta: parseFloat(((feat.moisture    - 0.50) * 100).toFixed(0)), color: '#EF4444', desc: 'Over Threshold (+32%)' },
    { name: 'Ensemble',    delta: parseFloat(((feat.ensemble    - 0.50) * 100).toFixed(0)), color: '#EF4444', desc: 'Over Threshold (+28%)' },
    { name: 'Wind Shear',  delta: parseFloat(((feat.wind        - 0.50) * 100).toFixed(0)), color: '#F59E0B', desc: 'Moderate Excess (+14%)' },
    { name: 'Novelty OOD', delta: parseFloat(((feat.novelty     - 0.50) * 100).toFixed(0)), color: '#10B981', desc: 'Near Baseline (+2%)' },
    { name: 'Temperature', delta: parseFloat(((feat.temperature - 0.50) * 100).toFixed(0)), color: '#0284C7', desc: 'Safe Margin (-5%)' },
    { name: 'Pressure',    delta: parseFloat(((feat.pressure    - 0.50) * 100).toFixed(0)), color: '#8B5CF6', desc: 'Safe Margin (-12%)' },
  ];

  // 6D Dimensions Detailed List
  const dimensionDetails = [
    {
      id: 'moisture',
      name: 'Moisture Sensitivity',
      icon: Droplets,
      value: parseFloat((feat.moisture * 100).toFixed(0)),
      delta: '+32%',
      color: '#059669',
      status: 'CRITICAL',
      statusBg: '#FEF2F2',
      statusText: '#B91C1C',
      subtitle: 'Specific humidity & PWAT influx'
    },
    {
      id: 'ensemble',
      name: 'GEFS Disagreement',
      icon: Users,
      value: parseFloat((feat.ensemble * 100).toFixed(0)),
      delta: '+28%',
      color: '#EF4444',
      status: 'CRITICAL',
      statusBg: '#FEF2F2',
      statusText: '#B91C1C',
      subtitle: 'Ensemble member divergence'
    },
    {
      id: 'wind',
      name: 'Wind Sensitivity',
      icon: Wind,
      value: parseFloat((feat.wind * 100).toFixed(0)),
      delta: '+14%',
      color: '#F59E0B',
      status: 'ELEVATED',
      statusBg: '#FFFBEB',
      statusText: '#B45309',
      subtitle: 'Boundary shear displacement'
    },
    {
      id: 'novelty',
      name: 'OOD / Novelty',
      icon: Sparkles,
      value: parseFloat((feat.novelty * 100).toFixed(0)),
      delta: '+2%',
      color: '#10B981',
      status: 'NORMAL',
      statusBg: '#ECFDF5',
      statusText: '#047857',
      subtitle: 'Training manifold distance'
    },
    {
      id: 'temp',
      name: 'Temperature',
      icon: Thermometer,
      value: parseFloat((feat.temperature * 100).toFixed(0)),
      delta: '-5%',
      color: '#0284C7',
      status: 'STABLE',
      statusBg: '#F1F5F9',
      statusText: '#64748B',
      subtitle: '2m thermal lapse stability'
    },
    {
      id: 'pressure',
      name: 'Pressure',
      icon: Gauge,
      value: parseFloat((feat.pressure * 100).toFixed(0)),
      delta: '-12%',
      color: '#8B5CF6',
      status: 'STABLE',
      statusBg: '#F5F3FF',
      statusText: '#6D28D9',
      subtitle: 'MSLP synoptic gradient'
    },
  ];

  const compositeRisk = Math.round(
    dimensionDetails.reduce((acc, d) => acc + d.value, 0) / dimensionDetails.length
  );

  return (
    <div className="h-full w-full overflow-y-auto p-5 space-y-4" style={{ backgroundColor: '#F7FAF9', color: '#334155' }}>

      {/* Top Banner */}
      <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE8E4', borderRadius: 10, boxShadow: '0 1px 2px rgba(15,39,71,0.04)', padding: '16px 20px' }}
           className="flex items-center justify-between">
        <div>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            FAILURE INTELLIGENCE ENGINE
          </span>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F2747', marginTop: 2 }} className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            Failure Intelligence &amp; DNA Corridors
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
            6D fingerprint vector matching for target point ({pointDetail ? `${pointDetail.latitude.toFixed(2)}°N, ${pointDetail.longitude.toFixed(2)}°E` : 'Selected Grid Point'}).
          </p>
        </div>
        <div style={{ backgroundColor: '#F1F5F4', border: '1px solid #DDE8E4', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#0F2747' }}>
          Fingerprint: <strong>{fingerprint?.fingerprint_label || 'High Moisture / Wind Disagreement'}</strong>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 w-fit" style={{ backgroundColor: '#F1F5F4', border: '1px solid #DDE8E4', padding: 4, borderRadius: 10 }}>
        {TABS.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            style={{
              padding: '6px 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              border: activeTab === i ? 'none' : '1px solid #DDE8E4',
              backgroundColor: activeTab === i ? '#059669' : '#FFFFFF',
              color: activeTab === i ? '#FFFFFF' : '#334155',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB 0: Failure Bits (6D Radar + 3D Feature Bars) */}
      {activeTab === 0 && (
        <div className="grid grid-cols-2 gap-4">
          {/* 6D Radar Chart */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE8E4', borderRadius: 10, boxShadow: '0 1px 2px rgba(15,39,71,0.04)', padding: 16 }} className="space-y-3">
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F2747' }} className="flex items-center gap-2">
              <Fingerprint className="w-4 h-4" style={{ color: '#059669' }} />
              6D Failure Fingerprint (SD Profile)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                  <PolarGrid stroke="#E7EFEC" />
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize: 12, fill: '#64748B', fontWeight: 500 }} />
                  <Radar
                    name="Current Case"
                    dataKey="current"
                    stroke="#059669"
                    fill="#059669"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Radar
                    name="Cluster Median"
                    dataKey="median"
                    stroke="#2563EB"
                    fill="#2563EB"
                    fillOpacity={0.1}
                    strokeWidth={2}
                    strokeDasharray="4 4"
                  />
                  <Tooltip formatter={(v: any, name: any) => [`${v}%`, name]} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #DDE8E4' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 justify-center" style={{ fontSize: 12 }}>
              <span className="flex items-center gap-1.5" style={{ color: '#059669', fontWeight: 500 }}>
                <span className="w-3 h-0.5 rounded" style={{ backgroundColor: '#059669', display: 'inline-block' }} />
                Current Case
              </span>
              <span className="flex items-center gap-1.5" style={{ color: '#2563EB', fontWeight: 500 }}>
                <span className="w-3 h-0.5 rounded" style={{ backgroundColor: '#2563EB', display: 'inline-block' }} />
                Cluster Median
              </span>
            </div>
          </div>

          {/* 6D Atmospheric Vulnerability Matrix */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE8E4', borderRadius: 10, boxShadow: '0 1px 2px rgba(15,39,71,0.04)', padding: 16 }} className="space-y-3 flex flex-col justify-between">
            <div>
              {/* Header with segmented switch */}
              <div className="flex items-center justify-between pb-2.5" style={{ borderBottom: '1px solid #DDE8E4' }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F2747' }} className="flex items-center gap-1.5">
                    <Activity className="w-4 h-4" style={{ color: '#059669' }} />
                    6D Atmospheric Vulnerability Matrix
                  </h3>
                  <p style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                    Diagnostic atmospheric sensitivities &amp; model failure vectors
                  </p>
                </div>

                <div className="flex items-center gap-1" style={{ backgroundColor: '#F1F5F4', padding: 2, borderRadius: 8, border: '1px solid #DDE8E4' }}>
                  <button
                    onClick={() => setChartMode('radial')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: 'none',
                      backgroundColor: chartMode === 'radial' ? '#059669' : 'transparent',
                      color: chartMode === 'radial' ? '#FFFFFF' : '#334155',
                      transition: 'all 0.15s',
                    }}
                  >
                    Radial Gauge
                  </button>
                  <button
                    onClick={() => setChartMode('deviation')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: 'none',
                      backgroundColor: chartMode === 'deviation' ? '#059669' : 'transparent',
                      color: chartMode === 'deviation' ? '#FFFFFF' : '#334155',
                      transition: 'all 0.15s',
                    }}
                  >
                    Threshold Variance
                  </button>
                </div>
              </div>

              {/* Mode 1: Radial Gauge Matrix */}
              {chartMode === 'radial' ? (
                <div className="grid grid-cols-12 gap-3 pt-2 items-center">
                  {/* Left: Concentric Radial Bar with Center Score */}
                  <div className="col-span-5 relative h-56 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart
                        cx="50%"
                        cy="50%"
                        innerRadius="25%"
                        outerRadius="100%"
                        barSize={8}
                        data={radialData}
                        startAngle={90}
                        endAngle={-270}
                      >
                        <RadialBar
                          background={{ fill: '#F1F5F4' }}
                          dataKey="value"
                          cornerRadius={6}
                        />
                        <Tooltip
                          formatter={(v: any, name: any) => [`${v}%`, name]}
                          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #DDE8E4' }}
                        />
                      </RadialBarChart>
                    </ResponsiveContainer>

                    {/* Central Telemetry Hub */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span style={{ fontSize: 24, fontWeight: 700, color: '#0F2747', lineHeight: 1 }}>{compositeRisk}%</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>Risk Score</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: '#B91C1C', backgroundColor: '#FEF2F2', padding: '2px 8px', borderRadius: 6, marginTop: 4, border: '1px solid #FCA5A5', textTransform: 'uppercase' }}>
                        Fragile
                      </span>
                    </div>
                  </div>

                  {/* Right: Dimension Diagnostic telemetry list */}
                  <div className="col-span-7 space-y-1.5 pl-1">
                    {dimensionDetails.map((dim) => {
                      const Icon = dim.icon;
                      return (
                        <div
                          key={dim.id}
                          className="flex items-center justify-between p-1.5 rounded-lg transition-colors"
                          style={{ border: '1px solid #DDE8E4', backgroundColor: '#F7FAF9' }}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: dim.color + '1A', color: dim.color }}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: '#0F2747', lineHeight: 1.3 }}>
                                {dim.name}
                              </div>
                              <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.2 }}>
                                {dim.subtitle}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: dim.color }}>
                              {dim.value}%
                            </span>
                            <span style={{
                              fontSize: 11,
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 6,
                              textTransform: 'uppercase',
                              backgroundColor: dim.statusBg,
                              color: dim.statusText,
                            }}>
                              {dim.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Mode 2: Baseline Deviation Waterfall Bar Chart */
                <div className="pt-2 space-y-2">
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={deviationData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 70, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="4 2" horizontal={false} stroke="#E7EFEC" />
                        <XAxis
                          type="number"
                          domain={[-30, 40]}
                          tick={{ fontSize: 12, fill: '#64748B' }}
                          tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}%`}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fontSize: 12, fill: '#64748B' }}
                        />
                        <ReferenceLine x={0} stroke="#334155" strokeWidth={1.5} />
                        <Tooltip
                          formatter={(v: any, name: any, item: any) => [`${v > 0 ? '+' : ''}${v}% (${item.payload.desc})`, 'Baseline Variance']}
                          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #DDE8E4' }}
                        />
                        <Bar dataKey="delta" radius={[4, 4, 4, 4]}>
                          {deviationData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-between px-2 pt-1" style={{ fontSize: 11, color: '#64748B', borderTop: '1px solid #DDE8E4' }}>
                    <span className="flex items-center gap-1" style={{ color: '#2563EB' }}>
                      <ArrowDownRight className="w-3 h-3" /> Safe Margin (&lt; 50% Baseline)
                    </span>
                    <span className="flex items-center gap-1" style={{ color: '#EF4444' }}>
                      <ArrowUpRight className="w-3 h-3" /> Critical Risk Driver (&gt; 50% Baseline)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Key Diagnostic Summary Alert */}
            <div className="flex items-center justify-between" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', padding: '10px 12px', borderRadius: 8, fontSize: 12 }}>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 14 }}>💡</span>
                <span style={{ color: '#334155', fontWeight: 500, fontSize: 12 }}>
                  <strong style={{ color: '#0F2747' }}>Primary Bust Trigger:</strong> High atmospheric moisture convergence (+32%) coupled with GEFS ensemble spread (+28%).
                </span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#B45309', backgroundColor: '#FFFFFF', padding: '2px 10px', borderRadius: 6, border: '1px solid #FDE68A', flexShrink: 0 }}>
                Coupled Failure
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: Failure Cluster */}
      {activeTab === 1 && (
        <div className="grid grid-cols-12 gap-4">
          {/* Cluster Scatter Visualization */}
          <div className="col-span-7 space-y-3" style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE8E4', borderRadius: 10, boxShadow: '0 1px 2px rgba(15,39,71,0.04)', padding: 16 }}>
            <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid #DDE8E4' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F2747' }} className="flex items-center gap-2">
                <Map className="w-4 h-4" style={{ color: '#059669' }} />
                Failure Cluster (Current Case)
              </h3>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#B45309', backgroundColor: '#FFFBEB', padding: '2px 8px', borderRadius: 6, border: '1px solid #FDE68A', textTransform: 'uppercase' }}>
                Prototype Cluster Map
              </span>
            </div>

            {/* Cluster scatter */}
            <div className="relative rounded-xl h-52 overflow-hidden" style={{ backgroundColor: '#F1F5F4', border: '1px solid #DDE8E4', backgroundImage: 'radial-gradient(circle, #DDE8E4 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
              {clusterData.map((c, i) => (
                <div
                  key={i}
                  className={`absolute rounded-full flex items-center justify-center cursor-pointer ${c.current ? 'ring-4 ring-offset-2 ring-[#059669]' : ''}`}
                  style={{
                    left: `${c.x}%`,
                    top: `${c.y}%`,
                    width: `${c.size}px`,
                    height: `${c.size}px`,
                    backgroundColor: c.color + (c.current ? '' : '88'),
                    transform: 'translate(-50%, -50%)',
                  }}
                  title={c.label}
                >
                  {c.current && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#FFFFFF', textAlign: 'center', lineHeight: 1.1, padding: '0 2px' }}>YOU</span>
                  )}
                </div>
              ))}
              {/* Legend */}
              <div className="absolute bottom-2 left-2 rounded-lg px-2 py-1 space-y-0.5" style={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #DDE8E4', fontSize: 11, fontWeight: 500, color: '#334155' }}>
                {clusterData.map((c, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="truncate" style={{ maxWidth: 140 }}>{c.label.split('—')[0].trim()}</span>
                    {c.current && <span style={{ color: '#059669', fontWeight: 600 }}>← Current</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg p-2.5" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', fontSize: 12, color: '#92400E' }}>
              ⚠ Cluster assignment is a prototype diagnostic feature. Cluster membership does not constitute a bust forecast.
            </div>
          </div>

          {/* Cluster Characteristics */}
          <div className="col-span-5 space-y-4">
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE8E4', borderRadius: 10, boxShadow: '0 1px 2px rgba(15,39,71,0.04)', padding: 16 }} className="space-y-3">
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F2747', paddingBottom: 8, borderBottom: '1px solid #DDE8E4' }}>Cluster Characteristics</h3>
              <div className="space-y-1.5">
                {clusterCharacteristics.map((item, i) => (
                  <div key={i} className="flex justify-between px-2.5 py-1.5 rounded" style={{ backgroundColor: '#F7FAF9', border: '1px solid #DDE8E4', fontSize: 12 }}>
                    <span style={{ color: '#64748B', fontWeight: 500 }}>{item.label}</span>
                    <span style={{ color: '#0F2747', fontWeight: 600 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE8E4', borderRadius: 10, boxShadow: '0 1px 2px rgba(15,39,71,0.04)', padding: 16 }} className="space-y-3">
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F2747', paddingBottom: 8, borderBottom: '1px solid #DDE8E4' }}>Historical Similarity</h3>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={historicalSim} margin={{ top: 5, right: 10, left: -10, bottom: 0 }} layout="vertical">
                    <CartesianGrid strokeDasharray="4 2" horizontal={false} stroke="#E7EFEC" />
                    <XAxis type="number" domain={[0, 1]} tick={{ fontSize: 12, fill: '#64748B' }} stroke="#DDE8E4" />
                    <YAxis type="category" dataKey="year" tick={{ fontSize: 11, fill: '#64748B' }} width={75} stroke="#DDE8E4" />
                    <Tooltip formatter={(v: any) => v.toFixed(2)} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #DDE8E4' }} />
                    <Bar dataKey="sim" radius={[0, 4, 4, 0]}>
                      {historicalSim.map((_, i) => (
                        <Cell key={i} fill={i === 0 ? '#059669' : i === 1 ? '#2563EB' : '#F59E0B'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Historical Analogues */}
      {activeTab === 2 && (
        <div className="space-y-4">
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE8E4', borderRadius: 10, boxShadow: '0 1px 2px rgba(15,39,71,0.04)', overflow: 'hidden' }}>
            <div className="p-3 flex items-center justify-between" style={{ borderBottom: '1px solid #DDE8E4', backgroundColor: '#F6FAF8' }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: '#0F2747', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Historical Analogue Matches</h3>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr style={{ backgroundColor: '#F6FAF8' }}>
                  {['Year', 'Event Type', 'Similarity', 'Error (mm)', 'Key Season'].map((h) => (
                    <th key={h} style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { year: 2011, type: 'Monsoon Heavy Rain', sim: 0.82, error: 6.71, key: 'JAS' },
                  { year: 2013, type: 'Monsoon Day',        sim: 0.74, error: 4.33, key: 'JAS' },
                  { year: 2015, type: 'Monsoon Day',        sim: 0.68, error: 3.88, key: 'JAS' },
                  { year: 2016, type: 'Monsoon Break',      sim: 0.64, error: 2.11, key: 'JAS' },
                ].map((c, i) => (
                  <tr key={i} style={{ height: 36, backgroundColor: i % 2 === 1 ? '#F7FAF9' : '#FFFFFF', borderTop: '1px solid #DDE8E4' }}>
                    <td style={{ padding: '0 12px', fontSize: 13, fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>{c.year}</td>
                    <td style={{ padding: '0 12px', fontSize: 13, color: '#334155' }}>{c.type}</td>
                    <td style={{ padding: '0 12px', fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: '#059669' }}>{c.sim}</td>
                    <td style={{ padding: '0 12px', fontSize: 13, fontFamily: 'monospace', color: '#334155' }}>{c.error}</td>
                    <td style={{ padding: '0 12px' }}>
                      <span style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{c.key}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Risk Patterns */}
      {activeTab === 3 && (
        <div className="grid grid-cols-2 gap-4">
          {/* Failure Corridors */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE8E4', borderRadius: 10, boxShadow: '0 1px 2px rgba(15,39,71,0.04)', padding: 16 }} className="space-y-3">
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F2747' }} className="flex items-center gap-2">
              <Layers className="w-4 h-4" style={{ color: '#059669' }} />
              Dominant Failure Corridors
            </h3>
            <div className="space-y-2">
              {(corridors.length > 0 ? corridors : [
                { corridor_id: 1, corridor_name: 'High Moisture Shear Corridor', description: 'Strong specific humidity influx with weak mid-level shear', percentage: 42.5 },
                { corridor_id: 2, corridor_name: 'Monsoon Break Transition Failure', description: 'Dry air intrusion during active monsoon phase', percentage: 28.0 }
              ]).map((c, idx) => (
                <div key={idx} className="p-2.5 rounded-lg space-y-1" style={{ backgroundColor: '#F7FAF9', border: '1px solid #DDE8E4', fontSize: 13 }}>
                  <div className="flex justify-between" style={{ fontWeight: 600, color: '#0F2747' }}>
                    <span>{c.corridor_name}</span>
                    <span style={{ color: '#059669', fontFamily: 'monospace' }}>{c.percentage}%</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#64748B' }}>{c.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Patterns */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE8E4', borderRadius: 10, boxShadow: '0 1px 2px rgba(15,39,71,0.04)', padding: 16 }} className="space-y-3">
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F2747' }} className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-600" />
              Key Risk Patterns
            </h3>
            <div className="space-y-2">
              {[
                { pattern: 'Humidity Influx → Bust', freq: '42%', bg: '#FEF2F2', border: '#FCA5A5', text: '#B91C1C' },
                { pattern: 'High Pressure Ridge',    freq: '28%', bg: '#FFFBEB', border: '#FDE68A', text: '#B45309' },
                { pattern: 'Ensemble Spread > 0.45', freq: '18%', bg: '#FFF7ED', border: '#FED7AA', text: '#C2410C' },
                { pattern: 'OOD Score > 50',         freq: '12%', bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8' },
              ].map((p, i) => (
                <div key={i} className="flex justify-between items-center px-2.5 py-2 rounded-lg" style={{ backgroundColor: p.bg, border: `1px solid ${p.border}`, fontSize: 13 }}>
                  <span style={{ fontWeight: 600, color: p.text }}>{p.pattern}</span>
                  <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#0F2747' }}>{p.freq}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
