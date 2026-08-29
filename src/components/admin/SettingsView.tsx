import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SystemSettings } from '../../types';
import {
  Settings,
  ShieldCheck,
  Bell,
  Save,
  Check,
  AlertCircle,
  Lock,
  RefreshCw,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { token, hasPermission } = useAuth();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/settings', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        setSettings(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [token]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(settings),
      });

      const json = await res.json();
      if (!res.ok) {
        setStatusMsg({ type: 'error', text: json.error || 'Failed to save system settings.' });
      } else {
        setStatusMsg({ type: 'success', text: 'System configuration saved successfully.' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Network connection failed.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span>Loading System Settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Global Platform &amp; Risk Settings
            </h1>
            <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-mono px-2 py-0.5 rounded font-bold">
              Super Admin Config
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure system-wide AML thresholds, 2FA security enforcement, automatic compliance triggers, and webhooks.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
        </button>
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

      <form onSubmit={handleSave} className="space-y-6">
        {/* Compliance & AML Limits */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>AML &amp; Compliance Thresholds</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Auto-Flag High Risk Transfer Threshold (BDT)
              </label>
              <input
                type="number"
                value={settings.amlThresholdBdt}
                onChange={(e) => setSettings({ ...settings, amlThresholdBdt: parseFloat(e.target.value) })}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="text-[10px] text-slate-400 mt-1">
                Transfers exceeding this amount require explicit compliance approval before payout.
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Unverified User Daily Send Limit (USD / Native Equivalent)
              </label>
              <input
                type="number"
                value={settings.unverifiedDailyLimit}
                onChange={(e) => setSettings({ ...settings, unverifiedDailyLimit: parseFloat(e.target.value) })}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="text-[10px] text-slate-400 mt-1">
                Maximum allowed transfer before requiring mandatory Tier-1 KYC verification.
              </div>
            </div>
          </div>
        </div>

        {/* Security & 2FA Enforcement */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            <Lock className="w-4 h-4 text-blue-600" />
            <span>Administrative Security Policies</span>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.require2faAllAdmins}
                onChange={(e) => setSettings({ ...settings, require2faAllAdmins: e.target.checked })}
                className="w-4 h-4 rounded bg-white border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="font-semibold text-slate-800">Enforce Multi-Factor Authentication (2FA) for all Admins</div>
                <div className="text-[11px] text-slate-400">Requires TOTP token challenge upon sign in.</div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="w-4 h-4 rounded bg-white border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="font-semibold text-amber-700">Maintenance Mode</div>
                <div className="text-[11px] text-slate-400">Suspends public customer order intake while preserving admin oversight.</div>
              </div>
            </label>
          </div>
        </div>

        {/* Real-time Webhooks & Events */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            <Bell className="w-4 h-4 text-blue-600" />
            <span>Real-time Event Notifications</span>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifyOnNewDeposit}
                onChange={(e) => setSettings({ ...settings, notifyOnNewDeposit: e.target.checked })}
                className="w-4 h-4 rounded bg-white border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="font-semibold text-slate-800">Broadcast SSE event on inbound customer deposit</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifyOnHighRiskTransfer}
                onChange={(e) => setSettings({ ...settings, notifyOnHighRiskTransfer: e.target.checked })}
                className="w-4 h-4 rounded bg-white border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="font-semibold text-slate-800">Push high-priority compliance alert on AML flagged transfers</span>
            </label>
          </div>
        </div>
      </form>
    </div>
  );
};
