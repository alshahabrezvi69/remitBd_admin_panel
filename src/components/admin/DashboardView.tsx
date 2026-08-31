import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Currency } from '../../types';
import { normalizeTransfer, normalizeUser, readApiError, asNumber, apiFetch } from '../../utils/api';
import {
  Users,
  UserCheck,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  AlertOctagon,
  TrendingUp,
  Banknote,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Layers,
  ChevronRight,
  ExternalLink,
  Bell,
  UserX,
  Snowflake,
} from 'lucide-react';

interface DashboardMetrics {
  users: { total: number; verified: number; pendingKyc: number; frozen: number; banned?: number; pendingVerification?: number; verifiedAccounts?: number; suspended?: number; rejected?: number };
  deposits: { todayCount: number; pending: number; completed: number; underReview: number };
  transfers: { todayCount: number; pending: number; completed: number; failed: number; refunds: number; inComplianceReview: number };
  currencyVolumes: Partial<Record<Currency, { depositVolume: number; transferVolume: number; pendingVolume: number }>>;
  bdtPayout: { completedBdt: number; pendingBdt: number; totalDisbursedBdt: number };
  recentTransfers: any[];
  recentDeposits: any[];
  recentAuditLogs: any[];
  recentUsers: any[];
  recentSendMoney: any[];
  recentReceiveMoney: any[];
  unreadNotifications: number;
}

const emptyDashboardMetrics: DashboardMetrics = {
  users: { total: 0, verified: 0, pendingKyc: 0, frozen: 0, banned: 0, pendingVerification: 0, verifiedAccounts: 0, suspended: 0, rejected: 0 },
  deposits: { todayCount: 0, pending: 0, completed: 0, underReview: 0 },
  transfers: { todayCount: 0, pending: 0, completed: 0, failed: 0, refunds: 0, inComplianceReview: 0 },
  currencyVolumes: {},
  bdtPayout: { completedBdt: 0, pendingBdt: 0, totalDisbursedBdt: 0 },
  recentTransfers: [],
  recentDeposits: [],
  recentAuditLogs: [],
  recentUsers: [],
  recentSendMoney: [],
  recentReceiveMoney: [],
  unreadNotifications: 0,
};

