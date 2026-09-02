import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Currency, FXRate } from '../../types';
import { apiFetch } from '../../utils/api';
import {
  TrendingUp,
  RefreshCw,
  Edit2,
  DollarSign,
  AlertCircle,
  Check,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export const FxManagementView: React.FC = () => {
  const { token, hasPermission } = useAuth();
  const [rates, setRates] = useState<FXRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [editingRate, setEditingRate] = useState<FXRate | null>(null);
  const [customerRateInput, setCustomerRateInput] = useState<number>(0);
  const [spreadPercentInput, setSpreadPercentInput] = useState<number>(0);
  const [statusMsg, setStatusMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const fetchRates = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/admin/fx', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        setRates(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, [token]);

  const handleSyncRates = async () => {
    setSyncing(true);
    setStatusMsg(null);
    try {
      const res = await apiFetch('/api/admin/fx/sync', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (!res.ok) {
        setStatusMsg({ type: 'error', text: json.error || 'Sync failed.' });
      } else {
        setStatusMsg({ type: 'success', text: 'Live interbank treasury FX rates synced with provider API.' });
        fetchRates();
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Network connection failed.' });
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenEdit = (r: FXRate) => {
    setEditingRate(r);
    setCustomerRateInput(r.customerRate);
    setSpreadPercentInput(r.spread);
  };

  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRate) return;
    setStatusMsg(null);

    try {
      const res = await apiFetch(`/api/admin/fx/${editingRate.pair}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          customerRate: Number(customerRateInput),
          spread: Number(spreadPercentInput),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setStatusMsg({ type: 'error', text: json.error || 'Failed to update FX rate.' });
      } else {
        setStatusMsg({ type: 'success', text: `FX rate for ${editingRate.pair} updated.` });
        setEditingRate(null);
        fetchRates();
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Network connection failed.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              FX Treasury Exchange Rates Desk
            </h1>
            <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-mono px-2 py-0.5 rounded font-bold">
              10 Active Corridors &rarr; BDT
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage interbank provider rates, customer conversion margins, spread yields, and locked quote validity windows. <span className="font-semibold text-blue-600">Reverse BDT-target: customer enters BDT, payable foreign = BDT ÷ rate × (1 - bonus%).</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchRates}
            className="p-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-200 shadow-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <button
            onClick={handleSyncRates}
            disabled={syncing}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-all disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing Interbank...' : 'Sync Provider Rates'}</span>
          </button>
        </div>
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

      {/* Grid of FX Pairs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rates.map((rate) => (
          <div
            key={rate.pair}
            className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-all shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-slate-900 font-mono">
                      {rate.pair}
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full uppercase">
                      {rate.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    From: <span className="font-semibold text-slate-800">{rate.fromCurrency}</span> &rarr; <span className="font-semibold text-blue-600">{rate.toCurrency}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-medium">Spread Yield</div>
                  <div className="text-xs font-mono font-bold text-blue-600">
                    +{rate.spread}%
                  </div>
                </div>
              </div>

              {/* Customer Rate Highlight - reverse */}
              <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                  Customer Conversion Rate (BDT-target)
                </div>
                <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
                  1 {rate.fromCurrency} = <span className="text-emerald-600">{rate.customerRate} BDT</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                  <span>Provider Interbank Base:</span>
                  <span className="font-mono text-slate-700 font-medium">1 = {rate.providerRate} BDT</span>
                </div>
                <div className="text-[10px] text-blue-600 mt-1 font-medium">Reverse: 10000 BDT → {(10000/(rate.customerRate||1)).toFixed(2)} {rate.fromCurrency} payable</div>
              </div>

              <div className="mt-3 space-y-1 text-[11px] text-slate-500">
                <div className="flex justify-between">
                  <span>Quote Validity:</span>
                  <span className="font-mono text-slate-800 font-medium">{rate.quoteValiditySeconds}s</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Updated:</span>
                  <span className="font-mono text-slate-500">
                    {new Date(rate.lastUpdated).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => handleOpenEdit(rate)}
                className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors font-semibold"
              >
                <Edit2 className="w-3 h-3 text-blue-600" />
                <span>Adjust Spread / Rate</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Rate Modal */}
      {editingRate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="font-bold text-slate-900 text-sm">
                Adjust FX Rate: {editingRate.pair}
              </span>
              <button onClick={() => setEditingRate(null)} className="text-slate-400 hover:text-slate-700 text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRate} className="p-5 space-y-4 bg-white">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Provider Interbank Base:</span>
                  <span className="font-mono font-bold text-slate-900">1 {editingRate.fromCurrency} = {editingRate.providerRate} BDT</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Customer Remittance Rate (BDT)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={customerRateInput}
                  onChange={(e) => setCustomerRateInput(parseFloat(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono text-base font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Spread Margin (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={spreadPercentInput}
                  onChange={(e) => setSpreadPercentInput(parseFloat(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRate(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
                >
                  Save Treasury Rate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
