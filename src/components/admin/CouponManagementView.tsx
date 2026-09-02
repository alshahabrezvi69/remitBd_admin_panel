import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Coupon } from '../../types';
import { apiFetch, normalizeCoupon, readApiError } from '../../utils/api';
import { Gift, Plus, Edit2, Trash2, RefreshCw, Check, X, AlertCircle, Tag } from 'lucide-react';

export const CouponManagementView: React.FC = () => {
  const { token } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', bonus_percent: 5, is_active: true, description: '', max_uses: 0, expires_at: '' });

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/admin/coupons', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const json = await res.json();
      if (!res.ok) throw new Error(readApiError(json, 'Failed to load coupons'));
      const list = Array.isArray(json) ? json : json.coupons || [];
      setCoupons(list.map(normalizeCoupon));
    } catch (e) {
      setStatusMsg({ type: 'error', text: e instanceof Error ? e.message : 'Load failed' });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchCoupons(); }, [token]);

  const openCreate = () => {
    setEditing(null);
    setForm({ code: '', bonus_percent: 5, is_active: true, description: '', max_uses: 0, expires_at: '' });
    setShowForm(true);
  };
  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({ code: c.code, bonus_percent: c.bonusPercent, is_active: c.isActive, description: c.description || '', max_uses: c.maxUses, expires_at: c.expiresAt ? c.expiresAt.slice(0,16) : '' });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    const payload: any = {
      code: form.code.trim().toUpperCase(),
      bonus_percent: Number(form.bonus_percent),
      is_active: form.is_active,
      description: form.description,
      max_uses: Number(form.max_uses),
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    };
    if (!payload.code || payload.bonus_percent <=0 || payload.bonus_percent >100) {
      setStatusMsg({ type: 'error', text: 'Code required and bonus 1-100%' });
      return;
    }
    try {
      const url = editing ? `/api/admin/coupons/${editing.id}` : '/api/admin/coupons';
      const method = editing ? 'PUT' : 'POST';
      const res = await apiFetch(url, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok) throw new Error(readApiError(json, 'Save failed'));
      setStatusMsg({ type: 'success', text: editing ? 'Coupon updated' : 'Coupon created' });
      setShowForm(false);
      fetchCoupons();
    } catch (e) { setStatusMsg({ type: 'error', text: e instanceof Error ? e.message : 'Save failed' }); }
  };

  const toggleStatus = async (c: Coupon) => {
    try {
      const res = await apiFetch(`/api/admin/coupons/${c.id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ is_active: !c.isActive }) });
      const json = await res.json();
      if (!res.ok) throw new Error(readApiError(json, 'Status update failed'));
      fetchCoupons();
    } catch (e) { setStatusMsg({ type: 'error', text: e instanceof Error ? e.message : 'Failed' }); }
  };

  const handleDelete = async (c: Coupon) => {
    if (!confirm(`Delete coupon ${c.code}?`)) return;
    try {
      const res = await apiFetch(`/api/admin/coupons/${c.id}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) { const j = await res.json(); throw new Error(readApiError(j,'Delete failed')); }
      fetchCoupons();
    } catch(e){ setStatusMsg({type:'error', text: e instanceof Error ? e.message : 'Delete failed'}); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Coupon Management</h1>
            <span className="bg-purple-50 text-purple-700 border border-purple-200 text-xs font-mono px-2 py-0.5 rounded font-bold">{coupons.length} Coupons</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Create, edit and deactivate bonus coupons for BDT-target reverse conversion (reduces payable foreign amount).</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchCoupons} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} /></button>
          <button onClick={openCreate} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4 py-2 rounded-lg"><Plus className="w-4 h-4" /> New Coupon</button>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${statusMsg.type==='error' ? 'bg-rose-50 border border-rose-200 text-rose-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'}`}>
          {statusMsg.type==='error' ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Bonus %</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Uses</th>
                <th className="py-3 px-4">Expires</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? <tr><td colSpan={7} className="py-12 text-center text-slate-400">Loading coupons...</td></tr> : coupons.length===0 ? <tr><td colSpan={7} className="py-12 text-center text-slate-400">No coupons created yet. Create one to offer conversion bonuses.</td></tr> : coupons.map(c=> (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 flex items-center gap-2"><Tag className="w-3.5 h-3.5 text-purple-500" />{c.code}</td>
                  <td className="py-3 px-4 font-bold text-emerald-600">+{c.bonusPercent}%</td>
                  <td className="py-3 px-4 text-slate-600 max-w-[220px] truncate">{c.description || '-'}</td>
                  <td className="py-3 px-4 font-mono">{c.usedCount} / {c.maxUses===0 ? '∞' : c.maxUses}</td>
                  <td className="py-3 px-4 text-slate-500">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : 'Never'}</td>
                  <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${c.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{c.isActive ? 'ACTIVE' : 'DISABLED'}</span></td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={()=>openEdit(c)} className="p-1.5 hover:bg-slate-100 rounded-lg"><Edit2 className="w-3.5 h-3.5 text-slate-600" /></button>
                      <button onClick={()=>toggleStatus(c)} className={`p-1.5 rounded-lg ${c.isActive ? 'hover:bg-amber-50 text-amber-600' : 'hover:bg-emerald-50 text-emerald-600'}`}>{c.isActive ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}</button>
                      <button onClick={()=>handleDelete(c)} className="p-1.5 hover:bg-rose-50 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-rose-600" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="font-bold text-slate-900 text-sm">{editing ? `Edit Coupon: ${editing.code}` : 'Create New Coupon'}</span>
              <button onClick={()=>setShowForm(false)} className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4 bg-white">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Coupon Code *</label>
                <input type="text" required value={form.code} onChange={e=> setForm({...form, code: e.target.value.toUpperCase()})} placeholder="EID10, BONUS5" className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Bonus Percentage (1-100) *</label>
                <input type="number" min={1} max={100} step={0.5} required value={form.bonus_percent} onChange={e=> setForm({...form, bonus_percent: parseFloat(e.target.value)||0})} className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500" />
                <p className="text-[11px] text-slate-500 mt-1">Applied as discount on payable foreign: payable = (BDT ÷ rate) × (1 - bonus%).</p>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Description</label>
                <input type="text" value={form.description} onChange={e=> setForm({...form, description: e.target.value})} placeholder="Eid bonus offer" className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Max Uses (0=∞)</label>
                  <input type="number" min={0} value={form.max_uses} onChange={e=> setForm({...form, max_uses: parseInt(e.target.value)||0})} className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Active</label>
                  <select value={form.is_active ? '1':'0'} onChange={e=> setForm({...form, is_active: e.target.value==='1'})} className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="1">Active</option>
                    <option value="0">Disabled</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Expires At (optional)</label>
                <input type="datetime-local" value={form.expires_at} onChange={e=> setForm({...form, expires_at: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button type="button" onClick={()=>setShowForm(false)} className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-5 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg">{editing ? 'Update Coupon' : 'Create Coupon'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs text-slate-600">
        <div className="font-bold text-slate-700 mb-1 flex items-center gap-2"><Gift className="w-4 h-4 text-purple-600" /> How reverse coupon works</div>
        Customer enters BDT they want to receive. System calculates payable foreign as <span className="font-mono font-bold">BDT ÷ rate × (1 - bonus%)</span>. Example: 10000 BDT at 32 BDT/SAR with 10% bonus → payable = 10000/32×0.9 = 281.25 SAR instead of 312.50 SAR. Admin sees bonus in transfer details.
      </div>
    </div>
  );
};