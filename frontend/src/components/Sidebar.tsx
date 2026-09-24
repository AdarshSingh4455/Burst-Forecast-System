import React from 'react';
import { 
  LayoutDashboard, MapPin, BarChart3, Activity, ShieldAlert, FileSearch, 
  CheckCircle2, FileText, Waves, Sprout, AlertTriangle, Zap, 
  Settings, Info, Cloud, AlertCircle, Clock, ZapOff
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAiAssistant?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navGroups = [
    {
      title: "MAIN",
      items: [
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "india_map", label: "India Map", icon: MapPin },
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
        { id: "trust_horizon", label: "Trust Horizon", icon: Clock },
        { id: "breaking_point", label: "Breaking Point Analysis", icon: ZapOff },
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
        { id: "reservoir", label: "Dam / Reservoir", icon: Waves },
        { id: "agriculture", label: "Agriculture", icon: Sprout },
        { id: "disaster", label: "Disaster Management", icon: AlertTriangle },
        { id: "grid", label: "Renewable Grid", icon: Zap },
      ]
    },
    {
      title: "TOOLS",
      items: [
        { id: "settings", label: "Settings", icon: Settings },
        { id: "about", label: "About", icon: Info },
      ]
    }
  ];

  return (
    <aside className="w-[235px] bg-[#E2F5EC] text-[#044E3A] flex flex-col h-screen border-r border-[#C4EAD6] select-none flex-shrink-0">
      {/* Brand Header - Ultra Light Green */}
      <div className="p-3.5 border-b border-[#C4EAD6] flex items-center gap-3 bg-[#D4F0E2] h-[80px]">
        <div className="bg-[#059669] p-2.5 rounded-xl text-white font-bold shadow-xs flex items-center justify-center flex-shrink-0">
          <Cloud className="w-6 h-6 text-white" />
        </div>
        <div className="overflow-hidden">
          <h1 className="font-extrabold text-[#033A2B] tracking-wide text-sm leading-tight">
            FORTRESS
          </h1>
          <p className="text-[10px] text-[#065F46] font-semibold leading-tight mt-0.5">
            Forecast Reliability
          </p>
          <p className="text-[9px] text-[#047857] leading-tight font-medium">
            Stress-Testing & Self-Audit
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-thin scrollbar-thumb-[#A7F3D0]">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <h2 className="px-3 text-[10px] font-extrabold text-[#047857] uppercase tracking-wider">
              {group.title}
            </h2>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] font-semibold rounded-md transition-all duration-150 relative ${
                    isActive 
                      ? 'bg-[#059669] text-white font-bold shadow-xs' 
                      : 'text-[#044E3A] hover:bg-[#C9EFE0] hover:text-[#022C20]'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1 bottom-1 w-1 bg-[#047857] rounded-r" />
                  )}
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#059669]'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer Badge */}
      <div className="p-3 border-t border-[#C4EAD6] bg-[#D0EFE0] text-[#044E3A] text-[11px] flex items-center gap-2">
        <div className="p-1.5 bg-[#E2F5EC] rounded border border-[#BDEBD3] text-amber-700 flex-shrink-0">
          <AlertCircle className="w-3.5 h-3.5" />
        </div>
        <div className="overflow-hidden">
          <p className="font-mono text-[10px] text-[#033A2B] font-bold">SIH26079 Prototype v1.0</p>
          <p className="text-[9px] text-[#047857] font-medium">Built for a Safer Tomorrow</p>
        </div>
      </div>
    </aside>
  );
};