interface DashboardViewProps {
  onNavigate: (path: string) => void;
  onSelectDeposit: (id: string) => void;
  onSelectTransfer: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onSelectDeposit,
  onSelectTransfer,
}) => {
  const { token } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      if (!token) {
        setMetrics(emptyDashboardMetrics);
        return;
      }
      const res = await apiFetch('/api/admin/dashboard/metrics', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(readApiError(data, `Dashboard request failed (${res.status}).`));
      }
      setMetrics({
        ...emptyDashboardMetrics,
        ...data,
        users: { ...emptyDashboardMetrics.users, ...(data.users || {}) },
        deposits: { ...emptyDashboardMetrics.deposits, ...(data.deposits || {}) },
        transfers: { ...emptyDashboardMetrics.transfers, ...(data.transfers || {}) },
        currencyVolumes: data.currencyVolumes || {},
        bdtPayout: {
          ...emptyDashboardMetrics.bdtPayout,
          ...(data.bdtPayout || {}),
          completedBdt: asNumber(data.bdtPayout?.completedBdt ?? data.bdtPayout?.completed_bdt),
          pendingBdt: asNumber(data.bdtPayout?.pendingBdt ?? data.bdtPayout?.pending_bdt),
          totalDisbursedBdt: asNumber(data.bdtPayout?.totalDisbursedBdt ?? data.bdtPayout?.total_disbursed_bdt),
        },
        recentTransfers: Array.isArray(data.recentTransfers ?? data.recent_transfers)
          ? (data.recentTransfers ?? data.recent_transfers).map(normalizeTransfer)
          : [],
        recentDeposits: Array.isArray(data.recentDeposits ?? data.recent_deposits) ? data.recentDeposits ?? data.recent_deposits : [],
        recentAuditLogs: Array.isArray(data.recentAuditLogs ?? data.recent_audit_logs) ? data.recentAuditLogs ?? data.recent_audit_logs : [],
        recentUsers: Array.isArray(data.recentUsers ?? data.recent_users) ? (data.recentUsers ?? data.recent_users).map(normalizeUser) : [],
        recentSendMoney: Array.isArray(data.recentSendMoney ?? data.recent_send_money) ? data.recentSendMoney ?? data.recent_send_money : [],
        recentReceiveMoney: Array.isArray(data.recentReceiveMoney ?? data.recent_receive_money) ? data.recentReceiveMoney ?? data.recent_receive_money : [],
        unreadNotifications: asNumber(data.unreadNotifications ?? data.unread_notifications),
      });
    } catch (err) {
      console.error(err);
      setMetrics((previous) => previous ?? emptyDashboardMetrics);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [token]);

  const currencyList: Array<{ code: Currency; country: string; flag: string }> = [
    { code: 'SAR', country: 'Saudi Arabia', flag: '🇸🇦' },
    { code: 'AED', country: 'United Arab Emirates', flag: '🇦🇪' },
    { code: 'QAR', country: 'Qatar', flag: '🇶🇦' },
    { code: 'KWD', country: 'Kuwait', flag: '🇰🇼' },
    { code: 'OMR', country: 'Oman', flag: '🇴🇲' },
    { code: 'MYR', country: 'Malaysia', flag: '🇲🇾' },
    { code: 'SGD', country: 'Singapore', flag: '🇸🇬' },
    { code: 'BHD', country: 'Bahrain', flag: '🇧🇭' },
    { code: 'MVR', country: 'Maldives', flag: '🇲🇻' },
    { code: 'EUR', country: 'Eurozone', flag: '🇪🇺' },
    { code: 'USD', country: 'United States', flag: '🇺🇸' },
    { code: 'GBP', country: 'United Kingdom', flag: '🇬🇧' },
    { code: 'BDT', country: 'Bangladesh', flag: '🇧🇩' },
  ];

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin text-blue-600 mr-2" />
        <span className="text-sm font-medium">Loading Real-time Executive Metrics...</span>
      </div>
    );
  }

  const currentMetrics = metrics ?? emptyDashboardMetrics;

  return (
    <div className="space-y-6">
      {/* Top Banner with Action buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Remittance Operations &amp; Treasury Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time cross-border liquidity, corridor volumes, compliance screening, and payout disbursements.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchMetrics}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-200 shadow-sm transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Sync Live Data</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* User Card */}
        <div
          onClick={() => onNavigate('/admin/users')}
          className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Total Users</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-end gap-2 mt-2">
            <div className="text-2xl font-bold text-slate-900">{currentMetrics.users.total.toLocaleString()}</div>
            <div className="text-xs text-emerald-600 font-medium mb-0.5">+{currentMetrics.users.verified} verified</div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>KYC Review: <strong className="text-amber-600 font-bold">{currentMetrics.users.pendingKyc} pending</strong></span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

        {/* Pending Verification Card */}
        <div
          onClick={() => onNavigate('/admin/users')}
          className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Pending Verification</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-end gap-2 mt-2">
            <div className="text-2xl font-bold text-amber-600">{currentMetrics.users.pendingVerification || 0}</div>
            <div className="text-xs text-slate-500 font-medium mb-0.5">awaiting review</div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Suspended: <strong className="text-rose-600 font-bold">{currentMetrics.users.suspended || 0}</strong></span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

        {/* Add Money (Deposits) Card */}
        <div
          onClick={() => onNavigate('/admin/deposits')}
          className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Pending Deposits</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-end gap-2 mt-2">
            <div className="text-2xl font-bold text-amber-600">{currentMetrics.deposits.pending}</div>
            <div className="text-xs text-slate-500 font-medium mb-0.5">{currentMetrics.deposits.completed} completed</div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Under Review: <strong className="text-slate-700 font-semibold">{currentMetrics.deposits.underReview}</strong></span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

        {/* Send Money (Transfers) Card */}
        <div
          onClick={() => onNavigate('/admin/transfers')}
          className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Today's Payouts</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-end gap-2 mt-2">
            <div className="text-2xl font-bold text-slate-900 font-mono">
              ৳ {(currentMetrics.bdtPayout.completedBdt || 0).toLocaleString()}
            </div>
            <div className="text-xs text-emerald-600 font-semibold mb-0.5">Active</div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Pending queue: <strong className="text-blue-600 font-bold">{currentMetrics.transfers.pending}</strong></span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

        {/* Notifications Card */}
        <div
          className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm hover:border-violet-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Notifications</span>
            <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-end gap-2 mt-2">
            <div className="text-2xl font-bold text-violet-600">{currentMetrics.unreadNotifications}</div>
            <div className="text-xs text-slate-500 font-medium mb-0.5">unread</div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Rejection rate: <strong className="text-rose-600 font-bold">{currentMetrics.users.rejected || 0} rejected</strong></span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </div>

      {/* Currency Volume Horizontal Strip (Clean Minimalism style) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Inbound Currency Corridors (10 Regions)
          </h3>
          <button
            onClick={() => onNavigate('/admin/fx')}
            className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider flex items-center gap-1"
          >
            <span>View All FX Rates</span>
            <span>&rarr;</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
          {currencyList.map((item) => {
            const rawVol = currentMetrics.currencyVolumes?.[item.code] as any;
            const vol = {
              depositVolume: asNumber(rawVol?.depositVolume ?? rawVol?.deposit_volume),
              transferVolume: asNumber(rawVol?.transferVolume ?? rawVol?.transfer_volume),
              pendingVolume: asNumber(rawVol?.pendingVolume ?? rawVol?.pending_volume),
            };
            return (
              <div
                key={item.code}
                className="flex-none px-3.5 py-2.5 bg-slate-50 rounded-lg border border-slate-100 min-w-[110px]"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold mb-1">
                  <span>{item.flag} {item.code}</span>
                </div>
                <div className="text-sm font-bold text-slate-900 font-mono">
                  {vol.depositVolume.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Sent: {vol.transferVolume.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Recent Activity Tables + Live Event Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transfers (Col 1-2) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Recent Outbound Transfers</h3>
            </div>
            <button
              onClick={() => onNavigate('/admin/transfers')}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold"
            >
              View All Transactions &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">Transaction ID</th>
                  <th className="px-4 py-2.5">Amount</th>
                  <th className="px-4 py-2.5">Recipient</th>
                  <th className="px-4 py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentMetrics.recentTransfers.slice(0, 6).map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => onSelectTransfer(tx.id)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 font-mono text-xs">{tx.id}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{tx.senderName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 font-mono">
                        {asNumber(tx.amount).toLocaleString()} {tx.currency}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        ৳ {asNumber(tx.bdtAmount).toLocaleString()} BDT
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{tx.recipientName}</div>
                      <div className="text-[10px] text-slate-500 italic">{tx.payoutMethod}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          tx.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-700'
                            : tx.status === 'COMPLIANCE_REVIEW'
                            ? 'bg-amber-100 text-amber-700'
                            : tx.status === 'PROCESSING'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Real-time Events Stream (Col 3, Dark Contrast Panel) */}
        <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 flex flex-col overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/15 to-transparent pointer-events-none"></div>
          <div className="px-4 py-3.5 border-b border-slate-800 bg-slate-900/70 flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Recent Registrations
            </h3>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              <span className="text-[10px] font-mono text-blue-300 uppercase">Live</span>
            </div>
          </div>

          <div className="p-4 space-y-3 overflow-y-auto z-10 flex-1">
            {currentMetrics.recentUsers.length === 0 ? (
              <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-sm text-slate-400">
                No recent registrations.
              </div>
            ) : (
              currentMetrics.recentUsers.map((user: any) => (
                <div key={user.id} className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
                      {user.verificationStatus === 'PENDING' ? '⏳ PENDING' : user.verificationStatus === 'VERIFIED' ? '✅ VERIFIED' : user.verificationStatus || 'UNKNOWN'}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">{user.createdAt || ''}</span>
                  </div>
                  <div className="mt-1 text-sm font-semibold text-white">{user.fullName || 'Unnamed'}</div>
                  <div className="mt-1 text-xs text-slate-300">{user.phone} &bull; {user.id}</div>
                  {user.verificationStatus === 'PENDING' && (
                    <div className="mt-2">
                      <button
                        onClick={() => onNavigate('/admin/users')}
                        className="text-[10px] font-bold text-amber-400 hover:text-amber-300 uppercase"
                      >
                        Review & Verify →
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

