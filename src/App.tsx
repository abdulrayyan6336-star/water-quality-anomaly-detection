/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { PrioritiesView } from './components/PrioritiesView';
import { AnomalyView } from './components/AnomalyView';
import { StationsView } from './components/StationsView';
import { SamplesView } from './components/SamplesView';
import { AlertsView } from './components/AlertsView';
import { TrendsView } from './components/TrendsView';
import { ApiExplorerView } from './components/ApiExplorerView';
import { CodeInspectorView } from './components/CodeInspectorView';
import { Station, Sample, AnomalyResult, Alert, SamplingPriority } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentRole, setCurrentRole] = useState<'admin' | 'analyst' | 'technician'>('admin');
  const [selectedStationId, setSelectedStationId] = useState<number>(1);

  // Data states
  const [stations, setStations] = useState<Station[]>([]);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyResult[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [priorities, setPriorities] = useState<SamplingPriority[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPrioritizing, setIsPrioritizing] = useState<boolean>(false);

  // Fetch all initial data from REST API backend
  const loadAllData = async () => {
    try {
      const [stnRes, smpRes, anomRes, altRes, priRes] = await Promise.all([
        fetch('/api/stations').then(r => r.json()),
        fetch('/api/samples').then(r => r.json()),
        fetch('/api/anomaly/results').then(r => r.json()),
        fetch('/api/alerts').then(r => r.json()),
        fetch('/api/sampling/priorities').then(r => r.json()),
      ]);

      setStations(stnRes || []);
      setSamples(smpRes || []);
      setAnomalies(anomRes || []);
      setAlerts(altRes || []);
      setPriorities(priRes || []);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Handlers for Stations
  const handleAddStation = async (stationData: Partial<Station>) => {
    try {
      const res = await fetch('/api/stations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stationData),
      });
      if (res.ok) {
        await loadAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStation = async (id: number, stationData: Partial<Station>) => {
    try {
      const res = await fetch(`/api/stations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stationData),
      });
      if (res.ok) {
        await loadAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteStation = async (id: number) => {
    try {
      const res = await fetch(`/api/stations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handler for Samples Ingestion
  const handleIngestSample = async (sampleData: any) => {
    try {
      const res = await fetch('/api/samples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sampleData),
      });
      if (res.ok) {
        await loadAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handler for Anomaly Playground
  const handleDetectAnomaly = async (reading: any) => {
    const res = await fetch('/api/anomaly/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reading),
    });
    return res.json();
  };

  // Handler for Smart Sampling Recalculation
  const handleRecalculatePriorities = async () => {
    setIsPrioritizing(true);
    try {
      const res = await fetch('/api/sampling/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force_recalculate: true }),
      });
      if (res.ok) {
        const data = await res.json();
        setPriorities(data.ranked_stations || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsPrioritizing(false);
    }
  };

  // Handler for Alert Acknowledgment
  const handleMarkAlertRead = async (alertId: string) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}/read`, {
        method: 'PATCH',
      });
      if (res.ok) {
        setAlerts(prev =>
          prev.map(a => (a.alert_id === alertId ? { ...a, is_read: true } : a))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const activeAlertCount = alerts.filter(a => !a.is_read).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Platform Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeAlertCount={activeAlertCount}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="h-96 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-400 font-mono">
              Connecting to AquaShield AI REST Backend...
            </span>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                stations={stations}
                samples={samples}
                anomalies={anomalies}
                alerts={alerts}
                priorities={priorities}
                onNavigateTab={setActiveTab}
                onSelectStation={id => setSelectedStationId(id)}
              />
            )}

            {activeTab === 'priorities' && (
              <PrioritiesView
                priorities={priorities}
                stations={stations}
                onRecalculate={handleRecalculatePriorities}
                isLoading={isPrioritizing}
              />
            )}

            {activeTab === 'anomaly' && (
              <AnomalyView
                anomalies={anomalies}
                samples={samples}
                onDetectAnomaly={handleDetectAnomaly}
              />
            )}

            {activeTab === 'stations' && (
              <StationsView
                stations={stations}
                onAddStation={handleAddStation}
                onUpdateStation={handleUpdateStation}
                onDeleteStation={handleDeleteStation}
              />
            )}

            {activeTab === 'samples' && (
              <SamplesView
                samples={samples}
                stations={stations}
                onIngestSample={handleIngestSample}
              />
            )}

            {activeTab === 'alerts' && (
              <AlertsView
                alerts={alerts}
                onMarkRead={handleMarkAlertRead}
              />
            )}

            {activeTab === 'trends' && (
              <TrendsView
                samples={samples}
                stations={stations}
              />
            )}

            {activeTab === 'api' && <ApiExplorerView />}

            {activeTab === 'code' && <CodeInspectorView />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            AquaShield AI · Water Quality Anomaly Detection & Smart Sampling Prioritizer
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span>FastAPI 0.111+</span>
            <span>·</span>
            <span>MySQL 8.0</span>
            <span>·</span>
            <span>Isolation Forest ML</span>
            <span>·</span>
            <span>EPA Clean Water Act Protocols</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
