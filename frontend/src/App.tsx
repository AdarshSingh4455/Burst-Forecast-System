import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { AiAssistantPopup } from './components/AiAssistantPopup';
import { OverviewView } from './views/OverviewView';
import { StressLabView } from './views/StressLabView';
import { FailureIntelligenceView } from './views/FailureIntelligenceView';
import { IndependentEvidenceView } from './views/IndependentEvidenceView';
import { SelfAuditView } from './views/SelfAuditView';
import { TrustHorizonView } from './views/TrustHorizonView';
import { BreakingPointView } from './views/BreakingPointView';
import { PassportView } from './views/PassportView';
import { AnalyticsView } from './views/AnalyticsView';
import { DecisionSupportView } from './views/DecisionSupportView';
import { AIAssistantView } from './views/AIAssistantView';
import { SettingsView } from './views/SettingsView';
import { AboutView } from './views/AboutView';
import { MapView } from './components/MapView';
import { TrendChart } from './components/TrendChart';
import { RightPanel } from './components/RightPanel';
import { Bot } from 'lucide-react';
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
  const [isAiOpen, setIsAiOpen] = useState<boolean>(false);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  
  // Settings & preferences persistence from localStorage
  const savedRun = localStorage.getItem('fortress_run') || '2019-07-01 00:00:00';
  const savedLead = parseInt(localStorage.getItem('fortress_lead') || '5', 10);
  const savedMetric = localStorage.getItem('fortress_metric') || 'bust_probability';
  const savedRegion = localStorage.getItem('fortress_region') || 'ALL';

  const [selectedRun, setSelectedRun] = useState<string>(savedRun);
  const [selectedLead, setSelectedLead] = useState<number>(savedLead);
  const [selectedMetric, setSelectedMetric] = useState<string>(savedMetric);
  const [selectedRegion, setSelectedRegion] = useState<string>(savedRegion);

  // Selected Grid Point (Initial: null -> set from first valid point returned by backend)
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLon, setSelectedLon] = useState<number | null>(null);

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
        if (runs.length > 0 && !runs.includes(selectedRun)) {
          setSelectedRun(runs[0]);
        }
      })
      .catch((err) => {
        console.error('Metadata fetch error:', err);
        setError('Failed to connect to FORTRESS backend. Ensure FastAPI server is running on http://127.0.0.1:8000');
      });
  }, []);

  // Fetch Grid Map & Regional Summary when run/lead/region/metric changes
  useEffect(() => {
    if (!selectedRun) return;
    setLoading(true);

    Promise.all([
      fetchGridMap(selectedRun, selectedLead, selectedRegion, selectedMetric),
      fetchRegionalSummary(selectedRun, selectedLead, selectedRegion)
    ])
      .then(([mapRes, summaryRes]) => {
        const pts = Array.isArray(mapRes) ? mapRes : (mapRes.grid_points || []);
        setGridPoints(pts);
        setRegionalSummary(summaryRes);

        const exists = selectedLat !== null && selectedLon !== null && pts.some(
          (p: GridPointMap) => Math.abs(p.latitude - selectedLat) < 0.01 && Math.abs(p.longitude - selectedLon) < 0.01
        );

        if (!exists && pts.length > 0) {
          setSelectedLat(pts[0].latitude);
          setSelectedLon(pts[0].longitude);
        }
      })
      .catch((err) => console.error('Map fetch error:', err))
      .finally(() => setLoading(false));
  }, [selectedRun, selectedLead, selectedRegion, selectedMetric]);

  // Fetch Grid Detail, Stress, Corridors, Fingerprint, Passport when lat/lon/run/lead changes
  useEffect(() => {
    if (selectedLat === null || selectedLon === null || !selectedRun) return;

    fetchGridDetail(selectedRun, selectedLat, selectedLon, selectedLead)
      .then((data) => setSelectedPointDetail(data))
      .catch((err) => console.error('Point detail fetch error:', err));

    fetchTrend(selectedRun, selectedLat, selectedLon)
      .then((res) => setTrendData(Array.isArray(res) ? res : (res?.trend || [])))
      .catch((err) => console.error('Trend fetch error:', err));

    fetchStressTestData(selectedRun, selectedLat, selectedLon, selectedLead)
      .then((res) => setStressData(res))
      .catch((err) => console.error('Stress test fetch error:', err));

    fetchFailureCorridors(selectedRun, selectedLat, selectedLon, selectedLead)
      .then((res) => setFailureCorridors(Array.isArray(res) ? res : (res?.corridors || [])))
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
      case 'india_map':
        return (
          <div className="h-full w-full flex flex-col overflow-hidden bg-[#EEF9F4] select-none p-3 space-y-3">
            <div className="flex-1 grid grid-cols-12 gap-3 min-h-0 overflow-hidden">
              <div className="col-span-8 flex flex-col gap-3 h-full min-h-0 overflow-hidden">
                <div className="flex-1 min-h-[300px] rounded-xl overflow-hidden shadow-sm border border-[#C8EAD9]">
                  <MapView
                    mapPoints={gridPoints}
                    selectedMetric={selectedMetric}
                    selectedLat={selectedLat ?? 26.75}
                    selectedLon={selectedLon ?? 83.25}
                    onSelectPoint={handlePointSelect}
                  />
                </div>
                <div className="h-[220px] rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                  <TrendChart
                    trendData={trendData}
                    selectedLat={selectedLat}
                    selectedLon={selectedLon}
                    selectedMetric={selectedMetric}
                    onNavigateTab={(tab) => setActiveTab(tab)}
                  />
                </div>
              </div>
              <div className="col-span-4 h-full min-h-0 rounded-xl overflow-hidden shadow-sm border border-[#C8EAD9]">
                <RightPanel
                  pointDetail={selectedPointDetail}
                  regionalSummary={regionalSummary}
                  onOpenPassport={() => setActiveTab('passport')}
                />
              </div>
            </div>
          </div>
        );
      case 'overview':
        return (
          <OverviewView
            selectedRun={selectedRun}
            selectedLead={selectedLead}
            selectedMetric={selectedMetric}
            gridPoints={gridPoints}
            selectedLat={selectedLat}
            selectedLon={selectedLon}
            onSelectPoint={handlePointSelect}
            regionalSummary={regionalSummary}
            trendData={trendData}
            pointDetail={selectedPointDetail}
            onOpenPassport={() => setActiveTab('passport')}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        );
      case 'analytics':
        return (
          <AnalyticsView
            selectedRun={selectedRun}
            selectedLead={selectedLead}
            gridPoints={gridPoints}
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
      case 'trust_horizon':
        return (
          <TrustHorizonView
            trustHorizon={trustHorizonData}
            pointDetail={selectedPointDetail}
          />
        );
      case 'breaking_point':
        return (
          <BreakingPointView
            trustHorizon={trustHorizonData}
            pointDetail={selectedPointDetail}
          />
        );
      case 'passport':
        return <PassportView passport={passportData} />;
      case 'reservoir':
      case 'agriculture':
      case 'disaster':
      case 'grid':
      case 'decision_support':
        return <DecisionSupportView />;
      case 'ai_assistant':
        return <AIAssistantView pointDetail={selectedPointDetail} />;
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
            selectedLat={selectedLat}
            selectedLon={selectedLon}
            onSelectPoint={handlePointSelect}
            regionalSummary={regionalSummary}
            trendData={trendData}
            pointDetail={selectedPointDetail}
            onOpenPassport={() => setActiveTab('passport')}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        );
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#EEF9F4] text-[#033A2B] font-sans select-none relative">
      {/* Light Mint Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenAiAssistant={() => setIsAiOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-full">
        {/* Top Header - Ultra Light Green */}
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
          onSelectPoint={handlePointSelect}
        />

        {/* Active View Container */}
        <div className="flex-1 overflow-hidden h-full min-h-0 bg-[#EEF9F4]">
          {error ? (
            <div className="p-8 text-center text-red-600 bg-red-50 m-6 border border-red-200 rounded-xl shadow-md">
              <p className="font-bold text-lg mb-2">Backend Connection Error</p>
              <p className="text-sm text-red-800 font-mono">{error}</p>
            </div>
          ) : (
            renderActiveView()
          )}
        </div>
      </div>

      {/* Floating Side Pop-Up AI Assistant Drawer */}
      <AiAssistantPopup 
        isOpen={isAiOpen} 
        onClose={() => setIsAiOpen(false)} 
        pointDetail={selectedPointDetail} 
      />

      {/* Floating Bottom-Right Launcher Button */}
      <button
        onClick={() => setIsAiOpen(!isAiOpen)}
        className="fixed bottom-5 right-5 z-[9990] bg-[#059669] hover:bg-[#047857] text-white px-4 py-3 rounded-full shadow-2xl transition-transform hover:scale-105 flex items-center gap-2 font-bold text-xs cursor-pointer border border-[#A7F3D0]"
        title="Open AI Assistant Side Popup"
      >
        <Bot className="w-5 h-5 text-white" />
        <span>AI Assistant</span>
      </button>
    </div>
  );
};

export default App;
