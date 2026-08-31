import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Currency, FundingAccount } from '../../types';
import { apiFetch } from '../../utils/api';
import {
  Landmark,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Archive,
  Edit2,
  RefreshCw,
  AlertCircle,
  Check,
  Building,
} from 'lucide-react';

const normalizeFundingAccount = (item: any): FundingAccount => ({
  id: item.id,
  country: item.country || '',
  countryCode: item.countryCode || item.country_code || '',
  currency: item.currency,
  provider: item.provider || '',
  paymentMethod: item.paymentMethod || item.payment_method || '',
  accountDisplayName: item.accountDisplayName || item.account_display_name || item.accountName || '',
  bankName: item.bankName || item.bank_name || '',
  accountNumber: item.accountNumber || item.account_number || '',
  iban: item.iban,
  swift: item.swift,
  paymentInstructions: item.paymentInstructions || item.payment_instructions || item.instructions || '',
  status: item.status || 'DISABLED',
  minDeposit: item.minDeposit ?? item.min_deposit,
  maxDeposit: item.maxDeposit ?? item.max_deposit,
  createdAt: item.createdAt || item.created_at || '',
  updatedAt: item.updatedAt || item.updated_at || '',
});

export const FundingAccountsView: React.FC = () => {
  const { token, hasPermission } = useAuth();
  const [accounts, setAccounts] = useState<FundingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FundingAccount | null>(null);
  const [formData, setFormData] = useState<Partial<FundingAccount>>({
    country: 'Saudi Arabia',
    currency: 'SAR',
    accountName: '',
    bankName: '',
    accountNumber: '',
    iban: '',
    swift: '',
    referencePrefix: 'RMT-SA-',
    status: 'ACTIVE',
    dailyLimit: 50000,
    monthlyLimit: 500000,
    instructions: '',
  });
  const [statusMsg, setStatusMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/admin/funding-accounts', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        setAccounts(Array.isArray(json) ? json.map(normalizeFundingAccount) : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [token]);

  const handleOpenAdd = () => {
    setEditingAccount(null);
    setFormData({
      country: 'Saudi Arabia',
      currency: 'SAR',
      accountName: '',
      bankName: '',
      accountNumber: '',
      iban: '',
      swift: '',
      referencePrefix: 'RMT-SA-',
      status: 'ACTIVE',
      dailyLimit: 0,
      monthlyLimit: 0,
      instructions: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (acc: FundingAccount) => {
    setEditingAccount(acc);
    setFormData(acc);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    try {
      const url = editingAccount
        ? `/api/admin/funding-accounts/${editingAccount.id}`
        : '/api/admin/funding-accounts';
      const method = editingAccount ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) {
        setStatusMsg({ type: 'error', text: json.error || 'Failed to save funding account.' });
      } else {
        setStatusMsg({ type: 'success', text: 'Funding account successfully saved.' });
        setModalOpen(false);
        fetchAccounts();
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Network connection failed.' });
    }
  };

  const handleToggleStatus = async (id: string, newStatus: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED') => {
    try {
      const res = await apiFetch(`/api/admin/funding-accounts/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchAccounts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const currencies: Currency[] = ['SAR', 'AED', 'QAR', 'KWD', 'OMR', 'MYR', 'SGD', 'BHD', 'MVR', 'EUR', 'USD', 'GBP', 'BDT'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Funding &amp; Collection Accounts Management
            </h1>
            <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-mono px-2 py-0.5 rounded font-bold">
              {accounts.length} Master Accounts
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure bank accounts, IBANs, and deposit instructions presented to customers in the 10 supported regional corridors.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchAccounts}
            className="p-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-200 shadow-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Funding Account</span>
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

      {/* Grid of Funding Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className={`bg-white border rounded-xl p-5 flex flex-col justify-between transition-all shadow-sm ${
              acc.status === 'ACTIVE'
                ? 'border-slate-200 hover:border-slate-300'
                : 'border-slate-200 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{acc.bankName}</h3>
                    <div className="text-xs text-slate-500">
                      {acc.country} &bull; <span className="font-bold font-mono text-blue-600">{acc.currency}</span>
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                    acc.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {acc.status}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Account Name</div>
                  <div className="font-bold text-slate-800">{acc.accountName}</div>
                </div>

                {acc.iban && (
                  <div>
                    <div className="text-[11px] text-slate-400 font-medium">IBAN</div>
                    <div className="font-mono text-[11px] text-slate-700 font-medium break-all">{acc.iban}</div>
                  </div>
                )}

                {acc.accountNumber && (
                  <div>
                    <div className="text-[11px] text-slate-400 font-medium">Account Number</div>
                    <div className="font-mono text-[11px] text-slate-700 font-medium">{acc.accountNumber}</div>
                  </div>
                )}

                <div className="flex justify-between pt-1">
                  <span className="text-slate-400 text-[11px]">Prefix:</span>
                  <span className="font-mono text-blue-700 font-bold text-[11px]">{acc.referencePrefix}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-medium">
                {acc.status === 'ACTIVE' ? (
                  <button
                    onClick={() => handleToggleStatus(acc.id, 'INACTIVE')}
                    className="text-[11px] text-amber-600 hover:underline"
                  >
                    Deactivate
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleStatus(acc.id, 'ACTIVE')}
                    className="text-[11px] text-emerald-600 hover:underline"
                  >
                    Activate
                  </button>
                )}
                <span className="text-slate-300">&bull;</span>
                <button
                  onClick={() => handleToggleStatus(acc.id, 'ARCHIVED')}
                  className="text-[11px] text-rose-600 hover:underline"
                >
                  Archive
                </button>
              </div>

              <button
                onClick={() => handleOpenEdit(acc)}
                className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 font-semibold transition-colors"
              >
                <Edit2 className="w-3 h-3 text-blue-600" />
                <span>Edit</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
          <div className="bg-white border border-slate-200 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="font-bold text-slate-900 text-sm">
                {editingAccount ? 'Edit Funding Account' : 'Add New Funding Account'}
              </span>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto bg-white">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Country</label>
                  <input
                    type="text"
                    required
                    value={formData.country || ''}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value as Currency })}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {currencies.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Beneficiary Account Name</label>
                <input
                  type="text"
                  required
                  value={formData.accountName || ''}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Bank Name</label>
                  <input
                    type="text"
                    required
                    value={formData.bankName || ''}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">IBAN / Account #</label>
                  <input
                    type="text"
                    required
                    value={formData.iban || formData.accountNumber || ''}
                    onChange={(e) => setFormData({ ...formData, iban: e.target.value, accountNumber: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Reference Prefix</label>
                  <input
                    type="text"
                    required
                    value={formData.referencePrefix || ''}
                    onChange={(e) => setFormData({ ...formData, referencePrefix: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">SWIFT / BIC (Optional)</label>
                  <input
                    type="text"
                    value={formData.swift || ''}
                    onChange={(e) => setFormData({ ...formData, swift: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Deposit Instructions</label>
                <textarea
                  rows={2}
                  value={formData.instructions || ''}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
                >
                  Save Funding Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
