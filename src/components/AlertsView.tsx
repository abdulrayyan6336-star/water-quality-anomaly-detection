import React, { useState } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Check, 
  Clock, 
  MapPin, 
  Filter,
  Volume2
} from 'lucide-react';
import { Alert } from '../types';

interface AlertsViewProps {
  alerts: Alert[];
  onMarkRead: (alertId: string) => Promise<void>;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  onMarkRead,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);

  const filteredAlerts = alerts.filter(a => {
    if (unreadOnly && a.is_read) return false;
    if (filterSeverity !== 'all' && a.severity.toLowerCase() !== filterSeverity.toLowerCase()) return false;
    return true;
  });

  const unreadCount = alerts.filter(a => !a.is_read).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            Water Quality Alert & Incident Management Desk
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time threshold breaches (Unsafe pH, Hypoxia &lt; 5.0 mg/L, High Turbidity, Abnormal TDS)
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Unresolved Incidents:</span>
          <span className="font-mono px-2.5 py-1 rounded-md bg-rose-950 text-rose-300 border border-rose-800/60 font-bold">
            {unreadCount} Active
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Severity Filter:</span>
          <select
            value={filterSeverity}
            onChange={e => setFilterSeverity(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical Only</option>
            <option value="high">High Only</option>
            <option value="medium">Medium Only</option>
            <option value="low">Low Only</option>
          </select>
        </div>

        <label className="flex items-center gap-2 cursor-pointer text-slate-300">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={e => setUnreadOnly(e.target.checked)}
            className="accent-teal-500 rounded"
          />
          Show Unread Only ({unreadCount})
        </label>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="p-10 rounded-xl border border-dashed border-slate-800 text-center text-slate-500 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-400/60 mx-auto mb-2" />
            No matching incidents found for the selected filter.
          </div>
        ) : (
          filteredAlerts.map(alert => {
            const isCrit = alert.severity === 'Critical';
            const isHigh = alert.severity === 'High';

            return (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  !alert.is_read
                    ? isCrit
                      ? 'border-rose-900/80 bg-rose-950/25 ring-1 ring-rose-500/30'
                      : 'border-slate-700 bg-slate-900/90'
                    : 'border-slate-800/60 bg-slate-950/40 opacity-75'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg shrink-0 ${
                    isCrit
                      ? 'bg-rose-500/20 text-rose-400'
                      : isHigh
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-200">
                        {alert.alert_id}
                      </span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.2 rounded tracking-wider ${
                        isCrit
                          ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                          : isHigh
                          ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                          : 'bg-yellow-950 text-yellow-300 border border-yellow-800/60'
                      }`}>
                        {alert.severity}
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-teal-400 font-medium">
                        Parameter: {alert.parameter}
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 font-medium mt-1">
                      {alert.message}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono mt-1.5">
                      <span>Station: {alert.station_name || `Station #${alert.station_id}`}</span>
                      <span>·</span>
                      <span>{new Date(alert.triggered_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 self-end sm:self-center">
                  {!alert.is_read ? (
                    <button
                      onClick={() => onMarkRead(alert.alert_id)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                    >
                      <Check className="w-3.5 h-3.5 text-teal-400" />
                      Mark Acknowledged
                    </button>
                  ) : (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Acknowledged
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
