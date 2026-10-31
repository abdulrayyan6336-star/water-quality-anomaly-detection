import React from 'react';
import { Waves, ShieldAlert, Cpu, UserCheck } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeAlertCount: number;
  currentRole: 'admin' | 'analyst' | 'technician';
  setCurrentRole: (role: 'admin' | 'analyst' | 'technician') => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeAlertCount,
  currentRole,
  setCurrentRole,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Executive Dashboard' },
    { id: 'priorities', label: 'Smart Prioritizer (0-100)' },
    { id: 'anomaly', label: 'AI Anomaly Detection' },
    { id: 'stations', label: 'Monitoring Stations' },
    { id: 'samples', label: 'Water Quality Samples' },
    { id: 'alerts', label: `Alerts${activeAlertCount > 0 ? ` (${activeAlertCount})` : ''}` },
    { id: 'trends', label: 'Trends & Analytics' },
    { id: 'api', label: 'REST API & Swagger' },
    { id: 'code', label: 'Backend Architecture' },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Waves className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 tracking-tight text-lg">AquaShield AI</span>
                <span className="text-xs px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800/60 font-mono">
                  v1.0.0
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Water Quality Anomaly Detection & Smart Sampling Prioritizer
              </p>
            </div>
          </div>

          {/* User Role Switcher & System Telemetry */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 border border-slate-800 rounded-md px-3 py-1.5 bg-slate-950">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Backend REST API</span>
              <span className="text-slate-600">|</span>
              <span className="font-mono text-emerald-400">200 OK</span>
            </div>

            {/* Role Switcher */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 hidden lg:inline">Active Role:</span>
              <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                {(['admin', 'analyst', 'technician'] as const).map(role => (
                  <button
                    key={role}
                    onClick={() => setCurrentRole(role)}
                    className={`px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors ${
                      currentRole === role
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto py-2 no-scrollbar border-t border-slate-800/60">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-teal-300 font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
