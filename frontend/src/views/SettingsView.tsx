import React from 'react';
import { Sliders, Database, Server, Cpu } from 'lucide-react';

export const SettingsView: React.FC = () => {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
            <Sliders className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">System Settings & Calibration</h1>
            <p className="text-sm text-slate-400">
              Configure telemetry thresholds, backend endpoints, and evaluation parameters
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
            <Server className="w-4 h-4 text-emerald-400" />
            <span>Backend Connection</span>
          </h2>
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">FastAPI Endpoint URL</label>
              <input
                type="text"
                readOnly
                value="http://127.0.0.1:8000/api"
                className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded px-3 py-2 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Status</label>
              <div className="flex items-center space-x-2 text-emerald-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Active (Connected)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <span>Data Sources</span>
          </h2>
          <div className="space-y-2 text-xs font-mono text-slate-400">
            <div className="flex justify-between border-b border-slate-800/60 pb-1">
              <span>Primary Parquet:</span>
              <span className="text-slate-200">FORTRESS_SELF_AUDIT.parquet</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/60 pb-1">
              <span>Trust Horizon:</span>
              <span className="text-slate-200">FORTRESS_TRUST_HORIZON.parquet</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/60 pb-1">
              <span>ML Model:</span>
              <span className="text-slate-200">fortress_bust_model.pkl</span>
            </div>
            <div className="flex justify-between pb-1">
              <span>Pilot Domain:</span>
              <span className="text-slate-200">Eastern UP (323 points)</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 md:col-span-2">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span>Operational Threshold Calibration</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-950 p-3 rounded border border-slate-800">
              <span className="text-slate-400 block mb-1">Bust Probability Flag Cutoff</span>
              <span className="text-lg font-bold text-red-400 font-mono">0.65</span>
            </div>
            <div className="bg-slate-950 p-3 rounded border border-slate-800">
              <span className="text-slate-400 block mb-1">FFD Wind Stress Level</span>
              <span className="text-lg font-bold text-amber-400 font-mono">8.0 m/s</span>
            </div>
            <div className="bg-slate-950 p-3 rounded border border-slate-800">
              <span className="text-slate-400 block mb-1">Self-Audit Min Trust Index</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">70 / 100</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
