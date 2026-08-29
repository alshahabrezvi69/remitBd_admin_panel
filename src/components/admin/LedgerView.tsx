import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Currency, LedgerEntry } from '../../types';
import {
  BookOpenCheck,
  Search,
  Filter,
  RefreshCw,
  Lock,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';

export const LedgerView: React.FC = () => {
  const { token } = useAuth();
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currencyFilter, setCurrencyFilter] = useState<string>('ALL');
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (currencyFilter !== 'ALL') params.append('currency', currencyFilter);
      if (accountTypeFilter !== 'ALL') params.append('accountType', accountTypeFilter);
      if (typeFilter !== 'ALL') params.append('type', typeFilter);

      const res = await fetch(`/api/admin/ledger?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        setEntries(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [currencyFilter, accountTypeFilter, typeFilter, token]);

  const currencies: Currency[] = ['SAR', 'AED', 'QAR', 'KWD', 'OMR', 'MYR', 'SGD', 'BHD', 'MVR', 'EUR'];

  const getTypeBadge = (type: string) => {
    if (type.includes('DEPOSIT') || type.includes('CREDIT')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (type.includes('REFUND')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    if (type.includes('DEBIT') || type.includes('TRANSFER')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Double-Entry Financial Ledger (Immutable)
            </h1>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-mono px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
              <Lock className="w-3 h-3" />
              <span>Read-Only</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Auditable double-entry accounting records. Balances are derived strictly from ledger journal entries; direct balance manipulation is disallowed.
          </p>
        </div>

        <button
          onClick={fetchLedger}
          className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-200 shadow-sm transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-wrap gap-3">
        <select
          value={currencyFilter}
          onChange={(e) => setCurrencyFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
        >
          <option value="ALL">All Currencies</option>
          {currencies.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={accountTypeFilter}
          onChange={(e) => setAccountTypeFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
        >
          <option value="ALL">All Account Types</option>
          <option value="USER_WALLET">User Wallet</option>
          <option value="PLATFORM_COLLECTION">Platform Collection</option>
          <option value="PLATFORM_PAYOUT">Platform Payout Pool</option>
          <option value="REVENUE">Revenue</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
        >
          <option value="ALL">All Transaction Types</option>
          <option value="DEPOSIT_CREDIT">DEPOSIT CREDIT</option>
          <option value="TRANSFER_DEBIT">TRANSFER DEBIT</option>
          <option value="TRANSFER_REFUND">TRANSFER REFUND</option>
          <option value="FEE">FEE</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4">Date &amp; Time</th>
                <th className="py-3 px-4">Entry ID</th>
                <th className="py-3 px-4">Account Type</th>
                <th className="py-3 px-4">Transaction Type</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4 text-right">Debit (-)</th>
                <th className="py-3 px-4 text-right">Credit (+)</th>
                <th className="py-3 px-4 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-sans">
                    No ledger records found for the selected filter.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500 text-[11px] font-sans">
                      {new Date(entry.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {entry.id}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-sans">
                      <span className="text-[11px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-medium">
                        {entry.accountType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border ${getTypeBadge(entry.type)}`}>
                        {entry.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 text-[11px]">
                      {entry.referenceId}
                      <div className="text-[10px] text-slate-400 font-sans">{entry.description}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                      {entry.debit > 0 ? `-${entry.debit.toLocaleString()} ${entry.currency}` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                      {entry.credit > 0 ? `+${entry.credit.toLocaleString()} ${entry.currency}` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {entry.runningBalance.toLocaleString()} {entry.currency}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
