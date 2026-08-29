import React, { useEffect, useState } from 'react';
import { Gift, PlayCircle, Plus, RefreshCw, ToggleLeft, ToggleRight, Pencil, Trash2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type Offer = { id: string; title: string; description: string; offer_type: 'VOUCHER' | 'BONUS'; code?: string; value_label: string; action_label: string; is_active: boolean; priority: number };
type Video = { id: string; title: string; description: string; video_url: string; duration_label: string; is_active: boolean; sort_order: number };

type VideoForm = { title: string; description: string; video_url: string; duration_label: string; sort_order: string };
const emptyVideoForm: VideoForm = { title: '', description: '', video_url: '', duration_label: '', sort_order: '0' };
const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

export const ContentManagementView: React.FC = () => {
  const { token } = useAuth();
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  const [offers, setOffers] = useState<Offer[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [message, setMessage] = useState('');
  const [offerForm, setOfferForm] = useState({ title: '', description: '', offer_type: 'VOUCHER', code: '', value_label: '', action_label: 'View offer', priority: '0' });
  const [videoForm, setVideoForm] = useState<VideoForm>(emptyVideoForm);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [savingVideo, setSavingVideo] = useState(false);

  const load = async () => {
    const [offersRes, videosRes] = await Promise.all([
      fetch('/api/admin/offers', { headers: authHeaders }),
      fetch('/api/admin/help-videos', { headers: authHeaders }),
    ]);
    if (offersRes.ok) setOffers(await offersRes.json());
    if (videosRes.ok) setVideos(await videosRes.json());
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
        <div><h1 className="text-2xl font-bold text-slate-900">Customer Content</h1><p className="text-sm text-slate-500 mt-1">Manage live offers and profile help videos stored in the backend.</p></div>
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
