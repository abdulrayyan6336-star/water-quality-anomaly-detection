import React, { useState } from 'react';
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Edit3, 
  Radio, 
  Activity, 
  Calendar, 
  ShieldAlert, 
  X,
  CheckCircle2
} from 'lucide-react';
import { Station } from '../types';

interface StationsViewProps {
  stations: Station[];
  onAddStation: (station: Partial<Station>) => Promise<void>;
  onUpdateStation: (id: number, station: Partial<Station>) => Promise<void>;
  onDeleteStation: (id: number) => Promise<void>;
}

export const StationsView: React.FC<StationsViewProps> = ({
  stations,
  onAddStation,
  onUpdateStation,
  onDeleteStation,
}) => {
  const [filterBasin, setFilterBasin] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);

  // Form states
  const [stationCode, setStationCode] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [basin, setBasin] = useState<string>('Hudson River Valley');
  const [locationDescription, setLocationDescription] = useState<string>('');
  const [latitude, setLatitude] = useState<number>(42.65);
  const [longitude, setLongitude] = useState<number>(-73.75);
  const [status, setStatus] = useState<'active' | 'maintenance' | 'offline'>('active');
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [sensorHealthScore, setSensorHealthScore] = useState<number>(95.0);

  const basins = Array.from(new Set(stations.map(s => s.basin)));

  const filteredStations = stations.filter(s => {
    if (filterBasin !== 'all' && s.basin !== filterBasin) return false;
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    return true;
  });

  const openCreateModal = () => {
    setEditingStation(null);
    setStationCode(`STN-NEW-${Math.floor(10 + Math.random() * 90)}`);
    setName('');
    setBasin('Hudson River Valley');
    setLocationDescription('');
    setLatitude(42.65);
    setLongitude(-73.75);
    setStatus('active');
    setRiskLevel('medium');
    setSensorHealthScore(95.0);
    setIsModalOpen(true);
  };

  const openEditModal = (stn: Station) => {
    setEditingStation(stn);
    setStationCode(stn.station_code);
    setName(stn.name);
    setBasin(stn.basin);
    setLocationDescription(stn.location_description);
    setLatitude(stn.latitude);
    setLongitude(stn.longitude);
    setStatus(stn.status);
    setRiskLevel(stn.risk_level);
    setSensorHealthScore(stn.sensor_health_score);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStation) {
      await onUpdateStation(editingStation.id, {
        name,
        basin,
        location_description: locationDescription,
        latitude,
        longitude,
        status,
        risk_level: riskLevel,
        sensor_health_score: sensorHealthScore,
      });
    } else {
      await onAddStation({
        station_code: stationCode,
        name,
        basin,
        location_description: locationDescription,
        latitude,
        longitude,
        status,
        risk_level: riskLevel,
        sensor_health_score: sensorHealthScore,
        installation_date: new Date().toISOString().split('T')[0],
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-teal-400" />
            Monitoring Stations Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Geographic coordinates, basin topologies, and sensor health telemetry
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Monitoring Station
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/50 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Basin:</span>
          <select
            value={filterBasin}
            onChange={e => setFilterBasin(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200"
          >
            <option value="all">All River Basins ({stations.length})</option>
            {basins.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Status:</span>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200"
          >
            <option value="all">All Operational Statuses</option>
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      </div>

      {/* Station Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStations.map(stn => {
          const isCrit = stn.risk_level === 'critical';
          const isHigh = stn.risk_level === 'high';

          return (
            <div
              key={stn.id}
              className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur flex flex-col justify-between hover:border-slate-700 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        stn.status === 'active' ? 'bg-emerald-400' : stn.status === 'maintenance' ? 'bg-amber-400' : 'bg-rose-400'
                      }`} />
                      <span className="font-semibold text-slate-100 text-sm">{stn.name}</span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      {stn.station_code} · {stn.basin}
                    </div>
                  </div>

                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wider ${
                    isCrit
                      ? 'bg-rose-950 text-rose-300 border border-rose-800/50'
                      : isHigh
                      ? 'bg-amber-950 text-amber-300 border border-amber-800/50'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                  }`}>
                    {stn.risk_level} Risk
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                  {stn.location_description || 'Standard watershed surveillance probe.'}
                </p>

                {/* Metrics Breakdown */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>GPS Coordinates:</span>
                    <span className="font-mono text-slate-200">
                      {stn.latitude.toFixed(4)}, {stn.longitude.toFixed(4)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-400">
                    <span>Sensor Telemetry Health:</span>
                    <span className={`font-mono font-bold ${
                      stn.sensor_health_score > 90 ? 'text-emerald-400' : stn.sensor_health_score > 75 ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {stn.sensor_health_score}%
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>Installed:</span>
                    <span className="font-mono text-slate-300">{stn.installation_date}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  onClick={() => openEditModal(stn)}
                  className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => onDeleteStation(stn.id)}
                  className="px-2.5 py-1 text-xs text-rose-300 hover:text-rose-100 bg-rose-950/60 hover:bg-rose-900 border border-rose-900/60 rounded transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Station Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-slate-100 text-sm">
                {editingStation ? 'Edit Monitoring Station' : 'Register New Monitoring Station'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Station Code</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingStation}
                    value={stationCode}
                    onChange={e => setStationCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Station Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mohawk River Basin Intake"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-medium">Basin / Watershed</label>
                <input
                  type="text"
                  required
                  value={basin}
                  onChange={e => setBasin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-medium">Location Description</label>
                <textarea
                  rows={2}
                  value={locationDescription}
                  onChange={e => setLocationDescription(e.target.value)}
                  placeholder="Proximity to intake, agricultural runoff, industrial effluent, etc."
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={latitude}
                    onChange={e => setLatitude(parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={longitude}
                    onChange={e => setLongitude(parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-2 text-slate-200"
                  >
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Risk Tier</label>
                  <select
                    value={riskLevel}
                    onChange={e => setRiskLevel(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-2 text-slate-200"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Sensor Health %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={sensorHealthScore}
                    onChange={e => setSensorHealthScore(parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono"
                  />
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
                  Save Station
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
