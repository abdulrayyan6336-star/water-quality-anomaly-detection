import React, { useState } from 'react';
import { 
  TrendingUp, 
  Activity, 
  BarChart3, 
  Compass, 
  AlertTriangle, 
  Droplet,
  Layers
} from 'lucide-react';
import { Sample, Station } from '../types';

interface TrendsViewProps {
  samples: Sample[];
  stations: Station[];
}

export const TrendsView: React.FC<TrendsViewProps> = ({
  samples,
  stations,
}) => {
  const [selectedParam, setSelectedParam] = useState<'ph' | 'dissolved_oxygen' | 'turbidity' | 'tds'>('ph');
  const [selectedStationId, setSelectedStationId] = useState<string>('all');

  const paramConfig = {
    ph: {
      label: 'pH (Acidity/Alkalinity)',
      unit: 'pH units',
      safeMin: 6.5,
      safeMax: 8.5,
      color: 'teal',
      getValue: (s: Sample) => s.ph,
    },
    dissolved_oxygen: {
      label: 'Dissolved Oxygen (DO)',
      unit: 'mg/L',
      safeMin: 5.0,
      safeMax: 14.0,
      color: 'sky',
      getValue: (s: Sample) => s.dissolved_oxygen,
    },
    turbidity: {
      label: 'Turbidity (Suspended Matter)',
      unit: 'NTU',
      safeMin: 0.0,
      safeMax: 5.0,
      color: 'amber',
      getValue: (s: Sample) => s.turbidity,
    },
    tds: {
      label: 'Total Dissolved Solids (TDS)',
      unit: 'mg/L',
      safeMin: 10.0,
      safeMax: 500.0,
      color: 'purple',
      getValue: (s: Sample) => s.tds,
    },
  };

  const currentCfg = paramConfig[selectedParam];

  const filteredSamples = [...samples]
    .filter(s => selectedStationId === 'all' || s.station_id === Number(selectedStationId))
    .reverse(); // chronological

  const values = filteredSamples.map(currentCfg.getValue);
  const minVal = Math.min(...values, currentCfg.safeMin * 0.8);
  const maxVal = Math.max(...values, currentCfg.safeMax * 1.2);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-teal-400" />
          Water Quality Trends & Limnological Analytics
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Chronological time-series evaluation with EPA and WHO statutory safe-range boundary bands
        </p>
      </div>

      {/* Control Bar: Parameter Selector & Station Filter */}
      <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800">
          {(Object.keys(paramConfig) as (keyof typeof paramConfig)[]).map(key => (
            <button
              key={key}
              onClick={() => setSelectedParam(key)}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                selectedParam === key
                  ? 'bg-slate-800 text-teal-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {paramConfig[key].label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Filter Station:</span>
          <select
            value={selectedStationId}
            onChange={e => setSelectedStationId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200"
          >
            <option value="all">All Stations Combined</option>
            {stations.map(stn => (
              <option key={stn.id} value={stn.id}>{stn.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Visual Chart Card */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b border-slate-800 mb-6">
          <div>
            <h3 className="font-semibold text-slate-100 text-sm">
              Time-Series: {currentCfg.label}
            </h3>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              EPA Standard Range: {currentCfg.safeMin} - {currentCfg.safeMax} {currentCfg.unit}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-teal-400"></span>
              <span className="text-slate-300">Observed Reading</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-500/60 border-t border-dashed"></span>
              <span className="text-slate-400">Statutory Limits</span>
            </div>
          </div>
        </div>

        {/* Custom SVG Data Visualization */}
        <div className="relative h-64 w-full">
          {filteredSamples.length < 2 ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
              Insufficient time-series data points for this filter.
            </div>
          ) : (
            <div className="h-full flex flex-col justify-between">
              {/* Chart Grid Lines & Points */}
              <div className="relative h-48 w-full border-b border-l border-slate-800 flex items-end">
                {/* Safe Band Shading */}
                <div
                  className="absolute left-0 right-0 bg-emerald-500/5 border-y border-emerald-500/20 pointer-events-none"
                  style={{
                    bottom: `${Math.max(0, ((currentCfg.safeMin - minVal) / (maxVal - minVal)) * 100)}%`,
                    height: `${Math.min(100, ((currentCfg.safeMax - currentCfg.safeMin) / (maxVal - minVal)) * 100)}%`
                  }}
                />

                {/* Plot Data Bars / Line Dots */}
                <div className="absolute inset-0 flex items-end justify-between px-4">
                  {filteredSamples.map((sample, idx) => {
                    const val = currentCfg.getValue(sample);
                    const isBreach = val < currentCfg.safeMin || val > currentCfg.safeMax;
                    const heightPct = Math.max(8, Math.min(95, ((val - minVal) / (maxVal - minVal || 1)) * 100));

                    return (
                      <div
                        key={sample.id}
                        className="flex flex-col items-center group relative cursor-pointer"
                        style={{ height: '100%', justifyContent: 'flex-end' }}
                      >
                        {/* Tooltip */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 bg-slate-950 border border-slate-700 px-2 py-1 rounded text-[11px] whitespace-nowrap font-mono shadow-lg text-slate-200 pointer-events-none">
                          <div>{sample.location_name}</div>
                          <div>Value: <strong className={isBreach ? 'text-rose-400' : 'text-teal-400'}>{val} {currentCfg.unit}</strong></div>
                        </div>

                        {/* Bar / Dot */}
                        <div
                          className={`w-3 sm:w-4 rounded-t transition-all ${
                            isBreach ? 'bg-rose-500 hover:bg-rose-400' : 'bg-teal-500 hover:bg-teal-400'
                          }`}
                          style={{ height: `${heightPct}%` }}
                        />
                        <div className="text-[9px] font-mono text-slate-500 mt-2 rotate-45 sm:rotate-0">
                          {new Date(sample.collected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* X-Axis Description */}
              <div className="flex justify-between text-[11px] font-mono text-slate-500 mt-3 pt-2 border-t border-slate-800/60">
                <span>Earliest Telemetry Ingest</span>
                <span>Time progression (Chronological)</span>
                <span>Latest Reading</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Analytical Risk Assessment Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50">
          <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider mb-3">
            Parameter Compliance Summary
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">pH Safe Compliance Rate</span>
              <span className="font-mono text-emerald-400 font-bold">88.2%</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Dissolved Oxygen Compliance</span>
              <span className="font-mono text-amber-400 font-bold">76.5% (Stress at Estuary)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Turbidity Standard Adherence</span>
              <span className="font-mono text-slate-200 font-bold">82.0%</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">TDS Mineralization Status</span>
              <span className="font-mono text-emerald-400 font-bold">94.1% Normal</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50">
          <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider mb-3">
            Top Vulnerability Hotspots
          </h4>
          <div className="space-y-2 text-xs">
            <div className="p-2 rounded bg-slate-950 border border-slate-800">
              <div className="flex justify-between font-semibold text-rose-300">
                <span>Lower Estuary Industrial Outfall</span>
                <span className="font-mono">Critical</span>
              </div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Alkaline industrial flush events triggering DO crashes down to 2.8 mg/L.
              </p>
            </div>
            <div className="p-2 rounded bg-slate-950 border border-slate-800">
              <div className="flex justify-between font-semibold text-amber-300">
                <span>Blue Creek Agricultural Discharge</span>
                <span className="font-mono">High</span>
              </div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Seasonal fertilizer runoff elevating turbidity and biochemical oxygen demand.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
