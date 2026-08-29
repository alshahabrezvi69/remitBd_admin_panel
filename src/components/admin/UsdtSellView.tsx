import React, { useEffect, useState } from 'react';
import { CheckCircle2, RefreshCw, Save, WalletCards, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Sale { id: string; user_name?: string; user_phone?: string; amount_bdt: number; usdt_amount: number; rate_bdt_per_usdt: number; trc20_wallet_address: string; status: string; note?: string; created_at: string; }
interface Config { enabled: boolean; rate_bdt_per_usdt: number; trc20_wallet_address: string; instructions: string; }

const statusOptions = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PAID'];

export const UsdtSellView: React.FC = () => {
  const { token } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [config, setConfig] = useState<Config>({ enabled: false, rate_bdt_per_usdt: 0, trc20_wallet_address: '', instructions: '' });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const auth = { Authorization: `Bearer ${token}` };

  const load = async () => {
    setLoading(true);
    try {
      const [salesRes, configRes] = await Promise.all([fetch('/api/admin/usdt-sells', { headers: auth }), fetch('/api/admin/usdt-config', { headers: auth })]);
      if (salesRes.ok) setSales(await salesRes.json());
      if (configRes.ok) setConfig({ ...config, ...(await configRes.json()) });
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const saveConfig = async () => {
    const res = await fetch('/api/admin/usdt-config', { method: 'PUT', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify(config) });
    setMessage(res.ok ? 'USDT configuration saved.' : 'Could not save configuration.');
  };
  const updateStatus = async (sale: Sale, status: string) => {
    const res = await fetch(`/api/admin/usdt-sells/${sale.id}/status`, { method: 'PATCH', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    if (res.ok) { setMessage(`Request ${sale.id} updated.`); load(); }
  };

  return <div className="p-6 space-y-6 overflow-y-auto h-full">
    <div className="flex items-center justify-between"><div><h2 className="text-xl font-bold text-slate-900">USDT Sell Requests</h2><p className="text-sm text-slate-500 mt-1">Review TRC20 deposits and control manual BDT payouts.</p></div><button onClick={load} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg"><RefreshCw className="w-4 h-4" /> Refresh</button></div>
    {message && <div className="bg-emerald-50 text-emerald-700 rounded-lg px-4 py-3 text-sm">{message}</div>}
    <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"><div className="flex items-center gap-2 mb-4"><WalletCards className="w-5 h-5 text-blue-600" /><h3 className="font-bold text-slate-900">Sell Configuration</h3></div><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><label className="text-xs font-semibold text-slate-600">Rate (BDT per USDT)<input type="number" value={config.rate_bdt_per_usdt} onChange={e => setConfig({ ...config, rate_bdt_per_usdt: Number(e.target.value) })} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" /></label><label className="text-xs font-semibold text-slate-600">TRC20 receiving wallet<input value={config.trc20_wallet_address} onChange={e => setConfig({ ...config, trc20_wallet_address: e.target.value })} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" /></label><label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mt-5"><input type="checkbox" checked={config.enabled} onChange={e => setConfig({ ...config, enabled: e.target.checked })} /> Enable USDT selling</label></div><textarea value={config.instructions} onChange={e => setConfig({ ...config, instructions: e.target.value })} placeholder="Customer instructions" className="mt-4 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" rows={2} /><button onClick={saveConfig} className="mt-3 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"><Save className="w-4 h-4" /> Save configuration</button></section>
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"><div className="px-5 py-4 border-b border-slate-100 font-bold text-slate-900">Manual Verification Queue</div><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-slate-50 text-slate-500 uppercase"><tr><th className="p-4">Customer</th><th className="p-4">USDT / BDT</th><th className="p-4">TRC20 Wallet</th><th className="p-4">Status</th><th className="p-4">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan={5} className="p-10 text-center text-slate-400">Loading requests...</td></tr> : sales.length === 0 ? <tr><td colSpan={5} className="p-10 text-center text-slate-400">No USDT sell requests.</td></tr> : sales.map(s => <tr key={s.id}><td className="p-4"><div className="font-bold text-slate-900">{s.user_name || 'Unknown customer'}</div><div className="text-slate-500">{s.user_phone}</div></td><td className="p-4 font-mono"><div>{s.usdt_amount} USDT</div><div className="text-emerald-600">৳ {s.amount_bdt}</div></td><td className="p-4 font-mono text-[11px] max-w-xs break-all">{s.trc20_wallet_address}</td><td className="p-4"><span className="px-2 py-1 rounded-full bg-amber-50 text-amber-700 font-bold">{s.status}</span></td><td className="p-4"><select value={s.status} onChange={e => updateStatus(s, e.target.value)} className="border border-slate-200 rounded-lg px-2 py-1 bg-white">{statusOptions.map(x => <option key={x}>{x}</option>)}</select></td></tr>)}</tbody></table></div></section>
  </div>;
};
