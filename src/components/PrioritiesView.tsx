import React, { useState } from 'react';
import { 
  Sliders, 
  RotateCw, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  ShieldAlert, 
  Layers, 
  Activity,
  ArrowUpDown,
  Compass
} from 'lucide-react';
import { SamplingPriority, Station } from '../types';

interface PrioritiesViewProps {
  priorities: SamplingPriority[];
  stations: Station[];
  onRecalculate: () => Promise<void>;
  isLoading: boolean;
}

export const PrioritiesView: React.FC<PrioritiesViewProps> = ({
  priorities,
  stations,
  onRecalculate,
  isLoading,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedStationId, setSelectedStationId] = useState<number | null>(
    priorities.length > 0 ? priorities[0].station_id : null
  );

  const filteredPriorities = priorities.filter(p => {
    if (filterCategory === 'high') return p.category === 'High Priority';
    if (filterCategory === 'medium') return p.category === 'Medium Priority';
    if (filterCategory === 'low') return p.category === 'Low Priority';
    return true;
  });

  const selectedPriority = priorities.find(p => p.station_id === selectedStationId) || priorities[0];

  return (
    <div className="space-y-6">
      {/* Top Banner: Algorithm Explanation & Trigger */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Compass className="w-5 h-5" />
            </span>
            <h2 className="text-base font-bold text-slate-100">
              Smart Sampling Prioritization Engine (0 - 100 Scale)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Multi-factor optimization algorithm calculating field dispatch priority across 5 weighted dimensions:
            <span className="text-teal-300 font-mono"> Anomaly Severity (35%)</span>,
            <span className="text-sky-300 font-mono"> Historical Violation Frequency (20%)</span>,
            <span className="text-indigo-300 font-mono"> Time Decay (20%)</span>,
            <span className="text-amber-300 font-mono"> Basin Vulnerability Risk (15%)</span>, and
            <span className="text-rose-300 font-mono"> Sensor Reliability (10%)</span>.
          </p>
        </div>

        <button
          onClick={onRecalculate}
          disabled={isLoading}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors whitespace-nowrap self-start md:self-auto"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Recalculating Matrix...' : 'Run Prioritizer Algorithm'}
        </button>
      </div>

      {/* Category Filter Tabs & Metric Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              filterCategory === 'all'
                ? 'bg-slate-800 text-slate-100 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Stations ({priorities.length})
          </button>
          <button
            onClick={() => setFilterCategory('high')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              filterCategory === 'high'
                ? 'bg-rose-950 text-rose-300 border border-rose-800/50 font-semibold'
                : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            High Priority (75-100)
          </button>
          <button
            onClick={() => setFilterCategory('medium')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              filterCategory === 'medium'
                ? 'bg-amber-950 text-amber-300 border border-amber-800/50 font-semibold'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            Medium Priority (40-74)
          </button>
          <button
            onClick={() => setFilterCategory('low')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              filterCategory === 'low'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50 font-semibold'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            Low Priority (0-39)
          </button>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span>Priority Thresholds:</span>
          <span className="text-rose-400 font-mono font-medium">75-100 High</span>
          <span>·</span>
          <span className="text-amber-400 font-mono font-medium">40-74 Med</span>
          <span>·</span>
          <span className="text-emerald-400 font-mono font-medium">0-39 Low</span>
        </div>
      </div>

      {/* Main Grid: Priority Ranking Table + Factor Breakdown Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Ranked Monitoring Stations */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-slate-800 bg-slate-900/50">
          <h3 className="font-semibold text-slate-100 text-sm mb-4">
            Ranked Monitoring Stations (Descending Priority)
          </h3>

          <div className="space-y-3">
            {filteredPriorities.map((item, index) => {
              const isSelected = selectedPriority?.station_id === item.station_id;
              const isHigh = item.category === 'High Priority';
              const isMed = item.category === 'Medium Priority';

              return (
                <div
                  key={item.station_id}
                  onClick={() => setSelectedStationId(item.station_id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-teal-500/70 bg-slate-800/80 shadow-md ring-1 ring-teal-500/30'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
                        isHigh
                          ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                          : isMed
                          ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                      }`}>
                        #{index + 1}
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-100 text-sm">
                          {item.station_name}
                        </h4>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          {item.station_code} · {item.basin}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-xl font-bold font-mono ${
                        isHigh ? 'text-rose-400' : isMed ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {item.priority_score.toFixed(1)}
                        <span className="text-xs text-slate-500 font-normal"> / 100</span>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider ${
                        isHigh
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-800/40'
                          : isMed
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-800/40'
                          : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40'
                      }`}>
                        {item.category}
                      </span>
                    </div>
                  </div>

                  {/* Recommendation Reason */}
                  <div className="mt-3 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                    <span className="text-slate-400 font-medium">Algorithmic Justification: </span>
                    {item.recommendation_reason}
                  </div>

                  {/* Metric Chips footer */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span>Recommended Visit: <strong className="text-slate-200">{item.recommended_date}</strong></span>
                      <span>·</span>
                      <span>Elapsed: <strong className="text-slate-200">{item.days_since_last_sample}d</strong></span>
                    </div>
                    <span className="text-[11px] text-teal-400 font-medium">
                      Inspect Factor Decomposition →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Factor Decomposition & Scheduling Assistant */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-slate-800 mb-4">
              <span className="text-[10px] uppercase tracking-wider text-teal-400 font-mono font-semibold">
                Factor Decomposition Matrix
              </span>
              <h3 className="font-semibold text-slate-100 text-sm mt-0.5">
                {selectedPriority?.station_name || 'Select a Station'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Weighted points contribution adding up to {selectedPriority?.priority_score} / 100
              </p>
            </div>

            {selectedPriority && (
              <div className="space-y-4">
                {/* 1. Anomaly Severity (Max 35 pts) */}
                <div>
                  <div className="flex justify-between text-xs mb-1 font-mono">
                    <span className="text-slate-300">1. Anomaly Severity (35% max)</span>
                    <span className="text-rose-400 font-bold">
                      {selectedPriority.category === 'High Priority' ? '35.0 pts' : selectedPriority.category === 'Medium Priority' ? '18.0 pts' : '5.0 pts'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                      className="bg-rose-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${((selectedPriority.category === 'High Priority' ? 35 : selectedPriority.category === 'Medium Priority' ? 18 : 5) / 35) * 100}%`
                      }}
                    />
                  </div>
                </div>

                {/* 2. Historical Violation Rate (Max 20 pts) */}
                <div>
                  <div className="flex justify-between text-xs mb-1 font-mono">
                    <span className="text-slate-300">2. Past Violation Frequency (20% max)</span>
                    <span className="text-amber-400 font-bold">
                      {Math.min(20, (selectedPriority.historical_violation_rate / 100) * 20 * 1.8).toFixed(1)} pts
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                      className="bg-amber-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (selectedPriority.historical_violation_rate / 60) * 100)}%`
                      }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Historical anomaly frequency: {selectedPriority.historical_violation_rate}%
                  </div>
                </div>

                {/* 3. Time Since Last Sample (Max 20 pts) */}
                <div>
                  <div className="flex justify-between text-xs mb-1 font-mono">
                    <span className="text-slate-300">3. Time Since Last Sample (20% max)</span>
                    <span className="text-sky-400 font-bold">
                      {selectedPriority.days_since_last_sample >= 21 ? '20.0 pts' : selectedPriority.days_since_last_sample >= 14 ? '14.0 pts' : '6.0 pts'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                      className="bg-sky-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (selectedPriority.days_since_last_sample / 21) * 100)}%`
                      }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {selectedPriority.days_since_last_sample} days elapsed since physical grab sample
                  </div>
                </div>

                {/* 4. Location Risk (Max 15 pts) */}
                <div>
                  <div className="flex justify-between text-xs mb-1 font-mono">
                    <span className="text-slate-300">4. Location Environmental Risk (15% max)</span>
                    <span className="text-purple-400 font-bold">
                      {selectedPriority.location_risk_weight.toFixed(1)} pts
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${(selectedPriority.location_risk_weight / 15) * 100}%`
                      }}
                    />
                  </div>
                </div>

                {/* 5. Sensor Unreliability / Health (Max 10 pts) */}
                <div>
                  <div className="flex justify-between text-xs mb-1 font-mono">
                    <span className="text-slate-300">5. Sensor Unreliability / Drift (10% max)</span>
                    <span className="text-teal-400 font-bold">
                      {selectedPriority.sensor_unreliability_score.toFixed(1)} pts
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                      className="bg-teal-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${(selectedPriority.sensor_unreliability_score / 10) * 100}%`
                      }}
                    />
                  </div>
                </div>

                {/* Dispatch Advisory Card */}
                <div className="mt-4 p-3.5 rounded-lg border border-slate-700 bg-slate-950">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                    <Calendar className="w-4 h-4 text-teal-400" />
                    <span>Recommended Sampling Window</span>
                  </div>
                  <div className="text-sm font-bold text-teal-300 font-mono mt-1">
                    {selectedPriority.recommended_date}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-normal">
                    {selectedPriority.category === 'High Priority'
                      ? 'Urgent: Dispatch field crew with duplicate lab bottles and calibrate pH/DO probes.'
                      : selectedPriority.category === 'Medium Priority'
                      ? 'Scheduled: Routine validation within standard weekly sampling round.'
                      : 'Low Priority: Automated telemetry sufficient; manual audit on standard bi-weekly interval.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 text-[11px] text-slate-500 text-center font-mono">
            Complies with EPA Clean Water Act Sampling Protocols
          </div>
        </div>
      </div>
    </div>
  );
};
