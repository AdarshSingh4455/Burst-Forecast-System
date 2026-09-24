import React, { useState, useEffect } from 'react';
import { 
  Waves, Sprout, AlertTriangle, Zap, Info, ShieldAlert, CheckCircle2, 
  AlertCircle, MapPin, Sliders, RefreshCw, FileText, HelpCircle, ArrowRight, Sun, Thermometer, Wind, Droplets
} from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Rectangle } from 'react-leaflet';
import { 
  fetchReservoirs, 
  fetchReservoirForecastContext, 
  fetchReservoirDecisionSupport, 
  postReservoirScenario,
  fetchForecastRuns,
  fetchAgricultureScenarios,
  fetchAgricultureForecastContext,
  fetchAgricultureDecisionSupport,
  postAgricultureScenario
} from '../lib/api';
import { 
  ReservoirSummary, 
  ReservoirForecastContextResponse, 
  ReservoirDecisionSupportResponse, 
  ReservoirScenarioResponse,
  AgricultureSummary,
  AgricultureForecastContextResponse,
  AgricultureDecisionSupportResponse,
  AgricultureScenarioResponse
} from '../types';

interface DecisionSupportViewProps {
  selectedRun?: string;
  selectedLead?: number;
  onOpenAssistant?: (prompt: string) => void;
}

