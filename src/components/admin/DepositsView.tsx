import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Currency, Deposit, DepositStatus } from '../../types';
import { asNumber, normalizeDeposit, readApiError } from '../../utils/api';
import {
  Search,
  Filter,
  ArrowDownLeft,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  Download,
} from 'lucide-react';
import { DepositDetailModal } from './DepositDetailModal';

interface DepositsViewProps {
  selectedDepositId?: string | null;
  onClearSelectedDeposit?: () => void;
}

export const DepositsView: React.FC<DepositsViewProps> = ({
  selectedDepositId,
  onClearSelectedDeposit,
}) => {
  const { token } = useAuth();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currencyFilter, setCurrencyFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModalDepositId, setActiveModalDepositId] = useState<string | null>(selectedDepositId || null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (selectedDepositId) {
      setActiveModalDepositId(selectedDepositId);
    }
  }, [selectedDepositId]);

  const fetchDeposits = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (currencyFilter !== 'ALL') params.append('currency', currencyFilter);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/admin/deposits?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(readApiError(json, `Deposit request failed (${res.status}).`));
      const records = Array.isArray(json) ? json : Array.isArray(json.deposits) ? json.deposits : [];
      setDeposits(records.map(normalizeDeposit));
    } catch (err) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'Unable to load deposits.');
      setDeposits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, [statusFilter, currencyFilter, token]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDeposits();
  };

  const getStatusBadge = (status: DepositStatus) => {
    switch (status) {
      case 'FUNDS_AVAILABLE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'UNDER_REVIEW':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'PAYMENT_RECEIVED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'FAILED':
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'REFUNDED':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const statuses: Array<{ value: string; label: string }> = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'PAYMENT_RECEIVED', label: 'Payment Received' },
    { value: 'UNDER_REVIEW', label: 'Under Review' },
    { value: 'FUNDS_AVAILABLE', label: 'Funds Available' },
    { value: 'FAILED', label: 'Failed' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'REFUNDED', label: 'Refunded' },
  ];

  const currencies: Currency[] = ['SAR', 'AED', 'QAR', 'KWD', 'OMR', 'MYR', 'SGD', 'BHD', 'MVR', 'EUR'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Add Money (Inbound Deposits) Management
            </h1>
            <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-mono px-2 py-0.5 rounded font-bold">
              {deposits.length} Records
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Reconcile inbound bank transfers, verify payment proofs, and credit customer wallet balances safely.
          </p>
        </div>

        <button
          onClick={fetchDeposits}
          className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-200 shadow-sm transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {errorMessage && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          <span>{errorMessage}</span>
          <button onClick={fetchDeposits} className="rounded-lg bg-white px-3 py-1.5 font-semibold text-rose-700 shadow-sm">Retry</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Deposit ID, Customer Name, Payment Ref, Provider Ref..."
              className="w-full bg-slate-100 border border-transparent focus:border-slate-300 focus:bg-white rounded-lg pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statuses.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            <select
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Currencies</option>
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Deposits Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4">Deposit ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Country &amp; Method</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Payment Reference</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="py-12 text-center text-slate-400">Loading deposit records...</td></tr>
              ) : deposits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    {errorMessage ? 'Deposit records could not be loaded.' : 'No deposits matching the selected criteria.'}
                  </td>
                </tr>
              ) : (
                deposits.map((dep) => (
                  <tr
                    key={dep.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    onClick={() => setActiveModalDepositId(dep.id)}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {dep.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{dep.userName}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[140px]">{dep.userEmail}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{dep.country}</div>
                      <div className="text-[11px] text-slate-500">{dep.paymentMethodName}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 text-sm">
                      +{asNumber(dep.amount).toLocaleString()} {dep.currency}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-slate-900 font-semibold">{dep.reference}</div>
                      <div className="font-mono text-[10px] text-slate-400">{dep.providerReference}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(dep.status)}`}>
                        {dep.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {new Date(dep.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveModalDepositId(dep.id);
                        }}
                        className="bg-slate-100 group-hover:bg-blue-600 text-slate-700 group-hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm"
                      >
                        Inspect &amp; Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal View */}
      {activeModalDepositId && (
        <DepositDetailModal
          depositId={activeModalDepositId}
          onClose={() => {
            setActiveModalDepositId(null);
            onClearSelectedDeposit?.();
          }}
          onRefresh={fetchDeposits}
        />
      )}
    </div>
  );
};
