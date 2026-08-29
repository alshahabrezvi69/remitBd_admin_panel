import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AuditLog } from '../../types';
import {
  History,
  Search,
  Filter,
  RefreshCw,
  Shield,
  Eye,
  Lock,
  Code,
} from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [resourceFilter, setResourceFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const url = resourceFilter === 'ALL' ? '/api/admin/audit-logs' : `/api/admin/audit-logs?resource=${resourceFilter}`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        setLogs(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [resourceFilter, token]);

  const resources = ['ALL', 'DEPOSIT', 'TRANSFER', 'USER', 'KYC', 'FX_RATE', 'FUNDING_ACCOUNT', 'PAYMENT_METHOD', 'RECONCILIATION', 'AUTH'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Chronological Regulatory Audit Trail
            </h1>
            <span className="bg-purple-50 text-purple-700 border border-purple-200 text-xs font-mono px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
              <Lock className="w-3 h-3 text-purple-600" />
              <span>SOC2 / ISO 27001 Immutable Log</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tamper-evident logs of every administrative review, approval, balance change, rate override, and security action.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-200 shadow-sm transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          <span>Refresh Audit Trail</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        {resources.map((r) => (
          <button
            key={r}
            onClick={() => setResourceFilter(r)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              resourceFilter === r
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Admin Operator</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Resource &amp; ID</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4 text-right font-sans">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {logs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                    {new Date(log.createdAt).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900">{log.adminName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{log.adminId}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-200">
                      {log.adminRole}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800 font-mono text-xs">{log.resource}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{log.resourceId}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                    {log.ipAddress}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLog(log);
                      }}
                      className="bg-slate-50 hover:bg-purple-600 text-slate-700 hover:text-white border border-slate-200 hover:border-purple-600 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm"
                    >
                      Inspect Diff
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Diff Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
          <div className="bg-white border border-slate-200 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="font-bold text-slate-900 text-sm">
                Audit Record #{selectedLog.id} &bull; {selectedLog.action}
              </span>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto bg-white">
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 font-medium">Operator:</span>{' '}
                  <span className="font-bold text-slate-900">{selectedLog.adminName}</span> ({selectedLog.adminRole})
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Target Entity:</span>{' '}
                  <span className="font-mono text-blue-600 font-semibold">{selectedLog.resource}:{selectedLog.resourceId}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Timestamp:</span>{' '}
                  <span className="font-mono text-slate-700">{new Date(selectedLog.createdAt).toISOString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">IP &amp; Client:</span>{' '}
                  <span className="font-mono text-slate-700">{selectedLog.ipAddress}</span>
                </div>
              </div>

              {selectedLog.reason && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-800 text-xs">
                  <span className="font-bold">Logged Justification:</span> {selectedLog.reason}
                </div>
              )}

              {/* State Diffs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <span>Pre-Action State</span>
                  </div>
                  <pre className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] font-mono text-slate-700 max-h-60 overflow-auto">
                    {JSON.stringify(selectedLog.oldState, null, 2) || '{}'}
                  </pre>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <span>Post-Action State</span>
                  </div>
                  <pre className="bg-slate-50 border border-emerald-200 rounded-xl p-3 text-[11px] font-mono text-emerald-800 max-h-60 overflow-auto">
                    {JSON.stringify(selectedLog.newState, null, 2) || '{}'}
                  </pre>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200"
                >
                  Close Diff Inspector
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