export const DecisionSupportView: React.FC<DecisionSupportViewProps> = ({
  selectedRun: propRun,
  selectedLead: propLead,
  onOpenAssistant
}) => {
  const [activeSector, setActiveSector] = useState<'dam' | 'agri' | 'disaster' | 'grid'>('dam');

  // Forecast init & lead state
  const [forecastRuns, setForecastRuns] = useState<string[]>([]);
  const [forecastInit, setForecastInit] = useState<string>('');
  const [leadDay, setLeadDay] = useState<number>(1);

  // State for Dam Decision Support (Phase 9A)
  const [reservoirs, setReservoirs] = useState<ReservoirSummary[]>([]);
  const [selectedReservoirId, setSelectedReservoirId] = useState<string>('RES_MEJA');
  const [reservoirScenarioKey, setReservoirScenarioKey] = useState<string>('NORMAL');
  const [damDecisionSupport, setDamDecisionSupport] = useState<ReservoirDecisionSupportResponse | null>(null);
  const [damForecastContext, setDamForecastContext] = useState<ReservoirForecastContextResponse | null>(null);
  const [whatIfStorage, setWhatIfStorage] = useState<number>(60);
  const [whatIfInflow, setWhatIfInflow] = useState<number>(300);
  const [whatIfDamResult, setWhatIfDamResult] = useState<ReservoirScenarioResponse | null>(null);

  // State for Agriculture Decision Support (Phase 9B)
  const [agricultureScenarios, setAgricultureScenarios] = useState<AgricultureSummary[]>([]);
  const [selectedAgriId, setSelectedAgriId] = useState<string>('AGRI_EUP_01');
  const [agriCrop, setAgriCrop] = useState<string>('Rice');
  const [agriStage, setAgriStage] = useState<string>('HARVEST');
  const [agriOperation, setAgriOperation] = useState<string>('HARVEST_WINDOW');
  const [agriSoilMoisture, setAgriSoilMoisture] = useState<number>(45.0);
  const [whatIfRainfallOverride, setWhatIfRainfallOverride] = useState<number | undefined>(undefined);
  const [whatIfDrySpellOverride, setWhatIfDrySpellOverride] = useState<number | undefined>(undefined);
  const [agriDecisionSupport, setAgriDecisionSupport] = useState<AgricultureDecisionSupportResponse | null>(null);
  const [agriForecastContext, setAgriForecastContext] = useState<AgricultureForecastContextResponse | null>(null);
  const [whatIfAgriResult, setWhatIfAgriResult] = useState<AgricultureScenarioResponse | null>(null);

  // Global UI states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [simulating, setSimulating] = useState<boolean>(false);

  // Bounds for Official Eastern UP Pilot (24.5 to 28.5 N, 80.0 to 84.5 E)
  const pilotBounds: [[number, number], [number, number]] = [[24.5, 80.0], [28.5, 84.5]];

  // Initial Data Load
  useEffect(() => {
    async function initData() {
      try {
        setLoading(true);
        const [resList, agriList, runs] = await Promise.all([
          fetchReservoirs(),
          fetchAgricultureScenarios(),
          fetchForecastRuns()
        ]);
        setReservoirs(resList);
        setAgricultureScenarios(agriList);
        setForecastRuns(runs);

        if (resList.length > 0) {
          const insideRes = resList.find(r => r.in_pilot_coverage);
          setSelectedReservoirId(insideRes ? insideRes.reservoir_id : resList[0].reservoir_id);
        }

        if (agriList.length > 0) {
          setSelectedAgriId(agriList[0].agri_id);
          setAgriCrop(agriList[0].crop);
          setAgriStage(agriList[0].crop_stage);
          setAgriOperation(agriList[0].field_operation);
          setAgriSoilMoisture(agriList[0].soil_moisture_percent);
        }

        if (runs.length > 0) {
          const initDate = propRun && runs.includes(propRun) ? propRun : runs[0];
          setForecastInit(initDate);
        }
        if (propLead && propLead >= 1 && propLead <= 10) {
          setLeadDay(propLead);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to initialize decision support data.');
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, [propRun, propLead]);

  // Fetch Dam / Reservoir Data
  useEffect(() => {
    if (activeSector !== 'dam' || !selectedReservoirId || !forecastInit) return;

    async function loadDamData() {
      try {
        setLoading(true);
        setError(null);
        const [dsData, ctxData] = await Promise.all([
          fetchReservoirDecisionSupport(selectedReservoirId, forecastInit, leadDay, reservoirScenarioKey),
          fetchReservoirForecastContext(selectedReservoirId, forecastInit)
        ]);
        setDamDecisionSupport(dsData);
        setDamForecastContext(ctxData);
        setWhatIfStorage(dsData.storage_percent);
        setWhatIfInflow(dsData.recent_inflow_cumecs);
        setWhatIfDamResult(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load reservoir decision support data.');
      } finally {
        setLoading(false);
      }
    }
    loadDamData();
  }, [activeSector, selectedReservoirId, forecastInit, leadDay, reservoirScenarioKey]);

  // Fetch Agriculture Data
  useEffect(() => {
    if (activeSector !== 'agri' || !selectedAgriId || !forecastInit) return;

    async function loadAgriData() {
      try {
        setLoading(true);
        setError(null);
        const [dsData, ctxData] = await Promise.all([
          fetchAgricultureDecisionSupport(selectedAgriId, forecastInit, leadDay),
          fetchAgricultureForecastContext(selectedAgriId, forecastInit)
        ]);
        setAgriDecisionSupport(dsData);
        setAgriForecastContext(ctxData);
        setAgriCrop(dsData.crop);
        setAgriStage(dsData.crop_stage);
        setAgriOperation(dsData.field_operation);
        setAgriSoilMoisture(dsData.soil_moisture_percent);
        setWhatIfRainfallOverride(undefined);
        setWhatIfDrySpellOverride(undefined);
        setWhatIfAgriResult(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load agriculture decision support data.');
      } finally {
        setLoading(false);
      }
    }
    loadAgriData();
  }, [activeSector, selectedAgriId, forecastInit, leadDay]);

  // Dam What-If Simulation
  const handleRunDamWhatIf = async () => {
    if (!selectedReservoirId || !forecastInit) return;
    try {
      setSimulating(true);
      const res = await postReservoirScenario(
        selectedReservoirId,
        whatIfStorage,
        forecastInit,
        leadDay,
        whatIfInflow,
        `What-If Storage: ${whatIfStorage}%`
      );
      setWhatIfDamResult(res);
    } catch (err: any) {
      alert(`Simulation error: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  const handleResetDamWhatIf = () => {
    if (damDecisionSupport) {
      setWhatIfStorage(damDecisionSupport.storage_percent);
      setWhatIfInflow(damDecisionSupport.recent_inflow_cumecs);
    }
    setWhatIfDamResult(null);
  };

  // Agriculture What-If Simulation
  const handleRunAgriWhatIf = async () => {
    if (!selectedAgriId || !forecastInit) return;
    try {
      setSimulating(true);
      const res = await postAgricultureScenario(
        selectedAgriId,
        forecastInit,
        leadDay,
        agriCrop,
        agriStage,
        agriOperation,
        agriSoilMoisture,
        whatIfRainfallOverride,
        whatIfDrySpellOverride,
        `What-If ${agriCrop} (${agriStage}) (DEMO WHAT-IF OVERRIDE)`
      );
      setWhatIfAgriResult(res);
    } catch (err: any) {
      alert(`Simulation error: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  const handleResetAgriWhatIf = () => {
    if (agriDecisionSupport) {
      setAgriCrop(agriDecisionSupport.crop);
      setAgriStage(agriDecisionSupport.crop_stage);
      setAgriOperation(agriDecisionSupport.field_operation);
      setAgriSoilMoisture(agriDecisionSupport.soil_moisture_percent);
      setWhatIfRainfallOverride(undefined);
      setWhatIfDrySpellOverride(undefined);
    }
    setWhatIfAgriResult(null);
  };

  const activeReservoir = reservoirs.find(r => r.reservoir_id === selectedReservoirId);
  const activeAgri = agricultureScenarios.find(a => a.agri_id === selectedAgriId);

  // Status Badge Helper
  const renderStatusBadge = (status: string | null | undefined) => {
    if (!status) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-slate-100 text-slate-700 border border-slate-300">
          <Info className="w-3.5 h-3.5 text-slate-500" />
          <span>RELIABILITY ANALYSIS UNAVAILABLE (OUTSIDE PILOT)</span>
        </span>
      );
    }
    switch (status) {
      case 'NORMAL_MONITORING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>NORMAL MONITORING</span>
          </span>
        );
      case 'HEIGHTENED_MONITORING':
      case 'FARM_ADVISORY_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>{status.replace(/_/g, ' ')}</span>
          </span>
        );
      case 'OPERATOR_REVIEW_ADVISED':
      case 'WEATHER_SENSITIVE_WINDOW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-900 border border-rose-300">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>{status.replace(/_/g, ' ')}</span>
          </span>
        );
      case 'HIGH_UNCERTAINTY_EXPERT_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-purple-900 border border-purple-300">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
            <span>HIGH UNCERTAINTY EXPERT REVIEW</span>
          </span>
        );
      default:
        return <span className="text-xs font-bold text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto p-4 space-y-4 bg-[#EEF9F4] text-[#033A2B]">
      {/* Top Ultra Light Green Banner Header */}
      <div className="bg-[#F4FAF6] border border-[#C8EAD9] rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold text-[#059669] uppercase tracking-wider">
              {activeSector === 'dam' ? 'FORTRESS PHASE 9A — RESERVOIR DECISION SUPPORT' : 'FORTRESS PHASE 9B — AGRICULTURE DECISION SUPPORT'}
            </span>
            <span className="bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {activeSector === 'dam' ? 'DEMO SCENARIO DATA' : 'DEMO AGRICULTURE SCENARIO'}
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-[#044E3A] mt-0.5 tracking-tight flex items-center gap-2">
            {activeSector === 'dam' ? <Waves className="w-6 h-6 text-[#059669]" /> : <Sprout className="w-6 h-6 text-[#059669]" />}
            <span>{activeSector === 'dam' ? 'Reservoir & Dam Decision Support System' : 'Agriculture Decision Support System'}</span>
          </h1>
          <p className="text-xs text-[#065F46] mt-0.5 font-medium">
            {activeSector === 'dam' 
              ? 'Hydrometeorological reliability context translation for dam safety monitoring and flood risk mitigation.'
              : 'Forecast reliability context for crop-stage and field-operation planning.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-[#059669]/10 border border-[#059669]/30 text-[#044E3A] text-xs font-bold px-3 py-1 rounded-lg">
            Mode B: Field Forecast Context
          </span>
          <span className="bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold px-3 py-1 rounded-lg">
            Eastern UP Pilot (24.5-28.5 N, 80.0-84.5 E)
          </span>
        </div>
      </div>

      {/* Sector Tabs */}
      <div className="flex border-b border-[#C8EAD9] bg-white rounded-t-xl p-1 gap-1 text-xs font-bold shadow-xs">
        <button
          onClick={() => setActiveSector('dam')}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${
            activeSector === 'dam' ? 'bg-[#059669] text-white shadow-xs' : 'text-[#065F46] hover:bg-[#EEF9F4]'
          }`}
        >
          <Waves className="w-4 h-4" />
          <span>Dam / Reservoir (Phase 9A Active)</span>
        </button>
        <button
          onClick={() => setActiveSector('agri')}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${
            activeSector === 'agri' ? 'bg-[#059669] text-white shadow-xs' : 'text-[#065F46] hover:bg-[#EEF9F4]'
          }`}
        >
          <Sprout className="w-4 h-4" />
          <span>Agriculture (Phase 9B Active)</span>
        </button>
        <button
          onClick={() => setActiveSector('disaster')}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${
            activeSector === 'disaster' ? 'bg-[#059669] text-white shadow-xs' : 'text-[#065F46] hover:bg-[#EEF9F4]'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Disaster Management (Phase 9 Shell)</span>
        </button>
        <button
          onClick={() => setActiveSector('grid')}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${
            activeSector === 'grid' ? 'bg-[#059669] text-white shadow-xs' : 'text-[#065F46] hover:bg-[#EEF9F4]'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Renewable Grid (Phase 9 Shell)</span>
        </button>
      </div>

      {/* Main Content Area */}
      {activeSector === 'disaster' || activeSector === 'grid' ? (
        /* Disaster / Renewable Shells */
        <div className="bg-white border border-[#C8EAD9] rounded-b-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#C8EAD9] pb-3">
            <h3 className="font-extrabold text-[#044E3A] text-base capitalize flex items-center gap-2">
              {activeSector === 'disaster' && <AlertTriangle className="w-5 h-5 text-rose-600" />}
              {activeSector === 'grid' && <Zap className="w-5 h-5 text-amber-600" />}
              <span>
                {activeSector === 'disaster'
                  ? 'Disaster Mitigation & Flood Evacuation Readiness'
                  : 'Renewable Energy Grid Dispatch & Backup Allocation'}
              </span>
            </h3>
            <span className="text-xs bg-amber-100 text-amber-900 font-extrabold px-2.5 py-1 rounded-md border border-amber-200">
              Planned Phase 9 module — not implemented in current build.
            </span>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-950 space-y-2">
            <p className="font-extrabold text-amber-900 text-sm flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600" />
              <span>Planned Phase 9 module — not implemented in current build.</span>
            </p>
            <p className="text-amber-800 leading-relaxed">
              The decision support engine for <strong>{activeSector === 'disaster' ? 'Disaster Mitigation' : 'Renewable Grid'}</strong> is scheduled for future Phase 9 extensions. No fake metrics or automated recommendations are generated.
            </p>
          </div>
        </div>
      ) : activeSector === 'agri' ? (
        /* PHASE 9B — AGRICULTURE DECISION SUPPORT VIEW */
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white border border-[#C8EAD9] rounded-xl p-4 shadow-xs space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 text-xs font-bold text-[#044E3A]">
              {/* Agri Scenario Selector */}
              <div className="col-span-2">
                <label className="block mb-1">Field / Agri Scenario</label>
                <select
                  value={selectedAgriId}
                  onChange={(e) => setSelectedAgriId(e.target.value)}
                  className="w-full bg-[#F4FAF6] border border-[#C8EAD9] p-2 rounded-lg text-xs font-extrabold text-[#033A2B]"
                >
                  {agricultureScenarios.map((a) => (
                    <option key={a.agri_id} value={a.agri_id}>
                      {a.name} {!a.in_pilot_coverage ? '(Outside Pilot)' : '(Inside Pilot)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Crop Selector */}
              <div>
                <label className="block mb-1">Crop</label>
                <select
                  value={agriCrop}
                  onChange={(e) => setAgriCrop(e.target.value)}
                  className="w-full bg-[#F4FAF6] border border-[#C8EAD9] p-2 rounded-lg text-xs font-bold text-[#033A2B]"
                >
                  <option value="Rice">Rice (Paddy)</option>
                  <option value="Wheat">Wheat</option>
                  <option value="Maize">Maize</option>
                </select>
              </div>

              {/* Crop Stage */}
              <div>
                <label className="block mb-1">Crop Stage</label>
                <select
                  value={agriStage}
                  onChange={(e) => setAgriStage(e.target.value)}
                  className="w-full bg-[#F4FAF6] border border-[#C8EAD9] p-2 rounded-lg text-xs font-bold text-[#033A2B]"
                >
                  <option value="PRE_SOWING">Pre-Sowing</option>
                  <option value="SOWING">Sowing</option>
                  <option value="VEGETATIVE">Vegetative</option>
                  <option value="FLOWERING">Flowering</option>
                  <option value="MATURITY">Maturity</option>
                  <option value="HARVEST">Harvest</option>
                </select>
              </div>

              {/* Field Operation */}
              <div>
                <label className="block mb-1">Field Operation</label>
                <select
                  value={agriOperation}
                  onChange={(e) => setAgriOperation(e.target.value)}
                  className="w-full bg-[#F4FAF6] border border-[#C8EAD9] p-2 rounded-lg text-xs font-bold text-[#033A2B]"
                >
                  <option value="GENERAL_MONITORING">General Monitoring</option>
                  <option value="SOWING_WINDOW">Sowing Window</option>
                  <option value="IRRIGATION_REVIEW">Irrigation Review</option>
                  <option value="FIELD_OPERATION">Field Operation</option>
                  <option value="HARVEST_WINDOW">Harvest Window</option>
                </select>
              </div>

              {/* Forecast Run & Lead */}
              <div>
                <label className="block mb-1">Forecast Init</label>
                <select
                  value={forecastInit}
                  onChange={(e) => setForecastInit(e.target.value)}
                  className="w-full bg-[#F4FAF6] border border-[#C8EAD9] p-2 rounded-lg text-xs font-bold text-[#033A2B]"
                >
                  {forecastRuns.map((run) => (
                    <option key={run} value={run}>{run}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lead Horizon Day Buttons */}
            <div className="flex items-center justify-between border-t border-[#C8EAD9] pt-2">
              <span className="text-xs font-extrabold text-[#044E3A]">Lead Horizon (D1 - D10):</span>
              <div className="flex gap-1 overflow-x-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((day) => (
                  <button
                    key={day}
                    onClick={() => setLeadDay(day)}
                    className={`px-3 py-1 rounded-md text-xs font-extrabold transition-all ${
                      leadDay === day
                        ? 'bg-[#059669] text-white shadow-xs'
                        : 'bg-[#F4FAF6] text-[#044E3A] hover:bg-[#C8EAD9] border border-[#C8EAD9]'
                    }`}
                  >
                    D{day}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Outside Pilot Alert Banner */}
          {activeAgri && !activeAgri.in_pilot_coverage && (
            <div className="bg-amber-50 border-2 border-amber-400 p-4 rounded-xl text-xs text-amber-950 flex items-start gap-3 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-extrabold text-amber-900 text-sm">
                  Outside Current FORTRESS Pilot Coverage
                </p>
                <p className="text-amber-900 leading-relaxed font-semibold">
                  FORTRESS reliability analysis is unavailable outside the current Eastern UP pilot coverage (24.5°–28.5°N, 80.0°–84.5°E). Coordinates for {activeAgri.name} ({activeAgri.latitude}°N, {activeAgri.longitude}°E) fall outside the pilot extent. All FORTRESS forecast reliability metrics, FFD scores, and decision attention statuses are suppressed.
                </p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="bg-white border border-[#C8EAD9] rounded-xl p-12 text-center space-y-3">
              <div className="w-8 h-8 border-4 border-[#059669] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-bold text-[#044E3A]">Evaluating agriculture decision support context...</p>
            </div>
          ) : error ? (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-900 text-xs font-bold">
              {error}
            </div>
          ) : agriDecisionSupport ? (
            <div className="space-y-4">
              {/* Top KPI Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* KPI 1: Crop & Stage */}
                <div className="bg-white border border-[#C8EAD9] rounded-xl p-4 shadow-xs space-y-1">
                  <span className="text-[10px] font-extrabold text-[#059669] uppercase tracking-wider block">CROP & FIELD STAGE</span>
                  <div className="text-xl font-black text-[#044E3A]">{agriDecisionSupport.crop}</div>
                  <p className="text-xs font-extrabold text-[#065F46]">
                    Stage: <span className="text-[#044E3A]">{agriDecisionSupport.crop_stage}</span>
                  </p>
                  <p className="text-[11px] text-slate-600 font-bold">
                    Operation: {agriDecisionSupport.field_operation}
                  </p>
                </div>

                {/* KPI 2: Soil Moisture (DEMO) */}
                <div className="bg-white border border-[#C8EAD9] rounded-xl p-4 shadow-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-extrabold text-[#059669] uppercase tracking-wider">SOIL MOISTURE</span>
                    <span className="bg-amber-100 text-amber-900 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-amber-300">DEMO</span>
                  </div>
                  <div className="text-2xl font-black text-[#044E3A]">{agriDecisionSupport.soil_moisture_percent}%</div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200 mt-1">
                    <div className="bg-[#059669] h-full" style={{ width: `${agriDecisionSupport.soil_moisture_percent}%` }} />
                  </div>
                  <p className="text-[10px] text-[#065F46] font-medium mt-1">Synthetic Demo Parameter</p>
                </div>

                {/* KPI 3: Forecast Weather (Suppressed outside pilot) */}
                <div className="bg-white border border-[#C8EAD9] rounded-xl p-4 shadow-xs space-y-1">
                  <span className="text-[10px] font-extrabold text-[#059669] uppercase tracking-wider block">WEATHER FORECAST (D{agriDecisionSupport.lead_day})</span>
                  {agriDecisionSupport.coverage_available ? (
                    <div>
                      <div className="text-xl font-black text-[#044E3A]">
                        {agriDecisionSupport.rainfall_mm} <span className="text-xs font-normal">mm</span> | {agriDecisionSupport.temperature_c}°C
                      </div>
                      <p className="text-[11px] text-[#065F46] font-bold mt-1">
                        Wind: {agriDecisionSupport.wind_speed_ms} m/s | Bust Risk: {((agriDecisionSupport.bust_probability || 0) * 100).toFixed(1)}%
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-slate-500 py-2">Suppressed (Outside Pilot)</p>
                  )}
                </div>

                {/* KPI 4: Forecast Reliability (Suppressed outside pilot) */}
                <div className="bg-white border border-[#C8EAD9] rounded-xl p-4 shadow-xs space-y-1">
                  <span className="text-[10px] font-extrabold text-[#059669] uppercase tracking-wider block">FORECAST RELIABILITY</span>
                  {agriDecisionSupport.coverage_available ? (
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-black text-[#044E3A]">
                          {(agriDecisionSupport.trust_index || 0).toFixed(1)} <span className="text-xs font-normal">/100</span>
                        </div>
                        <span className={`px-2 py-0.5 text-xs font-extrabold rounded-md border ${
                          agriDecisionSupport.reliability_band === 'GREEN' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                          agriDecisionSupport.reliability_band === 'YELLOW' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                          'bg-rose-100 text-rose-800 border-rose-300'
                        }`}>
                          {agriDecisionSupport.reliability_band}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#065F46] font-medium truncate mt-1">
                        Audit: <span className="font-extrabold">{agriDecisionSupport.self_audit_status}</span>
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-slate-500 py-2">Suppressed (Outside Pilot)</p>
                  )}
                </div>
              </div>

              {/* Main Agriculture Attention Status Card */}
              <div className="bg-white border border-[#C8EAD9] rounded-xl p-5 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#C8EAD9] pb-3">
                  <div>
                    <span className="text-[10px] font-extrabold text-[#059669] uppercase tracking-wider">AGRICULTURE ATTENTION EVALUATION</span>
                    <h3 className="text-lg font-black text-[#044E3A] mt-0.5 flex items-center gap-2">
                      <span>Attention Status:</span>
                      {renderStatusBadge(agriDecisionSupport.attention_status)}
                    </h3>
                  </div>

                  {onOpenAssistant && agriDecisionSupport.coverage_available && (
                    <button
                      onClick={() => onOpenAssistant(`Explain the agriculture decision support status for ${agriDecisionSupport.crop} (${agriDecisionSupport.crop_stage}) on Lead D${agriDecisionSupport.lead_day}.`)}
                      className="bg-[#059669] hover:bg-[#044E3A] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span>Ask AI Assistant About Agriculture</span>
                    </button>
                  )}
                </div>

                {/* Weather Flags Tags */}
                {agriDecisionSupport.weather_flags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[10px] font-bold text-[#065F46] self-center mr-1">Diagnostic Weather Flags:</span>
                    {agriDecisionSupport.weather_flags.map((flag) => (
                      <span key={flag} className="bg-[#EEF9F4] text-[#044E3A] border border-[#C8EAD9] text-[10px] font-extrabold px-2 py-0.5 rounded">
                        {flag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Bulleted Scientific & Agronomic Reasons */}
                <div className="bg-[#F4FAF6] border border-[#C8EAD9] p-4 rounded-xl space-y-2">
                  <h4 className="text-xs font-extrabold text-[#044E3A] uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-[#059669]" />
                    <span>Scientific & Agronomic Evaluation Reasons</span>
                  </h4>
                  <ul className="space-y-1.5 pl-2">
                    {agriDecisionSupport.reasons.map((reason, idx) => (
                      <li key={idx} className="text-xs text-[#044E3A] font-medium flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#059669] mt-1.5 flex-shrink-0"></span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 2-Column Grid: Weather Reliability & 3x3 Matrix */}
              {agriDecisionSupport.coverage_available ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Weather Reliability Card */}
                  <div className="bg-white border border-[#C8EAD9] rounded-xl p-5 shadow-xs space-y-3">
                    <h3 className="text-sm font-extrabold text-[#044E3A] border-b border-[#C8EAD9] pb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#059669]" />
                      <span>Forecast Reliability & Self-Audit Evidence</span>
                    </h3>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-[#F4FAF6] p-2.5 rounded-lg border border-[#C8EAD9]">
                        <span className="text-[10px] text-[#065F46] font-bold block">Self-Audit Status</span>
                        <span className="font-extrabold text-[#044E3A]">{agriDecisionSupport.self_audit_status}</span>
                      </div>

                      <div className="bg-[#F4FAF6] p-2.5 rounded-lg border border-[#C8EAD9]">
                        <span className="text-[10px] text-[#065F46] font-bold block">FFD Score & Fragility</span>
                        <span className="font-extrabold text-[#044E3A]">{agriDecisionSupport.ffd} ({agriDecisionSupport.fragility_category})</span>
                      </div>

                      <div className="bg-[#F4FAF6] p-2.5 rounded-lg border border-[#C8EAD9]">
                        <span className="text-[10px] text-[#065F46] font-bold block">Ensemble Disagreement</span>
                        <span className="font-extrabold text-[#044E3A]">{agriDecisionSupport.ensemble_disagreement_category}</span>
                      </div>

                      <div className="bg-[#F4FAF6] p-2.5 rounded-lg border border-[#C8EAD9]">
                        <span className="text-[10px] text-[#065F46] font-bold block">Trust Horizon Limit</span>
                        <span className="font-extrabold text-[#044E3A]">Day {agriDecisionSupport.trust_horizon_day}</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-xs space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Self-Audit Scientific Reason</span>
                      <p className="text-slate-800 font-medium">{agriDecisionSupport.self_audit_reason}</p>
                    </div>
                  </div>

                  {/* 3x3 Agriculture Reliability Matrix */}
                  <div className="bg-white border border-[#C8EAD9] rounded-xl p-5 shadow-xs space-y-3">
                    <h3 className="text-sm font-extrabold text-[#044E3A] border-b border-[#C8EAD9] pb-2 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-[#059669]" />
                      <span>3x3 Agriculture Decision Matrix (Sensitivity vs Reliability)</span>
                    </h3>

                    <div className="space-y-2">
                      <p className="text-[11px] text-[#065F46] font-medium">
                        Matrix maps Agricultural Sensitivity (Crop stage / operation) against Forecast Reliability Band.
                      </p>

                      <div className="grid grid-cols-4 gap-1 text-[10px] font-bold text-center">
                        <div className="p-1"></div>
                        <div className="bg-slate-100 p-1.5 rounded font-extrabold text-slate-700">GREEN (High Trust)</div>
                        <div className="bg-slate-100 p-1.5 rounded font-extrabold text-slate-700">AMBER (Mod Trust)</div>
                        <div className="bg-slate-100 p-1.5 rounded font-extrabold text-slate-700">RED (Low/Conflict)</div>

                        {/* High Sensitivity (Sowing/Harvest) */}
                        <div className="bg-slate-100 p-1.5 rounded font-extrabold text-slate-700 flex items-center justify-center">High Sensitivity</div>
                        <div className={`p-2 rounded border text-center transition-all ${
                          (agriDecisionSupport.crop_stage === 'HARVEST' || agriDecisionSupport.crop_stage === 'SOWING') && agriDecisionSupport.reliability_band === 'GREEN'
                            ? 'bg-rose-500 text-white font-extrabold border-2 border-slate-900 shadow-md scale-105'
                            : 'bg-rose-100 text-rose-900 border-rose-200 opacity-60'
                        }`}>
                          Sensitive Window
                        </div>
                        <div className={`p-2 rounded border text-center transition-all ${
                          (agriDecisionSupport.crop_stage === 'HARVEST' || agriDecisionSupport.crop_stage === 'SOWING') && agriDecisionSupport.reliability_band === 'YELLOW'
                            ? 'bg-rose-500 text-white font-extrabold border-2 border-slate-900 shadow-md scale-105'
                            : 'bg-rose-200 text-rose-950 border-rose-300 opacity-60'
                        }`}>
                          Sensitive Window
                        </div>
                        <div className={`p-2 rounded border text-center transition-all ${
                          (agriDecisionSupport.crop_stage === 'HARVEST' || agriDecisionSupport.crop_stage === 'SOWING') && (agriDecisionSupport.reliability_band === 'RED' || ['CONFLICT', 'POSSIBLE BLIND SPOT'].includes(agriDecisionSupport.self_audit_status || ''))
                            ? 'bg-purple-600 text-white font-extrabold border-2 border-slate-900 shadow-md scale-105'
                            : 'bg-purple-100 text-purple-900 border-purple-200 opacity-60'
                        }`}>
                          Expert Review
                        </div>

                        {/* Mod Sensitivity (Flowering/Irrigation) */}
                        <div className="bg-slate-100 p-1.5 rounded font-extrabold text-slate-700 flex items-center justify-center">Mod Sensitivity</div>
                        <div className={`p-2 rounded border text-center transition-all ${
                          agriDecisionSupport.crop_stage === 'FLOWERING' && agriDecisionSupport.reliability_band === 'GREEN'
                            ? 'bg-amber-500 text-white font-extrabold border-2 border-slate-900 shadow-md scale-105'
                            : 'bg-amber-100 text-amber-900 border-amber-200 opacity-60'
                        }`}>
                          Advisory Review
                        </div>
                        <div className={`p-2 rounded border text-center transition-all ${
                          agriDecisionSupport.crop_stage === 'FLOWERING' && agriDecisionSupport.reliability_band === 'YELLOW'
                            ? 'bg-amber-500 text-white font-extrabold border-2 border-slate-900 shadow-md scale-105'
                            : 'bg-amber-100 text-amber-900 border-amber-200 opacity-60'
                        }`}>
                          Advisory Review
                        </div>
                        <div className={`p-2 rounded border text-center transition-all ${
                          agriDecisionSupport.crop_stage === 'FLOWERING' && (agriDecisionSupport.reliability_band === 'RED' || ['CONFLICT', 'POSSIBLE BLIND SPOT'].includes(agriDecisionSupport.self_audit_status || ''))
                            ? 'bg-purple-600 text-white font-extrabold border-2 border-slate-900 shadow-md scale-105'
                            : 'bg-purple-100 text-purple-900 border-purple-200 opacity-60'
                        }`}>
                          Expert Review
                        </div>

                        {/* Low Sensitivity (Vegetative/Pre-sowing) */}
                        <div className="bg-slate-100 p-1.5 rounded font-extrabold text-slate-700 flex items-center justify-center">Low Sensitivity</div>
                        <div className={`p-2 rounded border text-center transition-all ${
                          (agriDecisionSupport.crop_stage === 'VEGETATIVE' || agriDecisionSupport.crop_stage === 'PRE_SOWING') && agriDecisionSupport.reliability_band === 'GREEN'
                            ? 'bg-emerald-600 text-white font-extrabold border-2 border-slate-900 shadow-md scale-105'
                            : 'bg-emerald-100 text-emerald-900 border-emerald-200 opacity-60'
                        }`}>
                          Normal Mon.
                        </div>
                        <div className={`p-2 rounded border text-center transition-all ${
                          (agriDecisionSupport.crop_stage === 'VEGETATIVE' || agriDecisionSupport.crop_stage === 'PRE_SOWING') && agriDecisionSupport.reliability_band === 'YELLOW'
                            ? 'bg-amber-500 text-white font-extrabold border-2 border-slate-900 shadow-md scale-105'
                            : 'bg-amber-100 text-amber-900 border-amber-200 opacity-60'
                        }`}>
                          Advisory Review
                        </div>
                        <div className={`p-2 rounded border text-center transition-all ${
                          (agriDecisionSupport.crop_stage === 'VEGETATIVE' || agriDecisionSupport.crop_stage === 'PRE_SOWING') && (agriDecisionSupport.reliability_band === 'RED' || ['CONFLICT', 'POSSIBLE BLIND SPOT'].includes(agriDecisionSupport.self_audit_status || ''))
                            ? 'bg-[#059669] text-white font-extrabold border-2 border-slate-900 shadow-md scale-105'
                            : 'bg-emerald-100 text-emerald-900 border-emerald-200 opacity-60'
                        }`}>
                          Normal Mon. (Low Rel)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-[#C8EAD9] rounded-xl p-6 shadow-xs text-center space-y-2">
                  <Info className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">
                    FORTRESS reliability metrics (Bust Risk, FFD, Trust Index, Self-Audit, 3x3 Matrix) are suppressed for agriculture locations outside the pilot extent (24.5°–28.5°N, 80.0°–84.5°E).
                  </p>
                </div>
              )}

              {/* D1-D10 Horizon Table */}
              {agriForecastContext && agriForecastContext.coverage_available && agriForecastContext.lead_contexts && (
                <div className="bg-white border border-[#C8EAD9] rounded-xl p-5 shadow-xs space-y-3">
                  <h3 className="text-sm font-extrabold text-[#044E3A] border-b border-[#C8EAD9] pb-2 flex items-center justify-between">
                    <span>10-Day Agriculture Weather & Reliability Outlook</span>
                    <span className="text-xs font-normal text-[#065F46]">Click any row to select lead day context</span>
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#F4FAF6] text-[#044E3A] border-b border-[#C8EAD9] text-[11px] font-extrabold">
                          <th className="p-2.5">Lead</th>
                          <th className="p-2.5">Rainfall</th>
                          <th className="p-2.5">Temp (°C)</th>
                          <th className="p-2.5">Wind (m/s)</th>
                          <th className="p-2.5">Bust Prob</th>
                          <th className="p-2.5">FFD</th>
                          <th className="p-2.5">Trust Index</th>
                          <th className="p-2.5">Reliability</th>
                          <th className="p-2.5">Self-Audit</th>
                          <th className="p-2.5">Agri Context</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#C8EAD9]">
                        {agriForecastContext.lead_contexts.map((ctx) => (
                          <tr
                            key={ctx.lead_day}
                            onClick={() => setLeadDay(ctx.lead_day)}
                            className={`cursor-pointer transition-colors ${
                              leadDay === ctx.lead_day ? 'bg-[#EEF9F4] font-extrabold' : 'hover:bg-[#F4FAF6]'
                            }`}
                          >
                            <td className="p-2.5 text-[#044E3A]">D{ctx.lead_day}</td>
                            <td className="p-2.5">{ctx.rainfall_mm} mm</td>
                            <td className="p-2.5">{ctx.temperature_c}°C</td>
                            <td className="p-2.5">{ctx.wind_speed_ms} m/s</td>
                            <td className="p-2.5">{(ctx.bust_probability * 100).toFixed(1)}%</td>
                            <td className="p-2.5">{ctx.ffd}</td>
                            <td className="p-2.5">{ctx.trust_index.toFixed(1)}</td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                ctx.reliability_band === 'GREEN' ? 'bg-emerald-100 text-emerald-800' :
                                ctx.reliability_band === 'YELLOW' ? 'bg-amber-100 text-amber-800' :
                                'bg-rose-100 text-rose-800'
                              }`}>
                                {ctx.reliability_band}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-700">{ctx.self_audit_status}</td>
                            <td className="p-2.5">{renderStatusBadge(ctx.attention_status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* What-If Scenario Simulator & Location Map Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* What-If Simulator */}
                <div className="bg-white border border-[#C8EAD9] rounded-xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#C8EAD9] pb-2">
                    <h3 className="text-sm font-extrabold text-[#044E3A] flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-[#059669]" />
                      <span>Agriculture What-If Scenario Simulator</span>
                    </h3>
                    <button
                      onClick={handleResetAgriWhatIf}
                      className="text-[11px] text-[#059669] hover:underline flex items-center gap-1 font-bold"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-[#044E3A] mb-1">Simulated Crop:</label>
                        <select
                          value={agriCrop}
                          onChange={(e) => setAgriCrop(e.target.value)}
                          className="w-full bg-[#F4FAF6] border border-[#C8EAD9] p-2 rounded-lg font-bold text-[#033A2B]"
                        >
                          <option value="Rice">Rice (Paddy)</option>
                          <option value="Wheat">Wheat</option>
                          <option value="Maize">Maize</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-[#044E3A] mb-1">Simulated Stage:</label>
                        <select
                          value={agriStage}
                          onChange={(e) => setAgriStage(e.target.value)}
                          className="w-full bg-[#F4FAF6] border border-[#C8EAD9] p-2 rounded-lg font-bold text-[#033A2B]"
                        >
                          <option value="PRE_SOWING">Pre-Sowing</option>
                          <option value="SOWING">Sowing</option>
                          <option value="VEGETATIVE">Vegetative</option>
                          <option value="FLOWERING">Flowering</option>
                          <option value="MATURITY">Maturity</option>
                          <option value="HARVEST">Harvest</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-[#044E3A] mb-1">Simulated Operation:</label>
                      <select
                        value={agriOperation}
                        onChange={(e) => setAgriOperation(e.target.value)}
                        className="w-full bg-[#F4FAF6] border border-[#C8EAD9] p-2 rounded-lg font-bold text-[#033A2B]"
                      >
                        <option value="GENERAL_MONITORING">General Monitoring</option>
                        <option value="SOWING_WINDOW">Sowing Window</option>
                        <option value="IRRIGATION_REVIEW">Irrigation Review</option>
                        <option value="FIELD_OPERATION">Field Operation</option>
                        <option value="HARVEST_WINDOW">Harvest Window</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between font-bold text-[#044E3A] mb-1">
                        <span>DEMO Soil Moisture (% DEMO):</span>
                        <span className="font-extrabold text-[#059669]">{agriSoilMoisture}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="90"
                        step="1"
                        value={agriSoilMoisture}
                        onChange={(e) => setAgriSoilMoisture(parseFloat(e.target.value))}
                        className="w-full accent-[#059669]"
                      />
                    </div>

                    <div className="bg-[#F4FAF6] border border-[#C8EAD9] p-2.5 rounded-lg space-y-2">
                      <span className="text-[10px] font-extrabold text-[#059669] uppercase tracking-wider block">
                        DEMO WEATHER WHAT-IF OVERRIDES (Optional)
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-[#044E3A]">Rainfall Override (mm):</label>
                          <input
                            type="number"
                            placeholder={`Actual: ${agriDecisionSupport?.rainfall_mm ?? 0} mm`}
                            value={whatIfRainfallOverride !== undefined ? whatIfRainfallOverride : ''}
                            onChange={(e) => setWhatIfRainfallOverride(e.target.value !== '' ? parseFloat(e.target.value) : undefined)}
                            className="w-full bg-white border border-[#C8EAD9] p-1.5 rounded font-bold text-[#033A2B] text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[#044E3A]">Dry Spell Override (days):</label>
                          <input
                            type="number"
                            placeholder={`Actual: ${agriDecisionSupport?.dry_spell_days ?? 0} days`}
                            value={whatIfDrySpellOverride !== undefined ? whatIfDrySpellOverride : ''}
                            onChange={(e) => setWhatIfDrySpellOverride(e.target.value !== '' ? parseInt(e.target.value) : undefined)}
                            className="w-full bg-white border border-[#C8EAD9] p-1.5 rounded font-bold text-[#033A2B] text-xs"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 italic">
                        Actual GEFS / FORTRESS forecast values remain read-only. Synthetic overrides apply to What-If simulation only.
                      </p>
                    </div>

                    <button
                      onClick={handleRunAgriWhatIf}
                      disabled={simulating}
                      className="w-full bg-[#059669] hover:bg-[#044E3A] text-white font-extrabold py-2.5 rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2"
                    >
                      {simulating ? 'Simulating...' : 'Recalculate Agriculture Scenario'}
                    </button>

                    {whatIfAgriResult && (
                      <div className="bg-[#F4FAF6] border-2 border-[#059669] p-4 rounded-xl space-y-2.5 mt-2">
                        <div className="flex justify-between items-center border-b border-[#C8EAD9] pb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-extrabold text-[#059669] uppercase">SIMULATION RESULT</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-[#059669] text-white">DEMO / WHAT-IF</span>
                          </div>
                          {renderStatusBadge(whatIfAgriResult.attention_status)}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2 rounded border border-[#C8EAD9]">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 block">ACTUAL GEFS FORECAST</span>
                            <span className="font-extrabold text-slate-800">Rainfall: {agriDecisionSupport?.rainfall_mm ?? 0} mm</span>
                            <span className="block text-[10px] text-slate-500">Dry Spell: {agriDecisionSupport?.dry_spell_days ?? 0} days (Derived)</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-[#059669] block">DEMO WHAT-IF OVERRIDE</span>
                            <span className="font-extrabold text-[#044E3A]">
                              Rainfall: {whatIfAgriResult.rainfall_mm_override !== null && whatIfAgriResult.rainfall_mm_override !== undefined ? `${whatIfAgriResult.rainfall_mm_override} mm` : 'None (Used Actual)'}
                            </span>
                            <span className="block text-[10px] text-[#059669] font-bold">
                              DEMO Soil Moisture: {whatIfAgriResult.soil_moisture_percent}% (DEMO)
                            </span>
                          </div>
                        </div>

                        <p className="font-bold text-[#044E3A] text-xs">
                          Simulated Stage: {whatIfAgriResult.crop} ({whatIfAgriResult.crop_stage}) — Operation: {whatIfAgriResult.field_operation}
                        </p>

                        <ul className="space-y-1">
                          {whatIfAgriResult.reasons.map((r, i) => (
                            <li key={i} className="text-[11px] text-[#065F46] font-medium flex items-start gap-1.5">
                              <ArrowRight className="w-3 h-3 text-[#059669] flex-shrink-0 mt-0.5" />
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Agriculture Location Map */}
                <div className="bg-white border border-[#C8EAD9] rounded-xl p-5 shadow-xs space-y-3">
                  <h3 className="text-sm font-extrabold text-[#044E3A] border-b border-[#C8EAD9] pb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#059669]" />
                    <span>Agriculture Location Spatial Context</span>
                  </h3>

                  {activeAgri && (
                    <div className="space-y-3">
                      <div className="h-48 w-full rounded-xl overflow-hidden border border-[#C8EAD9]">
                        <MapContainer
                          center={[activeAgri.latitude, activeAgri.longitude]}
                          zoom={8}
                          scrollWheelZoom={false}
                          style={{ height: '100%', width: '100%' }}
                        >
                          <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution="&copy; OpenStreetMap"
                          />
                          <Rectangle
                            bounds={pilotBounds}
                            pathOptions={{ color: '#059669', weight: 2, fillOpacity: 0.05, dashArray: '4,4' }}
                          />
                          <CircleMarker
                            center={[activeAgri.latitude, activeAgri.longitude]}
                            radius={8}
                            pathOptions={{ 
                              color: activeAgri.in_pilot_coverage ? '#15803d' : '#d97706', 
                              fillColor: activeAgri.in_pilot_coverage ? '#22c55e' : '#f59e0b', 
                              fillOpacity: 0.9, 
                              weight: 2 
                            }}
                          >
                            <Tooltip permanent={false}>
                              <div className="font-bold text-xs">
                                {activeAgri.name} {!activeAgri.in_pilot_coverage ? '(Outside Pilot)' : ''}
                              </div>
                            </Tooltip>
                          </CircleMarker>
                          {agriDecisionSupport.coverage_available && (
                            <CircleMarker
                              center={[agriDecisionSupport.latitude, agriDecisionSupport.longitude]}
                              radius={5}
                              pathOptions={{ color: '#7e22ce', fillColor: '#a855f7', fillOpacity: 0.9, weight: 1.5 }}
                            >
                              <Tooltip permanent={false}>
                                <div className="font-bold text-xs">Nearest Pilot Grid Point</div>
                              </Tooltip>
                            </CircleMarker>
                          )}
                        </MapContainer>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-[#F4FAF6] p-2 rounded-lg border border-[#C8EAD9]">
                          <span className="text-[10px] text-[#065F46] font-bold block">District & State</span>
                          <span className="font-extrabold text-[#044E3A]">{activeAgri.district_label}, {activeAgri.state}</span>
                        </div>

                        <div className="bg-[#F4FAF6] p-2 rounded-lg border border-[#C8EAD9]">
                          <span className="text-[10px] text-[#065F46] font-bold block">Coverage Status</span>
                          <span className="font-extrabold text-[#044E3A]">
                            {activeAgri.in_pilot_coverage ? 'INSIDE PILOT (24.5-28.5 N, 80.0-84.5 E)' : 'OUTSIDE PILOT COVERAGE'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Data Provenance & System Limitations */}
              <div className="bg-white border border-[#C8EAD9] rounded-xl p-5 shadow-xs space-y-2 text-xs">
                <h4 className="font-extrabold text-[#044E3A] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-[#059669]" />
                  <span>Data Provenance & Agronomic System Limitations</span>
                </h4>
                <ul className="space-y-1 pl-2 text-[#065F46] font-medium">
                  {agriDecisionSupport.limitations.map((lim, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#059669] mt-1.5 flex-shrink-0"></span>
                      <span>{lim}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mandatory Legal Disclaimer Box */}
              <div className="bg-amber-50 border-2 border-amber-400 p-4 rounded-xl text-xs text-amber-950 space-y-1 shadow-xs">
                <div className="font-extrabold text-amber-900 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <span>MANDATORY OPERATIONAL DISCLAIMER</span>
                </div>
                <p className="text-amber-900 leading-relaxed font-semibold">
                  {agriDecisionSupport.disclaimer}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        /* PHASE 9A — RESERVOIR / DAM DECISION SUPPORT VIEW */
        <div className="space-y-4">
          {/* Controls Bar: Selector Dropdowns */}
          <div className="bg-white border border-[#C8EAD9] rounded-xl p-4 shadow-xs space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Reservoir Selector */}
              <div>
                <label className="block text-xs font-bold text-[#044E3A] mb-1">Select Reservoir / Dam</label>
                <select
                  value={selectedReservoirId}
                  onChange={(e) => setSelectedReservoirId(e.target.value)}
                  className="w-full bg-[#F4FAF6] border border-[#C8EAD9] text-[#033A2B] text-xs font-extrabold rounded-lg p-2 focus:ring-2 focus:ring-[#059669] focus:outline-none"
                >
                  {reservoirs.map((r) => (
                    <option key={r.reservoir_id} value={r.reservoir_id}>
                      {r.name} {!r.in_pilot_coverage ? '(Outside Pilot)' : '(Inside Pilot)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Forecast Run Selector */}
              <div>
                <label className="block text-xs font-bold text-[#044E3A] mb-1">Forecast Initialization</label>
                <select
                  value={forecastInit}
                  onChange={(e) => setForecastInit(e.target.value)}
                  className="w-full bg-[#F4FAF6] border border-[#C8EAD9] text-[#033A2B] text-xs font-bold rounded-lg p-2 focus:ring-2 focus:ring-[#059669] focus:outline-none"
                >
                  {forecastRuns.map((run) => (
                    <option key={run} value={run}>
                      {run}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pre-baked Scenario Selector */}
              <div>
                <label className="block text-xs font-bold text-[#044E3A] mb-1">Storage Scenario</label>
                <select
                  value={reservoirScenarioKey}
                  onChange={(e) => setReservoirScenarioKey(e.target.value)}
                  className="w-full bg-[#F4FAF6] border border-[#C8EAD9] text-[#033A2B] text-xs font-bold rounded-lg p-2 focus:ring-2 focus:ring-[#059669] focus:outline-none"
                >
                  <option value="NORMAL">Normal Storage (~58%)</option>
                  <option value="HIGH">High Storage (~79%)</option>
                  <option value="VERY_HIGH">Very High Storage (~89%)</option>
                </select>
              </div>

              {/* Lead Day Selector Buttons */}
              <div>
                <label className="block text-xs font-bold text-[#044E3A] mb-1">Lead Horizon (Day 1-10)</label>
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((day) => (
                    <button
                      key={day}
                      onClick={() => setLeadDay(day)}
                      className={`px-2 py-1.5 rounded-md text-xs font-extrabold flex-1 transition-all ${
                        leadDay === day
                          ? 'bg-[#059669] text-white shadow-xs'
                          : 'bg-[#F4FAF6] text-[#044E3A] hover:bg-[#C8EAD9] border border-[#C8EAD9]'
                      }`}
                    >
                      D{day}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Outside Pilot Alert Banner */}
          {activeReservoir && !activeReservoir.in_pilot_coverage && (
            <div className="bg-amber-50 border-2 border-amber-400 p-4 rounded-xl text-xs text-amber-950 flex items-start gap-3 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-extrabold text-amber-900 text-sm">
                  Outside Current FORTRESS Pilot Coverage
                </p>
                <p className="text-amber-900 leading-relaxed font-semibold">
                  FORTRESS reliability analysis is unavailable outside the current Eastern UP pilot coverage (24.5°–28.5°N, 80.0°–84.5°E). Coordinates for {activeReservoir.name} ({activeReservoir.latitude}°N, {activeReservoir.longitude}°E) fall outside the pilot extent. All FORTRESS forecast reliability metrics, FFD scores, and decision attention statuses are suppressed.
                </p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="bg-white border border-[#C8EAD9] rounded-xl p-12 text-center space-y-3">
              <div className="w-8 h-8 border-4 border-[#059669] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-bold text-[#044E3A]">Evaluating reservoir decision support context...</p>
            </div>
          ) : error ? (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-900 text-xs font-bold">
              {error}
            </div>
          ) : damDecisionSupport ? (
            <div className="space-y-4">
              {/* Top KPI Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-[#C8EAD9] rounded-xl p-4 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-[#059669] uppercase tracking-wider">RESERVOIR STORAGE</span>
                    <span className="text-xs font-extrabold text-[#044E3A]">{damDecisionSupport.storage_percent}%</span>
                  </div>
                  <div className="text-2xl font-black text-[#044E3A]">
                    {damDecisionSupport.current_storage_mcm} <span className="text-xs font-normal text-[#065F46]">MCM</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                    <div
                      className={`h-full transition-all ${
                        damDecisionSupport.storage_percent >= 85 ? 'bg-rose-500' :
                        damDecisionSupport.storage_percent >= 75 ? 'bg-amber-500' :
                        'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, damDecisionSupport.storage_percent)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-[#065F46] font-medium">
                    Total Capacity: {damDecisionSupport.capacity_mcm} MCM
                  </p>
                </div>

                <div className="bg-white border border-[#C8EAD9] rounded-xl p-4 shadow-xs space-y-2">
                  <span className="text-[10px] font-extrabold text-[#059669] uppercase tracking-wider block">HYDRO FLOW RATES</span>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-xl font-black text-[#044E3A]">{damDecisionSupport.recent_inflow_cumecs}</div>
                      <span className="text-[10px] text-[#065F46] font-bold">Inflow (cumecs)</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-700">{damDecisionSupport.scenario_name}</div>
                      <span className="text-[10px] text-[#065F46] font-medium">Active Scenario</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-[#C8EAD9] rounded-xl p-4 shadow-xs space-y-2">
                  <span className="text-[10px] font-extrabold text-[#059669] uppercase tracking-wider block">WEATHER FORECAST (D{damDecisionSupport.lead_day})</span>
                  {damDecisionSupport.coverage_available ? (
                    <div className="flex justify-between items-baseline">
                      <div>
                        <div className="text-2xl font-black text-[#044E3A]">{damDecisionSupport.rainfall_mm} <span className="text-xs font-normal">mm</span></div>
                        <span className="text-[10px] text-[#065F46] font-bold">Expected Rain</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-extrabold text-amber-700">{((damDecisionSupport.bust_probability || 0) * 100).toFixed(1)}%</div>
                        <span className="text-[10px] text-[#065F46] font-medium">Bust Risk</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs font-bold text-slate-500 py-2">
                      Suppressed (Outside Pilot Coverage)
                    </div>
                  )}
                </div>

                <div className="bg-white border border-[#C8EAD9] rounded-xl p-4 shadow-xs space-y-2">
                  <span className="text-[10px] font-extrabold text-[#059669] uppercase tracking-wider block">FORECAST RELIABILITY</span>
                  {damDecisionSupport.coverage_available ? (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-black text-[#044E3A]">
                          {(damDecisionSupport.trust_index || 0).toFixed(1)} <span className="text-xs font-normal text-[#065F46]">/100</span>
                        </div>
                        <span className={`px-2 py-0.5 text-xs font-extrabold rounded-md border ${
                          damDecisionSupport.reliability_band === 'GREEN' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                          damDecisionSupport.reliability_band === 'YELLOW' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                          'bg-rose-100 text-rose-800 border-rose-300'
                        }`}>
                          {damDecisionSupport.reliability_band}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#065F46] font-medium truncate">
                        Audit: <span className="font-extrabold">{damDecisionSupport.self_audit_status}</span>
                      </p>
                    </>
                  ) : (
                    <div className="text-xs font-bold text-slate-500 py-2">
                      Suppressed (Outside Pilot Coverage)
                    </div>
                  )}
                </div>
              </div>

              {/* Main Attention Status Card */}
              <div className="bg-white border border-[#C8EAD9] rounded-xl p-5 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#C8EAD9] pb-3">
                  <div>
                    <span className="text-[10px] font-extrabold text-[#059669] uppercase tracking-wider">INTELLIGENCE ATTENTION EVALUATION</span>
                    <h3 className="text-lg font-black text-[#044E3A] mt-0.5 flex items-center gap-2">
                      <span>Attention Status:</span>
                      {renderStatusBadge(damDecisionSupport.attention_status)}
                    </h3>
                  </div>

                  {onOpenAssistant && damDecisionSupport.coverage_available && (
                    <button
                      onClick={() => onOpenAssistant(`Explain the decision support status for ${damDecisionSupport.reservoir_name} on Lead D${damDecisionSupport.lead_day} under ${damDecisionSupport.scenario_name}.`)}
                      className="bg-[#059669] hover:bg-[#044E3A] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span>Ask AI Assistant About Dam</span>
                    </button>
                  )}
                </div>

                <div className="bg-[#F4FAF6] border border-[#C8EAD9] p-4 rounded-xl space-y-2">
                  <h4 className="text-xs font-extrabold text-[#044E3A] uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-[#059669]" />
                    <span>Scientific & Hydrological Evaluation Reasons</span>
                  </h4>
                  <ul className="space-y-1.5 pl-2">
                    {damDecisionSupport.reasons.map((reason, idx) => (
                      <li key={idx} className="text-xs text-[#044E3A] font-medium flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#059669] mt-1.5 flex-shrink-0"></span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Weather Evidence & 2D Matrix */}
              {damDecisionSupport.coverage_available ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white border border-[#C8EAD9] rounded-xl p-5 shadow-xs space-y-3">
                    <h3 className="text-sm font-extrabold text-[#044E3A] border-b border-[#C8EAD9] pb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#059669]" />
                      <span>Forecast Reliability & Self-Audit Evidence</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-[#F4FAF6] p-2.5 rounded-lg border border-[#C8EAD9]">
                        <span className="text-[10px] text-[#065F46] font-bold block">Self-Audit Status</span>
                        <span className="font-extrabold text-[#044E3A]">{damDecisionSupport.self_audit_status}</span>
                      </div>
                      <div className="bg-[#F4FAF6] p-2.5 rounded-lg border border-[#C8EAD9]">
                        <span className="text-[10px] text-[#065F46] font-bold block">FFD Score & Fragility</span>
                        <span className="font-extrabold text-[#044E3A]">{damDecisionSupport.ffd} ({damDecisionSupport.fragility_category})</span>
                      </div>
                      <div className="bg-[#F4FAF6] p-2.5 rounded-lg border border-[#C8EAD9]">
                        <span className="text-[10px] text-[#065F46] font-bold block">Ensemble Disagreement</span>
                        <span className="font-extrabold text-[#044E3A]">{damDecisionSupport.ensemble_disagreement_category}</span>
                      </div>
                      <div className="bg-[#F4FAF6] p-2.5 rounded-lg border border-[#C8EAD9]">
                        <span className="text-[10px] text-[#065F46] font-bold block">Trust Horizon Limit</span>
                        <span className="font-extrabold text-[#044E3A]">Day {damDecisionSupport.trust_horizon_day}</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-xs space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Self-Audit Scientific Reason</span>
                      <p className="text-slate-800 font-medium">{damDecisionSupport.self_audit_reason}</p>
                    </div>
                  </div>

                  <div className="bg-white border border-[#C8EAD9] rounded-xl p-5 shadow-xs space-y-3">
                    <h3 className="text-sm font-extrabold text-[#044E3A] border-b border-[#C8EAD9] pb-2 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-[#059669]" />
                      <span>2D Decision Support Matrix (Storage vs Reliability)</span>
                    </h3>
                    <div className="space-y-2">
                      <p className="text-[11px] text-[#065F46] font-medium">
                        Matrix maps Hydrological Storage Pressure against Forecast Reliability Band. Active cell represents current state.
                      </p>
                      <div className="grid grid-cols-4 gap-1 text-[10px] font-bold text-center">
                        <div className="p-1"></div>
                        <div className="bg-slate-100 p-1.5 rounded font-extrabold text-slate-700">GREEN (High Trust)</div>
                        <div className="bg-slate-100 p-1.5 rounded font-extrabold text-slate-700">AMBER (Mod Trust)</div>
                        <div className="bg-slate-100 p-1.5 rounded font-extrabold text-slate-700">RED (Low/Conflict)</div>

                        <div className="bg-slate-100 p-1.5 rounded font-extrabold text-slate-700 flex items-center justify-center">Storage &gt;85%</div>
                        <div className={`p-2 rounded border text-center transition-all ${
                          damDecisionSupport.storage_percent >= 85 && damDecisionSupport.reliability_band === 'GREEN'
                            ? 'bg-rose-500 text-white font-extrabold border-2 border-slate-900 shadow-md scale-105'
                            : 'bg-rose-100 text-rose-900 border-rose-200 opacity-60'
                        }`}>
                          Operator Review
                        </div>
                        <div className={`p-2 rounded border text-center transition-all ${
                          damDecisionSupport.storage_percent >= 85 && damDecisionSupport.reliability_band === 'YELLOW'
                            ? 'bg-rose-500 text-white font-extrabold border-2 border-slate-900 shadow-md scale-105'
                            : 'bg-rose-200 text-rose-950 border-rose-300 opacity-60'
                        }`}>
                          Operator Review
                        </div>
                        <div className={`p-2 rounded border text-center transition-all ${
                          damDecisionSupport.storage_percent >= 85 && (damDecisionSupport.reliability_band === 'RED' || ['CONFLICT', 'POSSIBLE BLIND SPOT'].includes(damDecisionSupport.self_audit_status || ''))
                            ? 'bg-purple-600 text-white font-extrabold border-2 border-slate-900 shadow-md scale-105'
                            : 'bg-purple-100 text-purple-900 border-purple-200 opacity-60'
                        }`}>
                          Expert Review
                        </div>

                        <div className="bg-slate-100 p-1.5 rounded font-extrabold text-slate-700 flex items-center justify-center">Storage 75-85%</div>
                        <div className={`p-2 rounded border text-center transition-all ${
                          damDecisionSupport.storage_percent >= 75 && damDecisionSupport.storage_percent < 85 && damDecisionSupport.reliability_band === 'GREEN'
                            ? 'bg-amber-500 text-white font-extrabold border-2 border-slate-900 shadow-md scale-105'
                            : 'bg-amber-100 text-amber-900 border-amber-200 opacity-60'
                        }`}>
                          Heightened Mon.
                        </div>
                        <div className={`p-2 rounded border text-center transition-all ${
                          damDecisionSupport.storage_percent >= 75 && damDecisionSupport.storage_percent < 85 && damDecisionSupport.reliability_band === 'YELLOW'
                            ? 'bg-amber-500 text-white font-extrabold border-2 border-slate-900 shadow-md scale-105'
                            : 'bg-amber-100 text-amber-900 border-amber-200 opacity-60'
                        }`}>
                          Heightened Mon.
                        </div>
                        <div className={`p-2 rounded border text-center transition-all ${
                          damDecisionSupport.storage_percent >= 75 && damDecisionSupport.storage_percent < 85 && (damDecisionSupport.reliability_band === 'RED' || ['CONFLICT', 'POSSIBLE BLIND SPOT'].includes(damDecisionSupport.self_audit_status || ''))
                            ? 'bg-purple-600 text-white font-extrabold border-2 border-slate-900 shadow-md scale-105'
                            : 'bg-purple-100 text-purple-900 border-purple-200 opacity-60'
                        }`}>
                          Expert Review
                        </div>

                        <div className="bg-slate-100 p-1.5 rounded font-extrabold text-slate-700 flex items-center justify-center">Storage &lt;75%</div>
                        <div className={`p-2 rounded border text-center transition-all ${
                          damDecisionSupport.storage_percent < 75 && damDecisionSupport.reliability_band === 'GREEN'
                            ? 'bg-emerald-600 text-white font-extrabold border-2 border-slate-900 shadow-md scale-105'
                            : 'bg-emerald-100 text-emerald-900 border-emerald-200 opacity-60'
                        }`}>
                          Normal Mon.
                        </div>
                        <div className={`p-2 rounded border text-center transition-all ${
                          damDecisionSupport.storage_percent < 75 && damDecisionSupport.reliability_band === 'YELLOW'
                            ? 'bg-amber-500 text-white font-extrabold border-2 border-slate-900 shadow-md scale-105'
                            : 'bg-amber-100 text-amber-900 border-amber-200 opacity-60'
                        }`}>
                          Heightened Mon.
                        </div>
                        <div className={`p-2 rounded border text-center transition-all ${
                          damDecisionSupport.storage_percent < 75 && (damDecisionSupport.reliability_band === 'RED' || ['CONFLICT', 'POSSIBLE BLIND SPOT'].includes(damDecisionSupport.self_audit_status || ''))
                            ? 'bg-purple-600 text-white font-extrabold border-2 border-slate-900 shadow-md scale-105'
                            : 'bg-purple-100 text-purple-900 border-purple-200 opacity-60'
                        }`}>
                          Expert Review
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-[#C8EAD9] rounded-xl p-6 shadow-xs text-center space-y-2">
                  <Info className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">
                    FORTRESS reliability metrics are suppressed for reservoirs outside the pilot extent (24.5°–28.5°N, 80.0°–84.5°E).
                  </p>
                </div>
              )}

              {/* D1-D10 Timeline Table */}
              {damForecastContext && damForecastContext.coverage_available && damForecastContext.lead_contexts && (
                <div className="bg-white border border-[#C8EAD9] rounded-xl p-5 shadow-xs space-y-3">
                  <h3 className="text-sm font-extrabold text-[#044E3A] border-b border-[#C8EAD9] pb-2 flex items-center justify-between">
                    <span>10-Day Horizon Lead Evaluation Timeline</span>
                    <span className="text-xs font-normal text-[#065F46]">Click any row to view lead day decision context</span>
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#F4FAF6] text-[#044E3A] border-b border-[#C8EAD9] text-[11px] font-extrabold">
                          <th className="p-2.5">Lead Day</th>
                          <th className="p-2.5">Rainfall (mm)</th>
                          <th className="p-2.5">Bust Probability</th>
                          <th className="p-2.5">FFD Score</th>
                          <th className="p-2.5">Reliability Band</th>
                          <th className="p-2.5">Self-Audit Status</th>
                          <th className="p-2.5">Attention Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#C8EAD9]">
                        {damForecastContext.lead_contexts.map((ctx) => (
                          <tr
                            key={ctx.lead_day}
                            onClick={() => setLeadDay(ctx.lead_day)}
                            className={`cursor-pointer transition-colors ${
                              leadDay === ctx.lead_day ? 'bg-[#EEF9F4] font-extrabold' : 'hover:bg-[#F4FAF6]'
                            }`}
                          >
                            <td className="p-2.5 text-[#044E3A]">Day {ctx.lead_day}</td>
                            <td className="p-2.5">{ctx.rainfall_mm} mm</td>
                            <td className="p-2.5">{(ctx.bust_probability * 100).toFixed(1)}%</td>
                            <td className="p-2.5">{ctx.ffd}</td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                ctx.reliability_band === 'GREEN' ? 'bg-emerald-100 text-emerald-800' :
                                ctx.reliability_band === 'YELLOW' ? 'bg-amber-100 text-amber-800' :
                                'bg-rose-100 text-rose-800'
                              }`}>
                                {ctx.reliability_band}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-700">{ctx.self_audit_status}</td>
                            <td className="p-2.5">{renderStatusBadge(ctx.attention_status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* What-If Simulator & Map Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-[#C8EAD9] rounded-xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#C8EAD9] pb-2">
                    <h3 className="text-sm font-extrabold text-[#044E3A] flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-[#059669]" />
                      <span>What-If Scenario Simulator</span>
                    </h3>
                    <button
                      onClick={handleResetDamWhatIf}
                      className="text-[11px] text-[#059669] hover:underline flex items-center gap-1 font-bold"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between font-bold text-[#044E3A] mb-1">
                        <span>Simulated Storage Level:</span>
                        <span className="font-extrabold text-[#059669]">{whatIfStorage}%</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="98"
                        step="1"
                        value={whatIfStorage}
                        onChange={(e) => setWhatIfStorage(parseFloat(e.target.value))}
                        className="w-full accent-[#059669]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#044E3A] mb-1">Simulated Recent Inflow (cumecs):</label>
                      <input
                        type="number"
                        value={whatIfInflow}
                        onChange={(e) => setWhatIfInflow(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#F4FAF6] border border-[#C8EAD9] p-2 rounded-lg font-bold text-[#033A2B]"
                      />
                    </div>
                    <button
                      onClick={handleRunDamWhatIf}
                      disabled={simulating}
                      className="w-full bg-[#059669] hover:bg-[#044E3A] text-white font-extrabold py-2.5 rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2"
                    >
                      {simulating ? 'Simulating...' : 'Simulate Custom Scenario'}
                    </button>
                    {whatIfDamResult && (
                      <div className="bg-[#F4FAF6] border-2 border-[#059669] p-4 rounded-xl space-y-2 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-extrabold text-[#059669] uppercase">SIMULATION RESULT</span>
                          {renderStatusBadge(whatIfDamResult.attention_status)}
                        </div>
                        <p className="font-bold text-[#044E3A]">
                          Simulated Storage: {whatIfDamResult.storage_percent}% ({whatIfDamResult.current_storage_mcm} MCM)
                        </p>
                        <ul className="space-y-1">
                          {whatIfDamResult.reasons.map((r, i) => (
                            <li key={i} className="text-[11px] text-[#065F46] font-medium flex items-start gap-1.5">
                              <ArrowRight className="w-3 h-3 text-[#059669] flex-shrink-0 mt-0.5" />
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-[#C8EAD9] rounded-xl p-5 shadow-xs space-y-3">
                  <h3 className="text-sm font-extrabold text-[#044E3A] border-b border-[#C8EAD9] pb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#059669]" />
                    <span>Reservoir Spatial Location</span>
                  </h3>
                  {activeReservoir && (
                    <div className="space-y-3">
                      <div className="h-48 w-full rounded-xl overflow-hidden border border-[#C8EAD9]">
                        <MapContainer
                          center={[activeReservoir.latitude, activeReservoir.longitude]}
                          zoom={8}
                          scrollWheelZoom={false}
                          style={{ height: '100%', width: '100%' }}
                        >
                          <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution="&copy; OpenStreetMap"
                          />
                          <Rectangle
                            bounds={pilotBounds}
                            pathOptions={{ color: '#059669', weight: 2, fillOpacity: 0.05, dashArray: '4,4' }}
                          />
                          <CircleMarker
                            center={[activeReservoir.latitude, activeReservoir.longitude]}
                            radius={8}
                            pathOptions={{ 
                              color: activeReservoir.in_pilot_coverage ? '#0369a1' : '#d97706', 
                              fillColor: activeReservoir.in_pilot_coverage ? '#0284c7' : '#f59e0b', 
                              fillOpacity: 0.9, 
                              weight: 2 
                            }}
                          >
                            <Tooltip permanent={false}>
                              <div className="font-bold text-xs">
                                {activeReservoir.name} {!activeReservoir.in_pilot_coverage ? '(Outside Pilot)' : ''}
                              </div>
                            </Tooltip>
                          </CircleMarker>
                          {damDecisionSupport.coverage_available && (
                            <CircleMarker
                              center={[damDecisionSupport.latitude, damDecisionSupport.longitude]}
                              radius={5}
                              pathOptions={{ color: '#7e22ce', fillColor: '#a855f7', fillOpacity: 0.9, weight: 1.5 }}
                            >
                              <Tooltip permanent={false}>
                                <div className="font-bold text-xs">Nearest Pilot Grid Point</div>
                              </Tooltip>
                            </CircleMarker>
                          )}
                        </MapContainer>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-[#F4FAF6] p-2 rounded-lg border border-[#C8EAD9]">
                          <span className="text-[10px] text-[#065F46] font-bold block">District & River</span>
                          <span className="font-extrabold text-[#044E3A]">{activeReservoir.district}, {activeReservoir.river}</span>
                        </div>
                        <div className="bg-[#F4FAF6] p-2 rounded-lg border border-[#C8EAD9]">
                          <span className="text-[10px] text-[#065F46] font-bold block">Coverage Status</span>
                          <span className="font-extrabold text-[#044E3A]">
                            {activeReservoir.in_pilot_coverage ? 'INSIDE PILOT (24.5-28.5 N, 80.0-84.5 E)' : 'OUTSIDE PILOT COVERAGE'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white border border-[#C8EAD9] rounded-xl p-5 shadow-xs space-y-2 text-xs">
                <h4 className="font-extrabold text-[#044E3A] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-[#059669]" />
                  <span>Data Provenance & System Limitations</span>
                </h4>
                <ul className="space-y-1 pl-2 text-[#065F46] font-medium">
                  {damDecisionSupport.limitations.map((lim, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#059669] mt-1.5 flex-shrink-0"></span>
                      <span>{lim}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-amber-50 border-2 border-amber-400 p-4 rounded-xl text-xs text-amber-950 space-y-1 shadow-xs">
                <div className="font-extrabold text-amber-900 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <span>MANDATORY OPERATIONAL DISCLAIMER</span>
                </div>
                <p className="text-amber-900 leading-relaxed font-semibold">
                  {damDecisionSupport.disclaimer}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
