import React, { useState } from 'react';
import { 
  Sparkles, 
  AlertTriangle, 
  CheckCircle, 
  ShieldAlert, 
  Sliders, 
  HelpCircle,
  Play,
  RotateCcw,
  Flame,
  Droplets,
  Activity
} from 'lucide-react';
import { AnomalyResult, Sample } from '../types';

interface AnomalyViewProps {
  anomalies: AnomalyResult[];
  samples: Sample[];
  onDetectAnomaly: (reading: {
    ph: number;
    turbidity: number;
    dissolved_oxygen: number;
    temperature: number;
    tds: number;
    electrical_conductivity: number;
  }) => Promise<any>;
}

export const AnomalyView: React.FC<AnomalyViewProps> = ({
  anomalies,
  samples,
  onDetectAnomaly,
}) => {
  // Playground interactive state
  const [ph, setPh] = useState<number>(7.35);
  const [turbidity, setTurbidity] = useState<number>(2.2);
  const [dissolvedOxygen, setDissolvedOxygen] = useState<number>(8.5);
  const [temperature, setTemperature] = useState<number>(18.0);
  const [tds, setTds] = useState<number>(230);
  const [ec, setEc] = useState<number>(360);

  const [activePreset, setActivePreset] = useState<string>('custom');
  const [liveInference, setLiveInference] = useState<any | null>(null);
  const [isInferring, setIsInferring] = useState<boolean>(false);

  // Preset loading
  const loadPreset = (name: string) => {
    setActivePreset(name);
    if (name === 'normal') {
      setPh(7.35);
      setTurbidity(1.8);
      setDissolvedOxygen(8.9);
      setTemperature(16.5);
      setTds(210);
      setEc(320);
    } else if (name === 'industrial') {
      setPh(9.45);
      setTurbidity(16.5);
      setDissolvedOxygen(2.7);
      setTemperature(27.5);
      setTds(720);
      setEc(1050);
    } else if (name === 'agricultural') {
      setPh(6.2);
      setTurbidity(14.8);
      setDissolvedOxygen(4.1);
      setTemperature(22.0);
      setTds(560);
      setEc(820);
    } else if (name === 'acid_mine') {
      setPh(4.8);
      setTurbidity(8.2);
      setDissolvedOxygen(6.5);
      setTemperature(15.0);
      setTds(890);
      setEc(1450);
    }
  };

  const runTestInference = async () => {
    setIsInferring(true);
    try {
      const res = await onDetectAnomaly({
        ph,
        turbidity,
        dissolved_oxygen: dissolvedOxygen,
        temperature,
        tds,
        electrical_conductivity: ec,
      });
      setLiveInference(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsInferring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-md bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Sparkles className="w-5 h-5" />
          </span>
          <h2 className="text-base font-bold text-slate-100">
            AI Anomaly Detection Engine (Isolation Forest + Regulatory Validation)
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Hybrid machine learning model coupling unsupervised <strong className="text-slate-300">Scikit-learn Isolation Forest</strong> multivariate outlier detection with <strong className="text-slate-300">EPA & WHO Statutory Safety Thresholds</strong>. Categorizes anomalies into Low, Medium, High, and Critical tiers with parameter attribution explaining the exact cause of each alert.
        </p>
      </div>

      {/* Main Grid: Interactive Inference Lab + Historical Detection Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Interactive Parameter Playground */}
        <div className="lg:col-span-7 p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">Interactive Anomaly Test Bench</h3>
              <p className="text-xs text-slate-400">Manipulate parameter readings or load realistic contamination scenarios</p>
            </div>
            <button
              onClick={runTestInference}
              disabled={isInferring}
              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              {isInferring ? 'Scoring...' : 'Run Isolation Forest'}
            </button>
          </div>

          {/* Scenario Presets */}
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-2">Simulate Real-World Scenarios:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => loadPreset('normal')}
                className={`px-2.5 py-2 rounded-lg border text-xs font-medium text-left transition-all ${
                  activePreset === 'normal'
                    ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-semibold">Normal Baseline</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Alpine reservoir standard</div>
              </button>

              <button
                onClick={() => loadPreset('industrial')}
                className={`px-2.5 py-2 rounded-lg border text-xs font-medium text-left transition-all ${
                  activePreset === 'industrial'
                    ? 'border-rose-500 bg-rose-950/40 text-rose-200'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-semibold text-rose-400">Caustic Spill</div>
                <div className="text-[10px] text-slate-500 mt-0.5">pH 9.45, DO crash</div>
              </button>

              <button
                onClick={() => loadPreset('agricultural')}
                className={`px-2.5 py-2 rounded-lg border text-xs font-medium text-left transition-all ${
                  activePreset === 'agricultural'
                    ? 'border-amber-500 bg-amber-950/40 text-amber-200'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-semibold text-amber-400">Agri Runoff</div>
                <div className="text-[10px] text-slate-500 mt-0.5">High turbidity, low DO</div>
              </button>

              <button
                onClick={() => loadPreset('acid_mine')}
                className={`px-2.5 py-2 rounded-lg border text-xs font-medium text-left transition-all ${
                  activePreset === 'acid_mine'
                    ? 'border-purple-500 bg-purple-950/40 text-purple-200'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-semibold text-purple-400">Acid Drainage</div>
                <div className="text-[10px] text-slate-500 mt-0.5">pH 4.8, high EC & TDS</div>
              </button>
            </div>
          </div>

          {/* Sliders for the 6 Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* 1. pH */}
            <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/60">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-slate-300 font-medium">pH (Acidity/Basicity)</span>
                <span className={`font-mono font-bold ${ph < 6.5 || ph > 8.5 ? 'text-rose-400' : 'text-teal-400'}`}>
                  {ph.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="3.0"
                max="12.0"
                step="0.05"
                value={ph}
                onChange={e => {
                  setPh(parseFloat(e.target.value));
                  setActivePreset('custom');
                }}
                className="w-full accent-teal-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                <span>3.0 (Acidic)</span>
                <span className="text-teal-500/80">Safe: 6.5 - 8.5</span>
                <span>12.0 (Alkaline)</span>
              </div>
            </div>

            {/* 2. Turbidity */}
            <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/60">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-slate-300 font-medium">Turbidity (NTU)</span>
                <span className={`font-mono font-bold ${turbidity > 5.0 ? 'text-amber-400' : 'text-teal-400'}`}>
                  {turbidity.toFixed(1)} NTU
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="35.0"
                step="0.1"
                value={turbidity}
                onChange={e => {
                  setTurbidity(parseFloat(e.target.value));
                  setActivePreset('custom');
                }}
                className="w-full accent-teal-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                <span>0.0 (Clear)</span>
                <span className="text-teal-500/80">Safe: &le; 5.0 NTU</span>
                <span>35.0 (Opaque)</span>
              </div>
            </div>

            {/* 3. Dissolved Oxygen */}
            <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/60">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-slate-300 font-medium">Dissolved Oxygen (mg/L)</span>
                <span className={`font-mono font-bold ${dissolvedOxygen < 5.0 ? 'text-rose-400' : 'text-teal-400'}`}>
                  {dissolvedOxygen.toFixed(1)} mg/L
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="14.0"
                step="0.1"
                value={dissolvedOxygen}
                onChange={e => {
                  setDissolvedOxygen(parseFloat(e.target.value));
                  setActivePreset('custom');
                }}
                className="w-full accent-teal-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                <span className="text-rose-400">&lt; 3.0 (Hypoxic)</span>
                <span className="text-teal-500/80">Safe: &ge; 5.0 mg/L</span>
                <span>14.0 (Saturated)</span>
              </div>
            </div>

            {/* 4. Temperature */}
            <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/60">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-slate-300 font-medium">Temperature (°C)</span>
                <span className={`font-mono font-bold ${temperature > 28.0 ? 'text-amber-400' : 'text-teal-400'}`}>
                  {temperature.toFixed(1)} °C
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="40.0"
                step="0.5"
                value={temperature}
                onChange={e => {
                  setTemperature(parseFloat(e.target.value));
                  setActivePreset('custom');
                }}
                className="w-full accent-teal-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                <span>0.0 °C</span>
                <span className="text-teal-500/80">Safe: 2 - 28 °C</span>
                <span>40.0 °C</span>
              </div>
            </div>

            {/* 5. Total Dissolved Solids (TDS) */}
            <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/60">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-slate-300 font-medium">TDS (mg/L)</span>
                <span className={`font-mono font-bold ${tds > 500 ? 'text-amber-400' : 'text-teal-400'}`}>
                  {tds} mg/L
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="1500"
                step="10"
                value={tds}
                onChange={e => {
                  setTds(parseInt(e.target.value));
                  setActivePreset('custom');
                }}
                className="w-full accent-teal-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                <span>10 mg/L</span>
                <span className="text-teal-500/80">Safe: &le; 500 mg/L</span>
                <span>1500 mg/L</span>
              </div>
            </div>

            {/* 6. Electrical Conductivity (EC) */}
            <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/60">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-slate-300 font-medium">Conductivity (µS/cm)</span>
                <span className={`font-mono font-bold ${ec > 800 ? 'text-amber-400' : 'text-teal-400'}`}>
                  {ec} µS/cm
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="2500"
                step="25"
                value={ec}
                onChange={e => {
                  setEc(parseInt(e.target.value));
                  setActivePreset('custom');
                }}
                className="w-full accent-teal-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                <span>50 µS/cm</span>
                <span className="text-teal-500/80">Safe: &le; 800 µS/cm</span>
                <span>2500 µS/cm</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Live Model Inference Output */}
        <div className="lg:col-span-5 p-5 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-800 mb-4">
              <span className="text-[10px] font-mono text-teal-400 uppercase tracking-wider font-semibold">
                Isolation Forest ML Output
              </span>
              <h3 className="font-semibold text-slate-100 text-sm mt-0.5">
                Real-Time Inference Results
              </h3>
            </div>

            {/* Result Display */}
            {liveInference ? (
              <div className="space-y-4">
                {/* Score & Severity Card */}
                <div className={`p-4 rounded-xl border ${
                  liveInference.severity === 'Critical'
                    ? 'border-rose-900/80 bg-rose-950/30 text-rose-200'
                    : liveInference.severity === 'High'
                    ? 'border-amber-900/80 bg-amber-950/30 text-amber-200'
                    : liveInference.severity === 'Medium'
                    ? 'border-yellow-900/80 bg-yellow-950/30 text-yellow-200'
                    : 'border-emerald-900/80 bg-emerald-950/30 text-emerald-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase font-mono font-medium tracking-wider text-slate-400">
                        Anomaly Severity
                      </div>
                      <div className="text-xl font-bold font-sans mt-0.5">
                        {liveInference.severity} Alert
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs uppercase font-mono font-medium tracking-wider text-slate-400">
                        ML Outlier Score
                      </div>
                      <div className="text-xl font-bold font-mono">
                        {liveInference.anomaly_score}
                        <span className="text-xs font-normal text-slate-400"> / 1.0</span>
                      </div>
                    </div>
                  </div>

                  {/* Violations Pill Tags */}
                  {liveInference.violated_parameters?.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap gap-1.5">
                      <span className="text-xs text-slate-400 font-medium">Breached Parameters:</span>
                      {liveInference.violated_parameters.map((p: string) => (
                        <span
                          key={p}
                          className="px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-800/50 rounded text-[11px] font-mono font-bold"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Root Cause Explanation */}
                <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-950">
                  <h5 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    Automated Root-Cause Explanation
                  </h5>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {liveInference.explanation}
                  </p>
                </div>

                {/* Feature Attribution Breakdown (%) */}
                {liveInference.parameter_contributions && (
                  <div>
                    <h5 className="text-xs font-semibold text-slate-400 mb-2 font-mono">
                      Parameter Attribution to Anomaly (% Variance):
                    </h5>
                    <div className="space-y-1.5">
                      {Object.entries(liveInference.parameter_contributions).map(([param, pct]: any) => (
                        <div key={param} className="text-xs">
                          <div className="flex justify-between font-mono text-[11px] mb-0.5">
                            <span className="capitalize text-slate-400">{param.replace('_', ' ')}</span>
                            <span className="text-slate-300 font-bold">{pct}%</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1.5">
                            <div
                              className="bg-teal-500 h-1.5 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl">
                <Activity className="w-8 h-8 text-teal-400/50 mx-auto mb-2 animate-pulse" />
                <p className="text-xs text-slate-400">
                  Adjust parameter sliders on the left or select a scenario preset, then click <strong className="text-teal-300">Run Isolation Forest</strong> to inspect anomaly scores.
                </p>
                <button
                  onClick={runTestInference}
                  className="mt-4 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-lg text-xs font-medium"
                >
                  Test Sample Now
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono text-center">
            Isolation Forest Model: 150 Estimators · Contamination: 8% · Unsupervised
          </div>
        </div>
      </div>

      {/* Historical Anomaly Results Records */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50">
        <h3 className="font-semibold text-slate-100 text-sm mb-4">
          Historical Anomaly Records Log
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                <th className="py-2.5 pr-4">ID</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Score</th>
                <th className="py-2.5 px-4">Breached Parameters</th>
                <th className="py-2.5 px-4">Scientific Explanation</th>
                <th className="py-2.5 pl-4 text-right">Detected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {anomalies.map(anom => {
                const isCrit = anom.severity === 'Critical';
                const isHigh = anom.severity === 'High';

                return (
                  <tr key={anom.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 pr-4 font-bold text-slate-200">
                      #{anom.id}
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        isCrit
                          ? 'bg-rose-950 text-rose-300 border border-rose-800/50'
                          : isHigh
                          ? 'bg-amber-950 text-amber-300 border border-amber-800/50'
                          : 'bg-yellow-950 text-yellow-300 border border-yellow-800/50'
                      }`}>
                        {anom.severity}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-200">
                      {anom.anomaly_score.toFixed(3)}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-300">
                      {anom.violated_parameters?.join(', ') || 'Multivariate divergence'}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-400 text-xs max-w-md truncate">
                      {anom.explanation}
                    </td>
                    <td className="py-3 pl-4 text-right text-slate-500 text-[11px]">
                      {new Date(anom.detected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
