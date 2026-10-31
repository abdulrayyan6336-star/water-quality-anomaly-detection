import React from 'react';
import { 
  Activity, 
  AlertTriangle, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  ShieldAlert, 
  ArrowRight,
  Database,
  Radio
} from 'lucide-react';
import { Station, Sample, AnomalyResult, Alert, SamplingPriority } from '../types';

interface DashboardViewProps {
  stations: Station[];
  samples: Sample[];
  anomalies: AnomalyResult[];
  alerts: Alert[];
  priorities: SamplingPriority[];
  onNavigateTab: (tab: string) => void;
  onSelectStation: (stationId: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stations,
  samples,
  anomalies,
  alerts,
  priorities,
  onNavigateTab,
  onSelectStation,
}) => {
  const activeAlerts = alerts.filter(a => !a.is_read);
  const criticalCount = alerts.filter(a => a.severity === 'Critical' && !a.is_read).length;
  const highPriorityStations = priorities.filter(p => p.category === 'High Priority');
  const anomalyCount = anomalies.filter(a => a.is_anomaly).length;

  const totalSamples = samples.length;
  const healthIndex = Math.max(20, Math.round((100 - (anomalyCount / (totalSamples || 1)) * 20 - highPriorityStations.length * 5) * 10) / 10);

  return (
    <div className="space-y-6">
      {/* Critical Alert Banner if any critical unread alerts */}
      {criticalCount > 0 && (
        <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-950/30 text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <h4 className="font-semibold text-rose-100 text-sm">
                Critical Water Quality Anomaly Detected ({criticalCount} Action Required)
              </h4>
              <p className="text-xs text-rose-300">
                Severe hypoxia or caustic pH excursion registered at Lower Estuary Industrial Outfall. Immediate inspection dispatched.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('alerts')}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors self-end sm:self-auto"
          >
            Review Incidents
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Overall Water Health Index */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Watershed Health Index</span>
            <Activity className="w-4 h-4 text-teal-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-100 font-mono">
              {healthIndex}
            </span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
          <div className="mt-3 text-xs flex items-center gap-1 text-slate-400">
            <span className="text-teal-400 font-medium">Composite score</span>
            <span>·</span>
            <span>Based on 6 limnological parameters</span>
          </div>
        </div>

        {/* KPI 2: Total Monitoring Stations */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Active Stations</span>
            <MapPin className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-100 font-mono">
              {stations.filter(s => s.status === 'active').length}
            </span>
            <span className="text-xs text-slate-400">of {stations.length} online</span>
          </div>
          <div className="mt-3 text-xs flex items-center gap-1 text-slate-400">
            <span className="text-emerald-400 font-medium">96.4%</span>
            <span>telemetry uptime across basins</span>
          </div>
        </div>

        {/* KPI 3: AI Anomalies Detected */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">ML Anomalies Flagged</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-amber-300 font-mono">
              {anomalyCount}
            </span>
            <span className="text-xs text-slate-400">out of {totalSamples} samples</span>
          </div>
          <div className="mt-3 text-xs flex items-center gap-1 text-slate-400">
            <span className="text-amber-400 font-medium font-mono">Isolation Forest</span>
            <span>·</span>
            <span>Unsupervised inference</span>
          </div>
        </div>

        {/* KPI 4: High Priority Sampling Stations */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">High Sampling Priority</span>
            <Clock className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-rose-300 font-mono">
              {highPriorityStations.length}
            </span>
            <span className="text-xs text-slate-400">stations &gt; 75/100 score</span>
          </div>
          <div className="mt-3 text-xs flex items-center gap-1 text-slate-400">
            <span className="text-rose-400 font-medium">&lt; 24h dispatch</span>
            <span>recommended</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Watershed Station Status + High Priority Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Geographic & Telemetry Station Board */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">Watershed Monitoring Stations</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time sensor telemetry, coordinates, and health indices
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('stations')}
              className="text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1"
            >
              Manage Stations
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {stations.map(stn => {
              const priority = priorities.find(p => p.station_id === stn.id);
              const score = priority ? priority.priority_score : 50;
              const isHigh = score >= 75;
              const isMed = score >= 40 && score < 75;

              return (
                <div
                  key={stn.id}
                  onClick={() => {
                    onSelectStation(stn.id);
                    onNavigateTab('stations');
                  }}
                  className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/70 hover:border-slate-700 cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${
                          stn.status === 'active' ? 'bg-emerald-400' : stn.status === 'maintenance' ? 'bg-amber-400' : 'bg-rose-400'
                        }`} />
                        <span className="font-medium text-slate-200 text-sm hover:text-teal-300 transition-colors">
                          {stn.name}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        {stn.station_code} · {stn.basin}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-xs font-mono font-bold ${
                        isHigh ? 'text-rose-400' : isMed ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {score}/100
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                        {priority?.category || 'Priority'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-slate-500" />
                      <span>Health: {stn.sensor_health_score}%</span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-500">
                      {stn.latitude.toFixed(3)}, {stn.longitude.toFixed(3)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: High Priority Sampling Dispatch Recommendations */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="font-semibold text-slate-100 text-sm">Smart Sampling Schedule</h3>
                <p className="text-xs text-slate-400 mt-0.5">Algorithmic ranking for field lab audits</p>
              </div>
              <button
                onClick={() => onNavigateTab('priorities')}
                className="text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1"
              >
                Full Algorithm
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {priorities.slice(0, 3).map((p, idx) => {
                const isHigh = p.category === 'High Priority';
                return (
                  <div
                    key={p.station_id}
                    className={`p-3 rounded-lg border ${
                      isHigh
                        ? 'border-rose-900/60 bg-rose-950/20 text-rose-200'
                        : 'border-slate-800 bg-slate-950/50 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-[11px] font-mono flex items-center justify-center text-slate-300 font-bold">
                          #{idx + 1}
                        </span>
                        <span className="font-medium text-xs text-slate-100">{p.station_name}</span>
                      </div>
                      <span className={`text-xs font-mono font-bold ${
                        isHigh ? 'text-rose-400' : 'text-amber-400'
                      }`}>
                        {p.priority_score} pts
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {p.recommendation_reason}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>Dispatch: {p.recommended_date}</span>
                      <span>Last test: {p.days_since_last_sample}d ago</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-center">
            <button
              onClick={() => onNavigateTab('priorities')}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
            >
              Generate New Schedule & Recalculate
            </button>
          </div>
        </div>
      </div>

      {/* Recent Ingested Telemetry Samples Feed */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div>
            <h3 className="font-semibold text-slate-100 text-sm">Recent Water Quality Telemetry</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live incoming parameter readings (pH, Turbidity, DO, Temp, TDS, EC)
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('samples')}
            className="text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1"
          >
            All Samples
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                <th className="py-2.5 pr-4">Sample ID</th>
                <th className="py-2.5 px-4">Station</th>
                <th className="py-2.5 px-3">pH</th>
                <th className="py-2.5 px-3">Turbidity</th>
                <th className="py-2.5 px-3">DO (mg/L)</th>
                <th className="py-2.5 px-3">TDS (mg/L)</th>
                <th className="py-2.5 px-3">EC (µS/cm)</th>
                <th className="py-2.5 px-3">Source</th>
                <th className="py-2.5 pl-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {samples.slice(0, 5).map(s => {
                const anom = anomalies.find(a => a.sample_id === s.id);
                const isBad = anom?.is_anomaly;

                return (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 pr-4 font-bold text-slate-200">
                      {s.sample_id}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-300">
                      {s.location_name}
                    </td>
                    <td className={`py-3 px-3 ${s.ph < 6.5 || s.ph > 8.5 ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                      {s.ph.toFixed(2)}
                    </td>
                    <td className={`py-3 px-3 ${s.turbidity > 5.0 ? 'text-amber-400 font-bold' : 'text-slate-300'}`}>
                      {s.turbidity.toFixed(2)} NTU
                    </td>
                    <td className={`py-3 px-3 ${s.dissolved_oxygen < 5.0 ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                      {s.dissolved_oxygen.toFixed(2)}
                    </td>
                    <td className={`py-3 px-3 ${s.tds > 500 ? 'text-amber-400' : 'text-slate-300'}`}>
                      {s.tds.toFixed(0)}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {s.electrical_conductivity.toFixed(0)}
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <span className={`text-[11px] px-2 py-0.5 rounded ${
                        s.source_type === 'sensor'
                          ? 'bg-sky-950 text-sky-400 border border-sky-800/50'
                          : s.source_type === 'manual'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800/50'
                          : 'bg-amber-950 text-amber-400 border border-amber-800/50'
                      }`}>
                        {s.source_type}
                      </span>
                    </td>
                    <td className="py-3 pl-4 text-right text-slate-500 text-[11px]">
                      {new Date(s.collected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
