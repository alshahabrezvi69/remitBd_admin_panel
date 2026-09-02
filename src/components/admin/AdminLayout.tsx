import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  LayoutDashboard,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Users,
  Settings,
  SlidersHorizontal,
  Bell,
  LogOut,
  Menu,
  X,
  Shield,
  ExternalLink,
  ChevronDown,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Search,
  MessageSquare,
  Gift,
  Landmark,
  Coins,
  Ticket,
} from 'lucide-react';
import { AdminRole } from '../../types';

interface AdminLayoutProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentPath,
  onNavigate,
  children,
}) => {
  const { admin, logout, switchRole } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, activeToast, dismissToast, handleNotificationClick } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [supportUnreadCount, setSupportUnreadCount] = useState(0);

  useEffect(() => {
    const fetchSupportUnread = async () => {
      try {
        const res = await fetch('/api/admin/support/unread-count');
        if (res.ok) {
          const data = await res.json();
          setSupportUnreadCount(data.totalUnread || 0);
        }
      } catch (e) {}
    };
    fetchSupportUnread();
    const interval = setInterval(fetchSupportUnread, 4000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    {
      group: 'General',
      items: [
        { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
        { path: '/admin/users', label: 'Users Directory', icon: Users, badge: null },
        {
          path: '/admin/support',
          label: 'Support Desk',
          icon: MessageSquare,
          badge: supportUnreadCount > 0 ? `${supportUnreadCount}` : null,
        },
      ],
    },
    {
      group: 'Finance & Treasury',
      items: [
        { path: '/admin/deposits', label: 'Add Money (Deposits)', icon: ArrowDownLeft, badge: null },
        { path: '/admin/transfers', label: 'Send Money (Transfers)', icon: ArrowUpRight, badge: null },
        { path: '/admin/payment-methods', label: 'Payment Methods', icon: CreditCard, badge: null },
        { path: '/admin/funding-accounts', label: 'Funding Accounts', icon: Landmark, badge: null },
        { path: '/admin/usdt-sells', label: 'USDT Sell Requests', icon: Coins, badge: null },
      ],
    },
    {
      group: 'System & Governance',
      items: [
        { path: '/admin/coupons', label: 'Coupon Codes', icon: Ticket, badge: null },
        { path: '/admin/content', label: 'Customer Content', icon: Gift, badge: null },
        { path: '/admin/customer-config', label: 'Customer Configuration', icon: SlidersHorizontal, badge: null },
        { path: '/admin/settings', label: 'System Settings', icon: Settings, badge: null },
      ],
    },
  ];

  const rolesList: Array<{ role: AdminRole; label: string; desc: string }> = [
    { role: 'SUPER_ADMIN', label: 'Super Admin', desc: 'Full authority & configuration' },
    { role: 'FINANCE_ADMIN', label: 'Finance Admin', desc: 'Deposits, Payouts, Ledger & FX' },
    { role: 'COMPLIANCE_ADMIN', label: 'Compliance Admin', desc: 'KYC review & AML verification' },
    { role: 'SUPPORT_ADMIN', label: 'Support Admin', desc: 'Customer inquiries (No Approvals)' },
    { role: 'FX_ADMIN', label: 'FX Admin', desc: 'Currency spreads & rate adjustments' },
    { role: 'AUDITOR', label: 'Auditor', desc: 'Strict read-only oversight' },
  ];

  const getRoleBadge = (role?: AdminRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'FINANCE_ADMIN':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'COMPLIANCE_ADMIN':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'SUPPORT_ADMIN':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'FX_ADMIN':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'AUDITOR':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'AD';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex overflow-hidden">
      {activeToast && (
        <div
          onClick={() => handleNotificationClick(activeToast)}
          className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white border border-slate-200 shadow-2xl rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 cursor-pointer hover:border-blue-300 transition-colors"
        >
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg flex-shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                {activeToast.type.replace(/_/g, ' ')}
              </h4>
              <button
                onClick={(e) => { e.stopPropagation(); dismissToast(); }}
                className="text-slate-400 hover:text-slate-600 text-xs p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs font-bold text-slate-900 mt-0.5">{activeToast.title}</p>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{activeToast.message}</p>
            {activeToast.transactionId && (
              <p className="text-[10px] text-blue-500 font-mono mt-1">TX: {activeToast.transactionId}</p>
            )}
          </div>
        </div>
      )}

      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 flex-shrink-0 h-screen select-none">
        <div className="p-5 flex items-center justify-between border-b border-slate-800">
          <div
            onClick={() => onNavigate('/admin/dashboard')}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-sm">
              R
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight flex items-baseline">
              RemitBD
              <span className="text-slate-500 font-medium text-[10px] uppercase ml-1.5 tracking-widest">
                Admin
              </span>
            </h1>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-5 overflow-y-auto">
          {navItems.map((group, gIdx) => (
            <div key={gIdx}>
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest px-3 mb-2">
                {group.group}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = currentPath === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => onNavigate(item.path)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                        active
                          ? 'bg-blue-600/15 text-blue-400 font-semibold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${active ? 'text-blue-400' : 'text-slate-400'}`} />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-600/30 text-blue-300">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white uppercase">
              {getInitials(admin?.fullName)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white leading-none truncate">{admin?.fullName || 'Super Admin'}</div>
              <div className="text-[10px] text-slate-500 mt-1 leading-none truncate">{admin?.email || 'admin@remitbd.com'}</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-slate-500 hover:text-slate-900 p-1 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="relative w-full">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search transfers, users, or reference IDs..."
                className="w-full bg-slate-100 border border-transparent focus:border-slate-300 focus:bg-white rounded-lg py-2 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 ml-4">
            <div className="hidden sm:flex items-center gap-2 border-r pr-3 border-slate-200">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                API: ONLINE
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-600 text-[10px] font-bold uppercase border border-slate-200">
                SAR-BDT: 31.85
              </div>
            </div>

            <button
              onClick={() => onNavigate('/admin/users')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Open customer records"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden lg:inline">Customer Records</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="relative p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                        Real-time Events
                      </span>
                      <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
                        {unreadCount} unread
                      </span>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[11px] font-semibold text-blue-600 hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3 text-xs transition-colors cursor-pointer hover:bg-slate-50 ${
                            !n.read ? 'bg-blue-50/50' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                n.type.includes('VERIFIED') || n.type.includes('APPROVED') ? 'bg-emerald-100 text-emerald-700' :
                                n.type.includes('REJECTED') || n.type.includes('BANNED') ? 'bg-rose-100 text-rose-700' :
                                n.type.includes('SUSPENDED') ? 'bg-amber-100 text-amber-700' :
                                n.type.includes('NEW_ACCOUNT') || n.type.includes('NEW_') ? 'bg-blue-100 text-blue-700' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {n.type.replace(/_/g, ' ')}
                              </span>
                              {n.transactionId && (
                                <span className="text-[9px] font-mono text-slate-400">{n.transactionId}</span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {new Date(n.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="font-bold text-slate-900">{n.title}</p>
                          <p className="text-slate-600 mt-0.5 truncate">{n.message}</p>
                          {n.amount && n.amount > 0 && (
                            <p className="text-[10px] font-mono text-blue-600 mt-1">{n.currency} {n.amount.toLocaleString()}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${getRoleBadge(
                  admin?.role
                )}`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden md:inline font-bold">{admin?.fullName || 'Admin'}</span>
                <span className="font-mono text-[10px] uppercase">({admin?.role})</span>
                <ChevronDown className="w-3 h-3 ml-0.5" />
              </button>

              {roleSwitcherOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Logged in as
                    </div>
                    <div className="font-bold text-slate-900 text-xs mt-0.5 truncate">{admin?.email}</div>
                  </div>

                  <div className="py-1">
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Switch RBAC Role (Simulator)
                    </div>
                    {rolesList.map((r) => (
                      <button
                        key={r.role}
                        onClick={() => {
                          switchRole(r.role);
                          setRoleSwitcherOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          admin?.role === r.role
                            ? 'bg-blue-50 text-blue-700 font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div>{r.label}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{r.desc}</div>
                        </div>
                        {admin?.role === r.role && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 pt-1 mt-1">
                    <button
                      onClick={() => {
                        logout();
                        setRoleSwitcherOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={logout}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors"
            >
              LOGOUT
            </button>
          </div>
        </header>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden bg-slate-900/60 backdrop-blur flex">
            <div className="w-72 bg-slate-900 h-full p-4 flex flex-col border-r border-slate-800">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-xs">
                    R
                  </div>
                  <span className="font-bold text-white text-sm">RemitBD Admin</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-3 space-y-4">
                {navItems.map((group, gIdx) => (
                  <div key={gIdx}>
                    <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest px-2 mb-1.5">
                      {group.group}
                    </div>
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const active = currentPath === item.path;
                        return (
                          <button
                            key={item.path}
                            onClick={() => {
                              onNavigate(item.path);
                              setMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium ${
                              active
                                ? 'bg-blue-600/20 text-blue-400 font-bold'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>

        <footer className="h-10 bg-white border-t border-slate-200 px-6 flex items-center justify-between text-[10px] text-slate-400 flex-shrink-0">
          <div>RemitBD Enterprise v2.4.0-stable</div>
          <div className="hidden sm:block">
            Connected to Ledger Core &bull; Region: ME-SOUTH-1 &bull; SOC2 Type II Certified
          </div>
        </footer>
      </div>
    </div>
  );
};
