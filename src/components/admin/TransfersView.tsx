import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Currency, Transfer, TransferStatus } from '../../types';
import { asNumber, normalizeTransfer, readApiError, apiFetch } from '../../utils/api';
import {
  Search,
  Filter,
  ArrowUpRight,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  Building,
} from 'lucide-react';
import { TransferDetailModal } from './TransferDetailModal';

interface TransfersViewProps {
  selectedTransferId?: string | null;
  onClearSelectedTransfer?: () => void;
}

export const TransfersView: React.FC<TransfersViewProps> = ({
  selectedTransferId,
  onClearSelectedTransfer,
}) => {
  const { token } = useAuth();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currencyFilter, setCurrencyFilter] = useState<string>('ALL');
  const [payoutMethodFilter, setPayoutMethodFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModalTransferId, setActiveModalTransferId] = useState<string | null>(selectedTransferId || null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (selectedTransferId) {
      setActiveModalTransferId(selectedTransferId);
    }
  }, [selectedTransferId]);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (currencyFilter !== 'ALL') params.append('currency', currencyFilter);
      if (payoutMethodFilter !== 'ALL') params.append('payoutMethod', payoutMethodFilter);
      if (searchQuery) params.append('search', searchQuery);

      const res = await apiFetch(`/api/admin/transfers?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(readApiError(json, `Transfer request failed (${res.status}).`));
      const records = Array.isArray(json) ? json : Array.isArray(json.transfers) ? json.transfers : [];
      setTransfers(records.map(normalizeTransfer));
    } catch (err) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'Unable to load transfers.');
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, [statusFilter, currencyFilter, payoutMethodFilter, token]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransfers();
  };

  const getStatusBadge = (status: TransferStatus) => {
    switch (status) {
      case 'PAID':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'COMPLIANCE_REVIEW':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'PROCESSING':
      case 'PAYOUT_PENDING':
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
    { value: 'CREATED', label: 'Created' },
    { value: 'COMPLIANCE_REVIEW', label: 'Compliance Review' },
    { value: 'PROCESSING', label: 'Processing' },
    { value: 'PAYOUT_PENDING', label: 'Payout Pending' },
    { value: 'PAID', label: 'Paid Out (Completed)' },
    { value: 'FAILED', label: 'Failed' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'REFUNDED', label: 'Refunded' },
  ];

  const currencies: Currency[] = ['SAR', 'AED', 'QAR', 'KWD', 'OMR', 'MYR', 'SGD', 'BHD', 'MVR', 'EUR', 'USD', 'GBP', 'BDT'];
  const payoutMethods = ['ALL', 'BKASH', 'NAGAD', 'ROCKET', 'BANK', 'BANK_TRANSFER'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Send Money (Outbound Transfers) Management
            </h1>
            <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-mono px-2 py-0.5 rounded font-bold">
              {transfers.length} Transactions
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review compliance flags, monitor real-time FX conversion, and authorize Bangladesh disbursements.
          </p>
        </div>

        <button
          onClick={fetchTransfers}
          className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-200 shadow-sm transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          <span>Sync Transfers</span>
        </button>
      </div>

      {errorMessage && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          <span>{errorMessage}</span>
          <button onClick={fetchTransfers} className="rounded-lg bg-white px-3 py-1.5 font-semibold text-rose-700 shadow-sm">Retry</button>
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
              placeholder="Search by Transfer ID, Sender, Beneficiary Name, Phone, Payout Ref..."
              className="w-full bg-slate-100 border border-transparent focus:border-slate-300 focus:bg-white rounded-lg pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-2">
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
              <option value="ALL">All Source Currencies</option>
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={payoutMethodFilter}
              onChange={(e) => setPayoutMethodFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {payoutMethods.map((m) => (
                <option key={m} value={m}>
                  {m === 'ALL' ? 'All Payout Methods' : m}
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

      {/* Transfers Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4">Transfer ID</th>
                <th className="py-3 px-4">Sender</th>
                <th className="py-3 px-4">Source Amount</th>
                <th className="py-3 px-4">FX Rate</th>
                <th className="py-3 px-4">Payout (BDT)</th>
                <th className="py-3 px-4">Beneficiary</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="py-12 text-center text-slate-400">Loading transfer records...</td></tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    {errorMessage ? 'Transfer records could not be loaded.' : 'No transfers found matching your filters.'}
                  </td>
                </tr>
              ) : (
                transfers.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    onClick={() => setActiveModalTransferId(tx.id)}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {tx.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{tx.senderName}</div>
                      <div className="text-[11px] text-slate-500">{tx.country}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-900 text-sm">
                        {asNumber(tx.payableForeignAmount || tx.amount).toLocaleString()} {tx.currency}
                      </div>
                      <div className="font-mono text-[11px] text-emerald-600 font-bold">
                        → ৳ {asNumber(tx.bdtAmount).toLocaleString()} BDT
                      </div>
                      {tx.couponCode && (
                        <div className="text-[10px] font-mono text-purple-600">Coupon: {tx.couponCode} (-{tx.bonusPercent}%)</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-blue-600 font-semibold">
                      1 = {asNumber(tx.fxRate)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-emerald-600 text-sm">
                        ৳ {asNumber(tx.bdtAmount).toLocaleString()} BDT
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        {tx.payoutMethod}{tx.accountType ? ` (${tx.accountType})` : ''}{tx.bankName ? ` • ${tx.bankName}` : ''} • {tx.payoutAccountNumber}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {['BKASH','NAGAD','ROCKET'].includes((tx.payoutMethod||'').toUpperCase()) ? (
                        <>
                          <div className="font-mono text-[11px] text-slate-700 font-bold">{tx.payoutAccountNumber}</div>
                          <div className="text-[10px] font-mono text-slate-500">{tx.accountType ? `${tx.accountType} • ` : ''}{tx.payoutMethod}</div>
                        </>
                      ) : (
                        <>
                          <div className="font-semibold text-slate-800">{tx.recipientName}</div>
                          <div className="font-mono text-[11px] text-slate-500">{tx.payoutAccountNumber}</div>
                          {tx.bankName && <div className="text-[10px] text-slate-500">{tx.bankName}</div>}
                        </>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(tx.status)}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveModalTransferId(tx.id);
                        }}
                        className="bg-slate-100 group-hover:bg-blue-600 text-slate-700 group-hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm"
                      >
                        Inspect &amp; Clear
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {activeModalTransferId && (
        <TransferDetailModal
          transferId={activeModalTransferId}
          onClose={() => {
            setActiveModalTransferId(null);
            onClearSelectedTransfer?.();
          }}
          onRefresh={fetchTransfers}
        />
      )}
    </div>
  );
};
