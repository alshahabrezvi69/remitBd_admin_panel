import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Currency, PaymentMethod, PaymentMethodAuditLog, PaymentMethodVersion } from '../../types';
import { asNumber, normalizePaymentMethod, normalizePaymentMethodAuditLog, normalizePaymentMethodVersion, readApiError } from '../../utils/api';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Sliders,
  DollarSign,
  AlertCircle,
  Check,
  Plus,
  History,
  Archive,
  Eye,
  Search,
  Filter,
  Landmark,
  Smartphone,
  Zap,
  ArrowRight,
  Shield,
  Clock,
  User,
  Copy,
  Info,
} from 'lucide-react';

export const PaymentMethodsView: React.FC = () => {
  const { token, admin, hasPermission } = useAuth();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DISABLED' | 'ARCHIVED'>('ALL');
  const [countryFilter, setCountryFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [methodVersions, setMethodVersions] = useState<PaymentMethodVersion[]>([]);
  const [methodAuditLogs, setMethodAuditLogs] = useState<PaymentMethodAuditLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    providerName: '',
    methodType: 'BANK_TRANSFER' as 'MOBILE_FINANCIAL_SERVICE' | 'BANK_TRANSFER' | 'DEBIT_CARD' | 'WALLET',
    country: 'Saudi Arabia',
    countryCode: 'SA',
    currencyCode: 'SAR' as Currency,
    displayName: '',
    accountName: '',
    accountNumber: '',
    walletNumber: '',
    bankName: '',
    branchName: '',
    routingNumber: '',
    iban: '',
    swift: '',
    instructions: '',
    minimumAmount: 50,
    maximumAmount: 50000,
    feePercent: 0,
    feeFixed: 0,
    status: 'ACTIVE' as 'ACTIVE' | 'DISABLED',
    displayOrder: 1,
    changeReason: '',
  });

  const [statusMsg, setStatusMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const fetchMethods = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const queryParams = new URLSearchParams();
      if (statusFilter !== 'ALL') queryParams.append('status', statusFilter);
      if (countryFilter !== 'ALL') queryParams.append('countryCode', countryFilter);
      if (typeFilter !== 'ALL') queryParams.append('methodType', typeFilter);
      if (searchQuery) queryParams.append('search', searchQuery);

      const res = await fetch(`/api/admin/payment-methods?${queryParams.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(readApiError(json, `Payment-method request failed (${res.status}).`));
      const records = Array.isArray(json) ? json : Array.isArray(json.paymentMethods) ? json.paymentMethods : Array.isArray(json.payment_methods) ? json.payment_methods : [];
      setMethods(records.map(normalizePaymentMethod));
    } catch (err) {
      console.error('Failed to fetch payment methods', err);
      setLoadError(err instanceof Error ? err.message : 'Unable to load payment methods.');
      setMethods([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, [token, statusFilter, countryFilter, typeFilter, searchQuery]);

  // Changes are refreshed after each successful mutation; the server is the source of truth.


  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setFormData({
      providerName: '',
      methodType: 'BANK_TRANSFER',
      country: 'Saudi Arabia',
      countryCode: 'SA',
      currencyCode: 'SAR',
      displayName: '',
      accountName: '',
      accountNumber: '',
      walletNumber: '',
      bankName: '',
      branchName: '',
      routingNumber: '',
      iban: '',
      swift: '',
      instructions: '',
      minimumAmount: 0,
      maximumAmount: 0,
      feePercent: 0,
      feeFixed: 0,
      status: 'ACTIVE',
      displayOrder: methods.length + 1,
      changeReason: '',
    });
    setAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (m: PaymentMethod) => {
    setSelectedMethod(m);
    setFormData({
      providerName: m.providerName || m.provider || '',
      methodType: m.methodType || (m.code === 'BKASH' || m.code === 'NAGAD' || m.code === 'STC_PAY' ? 'MOBILE_FINANCIAL_SERVICE' : 'BANK_TRANSFER'),
      country: m.country,
      countryCode: m.countryCode || 'SA',
      currencyCode: (m.currencyCode || m.supportedCurrencies?.[0] || 'SAR') as Currency,
      displayName: m.displayName || m.name,
      accountName: m.accountName || 'RemitBD Settlement Hub',
      accountNumber: m.accountNumber || '',
      walletNumber: m.walletNumber || '',
      bankName: m.bankName || '',
      branchName: m.branchName || '',
      routingNumber: m.routingNumber || '',
      iban: m.iban || '',
      swift: m.swift || '',
      instructions: Array.isArray(m.instructions) ? m.instructions.join('\n') : (m.instructions || ''),
      minimumAmount: m.minimumAmount || m.minLimit || 10,
      maximumAmount: m.maximumAmount || m.maxLimit || 50000,
      feePercent: m.feePercent || 0,
      feeFixed: m.feeFixed || 0,
      status: (m.status === 'ACTIVE' ? 'ACTIVE' : 'DISABLED'),
      displayOrder: m.displayOrder || 1,
      changeReason: '',
    });
    setEditModalOpen(true);
  };

  // Open History / Audit Modal
  const handleOpenHistory = async (m: PaymentMethod) => {
    setSelectedMethod(m);
    setHistoryModalOpen(true);
    setLoadingHistory(true);
    setHistoryError(null);
    setMethodVersions([]);
    setMethodAuditLogs([]);
    try {
      const res = await fetch(`/api/admin/payment-methods/${m.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(readApiError(json, `Payment-method history request failed (${res.status}).`));
      const versions = Array.isArray(json.versions) ? json.versions : Array.isArray(json.version_history) ? json.version_history : [];
      const auditLogs = Array.isArray(json.auditLogs) ? json.auditLogs : Array.isArray(json.audit_logs) ? json.audit_logs : [];
      setMethodVersions(versions.map(normalizePaymentMethodVersion));
      setMethodAuditLogs(auditLogs.map(normalizePaymentMethodAuditLog));
    } catch (err) {
      console.error(err);
      setHistoryError(err instanceof Error ? err.message : 'Unable to load payment-method history.');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Open Archive Modal
  const handleOpenArchive = (m: PaymentMethod) => {
    setSelectedMethod(m);
    setArchiveModalOpen(true);
  };

  // Toggle Active Status
  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/admin/payment-methods/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          status: nextStatus,
          reason: `Admin toggled status to ${nextStatus}`,
        }),
      });
      if (res.ok) {
        setStatusMsg({ type: 'success', text: `Payment method status changed to ${nextStatus}.` });
        fetchMethods();
      } else {
        const err = await res.json();
        setStatusMsg({ type: 'error', text: err.error || 'Failed to update status.' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Network connection failed.' });
    }
  };

  // Save New Method
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    try {
      const res = await fetch('/api/admin/payment-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...formData,
          instructions: formData.instructions.split('\n').map((s) => s.trim()).filter(Boolean),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setStatusMsg({ type: 'error', text: json.error || 'Failed to create payment method.' });
      } else {
        setStatusMsg({ type: 'success', text: `Payment method "${json.paymentMethod.displayName}" successfully configured and activated.` });
        setAddModalOpen(false);
        fetchMethods();
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Network error during payment method creation.' });
    }
  };

  // Save Edit Method
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMethod) return;
    setStatusMsg(null);

    try {
      const res = await fetch(`/api/admin/payment-methods/${selectedMethod.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...formData,
          instructions: formData.instructions.split('\n').map((s) => s.trim()).filter(Boolean),
          changeReason: formData.changeReason || 'Admin updated payment collection rail parameters',
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setStatusMsg({ type: 'error', text: json.error || 'Failed to update payment method.' });
      } else {
        setStatusMsg({
          type: 'success',
          text: `Payment method updated (Version ${json.version || json.paymentMethod.currentVersion}). Customer apps updated in real-time.`,
        });
        setEditModalOpen(false);
        fetchMethods();
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Network error during update.' });
    }
  };

  // Execute Safe Archive
  const handleArchiveSubmit = async () => {
    if (!selectedMethod) return;
    try {
      const res = await fetch(`/api/admin/payment-methods/${selectedMethod.id}/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          reason: 'Payment method archived by admin. Historical receipts and transactions remain locked and intact.',
        }),
      });

      if (res.ok) {
        setStatusMsg({ type: 'success', text: `Payment method "${selectedMethod.displayName || selectedMethod.name}" safely archived.` });
        setArchiveModalOpen(false);
        fetchMethods();
      } else {
        const err = await res.json();
        setStatusMsg({ type: 'error', text: err.error || 'Failed to archive payment method.' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Network error during archiving.' });
    }
  };

  // Helper Country Map
  const countryOptions = [
    { code: 'SA', name: 'Saudi Arabia', currency: 'SAR' },
    { code: 'AE', name: 'United Arab Emirates', currency: 'AED' },
    { code: 'BD', name: 'Bangladesh', currency: 'BDT' },
    { code: 'MY', name: 'Malaysia', currency: 'MYR' },
    { code: 'QA', name: 'Qatar', currency: 'QAR' },
    { code: 'KW', name: 'Kuwait', currency: 'KWD' },
    { code: 'OM', name: 'Oman', currency: 'OMR' },
    { code: 'BH', name: 'Bahrain', currency: 'BHD' },
    { code: 'EU', name: 'Eurozone', currency: 'EUR' },
    { code: 'SG', name: 'Singapore', currency: 'SGD' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Payment Method Management
            </h1>
            <span className="bg-slate-100 text-slate-700 border border-slate-300 text-xs font-mono px-2.5 py-0.5 rounded-full font-bold">
              {methods.length} Total Configured
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Centrally manage collection rails, bank coordinates, MFS merchant wallets (bKash, Nagad), fees, limits, and versioned customer snapshots.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchMethods}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-slate-900' : 'text-slate-500'}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Payment Method</span>
          </button>
        </div>
      </div>

      {loadError && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          <span>{loadError}</span>
          <button onClick={fetchMethods} className="rounded-lg bg-white px-3 py-1.5 font-semibold text-rose-700 shadow-sm">Retry</button>
        </div>
      )}

      {/* Global Status Message */}
      {statusMsg && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between gap-3 shadow-sm ${
            statusMsg.type === 'error'
              ? 'bg-rose-50 border border-rose-200 text-rose-800 font-medium'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusMsg.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-slate-700 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search provider, bank, IBAN, wallet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="ALL">All Statuses (Active &amp; Disabled)</option>
              <option value="ACTIVE">Active Only</option>
              <option value="DISABLED">Disabled Only</option>
              <option value="ARCHIVED">Archived (Retired)</option>
            </select>
          </div>

          {/* Corridor / Country Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Corridor:</span>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="ALL">All Corridors / Countries</option>
              {countryOptions.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.currency})
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rail:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="ALL">All Rail Types</option>
              <option value="MOBILE_FINANCIAL_SERVICE">Mobile Financial Service (MFS)</option>
              <option value="BANK_TRANSFER">Bank Transfer / IBAN</option>
              <option value="WALLET">Digital Wallet</option>
              <option value="DEBIT_CARD">Debit Card Gateway</option>
            </select>
          </div>
        </div>
      </div>

      {/* Methods Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-slate-500" />
          <span>Synchronizing payment collection rails...</span>
        </div>
      ) : methods.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <CreditCard className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">{loadError ? 'Payment methods could not be loaded' : 'No payment methods match your filter'}</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Adjust your search or corridor criteria, or add a new collection payment method using the button above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {methods.map((method) => {
            const isMfs = method.methodType === 'MOBILE_FINANCIAL_SERVICE' || method.code === 'BKASH' || method.code === 'NAGAD';
            const isArchived = method.status === 'ARCHIVED';
            const isActive = method.status === 'ACTIVE';

            return (
              <div
                key={method.id}
                className={`bg-white border rounded-2xl p-5 flex flex-col justify-between transition-all shadow-sm relative overflow-hidden ${
                  isArchived
                    ? 'border-slate-200 bg-slate-50/70 opacity-60'
                    : isActive
                    ? 'border-slate-200 hover:border-slate-300'
                    : 'border-amber-200/80 bg-amber-50/20'
                }`}
              >
                <div>
                  {/* Top Bar: Icon + Provider + Status Pill */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
                          isMfs
                            ? 'bg-rose-50 border-rose-200 text-rose-600'
                            : method.methodType === 'BANK_TRANSFER'
                            ? 'bg-blue-50 border-blue-200 text-blue-600'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                        }`}
                      >
                        {isMfs ? (
                          <Smartphone className="w-5 h-5" />
                        ) : method.methodType === 'BANK_TRANSFER' ? (
                          <Landmark className="w-5 h-5" />
                        ) : (
                          <CreditCard className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-sm text-slate-900 line-clamp-1">
                            {method.displayName || method.name}
                          </h3>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-semibold text-slate-700">{method.providerName || method.provider}</span>
                          <span>&bull;</span>
                          <span>{method.country}</span>
                          <span className="bg-slate-100 text-slate-800 font-mono font-bold text-[10px] px-1.5 py-0.2 rounded border border-slate-200">
                            {method.currencyCode || method.currency}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <button
                        onClick={() => !isArchived && handleToggleStatus(method.id, method.status)}
                        disabled={isArchived}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border transition-colors ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : isArchived
                            ? 'bg-slate-200 text-slate-700 border-slate-300 cursor-not-allowed'
                            : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                        }`}
                      >
                        {method.status}
                      </button>

                      <button
                        onClick={() => handleOpenHistory(method)}
                        className="text-[10px] font-mono text-slate-500 hover:text-slate-900 flex items-center gap-1 bg-slate-50 hover:bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 transition-colors"
                        title="View Version History & Audit Log"
                      >
                        <History className="w-3 h-3 text-slate-400" />
                        <span>v{method.currentVersion || 1}</span>
                      </button>
                    </div>
                  </div>

                  {/* Destination Account Details Box */}
                  <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider">Account Title:</span>
                      <span className="font-semibold text-slate-900 truncate max-w-[170px]" title={method.accountName}>
                        {method.accountName || 'RemitBD Settlement'}
                      </span>
                    </div>

                    {/* MFS Wallet or Account Number */}
                    {method.walletNumber && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-medium">Wallet Number:</span>
                        <div className="flex items-center gap-1 font-mono font-bold text-slate-900">
                          <span>{method.walletNumber}</span>
                          <button
                            onClick={() => handleCopy(method.walletNumber || '')}
                            className="p-1 hover:text-blue-600 text-slate-400"
                            title="Copy Wallet Number"
                          >
                            {copiedText === method.walletNumber ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {method.accountNumber && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-medium">Account No:</span>
                        <div className="flex items-center gap-1 font-mono font-bold text-slate-900">
                          <span>{method.accountNumber}</span>
                          <button
                            onClick={() => handleCopy(method.accountNumber || '')}
                            className="p-1 hover:text-blue-600 text-slate-400"
                            title="Copy Account Number"
                          >
                            {copiedText === method.accountNumber ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* IBAN */}
                    {method.iban && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-medium">IBAN:</span>
                        <div className="flex items-center gap-1 font-mono text-[11px] font-bold text-slate-800 truncate max-w-[150px]">
                          <span title={method.iban}>{method.iban}</span>
                          <button
                            onClick={() => handleCopy(method.iban || '')}
                            className="p-1 hover:text-blue-600 text-slate-400"
                            title="Copy IBAN"
                          >
                            {copiedText === method.iban ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Bank / Branch */}
                    {method.bankName && (
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400 font-medium">Bank:</span>
                        <span className="text-slate-700 truncate max-w-[170px]" title={method.bankName}>
                          {method.bankName}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Limits & Fee Parameters */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Limits</div>
                      <div className="font-mono text-slate-800 font-medium text-[11px] mt-0.5">
                        {method.minimumAmount || method.minLimit || 10} - {(method.maximumAmount || method.maxLimit || 50000).toLocaleString()}{' '}
                        {method.currencyCode || method.currency}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fee Structure</div>
                      <div className="font-mono text-slate-800 font-medium text-[11px] mt-0.5">
                        {method.feePercent || 0}% + {method.feeFixed || 0} {method.currencyCode || method.currency}
                      </div>
                    </div>
                  </div>

                  {/* Usage / Orders summary */}
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Order Position: #{method.displayOrder || 1}</span>
                    <span>
                      Transactions:{' '}
                      <strong className="text-slate-700">{(method as any).usageCount || 0}</strong>
                    </span>
                  </div>
                </div>

                {/* Bottom Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenHistory(method)}
                    className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-medium py-1.5 px-2 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <History className="w-3.5 h-3.5 text-slate-400" />
                    <span>Audit Trail</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {!isArchived && (
                      <button
                        onClick={() => handleOpenArchive(method)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Archive Payment Method (Preserves Transaction History)"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenEdit(method)}
                      className="flex items-center gap-1.5 text-xs text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-semibold transition-colors"
                    >
                      <Sliders className="w-3.5 h-3.5 text-slate-700" />
                      <span>Edit Rail</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 1: ADD PAYMENT METHOD */}
      {/* ============================================================ */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans overflow-y-auto">
          <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Add New Payment / Collection Method</h3>
                  <p className="text-[11px] text-slate-500">
                    Configure inbound payment coordinates. Real-time updates push automatically to customer apps.
                  </p>
                </div>
              </div>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Row 1: Provider Name & Rail Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Provider / Method Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. bKash, Nagad, Al Rajhi Bank, Emirates NBD"
                    value={formData.providerName}
                    onChange={(e) => setFormData({ ...formData, providerName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Payment Rail Type *
                  </label>
                  <select
                    value={formData.methodType}
                    onChange={(e) => setFormData({ ...formData, methodType: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer (Direct Wire / IBAN)</option>
                    <option value="MOBILE_FINANCIAL_SERVICE">Mobile Financial Service (bKash / Nagad / STC Pay)</option>
                    <option value="WALLET">Digital Wallet Gateway</option>
                    <option value="DEBIT_CARD">Debit Card Collection Gateway</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Country & Currency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Corridor / Country *
                  </label>
                  <select
                    value={formData.countryCode}
                    onChange={(e) => {
                      const sel = countryOptions.find((c) => c.code === e.target.value);
                      if (sel) {
                        setFormData({
                          ...formData,
                          countryCode: sel.code,
                          country: sel.name,
                          currencyCode: sel.currency as Currency,
                        });
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  >
                    {countryOptions.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.currency})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Customer Display Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. bKash Merchant Wallet, Al Rajhi Inward Clearing"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              {/* Destination Account Fields */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-slate-600" />
                  <span>Destination Account Coordinates</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Account Beneficiary / Legal Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RemitBD Client Collection Escrow"
                    value={formData.accountName}
                    onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                {/* Conditional Fields based on methodType */}
                {formData.methodType === 'MOBILE_FINANCIAL_SERVICE' || formData.methodType === 'WALLET' ? (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Wallet Number / Mobile Merchant Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 01711223344 or STC-966-880011"
                      value={formData.walletNumber}
                      onChange={(e) => setFormData({ ...formData, walletNumber: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Bank Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Al Rajhi Bank, Emirates NBD, Maybank"
                          value={formData.bankName}
                          onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Branch Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Main Corporate Branch"
                          value={formData.branchName}
                          onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Account Number</label>
                        <input
                          type="text"
                          placeholder="e.g. 89001238472901"
                          value={formData.accountNumber}
                          onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">IBAN</label>
                        <input
                          type="text"
                          placeholder="e.g. SA448000089001238472901"
                          value={formData.iban}
                          onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">SWIFT / BIC Code</label>
                        <input
                          type="text"
                          placeholder="e.g. RJHISARI"
                          value={formData.swift}
                          onChange={(e) => setFormData({ ...formData, swift: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Routing / Sort Code</label>
                        <input
                          type="text"
                          placeholder="Optional"
                          value={formData.routingNumber}
                          onChange={(e) => setFormData({ ...formData, routingNumber: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Payment Instructions */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Instructions (One step per line)
                </label>
                <textarea
                  rows={4}
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-sans focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  placeholder="Enter step-by-step instructions shown to customers during deposit..."
                />
              </div>

              {/* Limits and Fees */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Min Deposit</label>
                  <input
                    type="number"
                    value={formData.minimumAmount}
                    onChange={(e) => setFormData({ ...formData, minimumAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Max Deposit</label>
                  <input
                    type="number"
                    value={formData.maximumAmount}
                    onChange={(e) => setFormData({ ...formData, maximumAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Fee (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.feePercent}
                    onChange={(e) => setFormData({ ...formData, feePercent: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Fixed Fee</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.feeFixed}
                    onChange={(e) => setFormData({ ...formData, feeFixed: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              {/* Status & Change Reason */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="ACTIVE">ACTIVE (Immediately Available in Customer App)</option>
                    <option value="DISABLED">DISABLED (Hidden from Customers)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Compliance Note / Reason
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Approved by compliance officer Tariq"
                    value={formData.changeReason}
                    onChange={(e) => setFormData({ ...formData, changeReason: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Create Payment Method</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: EDIT PAYMENT METHOD */}
      {/* ============================================================ */}
      {editModalOpen && selectedMethod && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans overflow-y-auto">
          <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Edit {selectedMethod.displayName || selectedMethod.name}
                  </h3>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <span>Current Version: <strong>v{selectedMethod.currentVersion || 1}</strong></span>
                    <span>&bull;</span>
                    <span>Corridor: {selectedMethod.country} ({selectedMethod.currencyCode || selectedMethod.currency})</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Sensitive Details Notice */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Configuration Versioning Protection Active</div>
                  <p className="text-[11px] text-blue-700 mt-0.5 leading-relaxed">
                    Changing sensitive account coordinates, IBAN, instructions, or fee rates automatically generates a new version (v{(selectedMethod.currentVersion || 1) + 1}). Historical customer transactions and deposit receipts remain locked to their exact timestamped snapshot.
                  </p>
                </div>
              </div>

              {/* Row 1: Provider & Display Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Provider Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.providerName}
                    onChange={(e) => setFormData({ ...formData, providerName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Display Title (in Customer App) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              {/* Destination Account Fields */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-slate-600" />
                  <span>Destination Account Coordinates</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Account Beneficiary / Legal Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.accountName}
                    onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                {formData.methodType === 'MOBILE_FINANCIAL_SERVICE' || formData.methodType === 'WALLET' ? (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Wallet / Mobile Merchant Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.walletNumber}
                      onChange={(e) => setFormData({ ...formData, walletNumber: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Bank Name</label>
                        <input
                          type="text"
                          value={formData.bankName}
                          onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Branch Name</label>
                        <input
                          type="text"
                          value={formData.branchName}
                          onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Account Number</label>
                        <input
                          type="text"
                          value={formData.accountNumber}
                          onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">IBAN</label>
                        <input
                          type="text"
                          value={formData.iban}
                          onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">SWIFT / BIC Code</label>
                        <input
                          type="text"
                          value={formData.swift}
                          onChange={(e) => setFormData({ ...formData, swift: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Routing / Sort Code</label>
                        <input
                          type="text"
                          value={formData.routingNumber}
                          onChange={(e) => setFormData({ ...formData, routingNumber: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Payment Instructions */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Instructions (One step per line)
                </label>
                <textarea
                  rows={4}
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-sans focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
              </div>

              {/* Limits and Fees */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Min Deposit</label>
                  <input
                    type="number"
                    value={formData.minimumAmount}
                    onChange={(e) => setFormData({ ...formData, minimumAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Max Deposit</label>
                  <input
                    type="number"
                    value={formData.maximumAmount}
                    onChange={(e) => setFormData({ ...formData, maximumAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Fee (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.feePercent}
                    onChange={(e) => setFormData({ ...formData, feePercent: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Fixed Fee</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.feeFixed}
                    onChange={(e) => setFormData({ ...formData, feeFixed: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              {/* Status and Mandatory Reason */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="DISABLED">DISABLED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Reason for Modification (Audit Log) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Updated corporate IBAN due to annual banking refresh"
                    value={formData.changeReason}
                    onChange={(e) => setFormData({ ...formData, changeReason: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Save Configuration</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: VERSION HISTORY & AUDIT LOGS DRAWER */}
      {/* ============================================================ */}
      {historyModalOpen && selectedMethod && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans overflow-y-auto">
          <div className="bg-white border border-slate-200 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Version History &amp; Audit Trail &bull; {selectedMethod.displayName || selectedMethod.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Immutable history of configuration changes, banking updates, and admin actions.
                  </p>
                </div>
              </div>
              <button onClick={() => setHistoryModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {loadingHistory ? (
                <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-500" />
                  <span>Loading immutable ledger history...</span>
                </div>
              ) : historyError ? (
                <div className="py-10 text-center text-xs text-rose-700 space-y-3">
                  <p>{historyError}</p>
                  <button onClick={() => selectedMethod && handleOpenHistory(selectedMethod)} className="rounded-lg bg-blue-600 px-3 py-2 text-white font-semibold">Retry</button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Section 1: Configuration Versions */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>Configuration Versions ({methodVersions.length})</span>
                    </h4>

                    {methodVersions.length === 0 ? (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
                        No previous configuration snapshots found.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {methodVersions.map((v) => (
                          <div
                            key={v.id}
                            className={`p-4 rounded-xl border transition-all text-xs space-y-2 ${
                              v.version === selectedMethod.currentVersion
                                ? 'bg-blue-50/40 border-blue-200'
                                : 'bg-slate-50/70 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                                    v.version === selectedMethod.currentVersion
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  Version {v.version}
                                </span>
                                {v.version === selectedMethod.currentVersion && (
                                  <span className="text-[10px] font-bold text-blue-700 uppercase bg-blue-100 px-1.5 py-0.5 rounded">
                                    Current Live
                                  </span>
                                )}
                              </div>
                              <span className="text-slate-400 font-mono text-[11px]">
                                {v.createdAt ? new Date(v.createdAt).toLocaleString() : 'No timestamp'}
                              </span>
                            </div>

                            <div className="text-slate-700">
                              <span className="text-slate-400">Change Reason:</span>{' '}
                              <strong className="text-slate-900">{v.changeReason || 'Direct update'}</strong>
                            </div>

                            <div className="text-slate-500 text-[11px]">
                              Modified By: <span className="font-semibold text-slate-800">{v.changedBy}</span> ({v.changedByEmail} - {v.changedByRole})
                            </div>

                            {/* Snapshot Coordinates */}
                            <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                              <div>
                                <span className="text-slate-400 block">Account / Wallet:</span>
                                <span className="text-slate-800 font-bold truncate block">
                                  {v.snapshot?.walletNumber || v.snapshot?.accountNumber || v.snapshot?.iban || 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block">Limits:</span>
                                <span className="text-slate-800 block">
                                  {asNumber(v.snapshot?.minimumAmount).toLocaleString()} - {asNumber(v.snapshot?.maximumAmount).toLocaleString()} {v.snapshot?.currencyCode || ''}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block">Fee:</span>
                                <span className="text-slate-800 block">
                                  {asNumber(v.snapshot?.feePercent)}% + {asNumber(v.snapshot?.feeFixed)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Section 2: Detailed Audit Log Trail */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Security &amp; Action Audit Log ({methodAuditLogs.length})</span>
                    </h4>

                    {methodAuditLogs.length === 0 ? (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
                        No audit events recorded yet.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {methodAuditLogs.map((log) => (
                          <div key={log.id} className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                                    log.action === 'CREATE'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : log.action === 'ENABLE'
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : log.action === 'DISABLE'
                                      ? 'bg-amber-100 text-amber-800'
                                      : log.action === 'ARCHIVE'
                                      ? 'bg-slate-200 text-slate-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {log.action}
                                </span>
                                <span className="font-semibold text-slate-800">{log.adminEmail}</span>
                                <span className="text-slate-400 text-[10px]">({log.adminRole})</span>
                              </div>
                              <span className="text-slate-400 font-mono text-[10px]">
                                {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'No timestamp'}
                              </span>
                            </div>

                            {log.reason && (
                              <div className="text-slate-600 text-[11px]">
                                Note: <em>{log.reason}</em>
                              </div>
                            )}

                            {log.changes && log.changes.length > 0 && (
                              <div className="pt-1.5 border-t border-slate-100 space-y-1">
                                {log.changes.map((c, i) => (
                                  <div key={i} className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                                    <span className="font-bold text-slate-700">{c.field}:</span>
                                    <span className="line-through text-rose-500">{String(c.oldValue ?? 'none')}</span>
                                    <ArrowRight className="w-3 h-3 text-slate-400" />
                                    <span className="text-emerald-600 font-semibold">{String(c.newValue)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: SAFE ARCHIVE CONFIRMATION */}
      {/* ============================================================ */}
      {archiveModalOpen && selectedMethod && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
                <Archive className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                Archive {selectedMethod.displayName || selectedMethod.name}?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Archiving retires this payment method so customers cannot select it for new deposit requests. 
                All historical transactions, audit logs, and accounting ledger records linked to this rail will remain permanently preserved.
              </p>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setArchiveModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleArchiveSubmit}
                className="px-5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-sm"
              >
                Confirm Safe Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
