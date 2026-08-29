import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ReconciliationRecord, ReconciliationStatus } from '../../types';
import {
  Scale,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Eye,
  Sliders,
  Check,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';

export const ReconciliationView: React.FC = () => {
  const { token, hasPermission } = useAuth();
  const [records, setRecords] = useState<ReconciliationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningRec, setRunningRec] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ReconciliationRecord | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [resolutionAction, setResolutionAction] = useState<string>('MARK_RESOLVED');
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const fetchReconciliation = async () => {
    try {
      setLoading(true);
      const url = statusFilter === 'ALL' ? '/api/admin/reconciliation' : `/api/admin/reconciliation?status=${statusFilter}`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        setRecords(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReconciliation();
  }, [statusFilter, token]);

  const handleRunReconciliation = async () => {
    setRunningRec(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/admin/reconciliation/run', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (!res.ok) {
        setStatusMsg({ type: 'error', text: json.error || 'Reconciliation run failed.' });
      } else {
        setStatusMsg({
          type: 'success',
          text: `Reconciliation completed: ${json.summary?.matchedCount || 0} matched, ${json.summary?.mismatchCount || 0} discrepancies detected.`,
        });
        fetchReconciliation();
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Network connection failed.' });
    } finally {
      setRunningRec(false);
    }
  };

  const handleResolveException = async () => {
    if (!selectedRecord) return;
    setStatusMsg(null);

    try {
      const res = await fetch(`/api/admin/reconciliation/${selectedRecord.id}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: resolutionAction, notes: resolutionNotes }),
      });

      const json = await res.json();
      if (!res.ok) {
        setStatusMsg({ type: 'error', text: json.error || 'Failed to resolve record.' });
      } else {
        setStatusMsg({ type: 'success', text: `Record ${selectedRecord.id} successfully reconciled and resolved.` });
        setSelectedRecord(null);
        setResolutionNotes('');
        fetchReconciliation();
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Network error.' });
    }
  };

  const getStatusBadge = (status: ReconciliationStatus) => {
    switch (status) {
      case 'MATCHED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'AMOUNT_MISMATCH':
      case 'DUPLICATE':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'MISSING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'REVERSED':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              3-Way Settlement &amp; Liquidity Reconciliation
            </h1>
            <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-mono px-2 py-0.5 rounded font-bold">
              Provider vs Internal vs Ledger
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Automated tri-party comparison between banking gateway settlement statements, internal orders, and the general ledger.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchReconciliation}
            className="p-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-200 shadow-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <button
            onClick={handleRunReconciliation}
            disabled={runningRec}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-all disabled:opacity-50"
          >
            <Scale className={`w-4 h-4 ${runningRec ? 'animate-spin' : ''}`} />
            <span>{runningRec ? 'Running Reconciliation Engine...' : 'Run Reconciliation Engine'}</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
            statusMsg.type === 'error'
              ? 'bg-rose-50 border border-rose-200 text-rose-700 font-medium'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium'
          }`}
        >
          {statusMsg.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-500" /> : <Check className="w-4 h-4 text-emerald-500" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        {[
          { key: 'ALL', label: 'All Records' },
          { key: 'MATCHED', label: 'Matched (Clear)' },
          { key: 'AMOUNT_MISMATCH', label: 'Amount Mismatches' },
          { key: 'MISSING', label: 'Missing Records' },
          { key: 'REVERSED', label: 'Reversals' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === tab.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reconciliation Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4">Rec ID</th>
                <th className="py-3 px-4">External Ref</th>
                <th className="py-3 px-4">Internal Ref</th>
                <th className="py-3 px-4">Provider</th>
                <th className="py-3 px-4">Provider Amount</th>
                <th className="py-3 px-4">Internal Amount</th>
                <th className="py-3 px-4">Variance</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right font-sans">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {records.map((rec) => {
                const variance = Math.abs(rec.providerAmount - rec.internalAmount);
                return (
                  <tr
                    key={rec.id}
                    onClick={() => setSelectedRecord(rec)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {rec.id}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {rec.externalReference}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {rec.internalReference}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 text-xs font-semibold">
                      {rec.provider}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {rec.providerAmount ? `${rec.providerAmount.toLocaleString()} ${rec.currency}` : '—'}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {rec.internalAmount ? `${rec.internalAmount.toLocaleString()} ${rec.currency}` : '—'}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {variance > 0 ? (
                        <span className="text-rose-600 font-bold">
                          {variance.toFixed(2)} {rec.currency}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-medium">0.00</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold border ${getStatusBadge(rec.status)}`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecord(rec);
                        }}
                        className="bg-slate-50 hover:bg-blue-600 text-slate-700 hover:text-white border border-slate-200 hover:border-blue-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm"
                      >
                        Investigate
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Exception Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
          <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="font-bold text-slate-900 text-sm">
                Reconciliation Exception: {selectedRecord.id}
              </span>
              <button onClick={() => setSelectedRecord(null)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 bg-white">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Provider Statement</div>
                  <div className="font-mono text-base font-bold text-slate-900 mt-1">
                    {selectedRecord.providerAmount} {selectedRecord.currency}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">{selectedRecord.externalReference}</div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Internal System Order</div>
                  <div className="font-mono text-base font-bold text-slate-900 mt-1">
                    {selectedRecord.internalAmount} {selectedRecord.currency}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">{selectedRecord.internalReference}</div>
                </div>
              </div>

              {selectedRecord.notes && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                  <span className="font-bold">Investigation Flag:</span> {selectedRecord.notes}
                </div>
              )}

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Resolution Action
                  </label>
                  <select
                    value={resolutionAction}
                    onChange={(e) => setResolutionAction(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="MARK_RESOLVED">Mark as Reconciled (Verified Manual Match)</option>
                    <option value="ADJUST_LEDGER">Post Reconciling Ledger Adjustment</option>
                    <option value="ISSUE_REFUND">Initiate Customer Balance Correction</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Auditor Notes
                  </label>
                  <textarea
                    rows={2}
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Enter manual bank statement confirmation or reason for clearance..."
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResolveException}
                  className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
                >
                  Apply Resolution
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
