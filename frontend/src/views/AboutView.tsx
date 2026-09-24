import React from 'react';
import { Info } from 'lucide-react';

export const AboutView: React.FC = () => {
  return (
    <div className="h-full w-full overflow-y-auto p-4 space-y-4 bg-[#EEF9F4] text-[#033A2B] select-none">
      {/* Top Ultra Light Green Banner Header */}
      <div className="bg-[#F4FAF6] border border-[#C8EAD9] rounded-xl p-4 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold text-[#059669] uppercase tracking-wider">PROJECT METADATA & DISCLAIMER</span>
          <h1 className="text-xl font-extrabold text-[#044E3A] mt-0.5 tracking-tight flex items-center gap-2">
            <Info className="w-5 h-5 text-[#059669]" />
            About FORTRESS
          </h1>
          <p className="text-xs text-[#065F46] mt-0.5 font-medium">
            Forecast Reliability Stress-Testing & Self-Audit System (SIH26079)
          </p>
        </div>

        <div className="bg-[#D4F0E2] border border-[#C8EAD9] px-3 py-1.5 rounded-lg text-xs font-bold text-[#044E3A]">
          Team Cyber Greecks // SIH26079
        </div>
      </div>

      <div className="bg-white border border-[#C8EAD9] rounded-xl p-6 shadow-xs space-y-4 max-w-3xl">
        <div className="bg-[#EEF9F4] border border-[#C8EAD9] p-4 rounded-xl space-y-1 text-xs text-[#044E3A]">
          <p className="font-extrabold text-[#033A2B] text-sm">Core System Philosophy</p>
          <p className="leading-relaxed">
            FORTRESS is not another weather forecasting model. It is an independent forecast reliability and vulnerability diagnostic layer that evaluates existing Numerical Weather Prediction (NWP) models (NOAA GEFSv12) using ML Bust Risk prediction, meteorological stress testing (FFD), failure fingerprinting, historical analogues, and AI self-auditing.
          </p>
        </div>

        <div className="space-y-2 text-xs">
          <h3 className="font-extrabold text-[#044E3A] text-sm uppercase tracking-wider border-b border-[#C8EAD9] pb-1.5">
            System Architecture Overview
          </h3>
          <ul className="space-y-1.5 text-[#065F46]">
            <li>• <strong>Phase 1:</strong> GEFSv12 Reforecast Data Pipeline & Atmospheric Predictor Processing</li>
            <li>• <strong>Phase 2:</strong> Historical Forecast Error Calculation & Lead-wise Bust Labeling</li>
            <li>• <strong>Phase 3:</strong> Bust Risk AI Engine (XGBoost / LightGBM)</li>
            <li>• <strong>Phase 4:</strong> Meteorological Stress Testing Lab & Forecast Failure Distance (FFD)</li>
            <li>• <strong>Phase 5:</strong> Failure Corridor Clustering & 6D Failure Fingerprinting</li>
            <li>• <strong>Phase 6:</strong> Independent Evidence Layer (KNN Analogues & Cosine Failure DNA)</li>
            <li>• <strong>Phase 7:</strong> AI Self-Audit & Trust Horizon Sequence Engine</li>
            <li>• <strong>Phase 8:</strong> FastAPI Backend & Full Green Geographical Interactive Dashboard</li>
          </ul>
        </div>

        <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-xs text-amber-950 space-y-1">
          <p className="font-bold text-amber-900">Scientific Disclaimer</p>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            FORTRESS prototype diagnostic outputs are designed for forecast reliability analysis and risk decision support. They do not constitute official meteorological weather warnings.
          </p>
        </div>
      </div>
    </div>
  );
};
