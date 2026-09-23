import React from 'react';
import { 
  LayoutDashboard, MapPin, BarChart3, Activity, ShieldAlert, FileSearch, 
  CheckCircle2, FileText, Waves, Sprout, AlertTriangle, Zap, 
  Bot, Settings, Info, Shield
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navGroups = [
    {
      title: "MAIN",
      items: [
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "analytics", label: "Forecast Analytics", icon: BarChart3 },
      ]
    },
    {
      title: "ANALYSIS",
      items: [
        { id: "stress_lab", label: "Stress Lab", icon: Activity },
        { id: "failure_intel", label: "Failure Intelligence", icon: ShieldAlert },
        { id: "evidence", label: "Independent Evidence", icon: FileSearch },
        { id: "self_audit", label: "Self-Audit", icon: CheckCircle2 },
      ]
    },
    {
      title: "REPORTS",
      items: [
        { id: "passport", label: "Reliability Passport", icon: FileText },
      ]
    },
    {
      title: "DECISION SUPPORT",
      items: [
        { id: "decision_support", label: "Decision Support Shell", icon: Waves },
      ]
    },
    {
      title: "TOOLS",
      items: [
        { id: "ai_assistant", label: "AI Assistant (P10)", icon: Bot },
        { id: "settings", label: "Settings", icon: Settings },
        { id: "about", label: "About", icon: Info },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen border-r border-slate-800 select-none flex-shrink-0">
      <div className="p-4 border-b border-slate-800 flex items-center gap-3">
        <div className="bg-emerald-600 p-2 rounded-lg text-white font-bold shadow-lg flex items-center justify-center">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-white tracking-wide text-lg">FORTRESS</h1>
          <p className="text-xs text-emerald-400 font-medium">Forecast Self-Audit System</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <h2 className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {group.title}
            </h2>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-emerald-600 text-white shadow-md' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-950 text-xs text-slate-500">
        <p className="font-semibold text-slate-400">NCMRWF / MoES</p>
        <p>SIH26079 Phase 8 Dashboard</p>
      </div>
    </aside>
  );
};
