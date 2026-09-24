import React from 'react';
import { ShieldAlert, Fingerprint, Layers } from 'lucide-react';
import { FingerprintResponse, FailureCorridor, GridPointDetail } from '../types';

interface FailureIntelligenceViewProps {
  fingerprint: FingerprintResponse | null;
  corridors: FailureCorridor[];
  pointDetail: GridPointDetail | null;
}

export const FailureIntelligenceView: React.FC<FailureIntelligenceViewProps> = ({ fingerprint, corridors, pointDetail }) => {
  const feat = fingerprint?.features || {
    moisture: 0.82,
    temperature: 0.45,
    pressure: 0.38,
    wind: 0.64,
    ensemble: 0.78,
    novelty: 0.52
  };

  return (
    <div className="h-full w-full overflow-y-auto p-4 space-y-4 bg-[#EEF9F4] text-[#033A2B] select-none">
      {/* Top Ultra Light Green Banner Header */}
      <div className="bg-[#F4FAF6] border border-[#C8EAD9] rounded-xl p-4 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold text-[#059669] uppercase tracking-wider">FAILURE INTELLIGENCE // DNA CORRIDORS</span>
          <h1 className="text-xl font-extrabold text-[#044E3A] mt-0.5 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            Failure Intelligence & Corridors
          </h1>
          <p className="text-xs text-[#065F46] mt-0.5 font-medium">
            Fingerprint vector matching for target point ({pointDetail ? `${pointDetail.latitude.toFixed(2)}°N, ${pointDetail.longitude.toFixed(2)}°E` : 'Selected Grid Point'}).
          </p>
        </div>

        <div className="bg-[#D4F0E2] border border-[#C8EAD9] px-3 py-1.5 rounded-lg text-xs font-bold text-[#044E3A]">
          Fingerprint: <strong>{fingerprint?.fingerprint_label || 'High Moisture / Wind Disagreement'}</strong>
        </div>
      </div>

      {/* Feature Fingerprint Breakdown */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-[#C8EAD9] p-4 rounded-xl shadow-xs space-y-3">
          <h3 className="font-extrabold text-[#044E3A] text-sm flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-[#059669]" />
            Feature Fingerprint Vector
          </h3>

          <div className="space-y-2 text-xs">
            <div>
              <div className="flex justify-between font-bold text-[#044E3A] mb-1">
                <span>Moisture Sensitivity</span>
                <span>{(feat.moisture * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-[#E2F5EC] h-2 rounded-full overflow-hidden">
                <div className="bg-[#059669] h-full rounded-full" style={{ width: `${feat.moisture * 100}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-bold text-[#044E3A] mb-1">
                <span>Ensemble Disagreement</span>
                <span>{(feat.ensemble * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-[#E2F5EC] h-2 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full" style={{ width: `${feat.ensemble * 100}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-bold text-[#044E3A] mb-1">
                <span>Wind Shear Influence</span>
                <span>{(feat.wind * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-[#E2F5EC] h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${feat.wind * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Failure Corridors List */}
        <div className="bg-white border border-[#C8EAD9] p-4 rounded-xl shadow-xs space-y-3">
          <h3 className="font-extrabold text-[#044E3A] text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#059669]" />
            Dominant Failure Corridors
          </h3>

          <div className="space-y-2 text-xs">
            {(corridors.length > 0 ? corridors : [
              { corridor_id: 1, corridor_name: 'High Moisture Shear Corridor', description: 'Strong specific humidity influx with weak mid-level shear', percentage: 42.5 },
              { corridor_id: 2, corridor_name: 'Monsoon Break Transition Failure', description: 'Dry air intrusion during active monsoon phase', percentage: 28.0 }
            ]).map((c, idx) => (
              <div key={idx} className="p-2.5 bg-[#EEF9F4] border border-[#C8EAD9] rounded-lg space-y-1">
                <div className="flex justify-between font-bold text-[#044E3A]">
                  <span>{c.corridor_name}</span>
                  <span className="text-[#059669] font-mono">{c.percentage}%</span>
                </div>
                <p className="text-[11px] text-[#065F46]">{c.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
