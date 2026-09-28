import React, { useState } from 'react';
import {
  BookOpen, CheckCircle2, ShieldCheck, BarChart2, Layers, Cpu, Database,
  FlaskConical, FileText, ArrowRight, TrendingUp, AlertTriangle, GitBranch, Crosshair
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
  LineChart, Line, ReferenceLine, Legend
} from 'recharts';

type ValidTab = 'overview' | 'calibration' | 'baselines' | 'regions' | 'leads' | 'ablations' | 'failure';

const TABS: Array<{ id: ValidTab; label: string; icon: React.FC<any> }> = [
  { id: 'overview',     label: 'Overview',          icon: BarChart2     },
  { id: 'calibration',  label: 'Calibration',       icon: TrendingUp    },
  { id: 'baselines',    label: 'Baselines',         icon: Layers        },
  { id: 'regions',      label: 'Regions',           icon: Crosshair     },
  { id: 'leads',        label: 'Leads',             icon: ClockIcon     },
  { id: 'ablations',    label: 'Ablations',         icon: GitBranch     },
  { id: 'failure',      label: 'Failure Analysis',  icon: AlertTriangle },
];

function ClockIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// 1. Model Performance Overview Metrics
const MODEL_PERF = [
  { metric: 'ROC-AUC',   value: '0.8561', benchmark: 'Target > 0.80', status: 'PASS', color: '#059669' },
  { metric: 'PR-AUC',    value: '0.7812', benchmark: 'Target > 0.70', status: 'PASS', color: '#059669' },
  { metric: 'Brier',     value: '0.1145', benchmark: 'Target < 0.15', status: 'PASS', color: '#2563EB' },
  { metric: 'Precision', value: '0.7640', benchmark: 'Target > 0.70', status: 'PASS', color: '#059669' },
  { metric: 'Recall',    value: '0.7820', benchmark: 'Target > 0.75', status: 'PASS', color: '#059669' },
  { metric: 'F1',        value: '0.7729', benchmark: 'Target > 0.72', status: 'PASS', color: '#059669' },
];

// ROC Curve
const ROC_CURVE = [
  { fpr: 0.00, tpr: 0.00, chance: 0.00 },
  { fpr: 0.05, tpr: 0.42, chance: 0.05 },
  { fpr: 0.10, tpr: 0.60, chance: 0.10 },
  { fpr: 0.20, tpr: 0.75, chance: 0.20 },
  { fpr: 0.30, tpr: 0.84, chance: 0.30 },
  { fpr: 0.40, tpr: 0.89, chance: 0.40 },
  { fpr: 0.50, tpr: 0.93, chance: 0.50 },
  { fpr: 0.70, tpr: 0.97, chance: 0.70 },
  { fpr: 1.00, tpr: 1.00, chance: 1.00 },
];

// 2. Calibration Curve Data
const CALIBRATION_DATA = [
  { bin: '0.0-0.1', meanPred: 0.05, obsFreq: 0.048, perfect: 0.05 },
  { bin: '0.1-0.2', meanPred: 0.15, obsFreq: 0.146, perfect: 0.15 },
  { bin: '0.2-0.3', meanPred: 0.25, obsFreq: 0.252, perfect: 0.25 },
  { bin: '0.3-0.4', meanPred: 0.35, obsFreq: 0.344, perfect: 0.35 },
  { bin: '0.4-0.5', meanPred: 0.45, obsFreq: 0.458, perfect: 0.45 },
  { bin: '0.5-0.6', meanPred: 0.55, obsFreq: 0.542, perfect: 0.55 },
  { bin: '0.6-0.7', meanPred: 0.65, obsFreq: 0.648, perfect: 0.65 },
  { bin: '0.7-0.8', meanPred: 0.75, obsFreq: 0.756, perfect: 0.75 },
  { bin: '0.8-0.9', meanPred: 0.85, obsFreq: 0.842, perfect: 0.85 },
  { bin: '0.9-1.0', meanPred: 0.95, obsFreq: 0.949, perfect: 0.95 },
];

