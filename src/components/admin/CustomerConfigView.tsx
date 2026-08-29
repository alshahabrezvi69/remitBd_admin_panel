import React, { useEffect, useState } from 'react';
import { Check, DollarSign, Pencil, Plus, RefreshCw, Save, Settings2, Trash2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type CurrencyConfig = {
  currency_code: string;
  currency_name: string;
  symbol: string;
  country_code: string;
  country_flag: string;
  country_name: string;
  enabled: boolean;
  indicative_bdt_rate: number;
  min_add_money: number;
  max_add_money: number;
  daily_limit: number;
  monthly_limit: number;
  supported_funding_methods: string[];
  supported_corridors: string[];
};

type CorridorConfig = {
  id: string;
  source_country_code: string;
  source_country_name: string;
  source_country_flag: string;
  source_currency: string;
  source_currency_symbol: string;
  target_country_code: string;
  target_country_name: string;
  target_country_flag: string;
  target_currency: string;
  target_currency_symbol: string;
  indicative_rate: number;
  service_fee: number;
  min_transfer: number;
  max_transfer: number;
  daily_limit: number;
  monthly_limit: number;
  is_enabled: boolean;
};

const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
const emptyCurrency: CurrencyConfig = {
  currency_code: '', currency_name: '', symbol: '', country_code: '', country_flag: '', country_name: '', enabled: true,
  indicative_bdt_rate: 0, min_add_money: 0, max_add_money: 0, daily_limit: 0, monthly_limit: 0,
  supported_funding_methods: ['BANK_TRANSFER'], supported_corridors: [],
};
const emptyCorridor: CorridorConfig = {
  id: '', source_country_code: '', source_country_name: '', source_country_flag: '', source_currency: '', source_currency_symbol: '',
  target_country_code: 'BD', target_country_name: 'Bangladesh', target_country_flag: '', target_currency: 'BDT', target_currency_symbol: '৳',
  indicative_rate: 0, service_fee: 0, min_transfer: 0, max_transfer: 0, daily_limit: 0, monthly_limit: 0, is_enabled: true,
};

const numberValue = (value: string) => Number.isFinite(Number(value)) ? Number(value) : 0;

export const CustomerConfigView: React.FC = () => {
  const { token } = useAuth();
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  const [currencies, setCurrencies] = useState<CurrencyConfig[]>([]);
  const [corridors, setCorridors] = useState<CorridorConfig[]>([]);
  const [currencyForm, setCurrencyForm] = useState<CurrencyConfig>(emptyCurrency);
  const [corridorForm, setCorridorForm] = useState<CorridorConfig>(emptyCorridor);
  const [editingCurrency, setEditingCurrency] = useState<string | null>(null);
  const [editingCorridor, setEditingCorridor] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/customer-config', { headers: authHeaders });
      if (!response.ok) throw new Error('Configuration could not be loaded.');
      const data = await response.json();
      setCurrencies(Array.isArray(data.currencies) ? data.currencies : []);
      setCorridors(Array.isArray(data.corridors) ? data.corridors : []);
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Configuration could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load().catch(() => undefined); }, [token]);

  const saveAll = async (nextCurrencies = currencies, nextCorridors = corridors) => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/customer-config', {
        method: 'PUT',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ currencies: nextCurrencies, corridors: nextCorridors }),
      });
      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        throw new Error(detail.detail || 'Configuration could not be saved.');
      }
      const saved = await response.json();
      setCurrencies(saved.currencies || nextCurrencies);
      setCorridors(saved.corridors || nextCorridors);
      setMessage('Customer configuration saved. New quotes use these server values.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Configuration could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const saveCurrency = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = { ...currencyForm, currency_code: currencyForm.currency_code.trim().toUpperCase(), country_code: currencyForm.country_code.trim().toUpperCase(), supported_funding_methods: currencyForm.supported_funding_methods.filter(Boolean) };
    if (!normalized.currency_code || !normalized.currency_name || !normalized.country_code) { setMessage('Currency code, name, and country code are required.'); return; }
    const next = editingCurrency ? currencies.map(item => item.currency_code === editingCurrency ? normalized : item) : [...currencies, normalized];
    setCurrencies(next);
    await saveAll(next, corridors);
    setCurrencyForm(emptyCurrency);
    setEditingCurrency(null);
  };

  const saveCorridor = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = { ...corridorForm, id: corridorForm.id.trim(), source_country_code: corridorForm.source_country_code.trim().toUpperCase(), source_currency: corridorForm.source_currency.trim().toUpperCase(), target_country_code: corridorForm.target_country_code.trim().toUpperCase(), target_currency: corridorForm.target_currency.trim().toUpperCase() };
    if (!normalized.id || !normalized.source_country_code || !normalized.source_currency || normalized.indicative_rate <= 0) { setMessage('Corridor ID, source country/currency, and a positive exchange rate are required.'); return; }
    const next = editingCorridor ? corridors.map(item => item.id === editingCorridor ? normalized : item) : [...corridors, normalized];
    setCorridors(next);
    await saveAll(currencies, next);
    setCorridorForm(emptyCorridor);
    setEditingCorridor(null);
  };

  const removeCurrency = async (code: string) => {
    const next = currencies.filter(item => item.currency_code !== code);
    setCurrencies(next);
    await saveAll(next, corridors);
  };

  const removeCorridor = async (id: string) => {
    const next = corridors.filter(item => item.id !== id);
    setCorridors(next);
    await saveAll(currencies, next);
  };

  const currencyField = (label: string, key: keyof CurrencyConfig, type: 'text' | 'number' = 'text') => (
    <label className="space-y-1 text-xs font-semibold text-slate-600">{label}
      <input className={inputClass} type={type} value={String(currencyForm[key] ?? '')} onChange={e => setCurrencyForm({ ...currencyForm, [key]: type === 'number' ? numberValue(e.target.value) : e.target.value })} />
    </label>
  );
  const corridorField = (label: string, key: keyof CorridorConfig, type: 'text' | 'number' = 'text') => (
    <label className="space-y-1 text-xs font-semibold text-slate-600">{label}
      <input className={inputClass} type={type} value={String(corridorForm[key] ?? '')} onChange={e => setCorridorForm({ ...corridorForm, [key]: type === 'number' ? numberValue(e.target.value) : e.target.value })} />
    </label>
  );

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-slate-900">Customer Configuration</h1><p className="mt-1 text-sm text-slate-500">Configure the currencies, corridors, rates, fees, and limits served by the customer Android app.</p></div>
        <button onClick={() => load()} disabled={loading} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 disabled:opacity-60"><RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} /> Refresh</button>
      </div>
      {message && <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">{message}</div>}
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">A fresh database intentionally has no currencies or corridors. Until an administrator saves at least one enabled configuration, the customer app remains in its configuration-required state and cannot request a transfer quote.</div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2"><DollarSign className="h-5 w-5 text-blue-600" /><h2 className="font-bold text-slate-900">Supported funding currencies</h2><span className="ml-auto text-xs text-slate-500">{currencies.length} configured</span></div>
        <form onSubmit={saveCurrency} className="space-y-3 border-b border-slate-100 pb-5 mb-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{currencyField('Currency code', 'currency_code')}{currencyField('Currency name', 'currency_name')}{currencyField('Symbol', 'symbol')}{currencyField('Country code', 'country_code')}</div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{currencyField('Country name', 'country_name')}{currencyField('Flag / emoji', 'country_flag')}{currencyField('Indicative BDT rate', 'indicative_bdt_rate', 'number')}{currencyField('Minimum add money', 'min_add_money', 'number')}</div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{currencyField('Maximum add money', 'max_add_money', 'number')}{currencyField('Daily limit', 'daily_limit', 'number')}{currencyField('Monthly limit', 'monthly_limit', 'number')}<label className="flex items-end gap-2 pb-2 text-xs font-semibold text-slate-600"><input type="checkbox" checked={currencyForm.enabled} onChange={e => setCurrencyForm({ ...currencyForm, enabled: e.target.checked })} /> Enabled for customers</label></div>
          <label className="block space-y-1 text-xs font-semibold text-slate-600">Funding method IDs, comma separated<input className={inputClass} value={currencyForm.supported_funding_methods.join(', ')} onChange={e => setCurrencyForm({ ...currencyForm, supported_funding_methods: e.target.value.split(',').map(value => value.trim().toUpperCase()).filter(Boolean) })} placeholder="BANK_TRANSFER, MOBILE_WALLET" /></label>
          <div className="flex gap-2"><button disabled={saving} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{editingCurrency ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{editingCurrency ? 'Save currency changes' : 'Add currency'}</button>{editingCurrency && <button type="button" onClick={() => { setEditingCurrency(null); setCurrencyForm(emptyCurrency); }} className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"><X className="h-4 w-4" /> Cancel</button>}</div>
        </form>
        <div className="grid gap-3 md:grid-cols-2">{currencies.map(item => <div key={item.currency_code} className="rounded-lg border border-slate-200 p-3"><div className="flex items-start justify-between gap-3"><div><div className="font-bold text-slate-900">{item.symbol} {item.currency_code} · {item.country_name || item.country_code}</div><div className="mt-1 text-xs text-slate-500">1 {item.currency_code} = {item.indicative_bdt_rate} BDT · Add money {item.min_add_money}–{item.max_add_money || 'unlimited'}</div></div><div className="flex gap-1"><button title="Edit currency" onClick={() => { setEditingCurrency(item.currency_code); setCurrencyForm({ ...emptyCurrency, ...item }); }} className="rounded-md p-1.5 text-blue-600 hover:bg-blue-50"><Pencil className="h-4 w-4" /></button><button title="Remove currency" onClick={() => removeCurrency(item.currency_code)} className="rounded-md p-1.5 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button></div></div><div className="mt-2 text-xs"><span className={item.enabled ? 'font-semibold text-emerald-600' : 'font-semibold text-slate-400'}>{item.enabled ? 'Enabled' : 'Disabled'}</span> · Funding: {(item.supported_funding_methods || []).join(', ') || 'not configured'}</div></div>)}</div>
        {currencies.length === 0 && <div className="py-6 text-center text-sm text-slate-500">No currencies configured. Add the first currency above.</div>}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2"><Settings2 className="h-5 w-5 text-emerald-600" /><h2 className="font-bold text-slate-900">Remittance corridors</h2><span className="ml-auto text-xs text-slate-500">{corridors.length} configured</span></div>
        <form onSubmit={saveCorridor} className="space-y-3 border-b border-slate-100 pb-5 mb-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{corridorField('Unique corridor ID', 'id')}{corridorField('Source country code', 'source_country_code')}{corridorField('Source country name', 'source_country_name')}{corridorField('Source currency', 'source_currency')}</div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{corridorField('Target country code', 'target_country_code')}{corridorField('Target country name', 'target_country_name')}{corridorField('Target currency', 'target_currency')}{corridorField('Target symbol', 'target_currency_symbol')}</div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{corridorField('Exchange rate to BDT', 'indicative_rate', 'number')}{corridorField('Service fee', 'service_fee', 'number')}{corridorField('Minimum transfer', 'min_transfer', 'number')}{corridorField('Maximum transfer', 'max_transfer', 'number')}</div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{corridorField('Daily limit', 'daily_limit', 'number')}{corridorField('Monthly limit', 'monthly_limit', 'number')}<label className="flex items-end gap-2 pb-2 text-xs font-semibold text-slate-600"><input type="checkbox" checked={corridorForm.is_enabled} onChange={e => setCorridorForm({ ...corridorForm, is_enabled: e.target.checked })} /> Enabled for customers</label></div>
          <div className="flex gap-2"><button disabled={saving} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{editingCorridor ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{editingCorridor ? 'Save corridor changes' : 'Add corridor'}</button>{editingCorridor && <button type="button" onClick={() => { setEditingCorridor(null); setCorridorForm(emptyCorridor); }} className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"><X className="h-4 w-4" /> Cancel</button>}</div>
        </form>
        <div className="grid gap-3 md:grid-cols-2">{corridors.map(item => <div key={item.id} className="rounded-lg border border-slate-200 p-3"><div className="flex items-start justify-between gap-3"><div><div className="font-bold text-slate-900">{item.id}</div><div className="mt-1 text-xs text-slate-500">{item.source_currency} → {item.target_currency} · 1 {item.source_currency} = {item.indicative_rate} {item.target_currency}</div><div className="mt-1 text-xs text-slate-500">Fee {item.service_fee} · Transfer {item.min_transfer}–{item.max_transfer || 'unlimited'}</div></div><div className="flex gap-1"><button title="Edit corridor" onClick={() => { setEditingCorridor(item.id); setCorridorForm({ ...emptyCorridor, ...item }); }} className="rounded-md p-1.5 text-blue-600 hover:bg-blue-50"><Pencil className="h-4 w-4" /></button><button title="Remove corridor" onClick={() => removeCorridor(item.id)} className="rounded-md p-1.5 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button></div></div><div className="mt-2 text-xs"><span className={item.is_enabled ? 'font-semibold text-emerald-600' : 'font-semibold text-slate-400'}>{item.is_enabled ? 'Enabled' : 'Disabled'}</span></div></div>)}</div>
        {corridors.length === 0 && <div className="py-6 text-center text-sm text-slate-500">No corridors configured. Add the first corridor above.</div>}
      </section>
    </div>
  );
};
