import { useState, useEffect } from 'react';
import { purchaseRequestsAPI, departmentsAPI, itemsAPI } from '../../api/inv.js';
import { Plus, Trash2, Loader2, Search } from 'lucide-react';

const inputClass = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-colors';

function ItemSearchRow({ onAdd }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await itemsAPI.list({ search: query, isActive: true });
        setResults(data.slice(0, 8));
      } finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
        <Search size={14} className="text-slate-500 flex-shrink-0" />
        <input value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search item to add…"
          className="bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none flex-1" />
        {searching && <Loader2 size={13} className="text-slate-500 animate-spin" />}
      </div>
      {results.length > 0 && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 glass rounded-xl border border-white/10 overflow-hidden">
          {results.map(item => (
            <button key={item.id} type="button"
              onClick={() => { onAdd(item); setQuery(''); setResults([]); }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors flex items-center justify-between">
              <div>
                <span className="text-white">{item.name}</span>
                <span className="text-slate-500 text-xs ml-2">{item.itemCode}</span>
              </div>
              <span className="text-xs text-slate-500">{item.unitType}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PurchaseRequestForm({ onClose, onSaved }) {
  const [form, setForm] = useState({ requestedDate: '', subDepartmentId: '', advanceAmount: '', eventName: '' });
  const [items, setItems] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    departmentsAPI.list().then(r => setDepartments(r.data));
  }, []);

  const addItem = (item) => {
    if (items.find(i => i.itemId === item.id)) return;
    setItems(prev => [...prev, {
      itemId: item.id, itemCode: item.itemCode, itemName: item.name, unitType: item.unitType,
      quantity: '', unitPrice: '', reason: '',
    }]);
  };

  const updateItem = (idx, field, value) => {
    setItems(prev => prev.map((row, i) => i === idx ? { ...row, [field]: value } : row));
  };

  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return setError('Add at least one item');
    if (items.some(i => !i.quantity || Number(i.quantity) <= 0)) return setError('All items need a valid quantity');
    setError('');
    setLoading(true);
    try {
      await purchaseRequestsAPI.create({
        requestedDate:   form.requestedDate,
        subDepartmentId: form.subDepartmentId || undefined,
        advanceAmount:   form.advanceAmount   || undefined,
        eventName:       form.eventName        || undefined,
        items: items.map(i => ({
          itemId:   i.itemId,
          quantity: Number(i.quantity),
          unitPrice: i.unitPrice ? Number(i.unitPrice) : undefined,
          reason:   i.reason || undefined,
        })),
      });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create purchase request');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <h1 className="font-semibold text-white">New Purchase Request</h1>
        <button type="button" onClick={onClose} className="text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">{error}</div>}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Requested Date <span className="text-red-400">*</span></label>
            <input type="date" required className={inputClass} value={form.requestedDate}
              onChange={e => setForm(f => ({ ...f, requestedDate: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Department</label>
            <select className={inputClass} value={form.subDepartmentId}
              onChange={e => setForm(f => ({ ...f, subDepartmentId: e.target.value }))}>
              <option value="">— Select department —</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Advance Amount</label>
            <input type="number" step="0.01" min="0" className={inputClass} value={form.advanceAmount}
              onChange={e => setForm(f => ({ ...f, advanceAmount: e.target.value }))}
              placeholder="Optional advance" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Event Name</label>
            <input className={inputClass} value={form.eventName}
              onChange={e => setForm(f => ({ ...f, eventName: e.target.value }))}
              placeholder="e.g. Gala Dinner 2026" />
          </div>
        </div>

        {/* Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-white">Items</h2>
            <span className="text-xs text-slate-500">{items.length} item(s)</span>
          </div>

          <ItemSearchRow onAdd={addItem} />

          {items.length > 0 && (
            <div className="mt-3 space-y-2">
              {/* Header */}
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 text-xs text-slate-500 uppercase tracking-wider px-2">
                <span>Item</span>
                <span className="w-24 text-center">Qty</span>
                <span className="w-28 text-center">Unit Price</span>
                <span className="w-40">Reason</span>
                <span className="w-8" />
              </div>
              {items.map((row, idx) => (
                <div key={row.itemId} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center glass-card rounded-lg px-2 py-2">
                  <div>
                    <p className="text-sm text-white">{row.itemName}</p>
                    <p className="text-xs text-slate-500">{row.itemCode} · {row.unitType}</p>
                  </div>
                  <input type="number" min="0.0001" step="0.0001" value={row.quantity}
                    onChange={e => updateItem(idx, 'quantity', e.target.value)}
                    placeholder="Qty" required
                    className="w-24 bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white text-center focus:outline-none focus:border-brand-500/40" />
                  <input type="number" min="0" step="0.0001" value={row.unitPrice}
                    onChange={e => updateItem(idx, 'unitPrice', e.target.value)}
                    placeholder="Est. price"
                    className="w-28 bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white text-center focus:outline-none focus:border-brand-500/40" />
                  <input value={row.reason}
                    onChange={e => updateItem(idx, 'reason', e.target.value)}
                    placeholder="Reason…"
                    className="w-40 bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-brand-500/40" />
                  <button type="button" onClick={() => removeItem(idx)}
                    className="w-8 flex justify-center text-slate-500 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/5">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
        <button type="submit" disabled={loading || items.length === 0}
          className="flex items-center gap-2 px-5 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
          {loading && <Loader2 size={14} className="animate-spin" />}
          {loading ? 'Submitting…' : 'Submit Purchase Request'}
        </button>
      </div>
    </form>
  );
}
