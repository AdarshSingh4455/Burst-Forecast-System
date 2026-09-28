import React from 'react';
import {
  BarChart3, ShieldAlert, CheckCircle2, ArrowRight, Activity, FileText,
  AlertTriangle, CloudRain, HelpCircle, Leaf, Zap, Waves
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { GridPointMap, RegionalSummary, TrendPoint, GridPointDetail } from '../types';
import { TrustStrip } from '../components/TrustStrip';

interface OverviewViewProps {
  selectedRun: string;
  selectedLead: number;
  setSelectedLead?: (lead: number) => void;
  selectedMetric: string;
  gridPoints: GridPointMap[];
  selectedLat: number | null;
  selectedLon: number | null;
  onSelectPoint: (lat: number, lon: number) => void;
  regionalSummary: RegionalSummary | null;
  trendData: TrendPoint[];
  pointDetail?: GridPointDetail | null;
  onOpenPassport: () => void;
  onNavigateTab?: (tab: string) => void;
}

// Helper: get status badge styles
const getStatusBadge = (status: string): { bg: string; color: string } => {
  const s = status.toUpperCase();
  if (s.includes('SUPPORTED RELIABILITY')) return { bg: '#ECFDF5', color: '#047857' };
  if (s.includes('WARNING')) return { bg: '#FFFBEB', color: '#B45309' };
  if (s.includes('CONFLICT')) return { bg: '#FEF2F2', color: '#B91C1C' };
  if (s.includes('EXPERT')) return { bg: '#F5F3FF', color: '#6D28D9' };
  return { bg: '#F1F5F9', color: '#64748B' };
};

export const OverviewView: React.FC<OverviewViewProps> = ({
  selectedRun,
  selectedLead,
  setSelectedLead,
  gridPoints,
  selectedLat,
  selectedLon,
  regionalSummary,
  trendData,
  pointDetail,
  onOpenPassport,
  onNavigateTab
}) => {
  const avgBustRisk = regionalSummary
    ? (regionalSummary.mean_bust_probability * 100).toFixed(0)
    : '62';
  const horizonDayNum = regionalSummary?.regional_trust_horizon_day ?? 5;
  const breakingDayNum = regionalSummary?.regional_breaking_point_day ?? 6;
  const effectiveBreakingDayNum = breakingDayNum > horizonDayNum
    ? breakingDayNum
    : Math.min(10, horizonDayNum + 3);
  const trustHorizon = `D${horizonDayNum}`;
  const breakingPoint = `D${effectiveBreakingDayNum}`;
  const selfAuditStatus = pointDetail?.self_audit_status || 'SUPPORTED WARNING';
  const trustIndex = pointDetail?.trust_index ?? 78;
  const reliabilityBand = pointDetail?.reliability_band ?? 'GREEN';

  const statusBadge = getStatusBadge(selfAuditStatus);

  const leadBands = React.useMemo(() => {
    const map: Record<number, 'GREEN' | 'YELLOW' | 'RED'> = {};
    if (trendData && trendData.length > 0) {
      trendData.forEach((t) => {
        if (t.lead_day) {
          let b = (t.reliability_band || '').toUpperCase();
          if (b === 'AMBER') b = 'YELLOW';
          if (b === 'GREEN' || b === 'YELLOW' || b === 'RED') {
            map[t.lead_day] = b as 'GREEN' | 'YELLOW' | 'RED';
          }
        }
      });
    }
    return map;
  }, [trendData]);

  const currentBand = (
    leadBands[selectedLead] ||
    (selectedLead <= horizonDayNum ? 'GREEN' : selectedLead < effectiveBreakingDayNum ? 'YELLOW' : 'RED')
  ).toUpperCase();

  const bandDisplay = currentBand === 'GREEN'
    ? { label: 'GREEN', bg: '#ECFDF5', color: '#047857', dot: '#22C55E' }
    : currentBand === 'RED'
    ? { label: 'RED', bg: '#FEF2F2', color: '#B91C1C', dot: '#EF4444' }
    : { label: 'YELLOW', bg: '#FFFBEB', color: '#B45309', dot: '#F5B82E' };

  // Self-audit donut (static regional distribution)
  const pieData = [
    { name: 'Supported Reliability', value: 63.9, color: '#22C55E' },
    { name: 'Supported Warning',     value: 4.0,  color: '#F5B82E' },
    { name: 'Conflict',              value: 20.4, color: '#EF4444' },
    { name: 'Insufficient Evidence', value: 6.8,  color: '#94A3B8' },
    { name: 'Expert Review',         value: 4.8,  color: '#7C3AED' },
  ];

  // Card style shorthand
  const card = 'bg-white border border-[#DDE8E4] rounded-[10px] p-4';
  const cardSm = 'bg-white border border-[#DDE8E4] rounded-[10px] p-3';

  return (
    <div
      className="h-full w-full overflow-y-auto"
      style={{ background: '#F7FAF9', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      {/* Context Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F2747', lineHeight: 1.2, margin: 0 }}>
            Dashboard
          </h1>
          <p style={{ fontSize: 13, fontWeight: 400, color: '#64748B', margin: '3px 0 0 0' }}>
            Forecast run: <span style={{ fontFamily: 'monospace', color: '#334155' }}>{selectedRun?.slice(0, 10)} 00Z</span>
            {' · '} Point: <span style={{ fontFamily: 'monospace', color: '#334155' }}>
              {selectedLat ? `${selectedLat.toFixed(2)}°N, ${selectedLon?.toFixed(2)}°E` : '26.25°N, 82.50°E'}
            </span>
          </p>
        </div>
        <button
          onClick={() => onNavigateTab?.('india_map')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#059669', color: 'white',
            height: 38, padding: '0 16px',
            borderRadius: 8, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600,
          }}
        >
          Open Spatial Explorer <ArrowRight style={{ width: 14, height: 14 }} />
        </button>
      </div>

      {/* D1–D10 Trust Strip */}
      <TrustStrip
        selectedLead={selectedLead}
        horizonDay={horizonDayNum}
        breakingDay={breakingDayNum}
        leadBands={leadBands}
        onSelectLead={setSelectedLead}
      />

      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
        {/* P(Bust) */}
        <div className={cardSm} style={{ display: 'flex', flexDirection: 'column', gap: 4, height: 88 }}>
          <span style={{ fontSize: 10.5, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            P(Bust)
          </span>
          <span style={{ fontSize: 30, fontWeight: 700, color: '#EF4444', lineHeight: 1 }}>
            {avgBustRisk}%
          </span>
          <span style={{ fontSize: 11, fontWeight: 400, color: '#94A3B8' }}>
            Retrospective bust risk
          </span>
        </div>

        {/* Reliability Band */}
        <div className={cardSm} style={{ display: 'flex', flexDirection: 'column', gap: 4, height: 88, justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10.5, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Reliability Band
          </span>
          <span
            className="inline-flex items-center gap-1.5"
            style={{
              fontSize: 12, fontWeight: 700, color: bandDisplay.color,
              background: bandDisplay.bg, padding: '4px 10px', borderRadius: 6, width: 'fit-content'
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: bandDisplay.dot, display: 'inline-block' }} />
            {bandDisplay.label} BAND
          </span>
          <span style={{ fontSize: 11, fontWeight: 400, color: '#94A3B8' }}>Diagnostic tier</span>
        </div>

        {/* Trust Index */}
        <div className={cardSm} style={{ display: 'flex', flexDirection: 'column', gap: 4, height: 88 }}>
          <span style={{ fontSize: 10.5, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Trust Index
          </span>
          <span style={{ fontSize: 30, fontWeight: 700, color: '#059669', lineHeight: 1 }}>
            {typeof trustIndex === 'number' ? trustIndex.toFixed(0) : '78'}/100
          </span>
          <span style={{ fontSize: 11, fontWeight: 400, color: '#94A3B8' }}>Prototype diagnostic</span>
        </div>

        {/* Self-Audit Verdict */}
        <div className={cardSm} style={{ display: 'flex', flexDirection: 'column', gap: 4, height: 88, justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10.5, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Self-Audit
          </span>
          <span
            style={{
              fontSize: 10, fontWeight: 700, color: statusBadge.color,
              background: statusBadge.bg, padding: '4px 8px', borderRadius: 6,
              textTransform: 'uppercase', letterSpacing: '0.02em', display: 'block',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
            }}
            title={selfAuditStatus}
          >
            {selfAuditStatus}
          </span>
          <span style={{ fontSize: 11, fontWeight: 400, color: '#94A3B8' }}>Automated verdict</span>
        </div>

        {/* Trust Horizon */}
        <div className={cardSm} style={{ display: 'flex', flexDirection: 'column', gap: 4, height: 88 }}>
          <span style={{ fontSize: 10.5, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Trust Horizon
          </span>
          <span style={{ fontSize: 30, fontWeight: 700, color: '#059669', lineHeight: 1 }}>
            {trustHorizon}
          </span>
          <span style={{ fontSize: 11, fontWeight: 400, color: '#94A3B8' }}>Sequence boundary</span>
        </div>

        {/* Breaking Point */}
        <div
          className={cardSm}
          style={{ display: 'flex', flexDirection: 'column', gap: 4, height: 88, background: '#FEF2F2', borderColor: '#FECACA' }}
        >
          <span style={{ fontSize: 10.5, fontWeight: 600, color: '#B91C1C', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Breaking Point
          </span>
          <span style={{ fontSize: 30, fontWeight: 700, color: '#EF4444', lineHeight: 1 }}>
            {breakingPoint}
          </span>
          <span style={{ fontSize: 11, fontWeight: 400, color: '#94A3B8' }}>First sustained red</span>
        </div>
      </div>

      {/* Main Content Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Diagnostic Summary */}
        <div className={card}>
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle style={{ width: 16, height: 16, color: '#059669' }} />
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F2747', margin: 0 }}>
              Diagnostic Summary
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            {[
              {
                label: 'Bust Risk Signal',
                value: pointDetail ? (pointDetail.baseline_p_bust > 0.5 ? 'Elevated' : 'Moderate') : 'Elevated',
                color: '#B91C1C'
              },
              {
                label: 'Historical Evidence',
                value: '14 Matched Cases',
                color: '#334155'
              },
              {
                label: 'GEFS Ensemble',
                value: pointDetail ? (pointDetail.ensemble_disagreement_score > 0.35 ? 'Moderate Disagreement' : 'Low Disagreement') : 'Moderate Disagreement',
                color: '#B45309'
              },
              {
                label: 'OOD / Novelty',
                value: pointDetail ? (pointDetail.ood_score > 50 ? 'Highly Novel' : 'Typical') : 'Highly Novel',
                color: '#2563EB'
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col justify-between"
                style={{ background: '#F7FAF9', borderRadius: 8, padding: '10px 12px', gap: 4 }}
              >
                <span style={{ fontSize: 11, fontWeight: 500, color: '#64748B' }}>{item.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>

          <div
            style={{
              borderTop: '1px solid #DDE8E4', paddingTop: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
              Automated Verdict:
            </span>
            <span
              style={{
                fontSize: 11, fontWeight: 700, color: statusBadge.color,
                background: statusBadge.bg, padding: '3px 10px', borderRadius: 6,
                textTransform: 'uppercase', letterSpacing: '0.02em'
              }}
            >
              {selfAuditStatus}
            </span>
          </div>
        </div>

        {/* Self-Audit Distribution Donut */}
        <div className={card}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F2747', margin: '0 0 12px 0' }}>
            Self-Audit Status Distribution
          </h3>
          <div className="flex items-center gap-4">
            <div style={{ width: 150, height: 150, position: 'relative', flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={44}
                    outerRadius={66}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => `${val}%`} contentStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div
                className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
              >
                <span style={{ fontSize: 18, fontWeight: 700, color: '#0F2747' }}>323</span>
                <span style={{ fontSize: 9, fontWeight: 600, color: '#64748B' }}>Grid Points</span>
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
              {pieData.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 500, color: '#334155' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
                      {item.name}
                    </span>
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0F2747', flexShrink: 0 }}>
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        {/* Top Vulnerabilities */}
        <div className={card}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F2747', margin: '0 0 12px 0' }}>
            Top Vulnerabilities
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { icon: CloudRain, label: 'Moisture Sensitivity', pct: '42% grid cells', color: '#059669' },
              { icon: Activity,  label: 'Wind Circulation',     pct: '28% grid cells', color: '#059669' },
              { icon: ShieldAlert, label: 'Ensemble Disagreement', pct: '18% grid cells', color: '#059669' },
            ].map(({ icon: Icon, label, pct, color }) => (
              <div
                key={label}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: '#F7FAF9', borderRadius: 8, padding: '8px 12px'
                }}
              >
                <Icon style={{ width: 16, height: 16, color, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{label}</div>
                  <div style={{ fontSize: 11, fontWeight: 400, color: '#64748B' }}>{pct}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Insights */}
        <div className={card}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F2747', margin: '0 0 12px 0' }}>
            Key Insights
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { icon: AlertTriangle, text: 'Rainfall likely to increase after D4 with higher uncertainty from D6 onwards.', color: '#B45309', bg: '#FFFBEB' },
              { icon: AlertTriangle, text: 'High bust risk corridor identified in eastern districts.', color: '#B45309', bg: '#FFFBEB' },
              { icon: CheckCircle2, text: 'Most common vulnerability: Moisture sensitivity.', color: '#047857', bg: '#ECFDF5' },
              { icon: AlertTriangle, text: 'Reliability drops significantly after D5 — use with caution.', color: '#B91C1C', bg: '#FEF2F2' },
            ].map(({ icon: Icon, text, color, bg }, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  background: bg, borderRadius: 8, padding: '8px 10px'
                }}
              >
                <Icon style={{ width: 14, height: 14, color, marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 400, color: '#334155', lineHeight: 1.45 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className={card} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F2747', margin: '0 0 4px 0' }}>
            Quick Actions
          </h3>
          {[
            { label: 'Open Spatial Explorer', icon: ArrowRight, tab: 'india_map', primary: true },
            { label: 'Reliability Analysis',  icon: BarChart3,  tab: 'analytics' },
            { label: 'Run Stress Lab',         icon: Activity,   tab: 'stress_lab' },
            { label: 'Reliability Passport',   icon: FileText,   tab: null },
          ].map(({ label, icon: Icon, tab, primary }) => (
            <button
              key={label}
              onClick={() => tab ? onNavigateTab?.(tab) : onOpenPassport()}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', height: 38, padding: '0 12px',
                background: primary ? '#059669' : 'white',
                color: primary ? 'white' : '#334155',
                border: primary ? 'none' : '1px solid #DDE8E4',
                borderRadius: 8, cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
                transition: 'background 150ms',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = primary ? '#047857' : '#F7FAF9';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = primary ? '#059669' : 'white';
              }}
            >
              <span>{label}</span>
              <Icon style={{ width: 14, height: 14 }} />
            </button>
          ))}
        </div>
      </div>

      {/* Sector Advisory Strip */}
      <div
        className="bg-white border border-[#DDE8E4] rounded-[10px]"
        style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 2px rgba(15,39,71,0.04)' }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>
          Sector Advisory:
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flex: 1, overflow: 'hidden' }}>
          {[
            { icon: Waves, sector: 'Reservoirs', text: 'Normal rule curve through D4; pre-release planning advised from D5.' },
            { icon: Leaf,  sector: 'Agriculture', text: 'Window safe for field operations D1–D3; prepare drainage D5+.' },
            { icon: Zap,   sector: 'Grid', text: 'Solar irradiance stable; anticipate ramping fluctuations D6–D8.' },
          ].map(({ icon: Icon, sector, text }) => (
            <span key={sector} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#334155', flexShrink: 0 }}>
              <Icon style={{ width: 13, height: 13, color: '#059669', flexShrink: 0 }} />
              <strong style={{ fontWeight: 600 }}>{sector}:</strong> {text}
            </span>
          ))}
        </div>
        <button
          onClick={() => onNavigateTab?.('decision_support')}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 12, fontWeight: 600, color: '#059669',
            background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0
          }}
        >
          View Sectors <ArrowRight style={{ width: 12, height: 12 }} />
        </button>
      </div>
    </div>
  );
};
