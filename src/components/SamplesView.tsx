import React, { useState } from 'react';
import { 
  Droplet, 
  Plus, 
  Radio, 
  FlaskConical, 
  Cpu, 
  Search, 
  Filter, 
  X, 
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { Sample, Station } from '../types';

interface SamplesViewProps {
  samples: Sample[];
  stations: Station[];
  onIngestSample: (sampleData: any) => Promise<void>;
}

export const SamplesView: React.FC<SamplesViewProps> = ({
  samples,
  stations,
  onIngestSample,
}) => {
  const [stationFilter, setStationFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState<boolean>(false);

  // Form state
  const [stationId, setStationId] = useState<number>(stations[0]?.id || 1);
  const [locationName, setLocationName] = useState<string>('');
  const [ph, setPh] = useState<number>(7.4);
  const [turbidity, setTurbidity] = useState<number>(2.1);
  const [dissolvedOxygen, setDissolvedOxygen] = useState<number>(8.8);
  const [temperature, setTemperature] = useState<number>(17.5);
  const [tds, setTds] = useState<number>(220);
  const [ec, setEc] = useState<number>(340);
  const [sourceType, setSourceType] = useState<'sensor' | 'manual' | 'simulated'>('manual');

  const filteredSamples = samples.filter(s => {
    if (stationFilter !== 'all' && s.station_id !== Number(stationFilter)) return false;
    if (sourceFilter !== 'all' && s.source_type !== sourceFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        s.sample_id.toLowerCase().includes(q) ||
        s.location_name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const stn = stations.find(s => s.id === Number(stationId));
    await onIngestSample({
      station_id: Number(stationId),
      location_name: locationName || stn?.name || 'Monitoring Site',
      ph: Number(ph),
      turbidity: Number(turbidity),
      dissolved_oxygen: Number(dissolvedOxygen),
      temperature: Number(temperature),
      tds: Number(tds),
      electrical_conductivity: Number(ec),
      source_type: sourceType,
      collected_at: new Date().toISOString(),
    });
    setIsModalOpen(false);
  };

  const handleSimulateIoT = async (scenario: 'normal' | 'anomaly_spike' | 'gradual_drift') => {
    const stn = stations[Math.floor(Math.random() * stations.length)];
    let samplePayload: any;

    if (scenario === 'normal') {
      samplePayload = {
        station_id: stn.id,
        location_name: stn.name,
        ph: Number((7.2 + Math.random() * 0.4).toFixed(2)),
        turbidity: Number((1.5 + Math.random() * 1.5).toFixed(2)),
        dissolved_oxygen: Number((8.0 + Math.random() * 1.5).toFixed(2)),
        temperature: Number((16.0 + Math.random() * 3.0).toFixed(1)),
        tds: Math.floor(190 + Math.random() * 50),
        electrical_conductivity: Math.floor(290 + Math.random() * 70),
        source_type: 'simulated',
        collected_at: new Date().toISOString(),
      };
    } else if (scenario === 'anomaly_spike') {
      samplePayload = {
        station_id: stn.id,
        location_name: stn.name,
        ph: Number((9.2 + Math.random() * 0.6).toFixed(2)),
        turbidity: Number((18.0 + Math.random() * 10.0).toFixed(2)),
        dissolved_oxygen: Number((2.2 + Math.random() * 1.2).toFixed(2)),
        temperature: Number((26.0 + Math.random() * 4.0).toFixed(1)),
        tds: Math.floor(750 + Math.random() * 300),
        electrical_conductivity: Math.floor(1100 + Math.random() * 400),
        source_type: 'simulated',
        collected_at: new Date().toISOString(),
      };
    } else {
      samplePayload = {
        station_id: stn.id,
        location_name: stn.name,
        ph: 6.2,
        turbidity: 8.5,
        dissolved_oxygen: 4.8,
        temperature: 21.0,
        tds: 520,
        electrical_conductivity: 780,
        source_type: 'simulated',
        collected_at: new Date().toISOString(),
      };
    }

    await onIngestSample(samplePayload);
    setIsSimulateModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header and Ingestion Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Droplet className="w-5 h-5 text-teal-400" />
            Water Quality Data Management & Telemetry Ingestion
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time and manual laboratory water quality parameter records
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSimulateModalOpen(true)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Cpu className="w-4 h-4" />
            Simulate IoT Stream
          </button>

          <button
            onClick={() => {
              setSourceType('manual');
              setIsModalOpen(true);
            }}
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ingest Water Sample
          </button>
        </div>
      </div>

      {/* Simulated Data Transparency Notice */}
      <div className="p-3 rounded-lg border border-amber-900/40 bg-amber-950/20 text-xs text-amber-200/90 flex items-center gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong>Data Integrity Standard:</strong> Sensor and manual laboratory readings are strictly segregated from synthetic test events. Simulated IoT records are explicitly tagged as <code className="font-mono bg-amber-950 px-1 rounded text-amber-300">simulated</code>.
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Station:</span>
            <select
              value={stationFilter}
              onChange={e => setStationFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200"
            >
              <option value="all">All Monitoring Stations</option>
              {stations.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.station_code})</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Source:</span>
            <select
              value={sourceFilter}
              onChange={e => setSourceFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200"
            >
              <option value="all">All Sources</option>
              <option value="sensor">Sensor Telemetry</option>
              <option value="manual">Manual Lab Grab</option>
              <option value="simulated">Simulated IoT</option>
            </select>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search sample ID or location..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-1 text-slate-200 text-xs placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Samples Table */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                <th className="py-2.5 pr-4">Sample ID</th>
                <th className="py-2.5 px-4">Station & Location</th>
                <th className="py-2.5 px-3">pH</th>
                <th className="py-2.5 px-3">Turbidity</th>
                <th className="py-2.5 px-3">DO (mg/L)</th>
                <th className="py-2.5 px-3">Temp (°C)</th>
                <th className="py-2.5 px-3">TDS (mg/L)</th>
                <th className="py-2.5 px-3">EC (µS/cm)</th>
                <th className="py-2.5 px-3">Source</th>
                <th className="py-2.5 pl-4 text-right">Collection Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredSamples.map(s => {
                const isBadPh = s.ph < 6.5 || s.ph > 8.5;
                const isBadDo = s.dissolved_oxygen < 5.0;
                const isBadTurb = s.turbidity > 5.0;
                const isBadTds = s.tds > 500;

                return (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 pr-4 font-bold text-slate-200">
                      {s.sample_id}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-300">
                      <div>{s.location_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">Station #{s.station_id}</div>
                    </td>
                    <td className={`py-3 px-3 ${isBadPh ? 'text-rose-400 font-bold' : 'text-slate-200'}`}>
                      {s.ph.toFixed(2)}
                    </td>
                    <td className={`py-3 px-3 ${isBadTurb ? 'text-amber-400 font-bold' : 'text-slate-200'}`}>
                      {s.turbidity.toFixed(2)}
                    </td>
                    <td className={`py-3 px-3 ${isBadDo ? 'text-rose-400 font-bold' : 'text-slate-200'}`}>
                      {s.dissolved_oxygen.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-slate-200">
                      {s.temperature.toFixed(1)}°
                    </td>
                    <td className={`py-3 px-3 ${isBadTds ? 'text-amber-400' : 'text-slate-200'}`}>
                      {s.tds.toFixed(0)}
                    </td>
                    <td className="py-3 px-3 text-slate-200">
                      {s.electrical_conductivity.toFixed(0)}
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wider ${
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
                      {new Date(s.collected_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Sample Ingestion Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-teal-400" />
                Ingest Laboratory Water Sample
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-medium">Monitoring Station</label>
                <select
                  value={stationId}
                  onChange={e => setStationId(parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200"
                >
                  {stations.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.station_code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-medium">Location Name / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Sampling Dock Pier 4"
                  value={locationName}
                  onChange={e => setLocationName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">pH (0 - 14)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="14"
                    required
                    value={ph}
                    onChange={e => setPh(parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Turbidity (NTU)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={turbidity}
                    onChange={e => setTurbidity(parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Dissolved Oxygen (mg/L)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={dissolvedOxygen}
                    onChange={e => setDissolvedOxygen(parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Temperature (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={temperature}
                    onChange={e => setTemperature(parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">TDS (mg/L)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={tds}
                    onChange={e => setTds(parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Conductivity (µS/cm)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={ec}
                    onChange={e => setEc(parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-medium">Source Type</label>
                <div className="flex gap-4 text-xs text-slate-300">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="sourceType"
                      checked={sourceType === 'manual'}
                      onChange={() => setSourceType('manual')}
                      className="accent-teal-500"
                    />
                    Manual Field Grab
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="sourceType"
                      checked={sourceType === 'sensor'}
                      onChange={() => setSourceType('sensor')}
                      className="accent-teal-500"
                    />
                    Direct In-Situ Sensor
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold"
                >
                  Save & Evaluate Anomaly
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Simulate IoT Stream Modal */}
      {isSimulateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <Cpu className="w-4 h-4 text-teal-400" />
                Simulate IoT Ingestion Stream
              </h3>
              <button
                onClick={() => setIsSimulateModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Inject synthetic telemetry packets into the processing pipeline to verify Isolation Forest scoring and real-time alert trigger mechanisms.
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => handleSimulateIoT('normal')}
                className="w-full p-3 rounded-lg border border-slate-800 bg-slate-950 hover:border-emerald-500 text-left transition-all text-xs"
              >
                <div className="font-semibold text-emerald-400">1. Normal Water Quality Packet</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Standard limnological readings within WHO/EPA drinking bounds.
                </div>
              </button>

              <button
                onClick={() => handleSimulateIoT('anomaly_spike')}
                className="w-full p-3 rounded-lg border border-slate-800 bg-slate-950 hover:border-rose-500 text-left transition-all text-xs"
              >
                <div className="font-semibold text-rose-400">2. Severe Chemical Spill Packet</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  High caustic pH 9.4, severe DO depletion &lt; 3.0 mg/L, high turbidity.
                </div>
              </button>

              <button
                onClick={() => handleSimulateIoT('gradual_drift')}
                className="w-full p-3 rounded-lg border border-slate-800 bg-slate-950 hover:border-amber-500 text-left transition-all text-xs"
              >
                <div className="font-semibold text-amber-400">3. Agricultural Runoff Packet</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Mild acidity, elevated suspended particulates, moderate hypoxia.
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
