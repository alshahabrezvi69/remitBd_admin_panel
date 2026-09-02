import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Transfer, User } from '../../types';
import { normalizeTransfer, normalizeUser, readApiError, asNumber, apiFetch } from '../../utils/api';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Send,
  RotateCcw,
  Ban,
  ShieldCheck,
  Building,
  User as UserIcon,
  CreditCard,
  History,
  AlertOctagon,
  ArrowRight,
  TrendingUp,
  Check,
} from 'lucide-react';

interface TransferDetailModalProps {
  transferId: string;
  onClose: () => void;
  onRefresh: () => void;
}

export const TransferDetailModal: React.FC<TransferDetailModalProps> = ({
  transferId,
  onClose,
  onRefresh,
}) => {
  const { token, admin } = useAuth();
  const [data, setData] = useState<{ transfer: Transfer; sender?: User } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionPrompt, setActionPrompt] = useState<{ action: string; label: string; placeholder: string } | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchTransferDetails = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const res = await apiFetch(`/api/admin/transfers/${transferId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(readApiError(json, `Transfer detail request failed (${res.status}).`));
      const transfer = normalizeTransfer(json.transfer ?? json);
      let sender: User | undefined;
      if (transfer.senderId) {
        const senderResponse = await apiFetch(`/api/admin/users/${transfer.senderId}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (senderResponse.ok) sender = normalizeUser(await senderResponse.json());
      }
      setData({ transfer, sender });
    } catch (err) {
      console.error(err);
      setLoadError(err instanceof Error ? err.message : 'Unable to load transfer details.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransferDetails();
  }, [transferId]);

  const executeAction = async (action: string, note?: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setActionLoading(true);

    try {
      const res = await apiFetch(`/api/admin/transfers/${transferId}/action`, {
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
        setSuccessMessage(`Action '${action.toUpperCase()}' processed.`);
        setActionPrompt(null);
        setActionNote('');
        fetchTransferDetails();
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

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 p-8 rounded-2xl text-slate-700 text-sm shadow-xl font-medium">Loading Transfer Record {transferId}...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white border border-rose-200 p-6 rounded-2xl text-slate-700 text-sm shadow-xl max-w-md w-full">
          <div className="font-bold text-slate-900">Unable to load transfer details</div>
          <p className="mt-2 text-rose-700">{loadError || 'The server returned an empty transfer record.'}</p>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={onClose} className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold">Close</button>
            <button onClick={fetchTransferDetails} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold">Retry</button>
          </div>
        </div>
      </div>
    );
  }

  const { transfer, sender } = data;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-sans">
      <div className="bg-white border border-slate-200 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-mono font-bold text-lg">
              &rarr;
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-900 text-base tracking-tight">Transfer: <span className="font-mono font-black bg-slate-900 text-white px-2 py-0.5 rounded text-[13px] select-all">{transfer.id}</span></span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getStatusBadge(transfer.status)}`}>
                  {transfer.status}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                Payout Reference: <span className="font-mono text-slate-900 font-black bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded text-[11px] select-all">{transfer.payoutReference || '—'}</span>
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
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-500 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-start gap-2.5">
              <Check className="w-4 h-4 flex-shrink-0 text-emerald-500 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Amount & FX Summary Cards - BDT-target with reverse logic */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Paid (Foreign)</div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {asNumber(transfer.payableForeignAmount || transfer.amount).toLocaleString()} {transfer.currency}
              </div>
              <div className="text-xs text-slate-500 mt-1">From: {transfer.country}</div>
              {transfer.couponCode && (
                <div className="text-[11px] font-bold text-emerald-600 mt-1">Coupon: {transfer.couponCode} (+{transfer.bonusPercent}% → +৳{asNumber((transfer as any).bonusBdt || 0).toLocaleString()} বোনাস যোগ)</div>
              )}
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Treasury Rate (BDT-target)</div>
              <div className="text-sm font-mono font-bold text-blue-600 mt-1">
                1 {transfer.currency} = {transfer.fxRate} BDT
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Platform Transfer Fee: <span className="text-emerald-600 font-mono font-bold">0.00 {transfer.currency} (FREE)</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Reverse: BDT ÷ rate = payable foreign</div>
            </div>

            <div className="bg-blue-50/50 border border-blue-200 p-4 rounded-xl">
              <div className="text-[11px] text-blue-800 font-bold uppercase tracking-wider">BDT Credited (Target) + Bonus</div>
              <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
                ৳ {asNumber(transfer.bdtAmount).toLocaleString()} BDT
              </div>
              {transfer.couponCode && (transfer as any).bonusBdt ? (
                <div className="text-xs text-emerald-700 mt-1 font-bold">বেস ৳{asNumber((transfer as any).baseBdtAmount || transfer.bdtAmount).toLocaleString()} + বোনাস ৳{asNumber((transfer as any).bonusBdt).toLocaleString()} ({transfer.bonusPercent}%)</div>
              ) : null}
              <div className="text-xs text-blue-700 mt-1">Disbursement via {transfer.payoutMethod}{transfer.accountType ? ` (${transfer.accountType})` : ''} • BDT locked {transfer.couponCode ? `• Coupon ${transfer.couponCode}` : ''}</div>
            </div>
          </div>

          {/* Ledger & Financial Posting */}
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
              Transaction ID: <span className="font-mono font-black text-white bg-slate-900 px-2 py-1 rounded text-xs tracking-wide select-all border border-slate-700">{transfer.id}</span>
            </div>
            <div className="text-[11px] text-slate-700 font-bold mt-1.5 flex items-center gap-1.5 flex-wrap">
              Payment Reference: <span className="font-mono font-black text-slate-900 bg-amber-100 border-2 border-amber-400 px-2 py-1 rounded text-xs tracking-wide select-all">{transfer.payoutReference || transfer.providerReference || transfer.id}</span>
            </div>
            {transfer.providerReference && transfer.providerReference !== transfer.payoutReference && (
              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                Provider Ref: <span className="font-mono font-extrabold text-slate-900 bg-white border border-slate-300 px-2 py-0.5 rounded text-[11px] select-all">{transfer.providerReference}</span>
              </div>
            )}
            {transfer.ledgerTransactionId && (
              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                Ledger Txn ID: <span className="font-mono font-extrabold text-slate-900 bg-white border border-slate-300 px-2 py-0.5 rounded text-[11px] select-all">{transfer.ledgerTransactionId}</span>
              </div>
            )}
          </div>

          {/* Risk & Compliance Screening Box */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  AML Compliance &amp; Sanctions Risk Scoring
                </span>
              </div>
              <span
                className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                  transfer.riskResult?.flagged
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                Risk Score: {transfer.riskResult?.score || 0}/100 ({transfer.riskResult?.flagged ? 'HIGH RISK' : 'LOW RISK'})
              </span>
            </div>

            {transfer.riskResult?.flagReason ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold">Escalation Trigger:</span> {transfer.riskResult.flagReason}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500">
                Automatic screening passed. No negative sanction list matches found on sender or beneficiary.
              </div>
            )}
          </div>

          {/* Sender & Recipient Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sender */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                <UserIcon className="w-4 h-4 text-blue-600" />
                <span className="font-extrabold text-slate-900">Sender (Customer)</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Name:</span>
                  <span className="font-bold text-slate-900">{transfer.senderName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sender Email:</span>
                  <span className="text-slate-700">{transfer.senderEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Country:</span>
                  <span className="text-slate-700">{transfer.country}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">KYC Status:</span>
                  <span className="font-mono text-emerald-600 font-bold">{sender?.kycStatus || 'VERIFIED'}</span>
                </div>
              </div>
            </div>

            {/* Recipient - hide name for mobile banking, show account_type */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                <Building className="w-4 h-4 text-blue-600" />
                <span>Bangladesh Recipient</span>
                {transfer.accountType && (
                  <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200">{transfer.accountType.toUpperCase()}</span>
                )}
              </div>
              <div className="space-y-1.5 text-xs">
                {['BKASH','NAGAD','ROCKET'].includes((transfer.payoutMethod||'').toUpperCase()) ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payout Method:</span>
                      <span className="font-mono text-blue-700 font-bold">{transfer.payoutMethod} {transfer.accountType ? `(${transfer.accountType})` : ''}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Mobile Wallet #:</span>
                      <span className="font-mono text-slate-900 font-bold">{transfer.payoutAccountNumber}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 italic">Recipient Name hidden for mobile banking - manual payout via {transfer.payoutMethod}{transfer.accountType ? ` ${transfer.accountType}` : ''} number</div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Beneficiary Name:</span>
                      <span className="font-bold text-slate-900">{transfer.recipientName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Phone:</span>
                      <span className="font-mono text-slate-700">{transfer.recipientPhone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payout Method:</span>
                      <span className="font-mono text-blue-700 font-bold">{transfer.payoutMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Account / Wallet #:</span>
                      <span className="font-mono text-slate-900 font-bold">{transfer.payoutAccountNumber}</span>
                    </div>
                    {transfer.bankName && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Bank &amp; Branch:</span>
                        <span className="text-slate-700">{transfer.bankName} ({transfer.branchName || 'Main'})</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              <History className="w-4 h-4 text-blue-600" />
              <span>Transfer Lifecycle Timeline</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
              {(transfer.timeline || []).length === 0 ? (
                <div className="text-xs text-slate-500">No timeline events were returned by the server.</div>
              ) : transfer.timeline.map((event, idx) => (
                <div key={idx} className="flex items-start gap-3 relative">
                  {idx !== transfer.timeline.length - 1 && (
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

          {/* Action Prompt Form */}
          {actionPrompt && (
            <div className="p-4 bg-slate-50 border border-blue-300 rounded-xl space-y-3 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                  Execute Action: {actionPrompt.label}
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
                  Administrative Note / Justification
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
                  {actionLoading ? 'Executing...' : 'Confirm Action'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Controlled Workflow Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="text-[11px] text-slate-500">
            Current RBAC: <span className="font-mono font-bold text-slate-800">{admin?.role}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Clear Compliance Review */}
            {transfer.status === 'COMPLIANCE_REVIEW' && (
              <button
                disabled={actionLoading}
                onClick={() =>
                  setActionPrompt({
                    action: 'approve_compliance',
                    label: 'Clear Compliance Review & Proceed to Payout',
                    placeholder: 'AML screening checked. Source of funds verified...',
                  })
                }
                className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors"
              >
                Clear Compliance
              </button>
            )}

            {/* Process / Dispatch Payout */}
            {(transfer.status === 'PROCESSING' || transfer.status === 'COMPLIANCE_REVIEW') && (
              <button
                disabled={actionLoading}
                onClick={() =>
                  setActionPrompt({
                    action: 'process_payout',
                    label: 'Dispatch to Bangladesh Payout Network',
                    placeholder: 'Dispatched to Bangladesh partner gateway...',
                  })
                }
                className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch Payout</span>
              </button>
            )}

            {/* Mark as Paid Out */}
            {transfer.status !== 'PAID' && transfer.status !== 'REFUNDED' && (
              <button
                disabled={actionLoading}
                onClick={() =>
                  setActionPrompt({
                    action: 'mark_paid',
                    label: 'Mark as Paid Out (Disbursement Confirmed)',
                    placeholder: 'Partner confirmation code received. Recipient credited.',
                  })
                }
                className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Paid</span>
              </button>
            )}

            {/* Fail Payout */}
            {transfer.status !== 'PAID' && transfer.status !== 'FAILED' && transfer.status !== 'REFUNDED' && (
              <button
                disabled={actionLoading}
                onClick={() =>
                  setActionPrompt({
                    action: 'fail',
                    label: 'Fail Transfer',
                    placeholder: 'Beneficiary account invalid or payment gateway rejected.',
                  })
                }
                className="px-3 py-1.5 text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 font-semibold transition-colors"
              >
                Fail
              </button>
            )}

            {/* Refund to Sender */}
            {transfer.status !== 'REFUNDED' && (
              <button
                disabled={actionLoading}
                onClick={() =>
                  setActionPrompt({
                    action: 'refund',
                    label: 'Refund to Sender Wallet (Post Reversing Ledger)',
                    placeholder: 'Reason for refunding transfer back to sender balance...',
                  })
                }
                className="px-3 py-1.5 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg border border-purple-200 font-semibold transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Refund Sender</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
