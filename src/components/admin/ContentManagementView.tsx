import React, { useEffect, useState } from 'react';
import { Gift, PlayCircle, Plus, RefreshCw, ToggleLeft, ToggleRight, Pencil, Trash2, X, Tag, Ticket, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type Offer = { id: string; title: string; description: string; offer_type: 'VOUCHER' | 'BONUS'; code?: string; value_label: string; action_label: string; is_active: boolean; priority: number };
type Video = { id: string; title: string; description: string; video_url: string; duration_label: string; is_active: boolean; sort_order: number };
type Coupon = { id: string; code: string; bonus_percent: number; bonusPercent?: number; is_active: boolean; isActive?: boolean; description?: string; max_uses: number; maxUses?: number; used_count: number; usedCount?: number; expires_at?: string; expiresAt?: string };

type VideoForm = { title: string; description: string; video_url: string; duration_label: string; sort_order: string };
const emptyVideoForm: VideoForm = { title: '', description: '', video_url: '', duration_label: '', sort_order: '0' };
const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

export const ContentManagementView: React.FC = () => {
  const { token } = useAuth();
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  const [offers, setOffers] = useState<Offer[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [message, setMessage] = useState('');
  const [offerForm, setOfferForm] = useState({ title: '', description: '', offer_type: 'VOUCHER', code: '', value_label: '', action_label: 'View offer', priority: '0' });
  const [videoForm, setVideoForm] = useState<VideoForm>(emptyVideoForm);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [savingVideo, setSavingVideo] = useState(false);
  const [couponForm, setCouponForm] = useState({ code: '', bonus_percent: '10', description: 'Extra BDT Bonus for Send Money & Add Money', max_uses: '0', expires_at: '', is_active: true });
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [savingCoupon, setSavingCoupon] = useState(false);

  const load = async () => {
    const [offersRes, videosRes, couponsRes] = await Promise.all([
      fetch('/api/admin/offers', { headers: authHeaders }),
      fetch('/api/admin/help-videos', { headers: authHeaders }),
      fetch('/api/admin/coupons', { headers: authHeaders }),
    ]);
    if (offersRes.ok) setOffers(await offersRes.json());
    if (videosRes.ok) setVideos(await videosRes.json());
    if (couponsRes.ok) {
      const data = await couponsRes.json();
      const list = Array.isArray(data) ? data : data.coupons || [];
      setCoupons(list);
    }
  };

  useEffect(() => { load().catch(() => setMessage('Unable to load content from the API.')); }, [token]);

  const createOffer = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await fetch('/api/admin/offers', { method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...offerForm, priority: Number(offerForm.priority), is_active: true, code: offerForm.code || null }) });
    if (!response.ok) { setMessage('Offer could not be saved.'); return; }
    setOfferForm({ title: '', description: '', offer_type: 'VOUCHER', code: '', value_label: '', action_label: 'View offer', priority: '0' });
    setMessage('Offer published to the customer app.');
    await load();
  };

  const saveCoupon = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingCoupon(true);
    setMessage('');
    try {
      const payload: any = {
        code: couponForm.code.trim().toUpperCase(),
        bonus_percent: Number(couponForm.bonus_percent),
        is_active: couponForm.is_active,
        description: couponForm.description,
        max_uses: Number(couponForm.max_uses),
        expires_at: couponForm.expires_at ? new Date(couponForm.expires_at).toISOString() : null,
      };
      if (!payload.code || !payload.bonus_percent || payload.bonus_percent <= 0 || payload.bonus_percent > 100) {
        setMessage('Coupon code and bonus 1-100% required.');
        return;
      }
      const path = editingCouponId ? `/api/admin/coupons/${editingCouponId}` : '/api/admin/coupons';
      const method = editingCouponId ? 'PUT' : 'POST';
      const res = await fetch(path, { method, headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMessage(err.detail || 'Coupon could not be saved.');
        return;
      }
      setCouponForm({ code: '', bonus_percent: '10', description: 'Extra BDT Bonus for Send Money & Add Money', max_uses: '0', expires_at: '', is_active: true });
      setEditingCouponId(null);
      setMessage(editingCouponId ? 'Coupon updated. Users can apply it in Add Money.' : 'Coupon created. Users can now apply it in Add Money for extra bonus.');
      await load();
      // Also optionally publish as visible Offer so users see code in Home carousel
      if (!editingCouponId && payload.code) {
        // auto-create offer for visibility if not exists
        const offerExists = offers.some(o => (o.code || '').toUpperCase() === payload.code);
        if (!offerExists) {
          await fetch('/api/admin/offers', { method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ title: `Coupon ${payload.code} - ${payload.bonus_percent}% Extra`, description: payload.description || `Use code ${payload.code} in Add Money to get ${payload.bonus_percent}% extra bonus on payable foreign amount`, offer_type: 'BONUS', code: payload.code, value_label: `${payload.bonus_percent}% EXTRA`, action_label: 'Apply in Add Money', is_active: true, priority: 10 }) }).catch(() => {});
          await load();
        }
      }
    } finally {
      setSavingCoupon(false);
    }
  };

  const editCoupon = (c: Coupon) => {
    setEditingCouponId(c.id);
    const bonus = (c as any).bonus_percent ?? (c as any).bonusPercent ?? 10;
    const active = (c as any).is_active ?? (c as any).isActive ?? true;
    const maxUses = (c as any).max_uses ?? (c as any).maxUses ?? 0;
    const expires = (c as any).expires_at ?? (c as any).expiresAt ?? '';
    setCouponForm({
      code: c.code,
      bonus_percent: String(bonus),
      description: c.description || '',
      max_uses: String(maxUses),
      expires_at: expires ? new Date(expires).toISOString().slice(0,16) : '',
      is_active: !!active,
    });
    setMessage(`Editing coupon ${c.code}`);
  };

  const toggleCoupon = async (c: Coupon) => {
    const active = (c as any).is_active ?? (c as any).isActive;
    await fetch(`/api/admin/coupons/${c.id}/status`, { method: 'PATCH', headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !active }) });
    await load();
  };

  const deleteCoupon = async (c: Coupon) => {
    if (!window.confirm(`Delete coupon ${c.code}? Users will no longer be able to use it.`)) return;
    const res = await fetch(`/api/admin/coupons/${c.id}`, { method: 'DELETE', headers: authHeaders });
    if (!res.ok) { setMessage('Coupon could not be deleted.'); return; }
    if (editingCouponId === c.id) { setEditingCouponId(null); setCouponForm({ code: '', bonus_percent: '10', description: 'Extra BDT Bonus for Send Money & Add Money', max_uses: '0', expires_at: '', is_active: true }); }
    setMessage('Coupon deleted.');
    await load();
  };

  const saveVideo = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingVideo(true);
    setMessage('');
    try {
      const path = editingVideoId ? `/api/admin/help-videos/${editingVideoId}` : '/api/admin/help-videos';
      const response = await fetch(path, {
        method: editingVideoId ? 'PUT' : 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...videoForm, sort_order: Number(videoForm.sort_order), is_active: true }),
      });
      if (!response.ok) { setMessage('Video could not be saved.'); return; }
      setVideoForm(emptyVideoForm);
      setEditingVideoId(null);
      setMessage(editingVideoId ? 'Help video updated in the customer app.' : 'Help video published to the customer app.');
      await load();
    } finally {
      setSavingVideo(false);
    }
  };

  const editVideo = (video: Video) => {
    setEditingVideoId(video.id);
    setVideoForm({ title: video.title, description: video.description || '', video_url: video.video_url, duration_label: video.duration_label || '', sort_order: String(video.sort_order ?? 0) });
    setMessage('Editing selected help video.');
  };

  const deleteVideo = async (video: Video) => {
    if (!window.confirm(`Delete “${video.title}” from the customer app?`)) return;
    const response = await fetch(`/api/admin/help-videos/${video.id}`, { method: 'DELETE', headers: authHeaders });
    if (!response.ok) { setMessage('Video could not be deleted.'); return; }
    if (editingVideoId === video.id) { setEditingVideoId(null); setVideoForm(emptyVideoForm); }
    setMessage('Help video deleted from the customer app.');
    await load();
  };

  const toggleOffer = async (offer: Offer) => {
    await fetch(`/api/admin/offers/${offer.id}/status`, { method: 'PATCH', headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !offer.is_active }) });
    await load();
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">Customer Content</h1><p className="text-sm text-slate-500 mt-1">Manage live offers, Add Money coupon codes, and profile help videos stored in the backend.</p></div>
        <button onClick={() => load()} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600"><RefreshCw className="w-4 h-4" /> Refresh</button>
      </div>
      {message && <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">{message}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4"><Gift className="w-5 h-5 text-blue-600" /><h2 className="font-bold text-slate-900">Voucher & Bonus Offers</h2></div>
          <form onSubmit={createOffer} className="space-y-3 border-b border-slate-100 pb-5 mb-5">
            <input required className={inputClass} placeholder="Offer title" value={offerForm.title} onChange={e => setOfferForm({ ...offerForm, title: e.target.value })} />
            <textarea required className={inputClass} placeholder="Customer-facing description" value={offerForm.description} onChange={e => setOfferForm({ ...offerForm, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-3"><select className={inputClass} value={offerForm.offer_type} onChange={e => setOfferForm({ ...offerForm, offer_type: e.target.value })}><option value="VOUCHER">Voucher</option><option value="BONUS">Bonus</option></select><input required className={inputClass} placeholder="Value label" value={offerForm.value_label} onChange={e => setOfferForm({ ...offerForm, value_label: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3"><input className={inputClass} placeholder="Voucher code (optional)" value={offerForm.code} onChange={e => setOfferForm({ ...offerForm, code: e.target.value })} /><input className={inputClass} type="number" placeholder="Priority" value={offerForm.priority} onChange={e => setOfferForm({ ...offerForm, priority: e.target.value })} /></div>
            <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white"><Plus className="w-4 h-4" /> Publish offer</button>
          </form>
          <div className="space-y-3">{offers.map(offer => <div key={offer.id} className="rounded-lg border border-slate-200 p-3"><div className="flex items-start justify-between gap-3"><div><div className="font-semibold text-sm text-slate-900">{offer.title}</div><div className="text-xs text-slate-500 mt-1">{offer.description}</div><div className="text-xs text-blue-600 font-bold mt-2">{offer.value_label}{offer.code ? ` · ${offer.code}` : ''}</div></div><button onClick={() => toggleOffer(offer)} title="Toggle offer" className={offer.is_active ? 'text-emerald-600' : 'text-slate-300'}>{offer.is_active ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}</button></div></div>)}</div>

          {/* Add Money Coupon Codes - inside Voucher & Bonus Offers */}
          <div className="mt-8 pt-6 border-t-2 border-purple-100">
            <div className="flex items-center gap-2 mb-3"><Ticket className="w-5 h-5 text-purple-600" /><h3 className="font-bold text-slate-900">Send Money Coupon Bonus (Extra BDT)</h3><span className="ml-auto text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">{coupons.length} codes</span></div>
            <p className="text-xs text-slate-500 mb-4">Create coupon codes for <span className="font-bold">Add Money & Send Money</span>. Example: <span className="font-mono font-bold text-purple-700">ADD10</span> with <span className="font-bold">10% Extra</span> → user enters <span className="font-bold">5000 BDT</span>, bonus <span className="font-bold">+500 BDT</span>, total <span className="font-bold">5500 BDT</span> shown in box (payable foreign = base BDT ÷ rate, bonus added to total). Admin sets any % you want.</p>
            <form onSubmit={saveCoupon} className="space-y-3 bg-purple-50/50 border border-purple-100 rounded-xl p-4 mb-4">
              <div className="grid grid-cols-2 gap-3">
                <input required className={inputClass} placeholder="Coupon code e.g. ADD10" value={couponForm.code} onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} />
                <div className="flex gap-2">
                  <input required type="number" min={1} max={100} step={0.5} className={inputClass} placeholder="Bonus % e.g. 10" value={couponForm.bonus_percent} onChange={e => setCouponForm({ ...couponForm, bonus_percent: e.target.value })} />
                  <span className="flex items-center text-sm font-bold text-purple-700">%</span>
                </div>
              </div>
              <input className={inputClass} placeholder="Description e.g. Add Money 10% Extra Bonus" value={couponForm.description} onChange={e => setCouponForm({ ...couponForm, description: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <input className={inputClass} type="number" min={0} placeholder="Max uses (0 = unlimited)" value={couponForm.max_uses} onChange={e => setCouponForm({ ...couponForm, max_uses: e.target.value })} />
                <input className={inputClass} type="datetime-local" value={couponForm.expires_at} onChange={e => setCouponForm({ ...couponForm, expires_at: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700"><input type="checkbox" checked={couponForm.is_active} onChange={e => setCouponForm({ ...couponForm, is_active: e.target.checked })} /> Active (users can apply)</label>
              <div className="flex gap-2">
                <button disabled={savingCoupon} className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"><Ticket className="w-4 h-4" /> {savingCoupon ? 'Saving…' : editingCouponId ? 'Update coupon' : 'Create coupon (10% Extra)'}</button>
                {editingCouponId && <button type="button" onClick={() => { setEditingCouponId(null); setCouponForm({ code: '', bonus_percent: '10', description: 'Extra BDT Bonus for Send Money & Add Money', max_uses: '0', expires_at: '', is_active: true }); }} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600"><X className="w-4 h-4" /></button>}
              </div>
              <p className="text-[11px] text-purple-600 font-medium">💡 Tip: Creating coupon automatically publishes a visible Offer with same code so users see <span className="font-mono">ADD10</span> in Home offers carousel. Valid for both Add Money & Send Money — <span className="font-bold">Admin sets any % (e.g. 5%, 12%, 20%) and it is added to total BDT shown in exchange box.</span></p>
            </form>
            <div className="space-y-2">
              {coupons.length === 0 ? <div className="text-xs text-slate-400 p-3 bg-slate-50 rounded-lg">No coupon codes yet. Create one e.g. <span className="font-mono font-bold">ADD10</span> for 10% extra.</div> : coupons.map(c => {
                const bonus = (c as any).bonus_percent ?? (c as any).bonusPercent ?? 0;
                const active = (c as any).is_active ?? (c as any).isActive ?? true;
                const maxU = (c as any).max_uses ?? (c as any).maxUses ?? 0;
                const used = (c as any).used_count ?? (c as any).usedCount ?? 0;
                const exp = (c as any).expires_at ?? (c as any).expiresAt;
                return (
                  <div key={c.id} className="rounded-lg border border-slate-200 p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-900 flex items-center gap-1"><Tag className="w-3.5 h-3.5 text-purple-500" />{c.code}</span>
                        <span className="text-xs font-bold text-emerald-600">+{bonus}% EXTRA</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{active ? 'ACTIVE' : 'DISABLED'}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 truncate">{c.description || 'Add Money bonus'}</div>
                      <div className="text-[11px] text-slate-400 mt-1 font-mono">{used} / {maxU === 0 ? '∞' : maxU} uses {exp ? `· expires ${new Date(exp).toLocaleDateString()}` : '· never expires'}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => editCoupon(c)} title="Edit" className="rounded-md p-1.5 text-blue-600 hover:bg-blue-50"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => toggleCoupon(c)} title={active ? 'Disable' : 'Enable'} className={`rounded-md p-1.5 ${active ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}>{active ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}</button>
                      <button onClick={() => deleteCoupon(c)} title="Delete" className="rounded-md p-1.5 text-rose-600 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2"><PlayCircle className="w-5 h-5 text-emerald-600" /><h2 className="font-bold text-slate-900">Profile Help Videos</h2></div>{editingVideoId && <button type="button" onClick={() => { setEditingVideoId(null); setVideoForm(emptyVideoForm); }} className="flex items-center gap-1 text-xs font-semibold text-slate-500"><X className="w-3.5 h-3.5" /> Cancel edit</button>}</div>
          <form onSubmit={saveVideo} className="space-y-3 border-b border-slate-100 pb-5 mb-5">
            <input required className={inputClass} placeholder="Video title" value={videoForm.title} onChange={e => setVideoForm({ ...videoForm, title: e.target.value })} />
            <textarea className={inputClass} placeholder="Description" value={videoForm.description} onChange={e => setVideoForm({ ...videoForm, description: e.target.value })} />
            <input required type="url" className={inputClass} placeholder="HTTPS video URL" value={videoForm.video_url} onChange={e => setVideoForm({ ...videoForm, video_url: e.target.value })} />
            <div className="grid grid-cols-2 gap-3"><input className={inputClass} placeholder="Duration label" value={videoForm.duration_label} onChange={e => setVideoForm({ ...videoForm, duration_label: e.target.value })} /><input className={inputClass} type="number" placeholder="Sort order" value={videoForm.sort_order} onChange={e => setVideoForm({ ...videoForm, sort_order: e.target.value })} /></div>
            <button disabled={savingVideo} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"><PlayCircle className="w-4 h-4" /> {savingVideo ? 'Saving…' : editingVideoId ? 'Save video changes' : 'Publish video'}</button>
          </form>
          <div className="space-y-3">{videos.map(video => <div key={video.id} className="rounded-lg border border-slate-200 p-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="font-semibold text-sm text-slate-900">{video.title}</div><div className="text-xs text-slate-500 mt-1">{video.description}</div><div className="text-xs text-emerald-600 mt-2 truncate">{video.video_url}</div></div><div className="flex items-center gap-2 shrink-0"><button onClick={() => editVideo(video)} title="Edit video" className="rounded-md p-1.5 text-blue-600 hover:bg-blue-50"><Pencil className="w-4 h-4" /></button><button onClick={() => deleteVideo(video)} title="Delete video" className="rounded-md p-1.5 text-rose-600 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></button></div></div></div>)}</div>
        </section>
      </div>
    </div>
  );
};