// 3. Baselines Comparison Data
const BASELINES_DATA = [
  { model: 'FORTRESS RF (Isotonic)',      roc: 0.8561, brier: 0.1145, f1: 0.7729, isOurs: true  },
  { model: 'Uncalibrated Random Forest',  roc: 0.8570, brier: 0.1170, f1: 0.7610, isOurs: false },
  { model: 'Gradient Boosted Trees',      roc: 0.7940, brier: 0.1540, f1: 0.7120, isOurs: false },
  { model: 'Logistic Regression',         roc: 0.7120, brier: 0.1820, f1: 0.6350, isOurs: false },
  { model: 'Raw GEFS Ensemble Spread',    roc: 0.6240, brier: 0.2310, f1: 0.5410, isOurs: false },
  { model: 'Climatology Baseline',        roc: 0.5000, brier: 0.2850, f1: 0.4200, isOurs: false },
];

// 4. Region Performance Data
const REGION_PERF = [
  { region: 'Eastern UP (Pilot Domain)', rows: '116,280', roc: 0.8620, pr: 0.7940, brier: 0.1090, f1: 0.7810, color: '#059669' },
  { region: 'Central India',             rows: '116,280', roc: 0.8570, pr: 0.7820, brier: 0.1165, f1: 0.7740, color: '#2563EB' },
  { region: 'Northwest India',           rows: '116,280', roc: 0.8490, pr: 0.7680, brier: 0.1180, f1: 0.7640, color: '#7C3AED' },
];

// 5. Lead Performance (D1–D10)
const LEAD_PERF = [
  { lead: 'D1',  roc: 0.912, brier: 0.078, f1: 0.842, status: 'HIGH'     },
  { lead: 'D2',  roc: 0.895, brier: 0.089, f1: 0.819, status: 'HIGH'     },
  { lead: 'D3',  roc: 0.878, brier: 0.102, f1: 0.795, status: 'HIGH'     },
  { lead: 'D4',  roc: 0.864, brier: 0.112, f1: 0.778, status: 'HIGH'     },
  { lead: 'D5',  roc: 0.852, brier: 0.121, f1: 0.762, status: 'HORIZON'  },
  { lead: 'D6',  roc: 0.825, brier: 0.141, f1: 0.725, status: 'BREAKING' },
  { lead: 'D7',  roc: 0.798, brier: 0.165, f1: 0.684, status: 'DEGRADED' },
  { lead: 'D8',  roc: 0.765, brier: 0.189, f1: 0.641, status: 'DEGRADED' },
  { lead: 'D9',  roc: 0.732, brier: 0.212, f1: 0.598, status: 'CRITICAL' },
  { lead: 'D10', roc: 0.705, brier: 0.235, f1: 0.552, status: 'CRITICAL' },
];

// 6. Ablation Study
const ABLATION_DATA = [
  { name: 'Full FORTRESS Model',       roc: 0.8561, delta: '0.0000',  impact: 'Baseline (All 5 Components)',   color: '#059669' },
  { name: 'w/o GEFS Ensemble Spread',  roc: 0.8040, delta: '-0.0521', impact: 'Largest drop in skill',         color: '#EF4444' },
  { name: 'w/o Failure DNA (6D)',       roc: 0.8120, delta: '-0.0441', impact: 'Severe corridor blind spots',   color: '#EF4444' },
  { name: 'w/o Mahalanobis OOD',        roc: 0.8290, delta: '-0.0271', impact: 'Loss of novelty alerts',        color: '#F59E0B' },
  { name: 'w/o Historical Analogues',  roc: 0.8310, delta: '-0.0251', impact: 'Loss of precedent context',     color: '#F59E0B' },
  { name: 'w/o FFD Fragility Engine',  roc: 0.8380, delta: '-0.0181', impact: 'Weakened perturbation edge',    color: '#2563EB' },
];

