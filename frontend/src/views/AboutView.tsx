import React from 'react';
import { Info } from 'lucide-react';

export const AboutView: React.FC = () => {
  return (
    <div className="h-full w-full overflow-y-auto p-4 space-y-4 bg-[#EEF9F4] text-[#033A2B]">
      {/* Top Ultra Light Green Banner Header */}
      <div className="bg-[#F4FAF6] border border-[#C8EAD9] rounded-xl p-4 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold text-[#059669] uppercase tracking-wider">PROJECT METADATA & DISCLAIMER</span>
          <h1 className="text-xl font-extrabold text-[#044E3A] mt-0.5 tracking-tight flex items-center gap-2">
            <Info className="w-5 h-5 text-[#059669]" />
            About FORTRESS
          </h1>
          <p className="text-xs text-[#065F46] mt-0.5 font-medium">
            Forecast Reliability Stress-Testing & Self-Audit System
          </p>
        </div>

        <div className="bg-[#D4F0E2] border border-[#C8EAD9] px-3 py-1.5 rounded-lg text-xs font-bold text-[#044E3A]">
          Team Cyber Greecks
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
            <li>• <strong>Data Pipeline:</strong> GEFSv12 Reforecast &amp; ERA5 Atmospheric Predictor Processing</li>
            <li>• <strong>Ground Truth Engine:</strong> Historical Forecast Verification &amp; Lead-wise Bust Labeling</li>
            <li>• <strong>Reliability Engine:</strong> Calibrated Random Forest Bust Probability Modeling</li>
            <li>• <strong>Diagnostic Lab:</strong> Meteorological Stress Testing &amp; Forecast Failure Distance (FFD)</li>
            <li>• <strong>Corridor Detection:</strong> Synoptic Failure Clustering &amp; 6D Failure Fingerprinting</li>
            <li>• <strong>Independent Evidence:</strong> Spatial KNN Analogues &amp; Cosine Failure DNA Matching</li>
            <li>• <strong>Safety Verification:</strong> AI Self-Audit &amp; Trust Horizon Sequence Engine</li>
            <li>• <strong>Operational UI:</strong> FastAPI Architecture &amp; Geospatial Decision Intelligence Dashboard</li>
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
