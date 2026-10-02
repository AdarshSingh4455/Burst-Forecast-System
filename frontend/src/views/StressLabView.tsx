import React, { useState } from 'react';
import { Activity, ShieldAlert, Zap, FlaskConical, AlertTriangle, ChevronRight, BarChart2 } from 'lucide-react';
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
  ReferenceLine,
  Cell,
  Legend
} from 'recharts';
import { StressTestResponse, GridPointDetail } from '../types';

interface StressLabViewProps {
  stressData: StressTestResponse | null;
  pointDetail: GridPointDetail | null;
}

type StressTab = 'perturbation' | 'sensitivity' | 'extreme' | 'variable';

// Hardcoded scenario sensitivity data (Prototype)
const SCENARIO_SENSITIVITY = [
  { scenario: 'Moisture Influx', label: 'Moisture Influx', delta: 0.85, color: '#EF4444' },
  { scenario: 'Monsoon Break', label: 'Monsoon Break', delta: 0.47, color: '#F59E0B' },
  { scenario: 'Western Dist.', label: 'Western Disturbance', delta: 0.38, color: '#F59E0B' },
  { scenario: 'Monsoon Active', label: 'Monsoon Active Phase', delta: 0.22, color: '#059669' },
  { scenario: 'Cyclone Tail', label: 'Cyclone Tail Effect', delta: 0.12, color: '#059669' },
];

const KEY_FINDINGS = [
  {
    icon: AlertTriangle,
    color: '#B91C1C',
    bg: '#FEF2F2',
    border: '#FECACA',
    text: 'High moisture influx significantly increases bust risk after D4, with ensemble spread expanding beyond reliable thresholds.'
  },
  {
    icon: Activity,
    color: '#B45309',
    bg: '#FFFBEB',
    border: '#FDE68A',
    text: 'Model is sensitive to humidity and temperature co-variability — joint perturbations produce non-linear bust risk amplification.'
  },
  {
    icon: Zap,
    color: '#1D4ED8',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    text: 'Forecast uncertainty amplifies significantly under active monsoon scenarios, reducing the effective trust horizon by 1–2 days.'
  },
];

const STRESS_TABS = [
  { key: 'perturbation' as StressTab, label: 'Perturbation Testing', icon: FlaskConical },
  { key: 'sensitivity' as StressTab, label: 'Sensitivity Analysis', icon: Activity },
  { key: 'extreme' as StressTab, label: 'Extreme Scenarios', icon: ShieldAlert },
  { key: 'variable' as StressTab, label: 'Variable Impact', icon: Zap },
];

