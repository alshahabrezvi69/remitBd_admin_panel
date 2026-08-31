import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Deposit, FundingAccount, User } from '../../types';
import { normalizeDeposit, normalizeFundingAccount, normalizeUser, readApiError, asNumber, apiFetch } from '../../utils/api';
import {
  X,
  CheckCircle2,
  AlertOctagon,
  Clock,
  PauseCircle,
  HelpCircle,
  RotateCcw,
  Ban,
  ShieldCheck,
  Landmark,
  User as UserIcon,
  CreditCard,
  History,
  FileText,
  AlertCircle,
  Check,
} from 'lucide-react';

interface DepositDetailModalProps {
  depositId: string;
  onClose: () => void;
  onRefresh: () => void;
}

export const DepositDetailModal: React.FC<DepositDetailModalProps> = ({
  depositId,
  onClose,
  onRefresh,
}) => {
  const { token, admin } = useAuth();
  const [data, setData] = useState<{ deposit: Deposit; user?: User; fundingAccount?: FundingAccount } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionPrompt, setActionPrompt] = useState<{ action: string; label: string; placeholder: string } | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchDepositDetails = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const res = await apiFetch(`/api/admin/deposits/${depositId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(readApiError(json, `Deposit detail request failed (${res.status}).`));
      const deposit = normalizeDeposit(json.deposit ?? json);
      const [userResponse, accountsResponse] = await Promise.all([
        deposit.userId
          ? apiFetch(`/api/admin/users/${deposit.userId}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
          : Promise.resolve(null),
        apiFetch('/api/admin/funding-accounts', { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
      ]);
      let user: User | undefined;
      if (userResponse?.ok) user = normalizeUser(await userResponse.json());
      let fundingAccount: FundingAccount | undefined;
      if (accountsResponse.ok) {
        const accountsJson = await accountsResponse.json().catch(() => []);
        const accounts = (Array.isArray(accountsJson) ? accountsJson : accountsJson.accounts || []).map(normalizeFundingAccount);
        fundingAccount = accounts.find((account) => account.id === deposit.fundingAccountId || account.id === deposit.paymentMethodId || account.currency === deposit.currency);
      }
      setData({ deposit, user, fundingAccount });
    } catch (err) {
      console.error(err);
      setLoadError(err instanceof Error ? err.message : 'Unable to load deposit details.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepositDetails();
  }, [depositId]);

  const executeAction = async (action: string, note?: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setActionLoading(true);

    try {
      const res = await apiFetch(`/api/admin/deposits/${depositId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action, note }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMessage(readApiError(json, 'Action failed.'));
      } else {
        setSuccessMessage(`Action '${action.toUpperCase()}' successfully processed.`);
        setActionPrompt(null);
        setActionNote('');
        fetchDepositDetails();
        onRefresh();
      }
    } catch (err) {
      setErrorMessage('Network connection error.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status?: string) => {
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

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 p-8 rounded-2xl text-slate-700 text-sm shadow-xl font-medium">Loading Deposit Record {depositId}...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white border border-rose-200 p-6 rounded-2xl text-slate-700 text-sm shadow-xl max-w-md w-full">
          <div className="font-bold text-slate-900">Unable to load deposit details</div>
          <p className="mt-2 text-rose-700">{loadError || 'The server returned an empty deposit record.'}</p>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={onClose} className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold">Close</button>
            <button onClick={fetchDepositDetails} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold">Retry</button>
          </div>
        </div>
      </div>
    );
  }

  const { deposit, user, fundingAccount } = data;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white border border-slate-200 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col font-sans">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-mono font-bold text-lg">
              +
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-900 text-base tracking-tight">Deposit: <span className="font-mono font-black bg-slate-900 text-white px-2 py-0.5 rounded text-[13px] select-all">{deposit.id}</span></span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getStatusBadge(deposit.status)}`}>
                  {deposit.status}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                Reference: <span className="font-mono text-slate-900 font-black bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded text-[11px] select-all">{deposit.reference}</span> &bull; Provider Ref: <span className="font-mono text-slate-900 font-extrabold bg-white border border-slate-300 px-1.5 py-0.5 rounded text-[11px] select-all">{deposit.providerReference || '—'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 bg-white">
          {/* Status Feedback */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-start gap-2.5">
              <Check className="w-4 h-4 flex-shrink-0 text-emerald-500 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Amount & State Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Deposit Amount</div>
              <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
                +{asNumber(deposit.amount).toLocaleString()} {deposit.currency}
              </div>
              <div className="text-xs text-slate-500 mt-1">{deposit.country}</div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Compliance &amp; Verification</div>
              <div className="flex items-center gap-1.5 mt-2">
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded font-bold ${
                    deposit.complianceStatus === 'CLEARED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {deposit.complianceStatus}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                User KYC: <span className="font-semibold text-slate-800">{user?.kycStatus}</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Ledger &amp; Financial Posting</div>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  LEDGER: PENDING
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Payment: <span className="font-bold text-slate-800">AWAITING_VERIFICATION</span>
              </div>
              <div className="text-[11px] text-slate-700 font-bold mt-1.5 flex items-center gap-1.5 flex-wrap">
                Transaction ID: <span className="font-mono font-black text-white bg-slate-900 px-2 py-1 rounded text-xs tracking-wide select-all border border-slate-700">{deposit.id}</span>
              </div>
              <div className="text-[11px] text-slate-700 font-bold mt-1.5 flex items-center gap-1.5 flex-wrap">
                Payment Reference: <span className="font-mono font-black text-slate-900 bg-amber-100 border-2 border-amber-400 px-2 py-1 rounded text-xs tracking-wide select-all">{deposit.reference}</span>
              </div>
              {deposit.providerReference && (
                <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                  Provider Ref: <span className="font-mono font-extrabold text-slate-900 bg-white border border-slate-300 px-2 py-0.5 rounded text-[11px] select-all">{deposit.providerReference}</span>
                </div>
              )}
              {deposit.customerTrxId && (
                <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                  Customer Trx ID: <span className="font-mono font-extrabold text-slate-900 bg-white border border-slate-300 px-2 py-0.5 rounded text-[11px] select-all">{deposit.customerTrxId}</span>
                </div>
              )}
            </div>
          </div>

          {/* User & Funding Account Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                <UserIcon className="w-4 h-4 text-blue-600" />
                <span className="font-extrabold text-slate-900">Sender (Customer)</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Name:</span>
                  <span className="font-bold text-slate-900">{deposit.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">User ID:</span>
                  <span className="font-mono text-slate-700">{deposit.userId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="text-slate-700">{deposit.userEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Balance:</span>
                  <span className="font-mono text-emerald-600 font-bold">
                    {asNumber(user?.balances?.[deposit.currency]).toLocaleString()} {deposit.currency}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                <Landmark className="w-4 h-4 text-blue-600" />
                <span>Funding Collection Account</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Account Name:</span>
                  <span className="font-bold text-slate-900">{deposit.fundingAccountName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Method:</span>
                  <span className="text-slate-700">{deposit.paymentMethodName}</span>
                </div>
                {fundingAccount?.iban && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">IBAN:</span>
                    <span className="font-mono text-[11px] text-slate-800">{fundingAccount.iban}</span>
                  </div>
                )}
                {fundingAccount?.accountNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Account #:</span>
                    <span className="font-mono text-[11px] text-slate-800">{fundingAccount.accountNumber}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              <History className="w-4 h-4 text-blue-600" />
              <span>Audit Timeline</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
              {(deposit.timeline || []).length === 0 ? (
                <div className="text-xs text-slate-500">No timeline events were returned by the server.</div>
              ) : deposit.timeline.map((event, idx) => (
                <div key={idx} className="flex items-start gap-3 relative">
                  {idx !== deposit.timeline.length - 1 && (
                    <div className="absolute left-2.5 top-6 bottom-0 w-0.5 bg-slate-200" />
                  )}
                  <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{event.actor}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-0.5">{event.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Controlled Workflow Action Dialog Prompt */}
          {actionPrompt && (
            <div className="p-4 bg-slate-50 border border-blue-300 rounded-xl space-y-3 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                  Confirm Workflow Action: {actionPrompt.label}
                </span>
                <button
                  onClick={() => setActionPrompt(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Administrative Note / Reason (Logged to Audit Trail)
                </label>
                <textarea
                  rows={2}
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder={actionPrompt.placeholder}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setActionPrompt(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Abort
                </button>
                <button
                  disabled={actionLoading}
                  onClick={() => executeAction(actionPrompt.action, actionNote)}
                  className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors"
                >
                  {actionLoading ? 'Executing...' : 'Submit Action'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Workflow Actions Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="text-[11px] text-slate-500">
            Current RBAC: <span className="font-mono font-bold text-slate-800">{admin?.role}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Review Button */}
            {(deposit.status === 'PENDING' || deposit.status === 'PAYMENT_RECEIVED') && (
              <button
                disabled={actionLoading}
                onClick={() =>
                  setActionPrompt({
                    action: 'review',
                    label: 'Move to Review',
                    placeholder: 'Reason for putting deposit in manual review queue...',
                  })
                }
                className="px-3 py-1.5 text-xs bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-300 font-semibold shadow-sm transition-colors"
              >
                Mark Under Review
              </button>
            )}

            {/* Request Info Button */}
            {deposit.status !== 'FUNDS_AVAILABLE' && deposit.status !== 'REFUNDED' && (
              <button
                disabled={actionLoading}
                onClick={() =>
                  setActionPrompt({
                    action: 'request_info',
                    label: 'Request Information from Customer',
                    placeholder: 'e.g. Please upload bank transfer receipt showing reference...',
                  })
                }
                className="px-3 py-1.5 text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg border border-amber-200 font-semibold transition-colors"
              >
                Request Info
              </button>
            )}

            {/* Approve Deposit Button */}
            {deposit.status !== 'FUNDS_AVAILABLE' && deposit.status !== 'REFUNDED' && (
              <button
                disabled={actionLoading}
                onClick={() =>
                  setActionPrompt({
                    action: 'approve',
                    label: 'APPROVE DEPOSIT (Post to Ledger & Credit Balance)',
                    placeholder: 'Verified payment in bank settlement statement...',
                  })
                }
                className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve Deposit</span>
              </button>
            )}

            {/* Reject Deposit Button */}
            {deposit.status !== 'FUNDS_AVAILABLE' && deposit.status !== 'REFUNDED' && deposit.status !== 'FAILED' && (
              <button
                disabled={actionLoading}
                onClick={() =>
                  setActionPrompt({
                    action: 'reject',
                    label: 'Reject Deposit',
                    placeholder: 'Reason for rejection (e.g. invalid sender name, fake receipt)...',
                  })
                }
                className="px-3 py-1.5 text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 font-semibold transition-colors"
              >
                Reject
              </button>
            )}

            {/* Refund Deposit Button */}
            {deposit.status === 'FUNDS_AVAILABLE' && (
              <button
                disabled={actionLoading}
                onClick={() =>
                  setActionPrompt({
                    action: 'refund',
                    label: 'REFUND DEPOSIT (Reverse Balance & Post Reversing Ledger)',
                    placeholder: 'Reason for refunding funds back to customer original bank account...',
                  })
                }
                className="px-3 py-1.5 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg border border-purple-200 font-semibold transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Refund Deposit</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

