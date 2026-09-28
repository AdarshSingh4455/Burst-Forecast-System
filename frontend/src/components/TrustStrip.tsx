import React from 'react';

interface TrustStripProps {
  selectedLead: number;
  horizonDay: number;
  breakingDay: number;
  onSelectLead?: (lead: number) => void;
  leadBands?: Record<number, 'GREEN' | 'YELLOW' | 'RED'>;
}

export const TrustStrip: React.FC<TrustStripProps> = ({
  selectedLead,
  horizonDay,
  breakingDay,
  onSelectLead,
  leadBands
}) => {
  const leadDays = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div className="bg-white border border-[#DDE8E4] rounded-[10px] p-4"
         style={{ boxShadow: '0 1px 2px rgba(15,39,71,0.04)' }}>
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-[#0F2747] flex items-center gap-2"
          style={{ fontSize: 13, fontWeight: 600 }}
        >
          <span className="w-2 h-2 rounded-full bg-[#059669] inline-block" />
          D1–D10 Diagnostic Trust Horizon Strip
        </span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5" style={{ fontSize: 11, fontWeight: 500, color: '#059669' }}>
            <span className="w-2 h-2 rounded-full bg-[#059669] inline-block" /> Green — Higher Trust
          </span>
          <span className="flex items-center gap-1.5" style={{ fontSize: 11, fontWeight: 500, color: '#B45309' }}>
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Yellow — Caution
          </span>
          <span className="flex items-center gap-1.5" style={{ fontSize: 11, fontWeight: 500, color: '#B91C1C' }}>
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Red — Lower Trust
          </span>
        </div>
      </div>

      <div className="grid grid-cols-10 gap-1.5">
        {leadDays.map((d) => {
          const safeHorizon = Math.max(1, Math.min(8, horizonDay || 4));
          const effectiveBreakingDay = breakingDay > safeHorizon ? breakingDay : Math.min(10, safeHorizon + 2);

          let band: 'GREEN' | 'YELLOW' | 'RED';
          if (leadBands && leadBands[d]) {
            band = leadBands[d];
            if (d < safeHorizon && band === 'RED') {
              band = 'GREEN';
            }
          } else {
            if (d <= safeHorizon) {
              band = 'GREEN';
            } else if (d < effectiveBreakingDay || d === safeHorizon + 1) {
              band = 'YELLOW';
            } else {
              band = 'RED';
            }
          }

          // Ensure transition zone is always YELLOW
          if (d > safeHorizon && d < effectiveBreakingDay) {
            band = 'YELLOW';
          }

          const isSelected = d === selectedLead;
          const isHorizon = d === safeHorizon;
          const isBreaking = d === effectiveBreakingDay;

          const bg = band === 'GREEN' ? '#059669' : band === 'YELLOW' ? '#F59E0B' : '#EF4444';
          const textColor = band === 'YELLOW' ? '#1e293b' : 'white';
          const borderColor = band === 'GREEN' ? '#047857' : band === 'YELLOW' ? '#D97706' : '#DC2626';

          return (
            <button
              key={d}
              onClick={() => onSelectLead?.(d)}
              className="relative flex flex-col items-center justify-center transition-all duration-150"
              style={{
                height: 52,
                borderRadius: 8,
                border: isSelected ? `2px solid var(--heading)` : `1px solid ${borderColor}`,
                background: bg,
                boxShadow: isSelected ? '0 0 0 3px rgba(22,119,184,0.35)' : 'none',
                cursor: 'pointer',
                padding: '4px 2px',
                outline: 'none',
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 700, color: textColor, lineHeight: 1.2 }}>
                D{d}
              </span>
              <span style={{ fontSize: 8, fontWeight: 600, color: textColor, opacity: 0.9, letterSpacing: '0.03em', lineHeight: 1 }}>
                {band === 'GREEN' ? 'RELIABLE' : band === 'YELLOW' ? 'CAUTION' : 'REVIEW'}
              </span>

              {isHorizon && (
                <span
                  className="absolute"
                  style={{
                    top: -9, right: -4,
                    background: '#0F2747', color: 'white',
                    fontSize: 7, fontWeight: 700,
                    padding: '1px 4px', borderRadius: 3,
                    whiteSpace: 'nowrap', lineHeight: 1.4,
                  }}
                >HORIZON</span>
              )}
              {isBreaking && (
                <span
                  className="absolute"
                  style={{
                    bottom: -9, left: -4,
                    background: '#991B1B', color: 'white',
                    fontSize: 7, fontWeight: 700,
                    padding: '1px 4px', borderRadius: 3,
                    whiteSpace: 'nowrap', lineHeight: 1.4,
                  }}
                >BREAK</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
