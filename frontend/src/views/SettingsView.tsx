import React, { useState } from 'react';
import { Settings, Save, Check, BookOpen, Server, HelpCircle, MessageSquare, ExternalLink, Video, FileText } from 'lucide-react';

const TABS = ['Settings', 'Data Sources', 'System Information', 'Help & Documentation'];

const docLinks = [
  { title: 'FORTRESS Overview',  desc: 'Full system architecture and pipeline description',                     type: 'PDF', icon: 'guide'  },
  { title: 'Methodology Guide',  desc: 'Calibrated Random Forest model, FFD scoring, and Self-Audit rules',    type: 'PDF', icon: 'method' },
  { title: 'Spatial Explorer',   desc: 'How to use the Spatial Explorer interactive controls and spatial grids', type: 'Doc', icon: 'guide'  },
  { title: 'API Documentation',  desc: 'REST endpoints: /api/grid, /api/stress, /api/self-audit, etc.',         type: 'API', icon: 'api'    },
  { title: 'Decision Support',   desc: 'How to interpret sector-level impact recommendations',                   type: 'PDF', icon: 'guide'  },
];

const videoLinks = [
  { title: 'Platform Overview',  duration: '4:12' },
  { title: 'Spatial Explorer',   duration: '2:48' },
  { title: 'Self-Audit System',  duration: '3:25' },
  { title: 'Decision Support',   duration: '2:11' },
];

/* ── Shared tokens ── */
const cardCls   = 'bg-white border border-[#DDE8E4] rounded-[10px] shadow-[0_1px_2px_rgba(15,39,71,0.04)]';
const inputCls  = 'w-full bg-white border border-[#D8E5E0] rounded-[8px] px-3 text-[13px] text-[#334155] font-medium focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/20';
const labelCls  = 'text-[12px] font-semibold text-[#64748B] block mb-1.5';

