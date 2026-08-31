import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Currency, Deposit, Transfer } from '../../types';
import { asNumber, normalizeDeposit, normalizeTransfer, normalizeUser, readApiError, apiFetch } from '../../utils/api';
import {
  Users,
  Search,
  ShieldCheck,
  ShieldAlert,
  Ban,
  Snowflake,
  Flame,
  AlertTriangle,
  RefreshCw,
  Eye,
  FileCheck2,
  XCircle,
  CheckCircle2,
  History,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';

export const UserManagementView: React.FC = () => {
  const { token, hasPermission } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userHistory, setUserHistory] = useState<{ deposits: Deposit[]; transfers: Transfer[] } | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionModal, setActionModal] = useState<{ action: string; title: string } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const res = await apiFetch(`/api/admin/users?search=${encodeURIComponent(searchQuery)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(readApiError(json, `Customer request failed (${res.status}).`));
      const records = Array.isArray(json) ? json : Array.isArray(json.users) ? json.users : [];
      setUsers(records.map(normalizeUser));
    } catch (err) {
      console.error(err);
      setLoadError(err instanceof Error ? err.message : 'Unable to load customers.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleInspectUser = async (u: User) => {
    setSelectedUser(normalizeUser(u as any));
    setUserHistory(null);
    setHistoryError(null);
    setHistoryLoading(true);
    try {
      const res = await apiFetch(`/api/admin/users/${u.id}/history`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(readApiError(json, `Customer history request failed (${res.status}).`));
      setUserHistory({
        deposits: (Array.isArray(json.deposits) ? json.deposits : []).map(normalizeDeposit),
        transfers: (Array.isArray(json.transfers) ? json.transfers : []).map(normalizeTransfer),
      });
    } catch (err) {
      console.error(err);
      setHistoryError(err instanceof Error ? err.message : 'Unable to load customer history.');
      setUserHistory({ deposits: [], transfers: [] });
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleExecuteUserAction = async (action: string) => {
    if (!selectedUser) return;
    setFeedback(null);

    try {
      const res = await apiFetch(`/api/admin/users/${selectedUser.id}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action, note: actionReason }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFeedback(readApiError(json, 'Action failed.'));
      } else {
        setFeedback('User status updated successfully.');
        setActionModal(null);
        setActionReason('');
        fetchUsers();
        // refresh selected user
        const refreshedRes = await apiFetch(`/api/admin/users/${selectedUser.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (refreshedRes.ok) {
          const u = await refreshedRes.json();
          setSelectedUser(normalizeUser(u));
        }
      }
    } catch (err) {
      setFeedback('Network request error.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Customer Directory &amp; Compliance Profiling
            </h1>
            <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-mono px-2 py-0.5 rounded font-bold">
              {users.length} Customers
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review customer identity dossiers, account status, multi-currency ledger balances, and risk scores.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-200 shadow-sm transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          <span>Refresh Directory</span>
        </button>
      </div>

      {loadError && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          <span>{loadError}</span>
          <button onClick={fetchUsers} className="rounded-lg bg-white px-3 py-1.5 font-semibold text-rose-700 shadow-sm">Retry</button>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchUsers();
          }}
          className="flex gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by User ID, Name, Email, Phone, Country..."
              className="w-full bg-slate-100 border border-transparent focus:border-slate-300 focus:bg-white rounded-lg pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Users Table */}
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4">User ID</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Country &amp; Phone</th>
                <th className="py-3 px-4">KYC Status</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Wallet Balance</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="py-12 text-center text-slate-400">Loading customer records...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-slate-400">{loadError ? 'Customer records could not be loaded.' : 'No customers match the selected search.'}</td></tr>
              ) : (
                users.map((u) => (
                <tr
                  key={u.id}
                  onClick={() => handleInspectUser(u)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {u.id}
                  </td>
                  <td className="py-3.5 px-4">
                                          <div className="font-bold text-slate-900">{u.fullName || 'Unnamed customer'}</div>
                      <div className="text-[11px] text-slate-500">{u.email || 'No email provided'}</div>

                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-slate-800 font-medium">{u.country}</div>
                    <div className="font-mono text-[11px] text-slate-500">{u.phone}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                        u.kycStatus === 'VERIFIED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : u.kycStatus === 'PENDING_VERIFICATION'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {u.kycStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                        u.accountStatus === 'BANNED' || u.isBanned
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : u.accountStatus === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : u.accountStatus === 'FROZEN'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {u.isBanned || u.accountStatus === 'BANNED' ? 'BANNED' : u.accountStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">
                    {asNumber(u.balances?.[u.nativeCurrency]).toLocaleString()} {u.nativeCurrency}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                        u.riskLevel === 'HIGH'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : u.riskLevel === 'MEDIUM'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {u.riskLevel} RISK
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInspectUser(u);
                      }}
                      className="bg-slate-100 group-hover:bg-blue-600 text-slate-700 group-hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm"
                    >
                      View Profile
                    </button>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Inspection Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-sans">
          <div className="bg-white border border-slate-200 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold text-base">
                  {selectedUser.fullName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-base">{selectedUser.fullName}</span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        selectedUser.accountStatus === 'BANNED' || selectedUser.isBanned
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : selectedUser.accountStatus === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {selectedUser.isBanned || selectedUser.accountStatus === 'BANNED' ? 'BANNED' : selectedUser.accountStatus}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    User ID: <span className="font-mono text-slate-700 font-semibold">{selectedUser.id}</span> &bull; {selectedUser.email}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 bg-white">
              {feedback && (
                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-xl font-medium">
                  {feedback}
                </div>
              )}
              {historyError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                  {historyError}
                </div>
              )}

              {/* Balances Across All Corridors */}
              <div>
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Customer Wallet Balances (All Corridors)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {Object.entries(selectedUser.balances).map(([curr, val]) => (
                    <div key={curr} className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                      <div className="text-[10px] text-slate-500 font-mono font-bold uppercase">{curr} Balance</div>
                      <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                        {asNumber(val).toLocaleString()} <span className="text-[10px] text-slate-500 font-normal">{curr}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* KYC and Account Security */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Identity &amp; KYC State
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">KYC Status:</span>
                    <span className="font-mono font-bold text-emerald-600">{selectedUser.kycStatus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Residence Country:</span>
                    <span className="text-slate-800 font-medium">{selectedUser.country}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Native Currency:</span>
                    <span className="font-mono text-blue-600 font-bold">{selectedUser.nativeCurrency}</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Risk &amp; Account Governance
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">AML Risk Score:</span>
                    <span className="font-mono font-bold text-slate-900">{selectedUser.riskLevel || 'LOW'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Risk Tier:</span>
                    <span className="font-mono font-bold text-amber-600">{selectedUser.riskLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Account State:</span>
                    <span className={`font-mono font-bold ${selectedUser.isBanned || selectedUser.accountStatus === 'BANNED' ? 'text-rose-700' : 'text-slate-800'}`}>
                      {selectedUser.isBanned || selectedUser.accountStatus === 'BANNED' ? 'BANNED' : selectedUser.accountStatus}
                    </span>
                  </div>
                  {(selectedUser.isBanned || selectedUser.accountStatus === 'BANNED') && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Ban Reason:</span>
                        <span className="text-rose-700 font-medium text-right max-w-[200px] truncate">{selectedUser.banReason || 'Policy violation'}</span>
                      </div>
                      {selectedUser.bannedAt && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Banned On:</span>
                          <span className="font-mono text-[10px] text-slate-600">{new Date(selectedUser.bannedAt).toLocaleString()}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* History Tabs (Recent Deposits & Transfers) */}
              <div>
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Customer Transaction Activity
                </div>
                {historyLoading ? (
                  <div className="p-6 text-center text-xs text-slate-400">Loading history records...</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Deposits */}
                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 mb-2">
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                        <span>Add Money Deposits ({userHistory?.deposits.length || 0})</span>
                      </div>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto text-xs">
                        {userHistory?.deposits.length === 0 ? (
                          <div className="text-slate-400 text-[11px]">No deposit records.</div>
                        ) : (
                          userHistory?.deposits.map((d) => (
                            <div key={d.id} className="p-2 bg-white border border-slate-200 rounded-lg flex justify-between shadow-2xs">
                              <div>
                                <div className="font-mono text-[11px] text-slate-900 font-semibold">{d.id}</div>
                                <div className="text-[10px] text-slate-500">{d.status}</div>
                              </div>
                              <div className="text-right font-mono font-bold text-emerald-600">
                                +{d.amount} {d.currency}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Transfers */}
                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 mb-2">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Send Money Transfers ({userHistory?.transfers.length || 0})</span>
                      </div>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto text-xs">
                        {userHistory?.transfers.length === 0 ? (
                          <div className="text-slate-400 text-[11px]">No transfer records.</div>
                        ) : (
                          userHistory?.transfers.map((t) => (
                            <div key={t.id} className="p-2 bg-white border border-slate-200 rounded-lg flex justify-between shadow-2xs">
                              <div>
                                <div className="font-mono text-[11px] text-slate-900 font-semibold">{t.id}</div>
                                <div className="text-[10px] text-slate-500">{t.recipientName} ({t.status})</div>
                              </div>
                              <div className="text-right">
                                <div className="font-mono font-bold text-slate-900">
                                  {t.amount} {t.currency}
                                </div>
                                <div className="font-mono text-[10px] text-blue-600 font-semibold">৳ {t.bdtAmount}</div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Dialog */}
              {actionModal && (
                <div className="p-4 bg-slate-50 border border-amber-300 rounded-xl space-y-3 shadow-inner">
                  <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                    {actionModal.title}
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Reason for Action (Recorded in Audit Trail)
                    </label>
                    <textarea
                      rows={2}
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      placeholder="e.g. Suspicious remittance activity or court order..."
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setActionModal(null)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleExecuteUserAction(actionModal.action)}
                      className="px-4 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm"
                    >
                      Confirm Action
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
              <div className="text-xs text-slate-500">
                Governance Actions
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedUser.accountStatus === 'BANNED' || selectedUser.isBanned ? (
                  <button
                    onClick={() =>
                      setActionModal({
                        action: 'unban',
                        title: 'Unban Customer Account (Restores Full Account Access)',
                      })
                    }
                    className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>Unban Account</span>
                  </button>
                ) : (
                  <>
                    {selectedUser.accountStatus === 'ACTIVE' ? (
                      <button
                        onClick={() =>
                          setActionModal({
                            action: 'freeze',
                            title: 'Freeze Customer Account (Suspends Inbound/Outbound)',
                          })
                        }
                        className="px-3.5 py-1.5 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 flex items-center gap-1.5 transition-colors"
                      >
                        <Snowflake className="w-3.5 h-3.5" />
                        <span>Freeze Account</span>
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          setActionModal({
                            action: 'unfreeze',
                            title: 'Unfreeze Customer Account (Restores Normal Access)',
                          })
                        }
                        className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
                      >
                        <Flame className="w-3.5 h-3.5" />
                        <span>Unfreeze Account</span>
                      </button>
                    )}

                    <button
                      onClick={() =>
                        setActionModal({
                          action: 'ban',
                          title: 'Ban Customer Account (Blocks Login & All App Access)',
                        })
                      }
                      className="px-3.5 py-1.5 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 flex items-center gap-1.5 transition-colors"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Ban Account</span>
                    </button>
                  </>
                )}

                <button
                  onClick={() =>
                    setActionModal({
                      action: 'require_kyc',
                      title: 'Enforce Mandatory KYC Re-verification',
                    })
                  }
                  className="px-3.5 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-200 shadow-sm transition-colors"
                >
                  Require KYC Re-upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
