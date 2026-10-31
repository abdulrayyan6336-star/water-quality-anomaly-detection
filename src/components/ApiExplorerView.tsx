import React, { useState } from 'react';
import { 
  Terminal, 
  Play, 
  Copy, 
  Check, 
  ExternalLink, 
  Code, 
  Layers, 
  Clock,
  Sparkles
} from 'lucide-react';

interface Endpoint {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  path: string;
  category: string;
  description: string;
  defaultBody?: string;
  defaultParams?: Record<string, string>;
}

export const ApiExplorerView: React.FC = () => {
  const endpoints: Endpoint[] = [
    {
      method: 'GET',
      path: '/api/dashboard',
      category: 'Dashboard',
      description: 'Retrieve consolidated executive KPIs, active alerts, and watershed health index',
    },
    {
      method: 'GET',
      path: '/api/sampling/priorities',
      category: 'Smart Prioritizer',
      description: 'Get ranked monitoring stations calculated on 0-100 multi-criteria score',
    },
    {
      method: 'POST',
      path: '/api/sampling/recommend',
      category: 'Smart Prioritizer',
      description: 'Recalculate priorities and generate actionable field dispatch schedule',
      defaultBody: JSON.stringify({ force_recalculate: true }, null, 2),
    },
    {
      method: 'POST',
      path: '/api/anomaly/detect',
      category: 'AI Anomaly',
      description: 'Run on-demand Isolation Forest ML model and regulatory threshold checks',
      defaultBody: JSON.stringify({
        ph: 9.35,
        turbidity: 14.5,
        dissolved_oxygen: 2.9,
        temperature: 26.5,
        tds: 680,
        electrical_conductivity: 950
      }, null, 2),
    },
    {
      method: 'GET',
      path: '/api/anomaly/results',
      category: 'AI Anomaly',
      description: 'List historical anomaly detection results with root-cause explanations',
    },
    {
      method: 'GET',
      path: '/api/stations',
      category: 'Stations',
      description: 'Retrieve all monitoring stations with health score and GPS coordinates',
    },
    {
      method: 'POST',
      path: '/api/stations',
      category: 'Stations',
      description: 'Register a new monitoring station',
      defaultBody: JSON.stringify({
        station_code: `STN-VAL-${Math.floor(10 + Math.random() * 90)}`,
        name: 'Valley Stream Tributary Station',
        basin: 'Mohawk River Basin',
        location_description: 'Agricultural confluence checkpoint',
        latitude: 42.755,
        longitude: -74.125,
        status: 'active',
        risk_level: 'medium',
        sensor_health_score: 97.0,
        installation_date: '2026-10-31'
      }, null, 2),
    },
    {
      method: 'GET',
      path: '/api/samples',
      category: 'Samples',
      description: 'List ingested water quality readings with optional station/source filter',
    },
    {
      method: 'POST',
      path: '/api/samples',
      category: 'Samples',
      description: 'Ingest water quality sample and auto-trigger Isolation Forest inference',
      defaultBody: JSON.stringify({
        station_id: 1,
        location_name: 'Upper Hudson Intake Reserve',
        ph: 7.42,
        turbidity: 2.1,
        dissolved_oxygen: 8.7,
        temperature: 16.5,
        tds: 215,
        electrical_conductivity: 310,
        source_type: 'sensor'
      }, null, 2),
    },
    {
      method: 'GET',
      path: '/api/analytics/trends',
      category: 'Analytics',
      description: 'Get chronological multi-parameter trends for charting',
    },
    {
      method: 'GET',
      path: '/api/analytics/summary',
      category: 'Analytics',
      description: 'Analytical summary of watershed risks and violation hotspots',
    },
    {
      method: 'GET',
      path: '/api/alerts',
      category: 'Alerts',
      description: 'Retrieve active water quality alerts (unsafe pH, low DO, high turbidity, TDS)',
    },
    {
      method: 'PATCH',
      path: '/api/alerts/ALT-2026-001/read',
      category: 'Alerts',
      description: 'Acknowledge an alert as read by alert_id',
    },
    {
      method: 'POST',
      path: '/api/auth/login',
      category: 'Authentication',
      description: 'Authenticate and receive JWT bearer access token',
      defaultBody: JSON.stringify({ username: 'admin', password: 'AdminPassword123!' }, null, 2),
    },
    {
      method: 'GET',
      path: '/api/docs/openapi.json',
      category: 'Swagger/OpenAPI',
      description: 'OpenAPI 3.0 specification for automated Swagger UI generation',
    }
  ];

  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint>(endpoints[0]);
  const [requestBody, setRequestBody] = useState<string>(endpoints[0].defaultBody || '');
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<string | null>(null);
  const [responseBody, setResponseBody] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const handleSelectEndpoint = (ep: Endpoint) => {
    setSelectedEndpoint(ep);
    setRequestBody(ep.defaultBody || '');
    setResponseBody(null);
    setResponseStatus(null);
    setLatency(null);
  };

  const handleExecute = async () => {
    setIsLoading(true);
    const startTime = performance.now();

    try {
      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_jwt_token_analyst',
        },
      };

      if (['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method) && requestBody) {
        options.body = requestBody;
      }

      const res = await fetch(selectedEndpoint.path, options);
      const endTime = performance.now();
      setLatency(Math.round(endTime - startTime));
      setResponseStatus(res.status);

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const json = await res.json();
        setResponseBody(JSON.stringify(json, null, 2));
      } else {
        const text = await res.text();
        setResponseBody(text);
      }
    } catch (err: any) {
      setResponseStatus(500);
      setResponseBody(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  const copyCurl = () => {
    let curl = `curl -X ${selectedEndpoint.method} "http://localhost:3000${selectedEndpoint.path}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <JWT_ACCESS_TOKEN>"`;
    if (['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method) && requestBody) {
      curl += ` \\\n  -d '${requestBody.replace(/\n/g, '')}'`;
    }
    navigator.clipboard.writeText(curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-teal-400" />
            Interactive REST API Console & Swagger Explorer
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Test all 15+ backend endpoints live in-browser with real JSON responses, JWT auth, and cURL commands
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyCurl}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            {copied ? 'cURL Copied' : 'Copy cURL Command'}
          </button>
        </div>
      </div>

      {/* Main Grid: Endpoint Selector List (Left 4 cols) + Request/Response Console (Right 8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Endpoint Selector List */}
        <div className="lg:col-span-4 p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-2 max-h-[680px] overflow-y-auto">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold mb-2">
            Available API Endpoints ({endpoints.length})
          </div>

          {endpoints.map((ep, idx) => {
            const isSelected = selectedEndpoint.path === ep.path && selectedEndpoint.method === ep.method;
            const isGet = ep.method === 'GET';
            const isPost = ep.method === 'POST';
            const isPatch = ep.method === 'PATCH';

            return (
              <div
                key={idx}
                onClick={() => handleSelectEndpoint(ep)}
                className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'border-teal-500 bg-slate-800 ring-1 ring-teal-500/30'
                    : 'border-slate-800/80 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    isGet
                      ? 'bg-sky-950 text-sky-400 border border-sky-800/60'
                      : isPost
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                      : 'bg-purple-950 text-purple-400 border border-purple-800/60'
                  }`}>
                    {ep.method}
                  </span>
                  <span className="font-mono text-xs text-slate-200 font-semibold truncate">
                    {ep.path}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-1">
                  {ep.description}
                </div>
              </div>
            );
          })}
        </div>

        {/* Request & Response Workbench */}
        <div className="lg:col-span-8 space-y-4">
          {/* Endpoint Bar & Execute Button */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded ${
                selectedEndpoint.method === 'GET'
                  ? 'bg-sky-950 text-sky-400 border border-sky-800/60'
                  : selectedEndpoint.method === 'POST'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                  : 'bg-purple-950 text-purple-400 border border-purple-800/60'
              }`}>
                {selectedEndpoint.method}
              </span>
              <span className="font-mono text-sm font-semibold text-slate-100">
                {selectedEndpoint.path}
              </span>
            </div>

            <button
              onClick={handleExecute}
              disabled={isLoading}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors self-end sm:self-auto"
            >
              <Play className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Executing...' : 'Execute Request'}
            </button>
          </div>

          {/* Description & Auth Notice */}
          <div className="px-4 py-2 rounded-lg bg-slate-900/40 border border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
            <span>{selectedEndpoint.description}</span>
            <span className="font-mono text-[11px] text-teal-400">JWT Bearer Enabled</span>
          </div>

          {/* Request Payload Editor (if POST/PUT/PATCH) */}
          {['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method) && (
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                <span className="text-xs font-semibold text-slate-300 font-mono">Request Body (JSON)</span>
                <span className="text-[10px] text-slate-500 font-mono">application/json</span>
              </div>
              <textarea
                rows={7}
                value={requestBody}
                onChange={e => setRequestBody(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-xs text-teal-200 font-mono focus:outline-hidden focus:border-teal-500/70"
              />
            </div>
          )}

          {/* Live Response Panel */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-300 font-mono">Server Response</span>
                {responseStatus !== null && (
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    responseStatus >= 200 && responseStatus < 300
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                      : 'bg-rose-950 text-rose-400 border border-rose-800/60'
                  }`}>
                    {responseStatus} {responseStatus === 200 ? 'OK' : responseStatus === 201 ? 'CREATED' : responseStatus === 204 ? 'NO CONTENT' : 'ERROR'}
                  </span>
                )}
              </div>

              {latency !== null && (
                <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-teal-400" />
                  <span>{latency} ms latency</span>
                </div>
              )}
            </div>

            {responseBody ? (
              <pre className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto max-h-96 leading-relaxed">
                {responseBody}
              </pre>
            ) : (
              <div className="p-10 text-center border border-dashed border-slate-800 rounded-lg text-slate-500 text-xs font-mono">
                Click "Execute Request" above to trigger this endpoint against the server.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
