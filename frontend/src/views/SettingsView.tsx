import React, { useState, useEffect } from 'react';
import { Settings, Save, Check } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [defaultRegion, setDefaultRegion] = useState(localStorage.getItem('fortress_region') || 'Eastern_UP_Pilot');
  const [defaultRun, setDefaultRun] = useState(localStorage.getItem('fortress_run') || '2019-07-01 00:00:00');
  const [defaultLead, setDefaultLead] = useState(localStorage.getItem('fortress_lead') || '5');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('fortress_region', defaultRegion);
    localStorage.setItem('fortress_run', defaultRun);
    localStorage.setItem('fortress_lead', defaultLead);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="h-full w-full overflow-y-auto p-4 space-y-4 bg-[#F5FAF8] text-[#102A2A] select-none">
      <div className="bg-white border border-[#D2E5DF] rounded-xl p-4 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold text-[#00A878] uppercase tracking-wider">SYSTEM CONFIGURATION</span>
          <h1 className="text-xl font-extrabold text-[#102A2A] mt-0.5 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#00A878]" />
            Settings
          </h1>
          <p className="text-xs text-[#617874] mt-0.5 font-medium">
            Manage local dashboard defaults, region parameters, and map preferences.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="bg-[#00A878] hover:bg-[#005C4B] text-white font-extrabold py-2 px-4 rounded-lg text-xs shadow-xs transition-colors flex items-center gap-2"
        >
          {saved ? <Check className="w-4 h-4 text-white" /> : <Save className="w-4 h-4" />}
          <span>{saved ? 'Saved to LocalStorage!' : 'Save Preferences'}</span>
        </button>
      </div>

      <div className="bg-white border border-[#D2E5DF] rounded-xl p-6 shadow-xs space-y-4 max-w-2xl">
        <h3 className="font-extrabold text-[#102A2A] text-sm uppercase tracking-wider border-b border-[#D2E5DF] pb-2">
          Dashboard Default Preferences
        </h3>

        <div className="space-y-3 text-xs">
          <div>
            <label className="font-extrabold text-[#617874] block mb-1">Default Region</label>
            <select
              value={defaultRegion}
              onChange={(e) => setDefaultRegion(e.target.value)}
              className="w-full bg-[#F5FAF8] border border-[#D2E5DF] rounded-lg p-2 font-bold text-[#102A2A] focus:outline-none focus:border-[#00A878]"
            >
              <option value="Eastern_UP_Pilot">Eastern UP Pilot Region</option>
              <option value="ALL">India Context</option>
            </select>
          </div>

          <div>
            <label className="font-extrabold text-[#617874] block mb-1">Default Forecast Run</label>
            <select
              value={defaultRun}
              onChange={(e) => setDefaultRun(e.target.value)}
              className="w-full bg-[#F5FAF8] border border-[#D2E5DF] rounded-lg p-2 font-mono font-bold text-[#102A2A] focus:outline-none focus:border-[#00A878]"
            >
              <option value="2019-07-01 00:00:00">2019-07-01 00:00:00 (Heavy Monsoon Event)</option>
              <option value="2019-01-01 00:00:00">2019-01-01 00:00:00 (Winter Event)</option>
            </select>
          </div>

          <div>
            <label className="font-extrabold text-[#617874] block mb-1">Default Lead Day</label>
            <select
              value={defaultLead}
              onChange={(e) => setDefaultLead(e.target.value)}
              className="w-full bg-[#F5FAF8] border border-[#D2E5DF] rounded-lg p-2 font-bold text-[#00A878] focus:outline-none focus:border-[#00A878]"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(l => (
                <option key={l} value={l}>Lead Day D{l}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
