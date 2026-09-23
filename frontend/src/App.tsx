import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { RightPanel } from './components/RightPanel';
import { OverviewView } from './views/OverviewView';
import { StressLabView } from './views/StressLabView';
import { FailureIntelligenceView } from './views/FailureIntelligenceView';
import { IndependentEvidenceView } from './views/IndependentEvidenceView';
import { SelfAuditView } from './views/SelfAuditView';
import { PassportView } from './views/PassportView';
import { AnalyticsView } from './views/AnalyticsView';
import { DecisionSupportView } from './views/DecisionSupportView';
import { AIAssistantView } from './views/AIAssistantView';
import { SettingsView } from './views/SettingsView';
import { AboutView } from './views/AboutView';
import {
  fetchMetadata,
  fetchGridMap,
  fetchGridDetail,
  fetchRegionalSummary,
  fetchTrend,
  fetchStressTestData,
  fetchFailureCorridors,
  fetchFingerprint,
  fetchAnalogues,
  fetchFailureDNA,
  fetchSelfAuditData,
  fetchTrustHorizonData,
  fetchPassportData
} from './lib/api';
import {
  Metadata,
  GridPointMap,
  GridPointDetail,
  RegionalSummary,
  TrendPoint,
  StressTestResponse,
  FailureCorridor,
  FingerprintResponse,
  AnalogueResponse,
  FailureDNAResponse,
  SelfAuditResponse,
  TrustHorizonResponse,
  ReliabilityPassport
} from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [selectedRun, setSelectedRun] = useState<string>('2019-07-01 00:00:00');
  const [selectedLead, setSelectedLead] = useState<number>(5);
  const [selectedMetric, setSelectedMetric] = useState<'bust_risk_probability' | 'fragility_score' | 'trust_index'>('bust_risk_probability');
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');

  // Selected Grid Point
  const [selectedLat, setSelectedLat] = useState<number | null>(26.75);
  const [selectedLon, setSelectedLon] = useState<number | null>(83.37);

  // Data states
  const [gridPoints, setGridPoints] = useState<GridPointMap[]>([]);
  const [selectedPointDetail, setSelectedPointDetail] = useState<GridPointDetail | null>(null);
  const [regionalSummary, setRegionalSummary] = useState<RegionalSummary | null>(null);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [stressData, setStressData] = useState<StressTestResponse | null>(null);
  const [failureCorridors, setFailureCorridors] = useState<FailureCorridor[]>([]);
  const [fingerprint, setFingerprint] = useState<FingerprintResponse | null>(null);
  const [analogues, setAnalogues] = useState<AnalogueResponse | null>(null);
  const [failureDNA, setFailureDNA] = useState<FailureDNAResponse | null>(null);
  const [selfAuditData, setSelfAuditData] = useState<SelfAuditResponse | null>(null);
  const [trustHorizonData, setTrustHorizonData] = useState<TrustHorizonResponse | null>(null);
  const [passportData, setPassportData] = useState<ReliabilityPassport | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load Metadata on Mount
  useEffect(() => {
    fetchMetadata()
      .then((data) => {
        setMetadata(data);
        const runs = data.forecast_init_dates || data.forecast_runs || [];
        if (runs.length > 0) {
          setSelectedRun(runs[0]);
        }
      })
      .catch((err) => {
        console.error('Metadata fetch error:', err);
        setError('Failed to connect to FORTRESS backend. Ensure FastAPI server is running on http://127.0.0.1:8000');
      });
  }, []);

  // Fetch Grid Map & Regional Summary when run/lead/region changes
  useEffect(() => {
    if (!selectedRun) return;
    setLoading(true);

    Promise.all([
      fetchGridMap(selectedRun, selectedLead, selectedRegion),
      fetchRegionalSummary(selectedRun, selectedLead, selectedRegion)
    ])
      .then(([mapRes, summaryRes]) => {
        setGridPoints(Array.isArray(mapRes) ? mapRes : (mapRes.grid_points || []));
        setRegionalSummary(summaryRes);
      })
      .catch((err) => console.error('Map fetch error:', err))
      .finally(() => setLoading(false));
  }, [selectedRun, selectedLead, selectedRegion]);

  // Fetch Grid Detail, Stress, Corridors, Fingerprint, Passport when lat/lon/run/lead changes
  useEffect(() => {
    if (selectedLat === null || selectedLon === null || !selectedRun) return;

    fetchGridDetail(selectedRun, selectedLat, selectedLon, selectedLead)
      .then((data) => setSelectedPointDetail(data))
      .catch((err) => console.error('Point detail fetch error:', err));

    fetchTrend(selectedRun, selectedLat, selectedLon)
      .then((res) => setTrendData(res.trend))
      .catch((err) => console.error('Trend fetch error:', err));

    fetchStressTestData(selectedRun, selectedLat, selectedLon, selectedLead)
      .then((res) => setStressData(res))
      .catch((err) => console.error('Stress test fetch error:', err));

    fetchFailureCorridors(selectedRun, selectedLat, selectedLon, selectedLead)
      .then((res) => setFailureCorridors(res.corridors))
      .catch((err) => console.error('Corridors fetch error:', err));

    fetchFingerprint(selectedRun, selectedLat, selectedLon, selectedLead)
      .then((res) => setFingerprint(res))
      .catch((err) => console.error('Fingerprint fetch error:', err));

    fetchAnalogues(selectedRun, selectedLat, selectedLon, selectedLead)
      .then((res) => setAnalogues(res))
      .catch((err) => console.error('Analogues fetch error:', err));

    fetchFailureDNA(selectedRun, selectedLat, selectedLon, selectedLead)
      .then((res) => setFailureDNA(res))
      .catch((err) => console.error('DNA fetch error:', err));

    fetchSelfAuditData(selectedRun, selectedLat, selectedLon, selectedLead)
      .then((res) => setSelfAuditData(res))
      .catch((err) => console.error('Self Audit fetch error:', err));

    fetchTrustHorizonData(selectedRun, selectedLat, selectedLon)
      .then((res) => setTrustHorizonData(res))
      .catch((err) => console.error('Trust Horizon fetch error:', err));

    fetchPassportData(selectedRun, selectedLat, selectedLon, selectedLead)
      .then((res) => setPassportData(res))
      .catch((err) => console.error('Passport fetch error:', err));
  }, [selectedRun, selectedLat, selectedLon, selectedLead]);

  const handlePointSelect = (lat: number, lon: number) => {
    setSelectedLat(lat);
    setSelectedLon(lon);
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewView
            selectedRun={selectedRun}
            selectedLead={selectedLead}
            selectedMetric={selectedMetric}
            gridPoints={gridPoints}
            selectedLat={selectedLat ?? 26.75}
            selectedLon={selectedLon ?? 83.37}
            onSelectPoint={handlePointSelect}
            regionalSummary={regionalSummary}
            trendData={trendData}
            onOpenPassport={() => setActiveTab('passport')}
          />
        );
      case 'stress_lab':
        return (
          <StressLabView
            stressData={stressData}
            pointDetail={selectedPointDetail}
          />
        );
      case 'failure_intel':
        return (
          <FailureIntelligenceView
            fingerprint={fingerprint}
            corridors={failureCorridors}
            pointDetail={selectedPointDetail}
          />
        );
      case 'evidence':
        return (
          <IndependentEvidenceView
            analogues={analogues}
            dna={failureDNA}
            pointDetail={selectedPointDetail}
          />
        );
      case 'self_audit':
        return (
          <SelfAuditView
            selfAudit={selfAuditData}
            trustHorizon={trustHorizonData}
            pointDetail={selectedPointDetail}
          />
        );
      case 'passport':
        return <PassportView passport={passportData} />;
      case 'analytics':
        return (
          <AnalyticsView
            selectedRun={selectedRun}
            selectedLead={selectedLead}
            gridPoints={gridPoints}
          />
        );
      case 'decision_support':
        return <DecisionSupportView />;
      case 'ai_assistant':
        return <AIAssistantView />;
      case 'settings':
        return <SettingsView />;
      case 'about':
        return <AboutView />;
      default:
        return (
          <OverviewView
            selectedRun={selectedRun}
            selectedLead={selectedLead}
            selectedMetric={selectedMetric}
            gridPoints={gridPoints}
            selectedLat={selectedLat ?? 26.75}
            selectedLon={selectedLon ?? 83.37}
            onSelectPoint={handlePointSelect}
            regionalSummary={regionalSummary}
            trendData={trendData}
            onOpenPassport={() => setActiveTab('passport')}
          />
        );
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <Header
          metadata={metadata}
          selectedRun={selectedRun}
          setSelectedRun={setSelectedRun}
          selectedLead={selectedLead}
          setSelectedLead={setSelectedLead}
          selectedMetric={selectedMetric}
          setSelectedMetric={setSelectedMetric}
          selectedRegion={selectedRegion}
          setSelectedRegion={setSelectedRegion}
        />

        {/* Dynamic Body Layout */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Active View Container */}
          <div className="flex-1 overflow-y-auto">
            {error ? (
              <div className="p-8 text-center text-red-400 bg-red-950/20 m-6 border border-red-800 rounded-xl">
                <p className="font-bold text-lg mb-2">Backend Connection Error</p>
                <p className="text-sm text-red-300 font-mono">{error}</p>
              </div>
            ) : (
              renderActiveView()
            )}
          </div>

          {/* Right Telemetry Panel (Visible in Overview tab or when grid point selected) */}
          {activeTab === 'overview' && (
            <RightPanel
              pointDetail={selectedPointDetail}
              regionalSummary={regionalSummary}
              onOpenPassport={() => setActiveTab('passport')}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
