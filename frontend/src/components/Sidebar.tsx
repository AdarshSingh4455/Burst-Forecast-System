import React from 'react';
import {
  LayoutDashboard, BarChart3, Activity, ShieldAlert, FileSearch,
  CheckCircle2, FileText, Waves, BookOpen, Clock, Settings, MapPin, Cloud
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAiAssistant?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navGroups = [
    {
      title: "PRIMARY PLATFORM",
      items: [
        { id: "overview",   label: "Dashboard",           icon: LayoutDashboard },
        { id: "india_map",  label: "Spatial Explorer",    icon: MapPin },
        { id: "analytics",  label: "Reliability Analysis",icon: BarChart3 },
      ]
    },
    {
      title: "DIAGNOSTIC ENGINES",
      items: [
        { id: "stress_lab",     label: "Stress Lab",            icon: Activity },
        { id: "failure_intel",  label: "Failure Intelligence",  icon: ShieldAlert },
        { id: "evidence",       label: "Independent Evidence",  icon: FileSearch },
        { id: "self_audit",     label: "Self-Audit",            icon: CheckCircle2 },
        { id: "trust_horizon",  label: "Sequence Analysis",     icon: Clock },
      ]
    },
    {
      title: "REPORTS & DECISIONS",
      items: [
        { id: "passport",            label: "Reliability Passport",  icon: FileText },
        { id: "decision_support",    label: "Decision Support",      icon: Waves },
        { id: "validation_research", label: "Validation & Research", icon: BookOpen },
      ]
    },
    {
      title: "PLATFORM",
      items: [
        { id: "settings",     label: "Settings & Help", icon: Settings },
      ]
    }
  ];

  const handleItemClick = (id: string) => {
    setActiveTab(id);
  };

  return (
    <aside
      style={{ width: 218, minWidth: 218, flexShrink: 0 }}
      className="bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] flex flex-col h-screen border-r border-[var(--border)] select-none transition-colors"
    >
      {/* Brand Header */}
      <div className="px-4 border-b border-[var(--border)] flex items-center gap-3 bg-[var(--header-bg)]"
           style={{ height: 64, flexShrink: 0 }}>
        <div
          className="rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            width: 34, height: 34,
            background: 'var(--primary)',
          }}
        >
          {/* Cloud icon */}
          <Cloud className="w-[18px] h-[18px] text-white" strokeWidth={2.2} />
        </div>
        <div className="overflow-hidden">
          <div
            className="leading-tight"
            style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--heading)' }}
          >
            FORTRESS
          </div>
          <div
            className="leading-tight truncate"
            style={{ fontSize: 10, fontWeight: 500, color: 'var(--sidebar-text-muted)' }}
          >
            Forecast Reliability Intelligence Platform
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2" style={{ gap: 0 }}>
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} style={{ marginBottom: gIdx < navGroups.length - 1 ? 20 : 0 }}>
            {/* Group Label */}
            <div
              className="uppercase tracking-wider px-3"
              style={{ fontSize: 10, fontWeight: 700, marginBottom: 4, letterSpacing: '0.06em', color: 'var(--sidebar-text-muted)' }}
            >
              {group.title}
            </div>

            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className="w-full flex items-center gap-2.5 rounded-lg relative text-left transition-colors cursor-pointer"
                    style={{
                      height: 40,
                      paddingLeft: isActive ? 11 : 12,
                      paddingRight: 12,
                      background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--sidebar-active-accent)' : '3px solid transparent',
                      color: isActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 500,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLButtonElement).style.background = 'var(--sidebar-hover)';
                        (e.currentTarget as HTMLButtonElement).style.color = 'var(--heading)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                        (e.currentTarget as HTMLButtonElement).style.color = 'var(--sidebar-text)';
                      }
                    }}
                  >
                    <Icon
                      style={{
                        width: 17, height: 17, flexShrink: 0,
                        color: isActive ? 'var(--sidebar-active-accent)' : 'var(--sidebar-text-muted)',
                      }}
                    />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div
        className="border-t border-[var(--border)] px-4 py-3 bg-[var(--header-bg)] flex items-center gap-2"
        style={{ flexShrink: 0 }}
      >
        <span
          className="rounded-full flex-shrink-0"
          style={{ width: 7, height: 7, background: 'var(--status-green)', display: 'inline-block' }}
        />
        <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--sidebar-text-muted)' }}>
          FORTRESS Platform v1.0
        </span>
      </div>
    </aside>
  );
};
