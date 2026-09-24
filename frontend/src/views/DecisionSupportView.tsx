import React, { useState } from 'react';
import { Waves, Sprout, AlertTriangle, Zap, Info } from 'lucide-react';

export const DecisionSupportView: React.FC = () => {
  const [activeSector, setActiveSector] = useState<'dam' | 'agri' | 'disaster' | 'grid'>('dam');

  return (
    <div className="h-full w-full overflow-y-auto p-4 space-y-4 bg-[#EEF9F4] text-[#033A2B] select-none">
      {/* Top Ultra Light Green Banner Header */}
      <div className="bg-[#F4FAF6] border border-[#C8EAD9] rounded-xl p-4 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold text-[#059669] uppercase tracking-wider">DECISION SUPPORT SYSTEM (PHASE 9 SHELL)</span>
          <h1 className="text-xl font-extrabold text-[#044E3A] mt-0.5 tracking-tight">Sector-Specific Decision Support</h1>
          <p className="text-xs text-[#065F46] mt-0.5 font-medium">
            Reliability context translation for water resource management, agriculture, disaster mitigation, and renewable power grids.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-900">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>Phase 9 Shell</span>
        </div>
      </div>

      {/* Sector Tabs */}
      <div className="flex border-b border-[#C8EAD9] bg-white rounded-t-xl p-1 gap-1 text-xs font-bold">
        <button
          onClick={() => setActiveSector('dam')}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${activeSector === 'dam' ? 'bg-[#059669] text-white' : 'text-[#065F46] hover:bg-[#EEF9F4]'}`}
        >
          <Waves className="w-4 h-4" />
          <span>Dam / Reservoir</span>
        </button>
        <button
          onClick={() => setActiveSector('agri')}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${activeSector === 'agri' ? 'bg-[#059669] text-white' : 'text-[#065F46] hover:bg-[#EEF9F4]'}`}
        >
          <Sprout className="w-4 h-4" />
          <span>Agriculture</span>
        </button>
        <button
          onClick={() => setActiveSector('disaster')}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${activeSector === 'disaster' ? 'bg-[#059669] text-white' : 'text-[#065F46] hover:bg-[#EEF9F4]'}`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Disaster Management</span>
        </button>
        <button
          onClick={() => setActiveSector('grid')}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${activeSector === 'grid' ? 'bg-[#059669] text-white' : 'text-[#065F46] hover:bg-[#EEF9F4]'}`}
        >
          <Zap className="w-4 h-4" />
          <span>Renewable Grid</span>
        </button>
      </div>

      {/* Sector Content Card */}
      <div className="bg-white border border-[#C8EAD9] rounded-b-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#C8EAD9] pb-3">
          <h3 className="font-extrabold text-[#044E3A] text-base capitalize flex items-center gap-2">
            {activeSector === 'dam' && <Waves className="w-5 h-5 text-blue-500" />}
            {activeSector === 'agri' && <Sprout className="w-5 h-5 text-emerald-500" />}
            {activeSector === 'disaster' && <AlertTriangle className="w-5 h-5 text-rose-500" />}
            {activeSector === 'grid' && <Zap className="w-5 h-5 text-amber-500" />}
            <span>
              {activeSector === 'dam' ? 'Dam / Reservoir Release Management' : 
               activeSector === 'agri' ? 'Agriculture Crop Vulnerability & Sowing Operations' : 
               activeSector === 'disaster' ? 'Disaster Mitigation & Flood Evacuation Readiness' : 
               'Renewable Energy Grid Dispatch & Backup Allocation'}
            </span>
          </h3>

          <span className="text-xs bg-amber-100 text-amber-900 font-extrabold px-2.5 py-1 rounded-md border border-amber-200">
            Phase 9 Pending
          </span>
        </div>

        {/* Prototype Disclaimer Box */}
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-950 space-y-2">
          <p className="font-extrabold text-amber-900 text-sm">
            Phase 9 domain-specific model not implemented.
          </p>
          <p className="text-amber-800 leading-relaxed">
            The decision recommendation engine for <strong>{activeSector === 'dam' ? 'Dam / Reservoir Inflow Release' : activeSector === 'agri' ? 'Agriculture Vulnerability' : activeSector === 'disaster' ? 'Disaster Mitigation Response' : 'Renewable Grid Dispatch'}</strong> requires Phase 9 sector models. In Phase 8, reliability metadata (Bust Probability, FFD, Trust Horizon) is provided for decision support overlay only.
          </p>
        </div>
      </div>
    </div>
  );
};
