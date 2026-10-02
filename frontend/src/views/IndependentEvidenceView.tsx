import React, { useState } from 'react';
import { FileSearch, ShieldCheck, Database, TrendingDown, Activity, History, Dna, BarChart2, Compass } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, ReferenceLine, Legend } from 'recharts';
import { AnalogueResponse, FailureDNAResponse, GridPointDetail } from '../types';

interface IndependentEvidenceViewProps {
  analogues: AnalogueResponse | null;
  dna: FailureDNAResponse | null;
  pointDetail: GridPointDetail | null;
}

const TABS = ['Observational Evidence', 'Analogues'];

// Static analogue cases from science artifacts
const analogueCases = [
  { year: 2011, type: 'Monsoon Heavy Rain', similarity: 0.82, bustRate: 0.71, error: '6.71', key: 'JAS' },
  { year: 2013, type: 'Monsoon Day',        similarity: 0.74, bustRate: 0.58, error: '4.33', key: 'JAS' },
  { year: 2015, type: 'Monsoon Day',        similarity: 0.68, bustRate: 0.52, error: '3.88', key: 'JAS' },
  { year: 2016, type: 'Monsoon Break',      similarity: 0.64, bustRate: 0.44, error: '2.11', key: 'JAS' },
];

// Historical error distribution data (prototype)
const errorDistData = [
  { bin: '-20', count: 18 },
  { bin: '-15', count: 34 },
  { bin: '-10', count: 62 },
  { bin: '-5',  count: 88 },
  { bin: '0',   count: 112 },
  { bin: '5',   count: 95 },
  { bin: '10',  count: 71 },
  { bin: '15',  count: 42 },
  { bin: '20',  count: 28 },
];

// Forecast vs observed line chart
const forecastObsData = [
  { name: 'D1', Observed: 28, GEFSMean: 26, EnsembleSpread: 5  },
  { name: 'D2', Observed: 32, GEFSMean: 35, EnsembleSpread: 8  },
  { name: 'D3', Observed: 45, GEFSMean: 38, EnsembleSpread: 12 },
  { name: 'D4', Observed: 42, GEFSMean: 52, EnsembleSpread: 18 },
  { name: 'D5', Observed: 38, GEFSMean: 61, EnsembleSpread: 24 },
];

