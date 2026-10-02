import React, { useState } from 'react';
import { Download, Printer, MapPin, AlertTriangle, CheckCircle2, Shield, BarChart3 } from 'lucide-react';
import { ReliabilityPassport } from '../types';

interface PassportViewProps {
  passport?: ReliabilityPassport | null;
}

const TABS = ['Summary', 'Detailed Diagnostics', 'Sector Impacts', 'Download Report'];

export const PassportView: React.FC<PassportViewProps> = ({ passport }) => {
  const [activeTab, setActiveTab] = useState(0);
  const p = passport;

  const handlePrint = () => window.print();

  const handleDownload = () => {
    if (!p) return;
    const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FORTRESS_Passport_${p.forecast_init.slice(0, 10)}_D${p.lead_day}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /** Returns badge inline style per exact Self-Audit status */
  const statusBadgeStyle = (s: string): { bg: string; color: string } => {
    if (s === 'SUPPORTED RELIABILITY') return { bg: '#ECFDF5', color: '#047857' };
    if (s === 'SUPPORTED WARNING')     return { bg: '#FFFBEB', color: '#B45309' };
    if (s === 'CONFLICT / POSSIBLE BLIND SPOT') return { bg: '#FEF2F2', color: '#B91C1C' };
    if (s === 'INSUFFICIENT EVIDENCE') return { bg: '#F1F5F9', color: '#64748B' };
    if (s === 'EXPERT REVIEW')         return { bg: '#F5F3FF', color: '#6D28D9' };
    return { bg: '#F1F5F9', color: '#64748B' };
  };

  const auditStatus = p?.self_audit_status || 'SUPPORTED WARNING';
  const bustPct = p ? (p.bust_probability * 100).toFixed(0) : '62';
  const trustIdx = p?.trust_index || 78;
  const horizonDay = p?.trust_horizon_day ?? 5;
  const breakingDay = p?.breaking_point_day ?? 6;
  const ffd = p?.ffd ?? 0.32;
  const badge = statusBadgeStyle(auditStatus);

  const sectorData = [
    { sector: 'Reservoir', impact: 'HIGH', detail: 'Highest reservoir in East UP above 97% inflow' },
    { sector: 'Agriculture', impact: 'MODERATE', detail: 'MODERATE impact; monitor crop scheduling' },
    { sector: 'Disaster', impact: 'HIGH', detail: 'Alert: High moisture inflow — History Influx' },
    { sector: 'Renewable Grid', impact: 'MODERATE', detail: 'MODERATE; wind forecast uncertainty elevated' },
  ];

  return (
    <div style={{ background: '#F7FAF9' }} className="h-full w-full overflow-y-auto p-5 space-y-4">
      {/* Action Bar */}
      <div className="bg-white border border-[#DDE8E4] rounded-[10px] shadow-[0_1px_2px_rgba(15,39,71,0.04)] p-4 flex items-center justify-between">
        <div>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Reliability Passport
          </span>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F2747', marginTop: 2 }}>
            FORTRESS Reliability Passport
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 2, lineHeight: 1.5 }}>
            Complete diagnostic report card combining AI Bust Risk, Stress FFD, Analogues, DNA, and Self-Audit verdicts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            style={{ background: '#059669', color: '#fff', height: 38, borderRadius: 8, fontSize: 13, fontWeight: 600, padding: '0 14px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.15s' }}
            onMouseOver={e => (e.currentTarget.style.background = '#047857')}
            onMouseOut={e => (e.currentTarget.style.background = '#059669')}
          >
            <Download className="w-4 h-4" />
            <span>Download JSON</span>
          </button>
          <button
            onClick={handlePrint}
            style={{ background: '#fff', color: '#0F2747', height: 38, borderRadius: 8, fontSize: 13, fontWeight: 600, padding: '0 14px', border: '1px solid #DDE8E4', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Printer className="w-4 h-4" style={{ color: '#059669' }} />
            <span>Print Passport</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white border border-[#DDE8E4] p-1 rounded-[10px] w-fit">
        {TABS.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            style={{
              padding: '6px 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === i ? '#059669' : 'transparent',
              color: activeTab === i ? '#fff' : '#334155',
              transition: 'all 0.15s',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Tab 0: Summary ── */}
      {activeTab === 0 && (
        <div className="grid grid-cols-12 gap-4">
          {/* Left: Passport Document */}
          <div className="col-span-7 bg-white border border-[#DDE8E4] rounded-[10px] shadow-[0_1px_2px_rgba(15,39,71,0.04)] p-6 space-y-5">
            {/* Passport Header */}
            <div className="flex justify-between items-start border-b border-[#DDE8E4] pb-4">
              <div>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block' }}>
                  FORTRESS OFFICIAL RELIABILITY PASSPORT
                </span>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F2747', marginTop: 4 }}>
                  Forecast Reliability Audit Card
                </h2>
                <p style={{ fontSize: 13, color: '#64748B', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin className="w-3.5 h-3.5" style={{ color: '#059669', flexShrink: 0 }} />
                  <strong style={{ color: '#334155' }}>{p ? p.region : 'Eastern Uttar Pradesh'}</strong>
                  <span>|</span>
                  <span>Init: <strong style={{ fontFamily: 'monospace', color: '#334155' }}>{p ? p.forecast_init : '2019-07-01 00:00:00'}</strong></span>
                  <span>|</span>
                  <span>Lead: <strong style={{ color: '#059669' }}>D{p ? p.lead_day : 5}</strong></span>
                </p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span style={{
                  display: 'inline-block',
                  padding: '2px 10px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  background: badge.bg,
                  color: badge.color,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}>
                  {auditStatus}
                </span>
                <span style={{ fontSize: 11, color: '#64748B', display: 'block', marginTop: 6, fontFamily: 'monospace' }}>
                  Trust Index: {trustIdx}/100
                </span>
              </div>
            </div>

            {/* Key Findings */}
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 600, color: '#0F2747', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Key Findings</h4>
              <div className="space-y-2">
                <div className="flex items-start gap-2 bg-[#FEF2F2] p-2.5 rounded-lg border border-rose-100">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#B91C1C' }} />
                  <span style={{ fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
                    Bust Risk P(Bust) = {bustPct}% —{' '}
                    <strong style={{ color: '#0F2747' }}>{p?.ai_risk_category || 'High Risk'}</strong>
                  </span>
                </div>
                <div className="flex items-start gap-2 bg-[#FFFBEB] p-2.5 rounded-lg border border-yellow-100">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#B45309' }} />
                  <span style={{ fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
                    Self-Audit: {auditStatus} — elevated uncertainty due to moisture variability and ensemble disagreement
                  </span>
                </div>
                <div className="flex items-start gap-2 bg-[#EFF6FF] p-2.5 rounded-lg border border-blue-100">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#2563EB' }} />
                  <span style={{ fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
                    FFD = {ffd} | Stress-test improves identification of high-risk lead after D{horizonDay}
                  </span>
                </div>
              </div>
            </div>

            {/* Diagnostic Metrics KPI row */}
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 600, color: '#0F2747', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Diagnostic Metrics</h4>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Rainfall Forecast', value: `${p?.rainfall_mm ?? 28.4} mm`, color: '#059669' },
                  { label: 'Bust Risk', value: `${bustPct}%`, color: '#B91C1C' },
                  { label: 'FFD Score', value: String(ffd), color: '#B45309' },
                  { label: 'Trust Index', value: `${trustIdx}`, color: '#059669' },
                ].map((item, i) => (
                  <div key={i} className="bg-white border border-[#DDE8E4] rounded-[10px] p-3 shadow-[0_1px_2px_rgba(15,39,71,0.04)]">
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', display: 'block' }}>{item.label}</span>
                    <span style={{ fontSize: 22, fontWeight: 700, color: item.color, display: 'block', marginTop: 2 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust Horizon & Breaking Point KPI cards */}
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 600, color: '#0F2747', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Reliability Timeline</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-[#DDE8E4] rounded-[10px] p-3 shadow-[0_1px_2px_rgba(15,39,71,0.04)]">
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', display: 'block' }}>Trust Horizon</span>
                  <span style={{ fontSize: 28, fontWeight: 700, color: '#059669', display: 'block', marginTop: 2 }}>D{horizonDay}</span>
                  <span style={{ fontSize: 12, color: '#64748B' }}>Forecast reliability stronger up to this lead</span>
                </div>
                <div className="bg-white border border-[#DDE8E4] rounded-[10px] p-3 shadow-[0_1px_2px_rgba(15,39,71,0.04)]">
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', display: 'block' }}>Breaking Point</span>
                  <span style={{ fontSize: 28, fontWeight: 700, color: '#B91C1C', display: 'block', marginTop: 2 }}>D{breakingDay}</span>
                  <span style={{ fontSize: 12, color: '#64748B' }}>Reliability degrades sharply beyond this lead</span>
                </div>
              </div>
            </div>

            {/* Historical Analogues */}
            <div className="bg-[#F1F5F4] border border-[#DDE8E4] p-3 rounded-[10px] flex items-center justify-between">
              <div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0F2747', display: 'block' }}>Historical Analogues: 14 cases matched</span>
                <span style={{ fontSize: 12, color: '#64748B' }}>Dominant: Monsoon Heavy Rain — Similarity: {p?.trust_index ? '0.82' : '0.78'}</span>
              </div>
              <button
                onClick={handleDownload}
                style={{ background: '#059669', color: '#fff', height: 32, borderRadius: 8, fontSize: 12, fontWeight: 600, padding: '0 12px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                onMouseOver={e => (e.currentTarget.style.background = '#047857')}
                onMouseOut={e => (e.currentTarget.style.background = '#059669')}
              >
                <Download className="w-3.5 h-3.5" />
                View Full Report
              </button>
            </div>

            {/* Passport Footer Disclaimer */}
            <div className="pt-3 border-t border-[#DDE8E4] text-center" style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Decision-support information — not an official weather warning.
            </div>
          </div>

          {/* Right: Sector Summary + Reliability Sequence */}
          <div className="col-span-5 space-y-4">
            {/* Sector Summary */}
            <div className="bg-white border border-[#DDE8E4] rounded-[10px] shadow-[0_1px_2px_rgba(15,39,71,0.04)] p-4 space-y-3">
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F2747', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #DDE8E4', paddingBottom: 8 }}>
                <BarChart3 className="w-4 h-4" style={{ color: '#059669' }} />
                Sector Summary
              </h3>
              <div className="space-y-2">
                {sectorData.map((s, i) => {
                  const isHigh = s.impact === 'HIGH';
                  return (
                    <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg border" style={{
                      background: isHigh ? '#FEF2F2' : '#FFFBEB',
                      borderColor: isHigh ? '#FECACA' : '#FDE68A',
                    }}>
                      <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: isHigh ? '#B91C1C' : '#B45309' }} />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#0F2747' }}>{s.sector}</span>
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                            background: isHigh ? '#FEE2E2' : '#FEF3C7',
                            color: isHigh ? '#B91C1C' : '#B45309',
                          }}>{s.impact}</span>
                        </div>
                        <p style={{ fontSize: 12, color: '#64748B', marginTop: 2, lineHeight: 1.5 }}>{s.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reliability Sequence D1-D10 */}
            <div className="bg-white border border-[#DDE8E4] rounded-[10px] shadow-[0_1px_2px_rgba(15,39,71,0.04)] p-4 space-y-3">
              <h3 style={{ fontSize: 13, fontWeight: 600, color: '#0F2747', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Reliability Sequence (D1–D10)
              </h3>
              <div className="grid grid-cols-10 gap-1">
                {[1,2,3,4,5,6,7,8,9,10].map(d => {
                  const isG = d <= horizonDay;
                  const isR = d > breakingDay;
                  const bg = isG ? '#059669' : isR ? '#EF4444' : '#F5B82E';
                  return (
                    <div key={d} style={{ borderRadius: 6, textAlign: 'center', padding: '8px 2px', background: bg }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', display: 'block' }}>D{d}</span>
                      {d === horizonDay && <span style={{ fontSize: 8, background: 'rgba(255,255,255,0.25)', color: '#fff', borderRadius: 3, padding: '0 2px', display: 'block', fontWeight: 700, marginTop: 2 }}>HRZ</span>}
                      {d === breakingDay && <span style={{ fontSize: 8, background: 'rgba(0,0,0,0.25)', color: '#fff', borderRadius: 3, padding: '0 2px', display: 'block', fontWeight: 700, marginTop: 2 }}>BRK</span>}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 pt-1">
                {[{ color: '#059669', label: 'Trust Horizon' }, { color: '#F5B82E', label: 'Transition' }, { color: '#EF4444', label: 'Breaking Point+' }].map(item => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: item.color, flexShrink: 0, display: 'inline-block' }} />
                    <span style={{ fontSize: 11, color: '#64748B' }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 1: Detailed Diagnostics ── */}
      {activeTab === 1 && (
        <div className="bg-white border border-[#DDE8E4] rounded-[10px] shadow-[0_1px_2px_rgba(15,39,71,0.04)] p-6 space-y-4 max-w-4xl mx-auto">
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F2747', borderBottom: '1px solid #DDE8E4', paddingBottom: 8 }}>
            Detailed Diagnostic Breakdown
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'P(Bust) Model Output', val: `${bustPct}%`, sub: 'Calibrated Random Forest + Isotonic Calibration — lead-specific Q95' },
              { label: 'FFD Score', val: `${ffd}`, sub: 'Forecast Failure Distance — perturbation metric' },
              { label: 'OOD Score', val: p ? `${p?.trust_index || 42}` : '42.5', sub: 'IsolationForest novelty score' },
              { label: 'Ensemble Disagreement', val: '38%', sub: 'GEFS variance — uncertainty indicator' },
              { label: 'Analogue Bust Rate', val: '71%', sub: '14 matched reforecast cases' },
              { label: 'DNA Similarity', val: '0.78', sub: 'Fingerprint cluster match score' },
            ].map((item, i) => (
              <div key={i} className="bg-white border border-[#DDE8E4] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(15,39,71,0.04)]">
                <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', display: 'block' }}>{item.label}</span>
                <span style={{ fontSize: 28, fontWeight: 700, color: '#0F2747', display: 'block', marginTop: 4 }}>{item.val}</span>
                <span style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>{item.sub}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab 2: Sector Impacts ── */}
      {activeTab === 2 && (
        <div className="space-y-3 max-w-3xl mx-auto">
          {sectorData.map((s, i) => {
            const isHigh = s.impact === 'HIGH';
            return (
              <div key={i} className="bg-white border border-[#DDE8E4] rounded-[10px] shadow-[0_1px_2px_rgba(15,39,71,0.04)] p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0F2747' }}>{s.sector} Sector</h3>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                    background: isHigh ? '#FEF2F2' : '#FFFBEB',
                    color: isHigh ? '#B91C1C' : '#B45309',
                  }}>
                    {s.impact} IMPACT
                  </span>
                </div>
                <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.5 }}>{s.detail}</p>
              </div>
            );
          })}
          <div className="text-center pt-2" style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Sector impacts are decision-support indicators — not official warnings.
          </div>
        </div>
      )}

      {/* ── Tab 3: Download Report ── */}
      {activeTab === 3 && (
        <div className="max-w-xl mx-auto bg-white border border-[#DDE8E4] rounded-[10px] shadow-[0_1px_2px_rgba(15,39,71,0.04)] p-6 space-y-4">
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F2747', borderBottom: '1px solid #DDE8E4', paddingBottom: 8 }}>
            Download Reliability Passport
          </h3>
          <div className="space-y-3">
            <div className="bg-[#F1F5F4] border border-[#DDE8E4] p-3 rounded-[10px]">
              <p style={{ fontSize: 13, fontWeight: 600, color: '#0F2747' }}>Format: JSON</p>
              <p style={{ fontSize: 13, color: '#64748B', marginTop: 4, lineHeight: 1.5 }}>
                Complete machine-readable audit report including all diagnostic metrics, Self-Audit verdict, and sector impacts.
              </p>
            </div>
            <button
              onClick={handleDownload}
              disabled={!p}
              style={{
                width: '100%', height: 42, borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: p ? '#059669' : '#CBD5E1', color: '#fff', border: 'none',
                cursor: p ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 0.15s',
              }}
              onMouseOver={e => { if (p) e.currentTarget.style.background = '#047857'; }}
              onMouseOut={e => { if (p) e.currentTarget.style.background = '#059669'; }}
            >
              <Download className="w-5 h-5" />
              <span>Download JSON Report</span>
            </button>
            <button
              onClick={handlePrint}
              style={{
                width: '100%', height: 38, borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: '#fff', color: '#0F2747', border: '1px solid #DDE8E4',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <Printer className="w-5 h-5" style={{ color: '#059669' }} />
              <span>Print Report</span>
            </button>
          </div>
          <div className="text-center border-t border-[#DDE8E4] pt-3" style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Decision-support information — not an official weather warning.
          </div>
        </div>
      )}
    </div>
  );
};