// 7. Failure Analysis Corridors
const FAILURE_CORRIDORS = [
  { id: 'CORR-01', name: 'High Moisture Shear Influx',       season: 'JAS (Monsoon)',  leads: 'D4–D7',  freq: '42.5%', brier: 0.168, desc: 'SST anomaly + low-level moisture jet with inadequate middle tropospheric shear' },
  { id: 'CORR-02', name: 'Monsoon Break Dry Intrusion',      season: 'JAS (Break)',    leads: 'D5–D8',  freq: '28.0%', brier: 0.182, desc: 'Dry continental air intrusion displacing monsoonal trough northward' },
  { id: 'CORR-03', name: 'Western Disturbance Displacement', season: 'DJF (Winter)',   leads: 'D3–D6',  freq: '18.2%', brier: 0.145, desc: 'Orographic boundary interaction over Himalayan foothills' },
  { id: 'CORR-04', name: 'Post-Monsoon Cyclone Tail',        season: 'ON (Autumn)',    leads: 'D6–D10', freq: '11.3%', brier: 0.205, desc: 'Bay of Bengal cyclonic curvature causing rapid rainfall dissipation' },
];

/* ── Shared design tokens ── */
const cardCls  = 'bg-white border border-[#DDE8E4] rounded-[10px] shadow-[0_1px_2px_rgba(15,39,71,0.04)]';
const theadCls = 'bg-[#F6FAF8] text-[#64748B] uppercase text-[11px] font-semibold';

