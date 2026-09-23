import React from 'react';
import { ShieldCheck, Info, Layers, CheckCircle2, Award } from 'lucide-react';

export const AboutView: React.FC = () => {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">FORTRESS</h1>
            <p className="text-sm text-emerald-400 font-semibold">
              Forecast Reliability Stress-Testing & Self-Audit System
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed border-t border-slate-800 pt-4">
          SIH26079 — AI-Based Forecast Bust Detection for Medium-Range Weather Forecasts.
          FORTRESS provides an automated stress-testing, self-auditing, and failure intelligence framework for NWP forecast outputs (GEFS/NCUM), detecting high-consequence forecast busts before they reach operational disaster management workflows.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Architecture & Pipeline Overview</span>
          </h2>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span><strong>Phase 1:</strong> GEFS Feature Processing Pipeline (323 Eastern UP Grid Points)</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span><strong>Phase 2 & 3:</strong> Historical ERA5 Verification & LightGBM Bust Risk AI</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span><strong>Phase 4:</strong> Forecast Stress Lab & Finite-Difference Fragility (FFD)</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span><strong>Phase 5:</strong> Failure Intelligence & K-Means Physical Corridors</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span><strong>Phase 6:</strong> Independent Evidence Verification Streams (Analogues, DNA, Novelty)</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span><strong>Phase 7:</strong> Rule-based Self-Audit, Trust Horizon & Breaking Point Identification</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span><strong>Phase 8:</strong> FastAPI Backend, React Master Dashboard & Reliability Passport Export</span>
            </li>
          </ul>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Pilot Dataset Verification</span>
          </h2>
          <div className="space-y-2 text-xs font-mono text-slate-400 bg-slate-950 p-4 rounded border border-slate-800">
            <div className="flex justify-between border-b border-slate-800 pb-1">
              <span>Domain:</span>
              <span className="text-slate-200">Eastern UP Pilot (26.0–28.0°N, 81.0–84.0°E)</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-1">
              <span>Grid Points:</span>
              <span className="text-slate-200">323 points (0.25° resolution)</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-1">
              <span>Forecast Cycles:</span>
              <span className="text-slate-200">12 runs (2019-07-01 to 2019-07-12)</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-1">
              <span>Total Sequence Cases:</span>
              <span className="text-slate-200">38,760 rows (101 columns)</span>
            </div>
            <div className="flex justify-between pb-1">
              <span>Verified Bust Events:</span>
              <span className="text-red-400 font-bold">1,940 events (5.00%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