export const StressLabView: React.FC<StressLabViewProps> = ({ stressData, pointDetail }) => {
  const [activeTab, setActiveTab] = useState<StressTab>('perturbation');
  const [isRunning, setIsRunning] = useState(false);

  // Use real stress curve from API or fallback defaults
  const curveData = stressData?.stress_curve || [
    { delta: -3.0, p_bust: 0.18, variable: 'Temperature' },
    { delta: -2.0, p_bust: 0.22, variable: 'Temperature' },
    { delta: -1.0, p_bust: 0.35, variable: 'Temperature' },
    { delta:  0.0, p_bust: 0.62, variable: 'Baseline' },
    { delta:  1.0, p_bust: 0.78, variable: 'Temperature' },
    { delta:  2.0, p_bust: 0.85, variable: 'Temperature' },
    { delta:  3.0, p_bust: 0.91, variable: 'Temperature' },
  ];

  const chartData = curveData.map(c => ({
    name: `${c.delta > 0 ? '+' : ''}${c.delta}`,
    'Bust Risk (%)': parseFloat((c.p_bust * 100).toFixed(1)),
    delta: c.delta,
  }));

  const handleRunStressTest = () => {
    setIsRunning(true);
    setTimeout(() => setIsRunning(false), 800);
  };

  return (
    <div className="h-full w-full overflow-y-auto p-5 space-y-4" style={{ backgroundColor: '#F7FAF9', color: '#334155' }}>

      {/* ── Top Banner ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#DDE8E4] rounded-[10px] shadow-[0_1px_2px_rgba(15,39,71,0.04)] p-4 flex items-center justify-between">
        <div>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            STRESS TESTING LABORATORY
          </span>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F2747', marginTop: 2 }} className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-[#059669]" />
            Stress Lab &amp; Fragility Analysis
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
            Perturbation-based forecast fragility evaluation for
            {pointDetail
              ? ` ${pointDetail.latitude.toFixed(2)}°N, ${pointDetail.longitude.toFixed(2)}°E`
              : ' selected grid point'}.
            {' '}Baseline bust risk:{' '}
            <strong style={{ fontFamily: 'monospace', color: '#EF4444' }}>
              {pointDetail ? (pointDetail.baseline_p_bust * 100).toFixed(0) : '62'}%
            </strong>
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <button
            onClick={handleRunStressTest}
            disabled={isRunning}
            style={{
              height: 38,
              padding: '0 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              backgroundColor: isRunning ? '#DDE8E4' : '#059669',
              color: isRunning ? '#64748B' : '#FFFFFF',
              border: 'none',
              cursor: isRunning ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'background 0.15s'
            }}
          >
            <Zap className={`w-4 h-4 ${isRunning ? 'animate-pulse' : ''}`} />
            {isRunning ? 'Running...' : 'Run Stress Test'}
          </button>
          <div className="bg-[#F1F5F4] border border-[#DDE8E4] px-3 py-1 rounded-[6px] text-[11px] font-semibold text-[#0F2747]">
            FFD: <strong className="text-[#B45309] font-mono">{pointDetail?.ffd ?? 0.32}</strong>
            {' · '}
            <span className="text-[#64748B]">{pointDetail?.fragility_category || 'Fragile'}</span>
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-white border border-[#DDE8E4] rounded-[10px] p-1 w-fit shadow-xs">
        {STRESS_TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
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

      {/* ── TAB 1: PERTURBATION TESTING ────────────────────────────────── */}
      {activeTab === 'perturbation' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {/* LEFT – Scenario Sensitivity (2/3 width) */}
            <div className="col-span-2 bg-white border border-[#DDE8E4] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(15,39,71,0.04)] space-y-3">
              <div className="flex items-center justify-between border-b border-[#DDE8E4] pb-2">
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F2747' }} className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#2563EB]" />
                  Forecast Sensitivity (ΔSI)
                </h3>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#1D4ED8', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', padding: '2px 8px', borderRadius: 6 }}>
                  Scenario Impact · Diagnostic
                </span>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={SCENARIO_SENSITIVITY}
                    layout="vertical"
                    margin={{ top: 4, right: 32, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="4 2" stroke="#E7EFEC" horizontal={false} />
                    <XAxis
                      type="number"
                      domain={[0, 1]}
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      stroke="#DDE8E4"
                      tickFormatter={v => `+${v.toFixed(2)}`}
                    />
                    <YAxis
                      type="category"
                      dataKey="scenario"
                      tick={{ fontSize: 12, fill: '#334155' }}
                      stroke="#DDE8E4"
                      width={90}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#FFFFFF', color: '#334155', borderRadius: '8px', fontSize: '12px', border: '1px solid #DDE8E4' }}
                      formatter={(v: number) => [`+${v.toFixed(2)}`, 'ΔSensitivity Index']}
                    />
                    <Bar dataKey="delta" radius={[0, 4, 4, 0]}>
                      {SCENARIO_SENSITIVITY.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Scenario pills */}
              <div className="flex flex-wrap gap-2 pt-1">
                {SCENARIO_SENSITIVITY.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 bg-[#F7FAF9] border border-[#DDE8E4] rounded-lg px-2.5 py-1"
                  >
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    <span style={{ fontSize: 11, fontWeight: 500, color: '#334155' }}>{s.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: s.color }}>
                      +{s.delta.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT – Key Findings (1/3 width) */}
            <div className="col-span-1 bg-white border border-[#DDE8E4] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(15,39,71,0.04)] space-y-3">
              <div className="border-b border-[#DDE8E4] pb-2">
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F2747' }} className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  Key Findings
                </h3>
                <p style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Stress Lab Diagnostics</p>
              </div>

              <div className="space-y-2.5">
                {KEY_FINDINGS.map((finding, i) => {
                  const Icon = finding.icon;
                  return (
                    <div
                      key={i}
                      style={{ backgroundColor: finding.bg, borderColor: finding.border }}
                      className="flex gap-2.5 p-2.5 rounded-lg border"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <Icon className="w-4 h-4" style={{ color: finding.color }} />
                      </div>
                      <p style={{ fontSize: 12, color: '#334155', lineHeight: 1.45 }}>
                        {finding.text}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Lab Recommendation */}
              <div className="bg-[#F7FAF9] border border-[#DDE8E4] rounded-lg p-2.5 mt-1">
                <p style={{ fontSize: 10, fontWeight: 700, color: '#059669', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 2 }}>
                  Lab Recommendation
                </p>
                <p style={{ fontSize: 11, color: '#64748B', lineHeight: 1.45 }}>
                  Trigger expert review when ΔSI &gt; 0.5 — perturbation response exceeds reliable forecast boundary.
                </p>
              </div>
            </div>
          </div>

          {/* Line Chart */}
          <div className="bg-white border border-[#DDE8E4] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(15,39,71,0.04)] space-y-3">
            <div className="flex items-center justify-between border-b border-[#DDE8E4] pb-2">
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F2747' }} className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-[#059669]" />
                Scenario Impact on Bust Risk (Perturbation Curve)
              </h3>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 11, fontWeight: 600, color: '#047857', backgroundColor: '#ECFDF5', padding: '2px 8px', borderRadius: 6 }}>
                  Baseline: {pointDetail ? (pointDetail.baseline_p_bust * 100).toFixed(0) : '62'}%
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#B91C1C', backgroundColor: '#FEF2F2', padding: '2px 8px', borderRadius: 6 }}>
                  Stress Curve (Perturbation δ)
                </span>
              </div>
            </div>

            <div className="h-[240px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 2" vertical={false} stroke="#E7EFEC" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} stroke="#DDE8E4" />
                  <YAxis tick={{ fontSize: 12, fill: '#64748B' }} stroke="#DDE8E4" domain={[0, 100]} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', color: '#334155', borderRadius: '8px', fontSize: '12px', border: '1px solid #DDE8E4' }} formatter={(v: number) => [`${v}%`, 'Bust Risk']} />
                  <ReferenceLine y={70} stroke="#EF4444" strokeDasharray="6 3" strokeWidth={1.5} label={{ value: 'High Risk (70%)', position: 'insideTopRight', fontSize: 11, fill: '#DC2626' }} />
                  <Line type="monotone" dataKey="Bust Risk (%)" stroke="#DC2626" strokeWidth={2.5} dot={{ r: 4, fill: '#DC2626' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-white border border-[#DDE8E4] rounded-[10px] shadow-[0_1px_2px_rgba(15,39,71,0.04)] overflow-hidden">
            <div className="p-3.5 border-b border-[#DDE8E4] bg-[#F6FAF8] flex items-center justify-between">
              <h3 style={{ fontSize: 12, fontWeight: 650, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }} className="flex items-center gap-2">
                <FlaskConical className="w-3.5 h-3.5 text-[#059669]" />
                Perturbation Results Table
              </h3>
              <span style={{ fontSize: 11, color: '#64748B' }}>{curveData.length} delta steps evaluated</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ fontSize: 13, color: '#334155' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F6FAF8', borderBottom: '1px solid #DDE8E4' }}>
                    <th style={{ padding: '8px 12px', fontSize: 11.5, fontWeight: 650, color: '#64748B', textTransform: 'uppercase' }}>δ Perturbation</th>
                    <th style={{ padding: '8px 12px', fontSize: 11.5, fontWeight: 650, color: '#64748B', textTransform: 'uppercase' }}>Variable</th>
                    <th style={{ padding: '8px 12px', fontSize: 11.5, fontWeight: 650, color: '#64748B', textTransform: 'uppercase' }}>P(Bust)</th>
                    <th style={{ padding: '8px 12px', fontSize: 11.5, fontWeight: 650, color: '#64748B', textTransform: 'uppercase' }}>Bust Risk (%)</th>
                    <th style={{ padding: '8px 12px', fontSize: 11.5, fontWeight: 650, color: '#64748B', textTransform: 'uppercase' }}>Risk Level</th>
                    <th style={{ padding: '8px 12px', fontSize: 11.5, fontWeight: 650, color: '#64748B', textTransform: 'uppercase' }}>ΔRisk vs Baseline</th>
                  </tr>
                </thead>
                <tbody style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {curveData.map((row, idx) => {
                    const bustPct = row.p_bust * 100;
                    const baseline = pointDetail ? pointDetail.baseline_p_bust * 100 : 62;
                    const delta = bustPct - baseline;
                    const riskBadge =
                      bustPct >= 75 ? { label: 'HIGH', bg: '#FEF2F2', color: '#B91C1C' }
                      : bustPct >= 50 ? { label: 'MODERATE', bg: '#FFFBEB', color: '#B45309' }
                      : { label: 'LOW', bg: '#ECFDF5', color: '#047857' };
                    return (
                      <tr key={idx} style={{ height: 36, backgroundColor: idx % 2 === 1 ? '#F7FAF9' : '#FFFFFF', borderBottom: '1px solid #F1F5F4' }}>
                        <td style={{ padding: '0 12px', fontWeight: 600, color: '#0F2747' }}>{row.delta > 0 ? '+' : ''}{row.delta.toFixed(1)}</td>
                        <td style={{ padding: '0 12px' }}>{row.variable}</td>
                        <td style={{ padding: '0 12px' }}>{row.p_bust.toFixed(3)}</td>
                        <td style={{ padding: '0 12px', fontWeight: 600, color: bustPct >= 70 ? '#EF4444' : '#059669' }}>{bustPct.toFixed(1)}%</td>
                        <td style={{ padding: '0 12px' }}>
                          <span style={{ backgroundColor: riskBadge.bg, color: riskBadge.color, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                            {riskBadge.label}
                          </span>
                        </td>
                        <td style={{ padding: '0 12px', fontWeight: 600, color: delta > 0 ? '#EF4444' : '#059669' }}>
                          {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: SENSITIVITY ANALYSIS ──────────────────────────────────── */}
      {activeTab === 'sensitivity' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#DDE8E4] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(15,39,71,0.04)] space-y-4">
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F2747' }} className="flex items-center gap-2 border-b border-[#DDE8E4] pb-2">
              <Activity className="w-4 h-4 text-[#2563EB]" />
              Sensitivity Analysis — Variable Response Matrix
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: 'Temperature Anomaly', sensitivity: '+0.72', status: 'High', color: '#EF4444', desc: 'High co-variability with moisture influx. Increases bust risk non-linearly after +1.5°C.' },
                { name: 'Specific Humidity', sensitivity: '+0.65', status: 'High', color: '#EF4444', desc: 'Primary driver of monsoonal forecast bust. 42% grid vulnerability.' },
                { name: 'Precipitation Volume', sensitivity: '+0.58', status: 'Moderate', color: '#F59E0B', desc: 'Non-linear threshold breach at >85mm precipitation.' },
                { name: 'Wind Vector Shear', sensitivity: '+0.41', status: 'Moderate', color: '#059669', desc: 'Secondary modulating factor for trough displacement.' }
              ].map((v, i) => (
                <div key={i} className="border border-[#DDE8E4] rounded-[10px] p-4 bg-[#F7FAF9] space-y-2">
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0F2747' }}>{v.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'monospace', padding: '2px 8px', borderRadius: 6, background: v.color + '20', color: v.color }}>
                      ΔSI: {v.sensitivity}
                    </span>
                  </div>
                  <div className="w-full bg-[#E7EFEC] rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: `${parseFloat(v.sensitivity) * 100}%`, backgroundColor: v.color }} />
                  </div>
                  <p style={{ fontSize: 12, color: '#64748B', paddingTop: 4 }}>{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: EXTREME SCENARIOS ──────────────────────────────────────── */}
      {activeTab === 'extreme' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#DDE8E4] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(15,39,71,0.04)] space-y-4">
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F2747' }} className="flex items-center gap-2 border-b border-[#DDE8E4] pb-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              Extreme Scenario Stress Testing
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: 'Cyclone-induced Moisture Surge', severity: 'CRITICAL', bustRisk: 94, description: 'SST anomaly >2°C triggers extreme convective feedback and severe forecast uncertainty.' },
                { name: 'Prolonged Dry Spell (15d+)', severity: 'HIGH', bustRisk: 78, description: 'Extended absence of monsoon trough leads to severe FFD degradation across D4–D10.' },
                { name: 'Rapid Onset Flooding', severity: 'HIGH', bustRisk: 82, description: 'Orographic enhancement + blocked low amplifies rainfall >3σ over Eastern UP.' },
                { name: 'Monsoon Withdrawal Anomaly', severity: 'MODERATE', bustRisk: 61, description: 'Early withdrawal increases bust probability through mid-October.' }
              ].map((s, i) => (
                <div key={i} className="p-4 rounded-[10px] border border-[#DDE8E4] bg-white space-y-2 flex items-start gap-4 shadow-[0_1px_2px_rgba(15,39,71,0.04)]">
                  <div className="text-center flex-shrink-0">
                    <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'monospace', color: s.bustRisk >= 80 ? '#EF4444' : '#B45309' }}>
                      {s.bustRisk}%
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Bust Risk</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#0F2747' }}>{s.name}</span>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 6,
                        backgroundColor: s.severity === 'CRITICAL' ? '#FEF2F2' : s.severity === 'HIGH' ? '#FFFBEB' : '#ECFDF5',
                        color:           s.severity === 'CRITICAL' ? '#B91C1C' : s.severity === 'HIGH' ? '#B45309' : '#047857',
                      }}>{s.severity}</span>
                    </div>
                    <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.45 }}>{s.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: VARIABLE IMPACT ────────────────────────────────────────── */}
      {activeTab === 'variable' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#DDE8E4] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(15,39,71,0.04)] space-y-4">
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F2747' }} className="flex items-center gap-2 border-b border-[#DDE8E4] pb-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Variable Impact &amp; Contribution Ranking
            </h3>
            <div className="space-y-3">
              {[
                { variable: 'Specific Humidity / Moisture Influx', impact: 0.85, role: 'Primary Driver', color: '#EF4444' },
                { variable: 'Temperature Gradient (2m Anomaly)', impact: 0.72, role: 'Co-Driver', color: '#EF4444' },
                { variable: 'Rainfall Intensity (Q95 Threshold)', impact: 0.65, role: 'Threshold Trigger', color: '#F59E0B' },
                { variable: 'Wind Circulation Shear', impact: 0.48, role: 'Modulator', color: '#059669' },
                { variable: 'Surface Pressure Systems', impact: 0.38, role: 'Background State', color: '#2563EB' },
              ].map((v, i) => (
                <div key={i} className="flex items-center gap-3 bg-[#F7FAF9] border border-[#DDE8E4] p-3 rounded-[8px]">
                  <div className="w-56 text-right flex-shrink-0">
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#0F2747' }}>{v.variable}</span>
                  </div>
                  <div className="flex-1 bg-[#E7EFEC] rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full transition-all"
                      style={{
                        width: `${v.impact * 100}%`,
                        backgroundColor: v.color
                      }}
                    />
                  </div>
                  <div className="w-32 flex items-center gap-2 flex-shrink-0">
                    <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'monospace', color: '#0F2747' }}>{v.impact.toFixed(2)}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6, backgroundColor: '#FFFFFF', border: '1px solid #DDE8E4', color: '#64748B' }}>
                      {v.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