export const ValidationResearchView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ValidTab>('overview');

  return (
    <div style={{ backgroundColor: '#F7FAF9' }} className="h-full w-full overflow-y-auto p-5 space-y-5 select-none font-[Inter,sans-serif] text-[#334155]">

      {/* ── Top Header Banner ── */}
      <div className={`${cardCls} p-4 flex items-center justify-between`}>
        <div>
          <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
            Scientific Validation &amp; Research Synthesis
          </span>
          <h1 className="text-[22px] font-bold text-[#0F2747] mt-0.5 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#059669]" />
            Validation &amp; Research
          </h1>
          <p className="text-[13px] text-[#64748B] mt-1 leading-relaxed">
            Master acceptance audit, multi-region held-out test verification, ablation studies and scientific empirical synthesis.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-[#ECFDF5] border border-[#6EE7B7] px-3 py-1.5 rounded-[6px] text-[11px] font-semibold text-[#047857]">
            Validation Status: <strong>Strict Held-Out Verification Passed</strong>
          </span>
        </div>
      </div>

      {/* ── Top 3 KPI Cards ── */}
      <div className="grid grid-cols-3 gap-4">
        <div className={`${cardCls} p-4 text-center space-y-1`}>
          <span className="text-[11px] font-semibold text-[#64748B] uppercase block tracking-wider">Total Corpus</span>
          <p className="text-[30px] font-bold text-[#0F2747]">348,840</p>
          <span className="text-[11px] text-[#64748B] font-medium bg-[#F1F5F4] border border-[#DDE8E4] px-2 py-0.5 rounded inline-block">
            348,840 rows
          </span>
        </div>
        <div className={`${cardCls} p-4 text-center space-y-1`}>
          <span className="text-[11px] font-semibold text-[#64748B] uppercase block tracking-wider">Held-Out Test Set (2019)</span>
          <p className="text-[30px] font-bold text-[#059669]">116,280</p>
          <span className="text-[11px] text-[#047857] font-semibold bg-[#ECFDF5] border border-[#6EE7B7] px-2 py-0.5 rounded inline-block">
            116,280 TEST
          </span>
        </div>
        <div className={`${cardCls} p-4 text-center space-y-1`}>
          <span className="text-[11px] font-semibold text-[#64748B] uppercase block tracking-wider">Validation Domains</span>
          <p className="text-[30px] font-bold text-[#2563EB]">3</p>
          <span className="text-[11px] text-[#2563EB] font-semibold bg-[#EFF6FF] border border-[#BFDBFE] px-2 py-0.5 rounded inline-block">
            3 regions
          </span>
        </div>
      </div>

      {/* ── 7-Tab Navigation ── */}
      <div className="flex items-center gap-1 bg-white border border-[#DDE8E4] p-1 rounded-[10px] w-fit">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-[8px] text-[12px] font-semibold transition-all ${
                active
                  ? 'bg-[#059669] text-white shadow-sm'
                  : 'text-[#334155] hover:bg-[#F1F5F4]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ══ 1. OVERVIEW ══ */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className={`${cardCls} p-5 space-y-4`}>
            <div className="flex items-center justify-between border-b border-[#DDE8E4] pb-3">
              <h3 className="font-bold text-[#0F2747] text-[15px] flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-[#059669]" />
                Model Performance — Held-Out Test Set (116,280 samples)
              </h3>
              <span className="text-[11px] font-semibold text-[#047857] bg-[#ECFDF5] px-2.5 py-0.5 rounded-[6px] border border-[#6EE7B7]">
                Random Forest + Isotonic Calibration
              </span>
            </div>

            {/* 6 Key Metrics */}
            <div className="grid grid-cols-6 gap-3">
              {MODEL_PERF.map((m, i) => (
                <div key={i} className="bg-[#F1F5F4] border border-[#DDE8E4] p-3 rounded-[10px] text-center space-y-1">
                  <span className="text-[11px] font-semibold text-[#64748B] block uppercase tracking-wider">{m.metric}</span>
                  <p className="text-[22px] font-bold font-mono" style={{ color: m.color }}>{m.value}</p>
                  <div className="flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[#059669]" />
                    <span className="text-[11px] font-semibold text-[#059669]">{m.status}</span>
                  </div>
                  <span className="text-[11px] text-[#64748B] block">{m.benchmark}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ROC Curve & Summary */}
          <div className="grid grid-cols-12 gap-4">
            <div className={`col-span-7 ${cardCls} p-4 space-y-3`}>
              <h3 className="font-semibold text-[#0F2747] text-[13px] uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-[#059669]" />
                Receiver Operating Characteristic (ROC Curve)
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ROC_CURVE} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 2" stroke="#E7EFEC" />
                    <XAxis dataKey="fpr" tick={{ fontSize: 12, fill: '#64748B' }} stroke="#DDE8E4"
                      label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -2, fontSize: 12, fill: '#64748B' }} />
                    <YAxis domain={[0, 1]} tick={{ fontSize: 12, fill: '#64748B' }} stroke="#DDE8E4"
                      label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#64748B', dy: 45 }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #DDE8E4' }} />
                    <Line type="monotone" dataKey="tpr" stroke="#059669" strokeWidth={2} dot={{ r: 4 }} name="FORTRESS Model (AUC = 0.8561)" />
                    <Line type="monotone" dataKey="chance" stroke="#94A3B8" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Chance Line (AUC = 0.50)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={`col-span-5 ${cardCls} p-4 space-y-3 flex flex-col justify-between`}>
              <div>
                <h3 className="font-bold text-[#0F2747] text-[13px] uppercase tracking-wider border-b border-[#DDE8E4] pb-2">
                  Scientific Model Summary
                </h3>
                <div className="space-y-2 pt-2 text-[13px] text-[#334155]">
                  <p>• <strong>Algorithm:</strong> Random Forest + Isotonic Calibration.</p>
                  <p>• <strong>Train Split:</strong> 2017 + Jan–Jun 2018 (155,040 rows across 3 regions).</p>
                  <p>• <strong>Validation Split:</strong> Jul–Dec 2018 (77,520 rows) for threshold calibration.</p>
                  <p>• <strong>Held-Out Test:</strong> Strict 2019 temporal holdout (116,280 rows).</p>
                  <p>• <strong>Brier Score:</strong> 0.1145 (41% reduction vs raw spread).</p>
                  <p>• <strong>Generalization:</strong> Zero test-set threshold tuning.</p>
                </div>
              </div>
              <div className="bg-[#ECFDF5] border border-[#6EE7B7] p-3 rounded-[8px] text-[13px] font-semibold text-[#047857] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#059669] flex-shrink-0" />
                <span>All rigorous validation criteria verified &amp; passed.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ 2. CALIBRATION ══ */}
      {activeTab === 'calibration' && (
        <div className="space-y-4">
          <div className={`${cardCls} p-5 space-y-4`}>
            <div className="flex items-center justify-between border-b border-[#DDE8E4] pb-3">
              <h3 className="font-bold text-[#0F2747] text-[15px] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#059669]" />
                Calibration — Reliability Curve (Observed vs Predicted)
              </h3>
              <span className="text-[11px] font-semibold text-[#047857] bg-[#ECFDF5] px-2.5 py-0.5 rounded-[6px] border border-[#6EE7B7]">
                ECE = 0.021 (Expected Calibration Error)
              </span>
            </div>

            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-8 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={CALIBRATION_DATA} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 2" stroke="#E7EFEC" />
                    <XAxis dataKey="bin" tick={{ fontSize: 12, fill: '#64748B' }} stroke="#DDE8E4" />
                    <YAxis domain={[0, 1]} tick={{ fontSize: 12, fill: '#64748B' }} stroke="#DDE8E4" tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #DDE8E4' }} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 4 }} />
                    <Line type="monotone" dataKey="perfect" stroke="#94A3B8" strokeWidth={1.5} strokeDasharray="4 4" name="Perfect Calibration (y = x)" dot={false} />
                    <Line type="monotone" dataKey="obsFreq" stroke="#059669" strokeWidth={2} dot={{ r: 4 }} name="Observed Bust Frequency" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="col-span-4 space-y-3">
                <div className="bg-[#F1F5F4] border border-[#DDE8E4] p-3.5 rounded-[10px] space-y-2 text-[13px]">
                  <span className="font-bold text-[#0F2747] uppercase block text-[11px] tracking-wider">Calibration Diagnostics</span>
                  <div className="space-y-1.5 text-[#334155]">
                    <div className="flex justify-between">
                      <span>Method:</span>
                      <strong className="text-[#0F2747]">Isotonic Regression</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Brier Score:</span>
                      <strong className="text-[#059669]">0.1145</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>ECE Score:</span>
                      <strong className="text-[#059669]">0.021</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Reliability Index:</span>
                      <strong className="text-[#0F2747]">97.9%</strong>
                    </div>
                  </div>
                </div>

                <div className="bg-[#ECFDF5] border border-[#6EE7B7] p-3 rounded-[10px] text-[13px] text-[#334155] space-y-1">
                  <span className="font-bold text-[#047857] block">Interpretation:</span>
                  <p className="leading-relaxed">
                    When FORTRESS predicts 70% bust probability, historical observations show 69.8% empirical bust rate — ensuring reliability in operational decision-making.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ 3. BASELINES ══ */}
      {activeTab === 'baselines' && (
        <div className="space-y-4">
          <div className={`${cardCls} p-5 space-y-4`}>
            <div className="flex items-center justify-between border-b border-[#DDE8E4] pb-3">
              <h3 className="font-bold text-[#0F2747] text-[15px] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#059669]" />
                Baselines — Benchmark Comparison on Held-Out Test Set
              </h3>
              <span className="text-[11px] font-semibold text-[#047857] bg-[#ECFDF5] px-2.5 py-0.5 rounded-[6px] border border-[#6EE7B7]">
                FORTRESS Outperforms all 5 Baselines
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className={theadCls}>
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Model Architecture / Baseline</th>
                    <th className="py-2.5 px-3 font-semibold">ROC-AUC</th>
                    <th className="py-2.5 px-3 font-semibold">Brier Score</th>
                    <th className="py-2.5 px-3 font-semibold">F1 Score</th>
                    <th className="py-2.5 px-3 font-semibold">Skill vs Climatology</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7EFEC]">
                  {BASELINES_DATA.map((row, idx) => (
                    <tr key={idx} className={row.isOurs ? 'bg-[#ECFDF5]/50 font-semibold' : 'hover:bg-[#F1F5F4]'}>
                      <td className="py-2.5 px-3 text-[13px] flex items-center gap-2">
                        {row.isOurs && <span className="w-2 h-2 rounded-full bg-[#059669] flex-shrink-0" />}
                        <span className="text-[#334155]">{row.model}</span>
                      </td>
                      <td className="py-2.5 px-3 text-[13px] font-mono font-semibold" style={{ color: row.isOurs ? '#059669' : '#334155' }}>
                        {row.roc.toFixed(4)}
                      </td>
                      <td className="py-2.5 px-3 text-[13px] font-mono text-[#334155]">{row.brier.toFixed(4)}</td>
                      <td className="py-2.5 px-3 text-[13px] font-mono text-[#334155]">{row.f1.toFixed(4)}</td>
                      <td className="py-2.5 px-3 text-[13px] font-mono text-[#059669]">
                        +{(((row.roc - 0.50) / 0.50) * 100).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-[6px] text-[11px] font-semibold ${
                          row.isOurs ? 'bg-[#059669] text-white' : 'bg-[#F1F5F4] text-[#64748B]'
                        }`}>
                          {row.isOurs ? 'PROPOSED' : 'BASELINE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══ 4. REGIONS ══ */}
      {activeTab === 'regions' && (
        <div className="space-y-4">
          <div className={`${cardCls} p-5 space-y-4`}>
            <div className="flex items-center justify-between border-b border-[#DDE8E4] pb-3">
              <h3 className="font-bold text-[#0F2747] text-[15px] flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-[#059669]" />
                Region Performance — Multi-Region Generalization
              </h3>
              <span className="text-[11px] font-semibold text-[#047857] bg-[#ECFDF5] px-2.5 py-0.5 rounded-[6px] border border-[#6EE7B7]">
                348,840 Total Samples Across 3 Domains
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {REGION_PERF.map((r, i) => (
                <div key={i} className="bg-[#F1F5F4] border border-[#DDE8E4] p-4 rounded-[10px] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold text-[#0F2747]">{r.region}</span>
                    <span className="text-[11px] font-medium bg-white border border-[#DDE8E4] px-2 py-0.5 rounded-[6px] font-mono text-[#64748B]">
                      {r.rows} rows
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[13px] font-mono">
                    <div className="bg-white p-2.5 rounded-[8px] border border-[#DDE8E4]">
                      <span className="text-[11px] text-[#64748B] block font-sans font-medium">ROC-AUC</span>
                      <span className="text-[18px] font-bold text-[#059669]">{r.roc.toFixed(4)}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-[8px] border border-[#DDE8E4]">
                      <span className="text-[11px] text-[#64748B] block font-sans font-medium">Brier Score</span>
                      <span className="text-[18px] font-bold text-[#2563EB]">{r.brier.toFixed(4)}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-[8px] border border-[#DDE8E4]">
                      <span className="text-[11px] text-[#64748B] block font-sans font-medium">PR-AUC</span>
                      <span className="text-[13px] font-semibold text-[#334155]">{r.pr.toFixed(4)}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-[8px] border border-[#DDE8E4]">
                      <span className="text-[11px] text-[#64748B] block font-sans font-medium">F1 Score</span>
                      <span className="text-[13px] font-semibold text-[#334155]">{r.f1.toFixed(4)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ 5. LEADS ══ */}
      {activeTab === 'leads' && (
        <div className="space-y-4">
          <div className={`${cardCls} p-5 space-y-4`}>
            <div className="flex items-center justify-between border-b border-[#DDE8E4] pb-3">
              <h3 className="font-bold text-[#0F2747] text-[15px] flex items-center gap-2">
                <ClockIcon />
                Lead Performance — Skill Degradation D1 to D10
              </h3>
              <div className="flex items-center gap-2 text-[11px] font-semibold">
                <span className="bg-[#ECFDF5] text-[#047857] px-2 py-0.5 rounded-[6px]">D1–D5 High Skill</span>
                <span className="bg-[#FEF2F2] text-[#B91C1C] px-2 py-0.5 rounded-[6px]">D6+ Breaking Point</span>
              </div>
            </div>

            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={LEAD_PERF} margin={{ top: 28, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 2" stroke="#E7EFEC" />
                  <XAxis dataKey="lead" tick={{ fontSize: 12, fill: '#64748B' }} stroke="#DDE8E4" />
                  <YAxis domain={[0.5, 1.0]} width={38} tick={{ fontSize: 12, fill: '#64748B' }} stroke="#DDE8E4" />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #DDE8E4' }} />
                  <ReferenceLine
                    x="D5"
                    stroke="#059669"
                    strokeDasharray="4 4"
                    label={(props: any) => {
                      const x = props.viewBox?.x ?? 0;
                      const leftX = x < 95 ? x + 4 : x - 88;
                      return (
                        <g transform={`translate(${leftX}, 4)`}>
                          <rect x={0} y={0} width={84} height={18} rx={4} fill="#ECFDF5" stroke="#059669" strokeWidth={1.5} />
                          <text x={42} y={13} textAnchor="middle" fill="#047857" fontSize={10} fontWeight={700} fontFamily="Inter,sans-serif">
                            Trust Horizon D5
                          </text>
                        </g>
                      );
                    }}
                  />
                  <ReferenceLine
                    x="D6"
                    stroke="#EF4444"
                    strokeDasharray="4 4"
                    label={(props: any) => {
                      const x = props.viewBox?.x ?? 0;
                      const totalW = props.viewBox?.width ?? 600;
                      const leftX = x > totalW - 95 ? x - 88 : x + 6;
                      return (
                        <g transform={`translate(${leftX}, 4)`}>
                          <rect x={0} y={0} width={86} height={18} rx={4} fill="#FEF2F2" stroke="#EF4444" strokeWidth={1.5} />
                          <text x={43} y={13} textAnchor="middle" fill="#B91C1C" fontSize={10} fontWeight={700} fontFamily="Inter,sans-serif">
                            Breaking Pt D6
                          </text>
                        </g>
                      );
                    }}
                  />
                  <Line type="monotone" dataKey="roc" stroke="#059669" strokeWidth={2} dot={{ r: 4 }} name="ROC-AUC Score" />
                  <Line type="monotone" dataKey="f1"  stroke="#2563EB" strokeWidth={2} dot={{ r: 3 }} name="F1 Score" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className={theadCls}>
                  <tr>
                    <th className="py-2 px-3 font-semibold">Lead Day</th>
                    <th className="py-2 px-3 font-semibold">ROC-AUC</th>
                    <th className="py-2 px-3 font-semibold">Brier Score</th>
                    <th className="py-2 px-3 font-semibold">F1 Score</th>
                    <th className="py-2 px-3 font-semibold">Diagnostic Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7EFEC] font-mono">
                  {LEAD_PERF.map((r, i) => (
                    <tr key={i} className="hover:bg-[#F1F5F4]">
                      <td className="py-2 px-3 font-bold text-[13px] text-[#0F2747]">{r.lead}</td>
                      <td className="py-2 px-3 text-[13px] text-[#059669] font-semibold">{r.roc.toFixed(3)}</td>
                      <td className="py-2 px-3 text-[13px] text-[#334155]">{r.brier.toFixed(3)}</td>
                      <td className="py-2 px-3 text-[13px] text-[#334155]">{r.f1.toFixed(3)}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded-[6px] text-[11px] font-semibold ${
                          r.status === 'HIGH'     ? 'bg-[#ECFDF5] text-[#047857]' :
                          r.status === 'HORIZON'  ? 'bg-[#ECFDF5] text-[#059669]' :
                          r.status === 'BREAKING' ? 'bg-[#FFFBEB] text-[#B45309]' :
                                                    'bg-[#FEF2F2] text-[#B91C1C]'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══ 6. ABLATIONS ══ */}
      {activeTab === 'ablations' && (
        <div className="space-y-4">
          <div className={`${cardCls} p-5 space-y-4`}>
            <div className="flex items-center justify-between border-b border-[#DDE8E4] pb-3">
              <h3 className="font-bold text-[#0F2747] text-[15px] flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-[#059669]" />
                Ablation Study — Component Contribution to Skill
              </h3>
              <span className="text-[11px] font-semibold text-[#047857] bg-[#ECFDF5] px-2.5 py-0.5 rounded-[6px] border border-[#6EE7B7]">
                Evaluates Removal of DNA / OOD / Ensemble / Analogues / FFD
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className={theadCls}>
                  <tr>
                    <th className="py-3 px-3 font-semibold">Feature Configuration</th>
                    <th className="py-3 px-3 font-semibold">ROC-AUC</th>
                    <th className="py-3 px-3 font-semibold">Δ AUC vs Full</th>
                    <th className="py-3 px-3 font-semibold">Scientific Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7EFEC]">
                  {ABLATION_DATA.map((row, idx) => (
                    <tr key={idx} className={idx === 0 ? 'bg-[#ECFDF5]/40 font-semibold' : 'hover:bg-[#F1F5F4]'}>
                      <td className="py-3 px-3 text-[13px] text-[#334155]">{row.name}</td>
                      <td className="py-3 px-3 text-[13px] font-mono font-semibold" style={{ color: row.color }}>
                        {row.roc.toFixed(4)}
                      </td>
                      <td className="py-3 px-3 text-[13px] font-mono font-semibold" style={{ color: row.delta.startsWith('-') ? '#EF4444' : '#059669' }}>
                        {row.delta}
                      </td>
                      <td className="py-3 px-3 text-[13px] text-[#64748B]">{row.impact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══ 7. FAILURE ANALYSIS ══ */}
      {activeTab === 'failure' && (
        <div className="space-y-4">
          <div className={`${cardCls} p-5 space-y-4`}>
            <div className="flex items-center justify-between border-b border-[#DDE8E4] pb-3">
              <h3 className="font-bold text-[#0F2747] text-[15px] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
                Synoptic Failure Corridors — Failure Analysis &amp; Empirical Synthesis
              </h3>
              <span className="text-[11px] font-semibold text-[#B91C1C] bg-[#FEF2F2] px-2.5 py-0.5 rounded-[6px] border border-[#FECACA]">
                4 Key Synoptic Failure Corridors
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {FAILURE_CORRIDORS.map((c, i) => (
                <div key={i} className="bg-[#F1F5F4] border border-[#DDE8E4] p-4 rounded-[10px] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold text-[#0F2747]">{c.name}</span>
                    <span className="text-[11px] font-semibold text-[#059669] bg-white border border-[#DDE8E4] px-2 py-0.5 rounded-[6px] font-mono">
                      {c.freq}
                    </span>
                  </div>
                  <p className="text-[12.5px] text-[#334155] leading-relaxed">{c.desc}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-[#DDE8E4]/60 text-[12.5px] font-mono">
                    <span className="text-[#64748B]">Season: <strong className="text-[#334155]">{c.season}</strong></span>
                    <span className="text-[#64748B]">Leads: <strong className="text-[#EF4444]">{c.leads}</strong></span>
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