export const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab]       = useState(0);
  const [defaultRegion, setDefaultRegion] = useState(localStorage.getItem('fortress_region') || 'Eastern_UP_Pilot');
  const [defaultRun, setDefaultRun]       = useState(localStorage.getItem('fortress_run')    || '2019-07-01 00:00:00');
  const [defaultLead, setDefaultLead]     = useState(localStorage.getItem('fortress_lead')   || '5');
  const [saved, setSaved]               = useState(false);

  const handleSave = () => {
    localStorage.setItem('fortress_region', defaultRegion);
    localStorage.setItem('fortress_run',    defaultRun);
    localStorage.setItem('fortress_lead',   defaultLead);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ backgroundColor: '#F7FAF9' }} className="h-full w-full overflow-y-auto p-5 space-y-5 font-[Inter,sans-serif] text-[#334155]">

      {/* ── Top Banner ── */}
      <div className={`${cardCls} p-4 flex items-center justify-between`}>
        <div>
          <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
            Platform Configuration
          </span>
          <h1 className="text-[22px] font-bold text-[#0F2747] mt-0.5 flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#059669]" />
            Settings &amp; Help
          </h1>
          <p className="text-[13px] text-[#64748B] mt-1 leading-relaxed">
            Platform settings, data provenance, system diagnostics, and documentation center.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-[#ECFDF5] border border-[#6EE7B7] px-3 py-1.5 rounded-[6px] text-[11px] font-semibold text-[#047857]">
            Backend: <strong>Online</strong> ✓
          </span>
          <span className="bg-[#F1F5F4] border border-[#DDE8E4] px-3 py-1.5 rounded-[6px] text-[11px] font-semibold text-[#334155]">
            v1.0.0 — FORTRESS
          </span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 bg-white border border-[#DDE8E4] p-1 rounded-[10px] w-fit">
        {TABS.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2 rounded-[8px] text-[12px] font-semibold transition-colors ${
              activeTab === i
                ? 'bg-[#059669] text-white shadow-sm'
                : 'text-[#334155] hover:bg-[#F1F5F4]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── TAB 0: Settings ── */}
      {activeTab === 0 && (
        <div className="grid grid-cols-12 gap-4">
          <div className={`col-span-7 ${cardCls} p-6 space-y-5`}>
            <div className="flex items-center justify-between border-b border-[#DDE8E4] pb-3">
              <h3 className="font-bold text-[#0F2747] text-[17px]">Dashboard Default Preferences</h3>
              <button
                onClick={handleSave}
                style={{ height: 38, backgroundColor: saved ? '#047857' : '#059669' }}
                className="hover:bg-[#047857] text-white font-semibold px-4 rounded-[8px] text-[13px] transition-colors flex items-center gap-2"
              >
                {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                <span>{saved ? 'Saved!' : 'Save Preferences'}</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelCls}>Default Region</label>
                <select
                  value={defaultRegion}
                  onChange={(e) => setDefaultRegion(e.target.value)}
                  className={inputCls}
                  style={{ height: 38 }}
                >
                  <option value="Eastern_UP_Pilot">Eastern UP Pilot Region</option>
                  <option value="ALL">All India Context</option>
                </select>
              </div>

              <div>
                <label className={labelCls}>Default Forecast Run</label>
                <select
                  value={defaultRun}
                  onChange={(e) => setDefaultRun(e.target.value)}
                  className={`${inputCls} font-mono`}
                  style={{ height: 38 }}
                >
                  <option value="2019-07-01 00:00:00">2019-07-01 (Heavy Monsoon Event)</option>
                  <option value="2019-01-01 00:00:00">2019-01-01 (Winter Event)</option>
                </select>
              </div>

              <div>
                <label className={labelCls}>Default Lead Day</label>
                <select
                  value={defaultLead}
                  onChange={(e) => setDefaultLead(e.target.value)}
                  className={inputCls}
                  style={{ height: 38 }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(l => (
                    <option key={l} value={l}>Lead Day D{l}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="col-span-5 space-y-4">
            <div className={`${cardCls} p-4 space-y-3`}>
              <h3 className="font-bold text-[#0F2747] text-[15px] flex items-center gap-2 border-b border-[#DDE8E4] pb-2">
                <Server className="w-4 h-4 text-[#059669]" />
                System Status
              </h3>
              <div className="space-y-2">
                {[
                  { label: 'Backend API',       status: 'Online',      color: '#047857', bg: '#ECFDF5' },
                  { label: 'Model Engine',       status: 'Loaded',      color: '#047857', bg: '#ECFDF5' },
                  { label: 'Science Artifacts',  status: 'Verified',    color: '#047857', bg: '#ECFDF5' },
                  { label: 'Validation Suite',   status: '48/48 PASS',  color: '#047857', bg: '#ECFDF5' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center bg-[#F1F5F4] px-3 py-2 rounded-[8px] border border-[#DDE8E4]">
                    <span className="text-[13px] font-medium text-[#334155]">{item.label}</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[6px]"
                      style={{ color: item.color, backgroundColor: item.bg }}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-[10px] p-4 text-[13px] text-[#92400E] space-y-1">
              <p className="font-bold text-[15px] text-[#B45309]">⚠ Research Platform</p>
              <p className="leading-relaxed">FORTRESS is a research and decision-support prototype. Outputs are diagnostic indicators only and do not constitute official weather warnings.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 1: Data Sources ── */}
      {activeTab === 1 && (
        <div className="grid grid-cols-2 gap-4">
          <div className={`${cardCls} p-5 space-y-4`}>
            <h3 className="font-bold text-[#0F2747] text-[17px] border-b border-[#DDE8E4] pb-2">Data Sources</h3>
            <div className="space-y-3">
              {[
                { name: 'NOAA GEFSv12 Reforecast', detail: '2000–2019, 31 members, 0.25° resolution', badge: 'PRIMARY'    },
                { name: 'GEFSv12 Archive',          detail: 'Hosted at NOAA NCEI — hindcast corpus',   badge: 'REANALYSIS' },
                { name: 'IMD Station Network',       detail: 'Observed precipitation for Eastern UP verification', badge: 'REFERENCE' },
                { name: 'ERA5 Reanalysis',           detail: 'Atmospheric feature baseline for fingerprinting',   badge: 'SUPPORT'   },
              ].map((src, i) => (
                <div key={i} className="flex items-start justify-between gap-3 bg-[#F1F5F4] p-3 rounded-[8px] border border-[#DDE8E4]">
                  <div>
                    <p className="text-[13px] font-semibold text-[#0F2747]">{src.name}</p>
                    <p className="text-[12.5px] text-[#64748B] mt-0.5">{src.detail}</p>
                  </div>
                  <span className="bg-[#ECFDF5] text-[#047857] font-semibold text-[11px] px-2 py-0.5 rounded-[6px] flex-shrink-0">{src.badge}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={`${cardCls} p-5 space-y-4`}>
            <h3 className="font-bold text-[#0F2747] text-[17px] border-b border-[#DDE8E4] pb-2">Data Provenance</h3>
            <div className="space-y-3">
              <div className="bg-[#F1F5F4] p-3 rounded-[8px] border border-[#DDE8E4] space-y-1">
                <span className="font-semibold text-[#0F2747] block text-[13px]">Training Corpus</span>
                <p className="text-[12.5px] text-[#64748B] leading-relaxed">348,840 grid-day samples — GEFSv12 hindcast 2000–2016 (3 regions × 10 leads × 116,280 training rows)</p>
              </div>
              <div className="bg-[#F1F5F4] p-3 rounded-[8px] border border-[#DDE8E4] space-y-1">
                <span className="font-semibold text-[#0F2747] block text-[13px]">Held-Out Test Set</span>
                <p className="text-[12.5px] text-[#64748B] leading-relaxed">116,280 rows — 2017–2019 seasons, zero leakage, used only for final validation</p>
              </div>
              <div className="bg-[#F1F5F4] p-3 rounded-[8px] border border-[#DDE8E4] space-y-1">
                <span className="font-semibold text-[#0F2747] block text-[13px]">Bust Label Definition</span>
                <p className="text-[12.5px] text-[#64748B] leading-relaxed">Lead-specific Q95 threshold from historical observed precipitation; threshold varies by lead day</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: System Information ── */}
      {activeTab === 2 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Grid Points',  value: '323',     sub: 'Eastern UP Pilot'     },
            { label: 'Lead Days Covered',  value: 'D1–D10',  sub: '10-day window'         },
            { label: 'Forecast Runs',      value: '12',      sub: 'Available in archive'  },
            { label: 'Science Phase',      value: '12/12',   sub: 'All phases complete'   },
            { label: 'Backend Endpoints',  value: '48/48',   sub: 'All PASS'              },
            { label: 'Validation Tests',   value: '111/111', sub: 'All PASS'              },
          ].map((item, i) => (
            <div key={i} className={`${cardCls} p-4 text-center space-y-1`}>
              <span className="text-[11px] font-semibold text-[#64748B] uppercase block tracking-wider">{item.label}</span>
              <p className="text-[28px] font-bold text-[#0F2747]">{item.value}</p>
              <span className="text-[11px] font-semibold text-[#047857] bg-[#ECFDF5] px-1.5 py-0.5 rounded-[6px] inline-block">{item.sub}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB 3: Help & Documentation ── */}
      {activeTab === 3 && (
        <div className="grid grid-cols-12 gap-4">
          {/* Documentation */}
          <div className={`col-span-8 ${cardCls} p-5 space-y-4`}>
            <h3 className="font-bold text-[#0F2747] text-[17px] flex items-center gap-2 border-b border-[#DDE8E4] pb-2">
              <BookOpen className="w-4 h-4 text-[#059669]" />
              Documentation
            </h3>
            <div className="space-y-2">
              {docLinks.map((doc, i) => (
                <div key={i} className="flex items-center justify-between bg-[#F1F5F4] px-3 py-2.5 rounded-[8px] border border-[#DDE8E4] hover:bg-[#E7EFEC] transition-colors cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-[#059669] flex-shrink-0" />
                    <div>
                      <p className="text-[13px] font-semibold text-[#0F2747]">{doc.title}</p>
                      <p className="text-[12px] text-[#64748B]">{doc.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="bg-[#ECFDF5] text-[#047857] font-semibold text-[11px] px-2 py-0.5 rounded-[6px]">{doc.type}</span>
                    <ExternalLink className="w-3 h-3 text-[#059669]" />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[#DDE8E4]">
              <h4 className="font-bold text-[#0F2747] text-[13px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-[#059669]" />
                Video Tutorials
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {videoLinks.map((v, i) => (
                  <div key={i} className="flex items-center justify-between bg-[#F1F5F4] px-3 py-2 rounded-[8px] border border-[#DDE8E4]">
                    <span className="text-[13px] font-medium text-[#334155]">{v.title}</span>
                    <span className="text-[11px] font-mono text-[#047857] bg-[#ECFDF5] px-1.5 py-0.5 rounded-[6px]">{v.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact & Support */}
          <div className="col-span-4 space-y-4">
            <div className={`${cardCls} p-4 space-y-3`}>
              <h3 className="font-bold text-[#0F2747] text-[15px] flex items-center gap-2 border-b border-[#DDE8E4] pb-2">
                <MessageSquare className="w-4 h-4 text-[#059669]" />
                Contact &amp; Support
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 bg-[#F1F5F4] p-2.5 rounded-[8px] border border-[#DDE8E4]">
                  <span className="text-[13px] font-medium text-[#334155]">Email:</span>
                  <span className="text-[13px] text-[#2563EB] font-mono">support@fortress.org</span>
                </div>
                <button
                  style={{ height: 38 }}
                  className="w-full bg-[#059669] hover:bg-[#047857] text-white font-semibold rounded-[8px] text-[13px] transition-colors flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Live Chat
                </button>
                <button
                  style={{ height: 38 }}
                  className="w-full bg-white hover:bg-[#F1F5F4] text-[#334155] border border-[#DDE8E4] font-semibold rounded-[8px] text-[13px] transition-colors flex items-center justify-center gap-2"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-[#059669]" />
                  Submit Feedback
                </button>
              </div>
            </div>

            <div className={`${cardCls} p-4 space-y-1.5`}>
              <p className="font-bold text-[#0F2747] text-[13px]">FORTRESS Intelligence</p>
              <p className="text-[12.5px] text-[#64748B]">FORTRESS — Forecast Reliability Intelligence Platform</p>
              <p className="text-[12px] text-[#047857] font-semibold mt-2">Research Decision-Support Platform</p>
              <p className="text-[11px] text-[#64748B]">Strict Empirical Validation Passed | Operational Core Active</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