export const IndependentEvidenceView: React.FC<IndependentEvidenceViewProps> = ({ analogues, dna, pointDetail }) => {
  const [activeTab, setActiveTab] = useState(0);
  const analogueCount    = analogues?.analogue_count ?? 14;
  const analogueBustRate = analogues ? (analogues.analogue_mean_bust_rate * 100).toFixed(0) : '71';
  const dnaMaxSim        = dna?.max_similarity ?? 0.78;
  const ensembleVar      = pointDetail ? (pointDetail.ensemble_disagreement_score * 100).toFixed(0) : '38';
  const oodScore         = pointDetail ? pointDetail.ood_score.toFixed(1) : '42.5';

  return (
    <div className="h-full w-full overflow-y-auto p-5 space-y-4" style={{ backgroundColor: '#F7FAF9', color: '#334155' }}>

      {/* Top Banner */}
      <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE8E4', borderRadius: 10, boxShadow: '0 1px 2px rgba(15,39,71,0.04)', padding: '16px 20px' }}
           className="flex items-center justify-between">
        <div>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            INDEPENDENT EVIDENCE ANALYSIS
          </span>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F2747', marginTop: 2 }} className="flex items-center gap-2">
            <FileSearch className="w-5 h-5" style={{ color: '#059669' }} />
            Independent Evidence Analysis
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
            Reforecast analogue search &amp; historical bust rate verification for ({pointDetail ? `${pointDetail.latitude.toFixed(2)}°N, ${pointDetail.longitude.toFixed(2)}°E` : 'Selected Grid Point'}).
          </p>
        </div>
        <div style={{ backgroundColor: '#F1F5F4', border: '1px solid #DDE8E4', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#0F2747' }}>
          DNA Similarity: <strong>{dnaMaxSim}</strong>
        </div>
      </div>

      {/* Tab Navigation */}
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

      {activeTab === 0 && (
        <>
          {/* 4 Evidence Cards — EXACTLY: Historical Analogues, Failure DNA, GEFS Ensemble Disagreement, OOD / Novelty */}
          <div className="grid grid-cols-4 gap-3">
            {/* Card 1: Historical Analogues */}
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE8E4', borderRadius: 10, boxShadow: '0 1px 2px rgba(15,39,71,0.04)', padding: '16px 16px 14px' }}>
              <div className="flex items-center gap-2 mb-2">
                <History className="w-4 h-4" style={{ color: '#059669' }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0F2747' }}>Historical Analogues</span>
              </div>
              <p style={{ fontSize: 26, fontWeight: 700, color: '#059669', lineHeight: 1.1 }}>{analogueCount}</p>
              <p style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>Cases matched from reforecast archive</p>
            </div>

            {/* Card 2: Failure DNA */}
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE8E4', borderRadius: 10, boxShadow: '0 1px 2px rgba(15,39,71,0.04)', padding: '16px 16px 14px' }}>
              <div className="flex items-center gap-2 mb-2">
                <Dna className="w-4 h-4" style={{ color: '#2563EB' }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0F2747' }}>Failure DNA</span>
              </div>
              <p style={{ fontSize: 26, fontWeight: 700, color: '#2563EB', lineHeight: 1.1 }}>{dnaMaxSim}</p>
              <p style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>Max similarity index to known failure patterns</p>
            </div>

            {/* Card 3: GEFS Ensemble Disagreement */}
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE8E4', borderRadius: 10, boxShadow: '0 1px 2px rgba(15,39,71,0.04)', padding: '16px 16px 14px' }}>
              <div className="flex items-center gap-2 mb-2">
                <BarChart2 className="w-4 h-4" style={{ color: '#F59E0B' }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0F2747' }}>GEFS Ensemble Disagreement</span>
              </div>
              <p style={{ fontSize: 26, fontWeight: 700, color: '#B45309', lineHeight: 1.1 }}>{ensembleVar}%</p>
              <p style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>Member spread across forecast window</p>
            </div>

            {/* Card 4: OOD / Novelty */}
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE8E4', borderRadius: 10, boxShadow: '0 1px 2px rgba(15,39,71,0.04)', padding: '16px 16px 14px' }}>
              <div className="flex items-center gap-2 mb-2">
                <Compass className="w-4 h-4" style={{ color: '#7C3AED' }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0F2747' }}>OOD / Novelty</span>
              </div>
              <p style={{ fontSize: 26, fontWeight: 700, color: '#7C3AED', lineHeight: 1.1 }}>{oodScore}</p>
              <p style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>Out-of-distribution distance from training manifold</p>
            </div>
          </div>

          {/* Two Column: Forecast vs Observed + Historical Error Distribution */}
          <div className="grid grid-cols-12 gap-4">
            {/* Forecast vs Observed Chart */}
            <div className="col-span-7 space-y-3" style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE8E4', borderRadius: 10, boxShadow: '0 1px 2px rgba(15,39,71,0.04)', padding: 16 }}>
              <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid #DDE8E4' }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F2747' }} className="flex items-center gap-2">
                  <Activity className="w-4 h-4" style={{ color: '#059669' }} />
                  Forecast vs Observed (D1–D10)
                </h3>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#B45309', backgroundColor: '#FFFBEB', padding: '2px 8px', borderRadius: 6, border: '1px solid #FDE68A', textTransform: 'uppercase' }}>
                  Prototype — Held-out Test Data
                </span>
              </div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={forecastObsData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 2" stroke="#E7EFEC" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} stroke="#DDE8E4" />
                    <YAxis tick={{ fontSize: 12, fill: '#64748B' }} stroke="#DDE8E4" />
                    <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', color: '#334155', borderRadius: 8, fontSize: 12, border: '1px solid #DDE8E4' }} />
                    <Legend wrapperStyle={{ fontSize: 12, color: '#64748B' }} />
                    <Line type="monotone" dataKey="Observed"       stroke="#059669" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="GEFSMean"       stroke="#2563EB" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="EnsembleSpread" stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Historical Error Distribution */}
            <div className="col-span-5 space-y-3" style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE8E4', borderRadius: 10, boxShadow: '0 1px 2px rgba(15,39,71,0.04)', padding: 16 }}>
              <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid #DDE8E4' }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F2747' }} className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" style={{ color: '#059669' }} />
                  Historical Error Distribution
                </h3>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#047857', backgroundColor: '#ECFDF5', padding: '2px 8px', borderRadius: 6 }}>Current: 12%</span>
              </div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={errorDistData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 2" stroke="#E7EFEC" />
                    <XAxis dataKey="bin" tick={{ fontSize: 12, fill: '#64748B' }} stroke="#DDE8E4" />
                    <YAxis tick={{ fontSize: 12, fill: '#64748B' }} stroke="#DDE8E4" />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #DDE8E4' }} />
                    <Bar dataKey="count" fill="#059669" radius={[3, 3, 0, 0]} />
                    <ReferenceLine x="5" stroke="#EF4444" strokeDasharray="4 4" strokeWidth={2} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Evidence Detail Cards Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Failure DNA detail */}
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE8E4', borderRadius: 10, boxShadow: '0 1px 2px rgba(15,39,71,0.04)', padding: 16 }} className="space-y-3">
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F2747' }} className="flex items-center gap-2">
                <Database className="w-4 h-4" style={{ color: '#2563EB' }} />
                Failure DNA
              </h3>
              <div className="space-y-2 rounded-lg p-3" style={{ backgroundColor: '#F7FAF9', border: '1px solid #DDE8E4', fontSize: 13 }}>
                <div className="flex justify-between" style={{ fontWeight: 500, color: '#334155' }}>
                  <span>Max Similarity Index</span>
                  <span style={{ color: '#2563EB', fontFamily: 'monospace', fontWeight: 700 }}>{dnaMaxSim}</span>
                </div>
                <div className="flex justify-between" style={{ fontWeight: 500, color: '#334155' }}>
                  <span>Dominant Pattern</span>
                  <span style={{ color: '#0F2747', fontWeight: 600 }}>Monsoon Heavy Rain</span>
                </div>
                <p style={{ fontSize: 12, color: '#64748B', paddingTop: 6, borderTop: '1px solid #DDE8E4' }}>
                  Supporting historical-pattern evidence only. DNA match does not guarantee bust.
                </p>
              </div>
            </div>

            {/* GEFS & OOD Summary */}
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE8E4', borderRadius: 10, boxShadow: '0 1px 2px rgba(15,39,71,0.04)', padding: 16 }} className="space-y-3">
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F2747' }} className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" style={{ color: '#059669' }} />
                GEFS &amp; OOD Summary
              </h3>
              <div className="space-y-2 rounded-lg p-3" style={{ backgroundColor: '#F7FAF9', border: '1px solid #DDE8E4', fontSize: 13 }}>
                <div className="flex justify-between" style={{ fontWeight: 500, color: '#334155' }}>
                  <span>Ensemble Variance</span>
                  <span style={{ color: '#B45309', fontFamily: 'monospace', fontWeight: 700 }}>{ensembleVar}%</span>
                </div>
                <div className="flex justify-between" style={{ fontWeight: 500, color: '#334155' }}>
                  <span>OOD / Novelty Distance</span>
                  <span style={{ color: '#7C3AED', fontFamily: 'monospace', fontWeight: 700 }}>{oodScore}</span>
                </div>
                <p style={{ fontSize: 12, color: '#64748B', paddingTop: 6, borderTop: '1px solid #DDE8E4' }}>
                  Ensemble disagreement &amp; novelty are uncertainty indicators, not bust predictions.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 1 && (
        <>
          {/* Top Analogue Cases Table */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE8E4', borderRadius: 10, boxShadow: '0 1px 2px rgba(15,39,71,0.04)', overflow: 'hidden' }}>
            <div className="p-3 flex items-center justify-between" style={{ borderBottom: '1px solid #DDE8E4', backgroundColor: '#F6FAF8' }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: '#0F2747', textTransform: 'uppercase', letterSpacing: '0.06em' }} className="flex items-center gap-2">
                <Database className="w-4 h-4" style={{ color: '#059669' }} />
                Top Analogue Cases
              </h3>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#047857', backgroundColor: '#ECFDF5', padding: '2px 8px', borderRadius: 6 }}>
                {analogueCount} total matched
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr style={{ backgroundColor: '#F6FAF8' }}>
                    {['Year', 'Event Type', 'Similarity', 'Error (mm)', 'Key Season', 'Match Quality'].map((h) => (
                      <th key={h} style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {analogueCases.map((c, i) => (
                    <tr key={i} style={{ height: 36, backgroundColor: i % 2 === 1 ? '#F7FAF9' : '#FFFFFF', borderTop: '1px solid #DDE8E4' }}>
                      <td style={{ padding: '0 12px', fontSize: 13, fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>{c.year}</td>
                      <td style={{ padding: '0 12px', fontSize: 13, color: '#334155' }}>{c.type}</td>
                      <td style={{ padding: '0 12px', fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: '#059669' }}>{c.similarity}</td>
                      <td style={{ padding: '0 12px', fontSize: 13, fontFamily: 'monospace', color: '#334155' }}>{c.error}</td>
                      <td style={{ padding: '0 12px' }}>
                        <span style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{c.key}</span>
                      </td>
                      <td style={{ padding: '0 12px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          backgroundColor: c.similarity > 0.75 ? '#ECFDF5' : c.similarity > 0.6 ? '#FFFBEB' : '#FEF2F2',
                          color:           c.similarity > 0.75 ? '#047857' : c.similarity > 0.6 ? '#B45309' : '#B91C1C',
                        }}>
                          {c.similarity > 0.75 ? 'Strong' : c.similarity > 0.6 ? 'Moderate' : 'Weak'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: '#92400E', fontWeight: 500 }}>
            ⚠ Analogues are identified via atmospheric similarity scoring from GEFSv12 reforecasts. Historical match does not constitute a bust prediction. Analogue evidence is one of five independent evidence components in FORTRESS Self-Audit.
          </div>
        </>
      )}
    </div>
  );
};
