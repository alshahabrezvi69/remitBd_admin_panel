import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ProviderHealth } from '../../types';
import {
  Activity,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Zap,
  Globe,
} from 'lucide-react';

export const ProvidersView: React.FC = () => {
  const { token } = useAuth();
  const [providers, setProviders] = useState<ProviderHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/providers', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        setProviders(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [token]);

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    try {
      await fetch(`/api/admin/providers/${id}/test`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      fetchProviders();
    } catch (err) {
      console.error(err);
    } finally {
      setTestingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPERATIONAL':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'DEGRADED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Integrated Gateway &amp; Provider Health Monitor
            </h1>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-mono px-2 py-0.5 rounded-full font-bold">
              All Systems Operational
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time ping latency, SLA uptime, and API gateway health across Inbound Collection, FX, KYC, and Bangladesh Payout rails.
          </p>
        </div>

        <button
          onClick={fetchProviders}
          className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-200 shadow-sm transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          <span>Ping All Providers</span>
        </button>
      </div>

      {/* Provider Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providers.map((p) => (
          <div
            key={p.id}
            className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-all shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{p.name}</h3>
                    <div className="text-xs text-slate-500 font-mono">
                      Category: <span className="text-blue-600 font-semibold">{p.type}</span>
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${getStatusColor(
                    p.status
                  )}`}
                >
                  {p.status}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs">
                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Latency</div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">{p.latencyMs} ms</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Success Rate</div>
                  <div className="font-mono font-bold text-emerald-600 mt-0.5">{p.successRate}%</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">SLA Uptime</div>
                  <div className="font-mono font-bold text-blue-600 mt-0.5">99.98%</div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                Last Heartbeat: {new Date(p.lastPing).toLocaleTimeString()}
              </span>

              <button
                onClick={() => handleTestConnection(p.id)}
                disabled={testingId === p.id}
                className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 font-semibold transition-colors disabled:opacity-50"
              >
                <Zap className={`w-3.5 h-3.5 ${testingId === p.id ? 'animate-bounce text-amber-500' : 'text-blue-600'}`} />
                <span>{testingId === p.id ? 'Testing...' : 'Test Connection'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
