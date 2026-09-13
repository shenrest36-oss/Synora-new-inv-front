import { useState, useEffect } from 'react';
import { quotationsAPI, suppliersAPI, itemsAPI } from '../../api/inv.js';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Loader2, Search } from 'lucide-react';

const inputClass = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 transition-colors';

export default function QuotationForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ supplierId: '', fromDate: '', toDate: '' });
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [itemSearch, setItemSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    suppliersAPI.list({ isActive: true }).then(r => setSuppliers(r.data));
    itemsAPI.list({ isActive: true }).then(r => setAllItems(r.data));
  }, []);

  const filteredItems = allItems.filter(i =>
    !items.find(row => row.itemId === i.id) &&
    (i.name.toLowerCase().includes(itemSearch.toLowerCase()) || i.itemCode.toLowerCase().includes(itemSearch.toLowerCase()))
  );

  const addItem = (item) => {
    setItems(prev => [...prev, { itemId: item.id, itemCode: item.itemCode, itemName: item.name, unitType: item.unitType, price: '', minQty: '', maxQty: '' }]);
    setItemSearch('');
  };

  const updateItem = (idx, field, value) => setItems(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.supplierId) return setError('Select a supplier');
    if (items.length === 0) return setError('Add at least one item');
    if (items.some(i => !i.price || Number(i.price) <= 0)) return setError('All items need a valid price');
    setError('');
    setLoading(true);
    try {
      await quotationsAPI.create({
        supplierId: Number(form.supplierId),
        fromDate: form.fromDate || undefined,
        toDate:   form.toDate   || undefined,
        items: items.map(i => ({
          itemId: i.itemId,
          price:  Number(i.price),
          minQty: i.minQty ? Number(i.minQty) : undefined,
          maxQty: i.maxQty ? Number(i.maxQty) : undefined,
        })),
      });
      navigate('/quotations');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create quotation');
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <h1 className="font-semibold text-white">New Quotation</h1>
        <button onClick={() => navigate('/quotations')} className="text-sm text-slate-400 hover:text-white">Cancel</button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
        {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">{error}</div>}

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Supplier <span className="text-red-400">*</span></label>
            <select className={inputClass} value={form.supplierId} onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))} required>
              <option value="">Select supplier…</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Valid From</label>
            <input type="date" className={inputClass} value={form.fromDate} onChange={e => setForm(f => ({ ...f, fromDate: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Valid To</label>
            <input type="date" className={inputClass} value={form.toDate} onChange={e => setForm(f => ({ ...f, toDate: e.target.value }))} />
          </div>
        </div>

        {/* Item search */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Items</label>
          <div className="relative mb-2">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={itemSearch} onChange={e => setItemSearch(e.target.value)}
              placeholder="Search items to add…"
              className="w-full pl-8 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50" />
          </div>
          {itemSearch && filteredItems.length > 0 && (
            <div className="glass rounded-xl border border-white/10 overflow-hidden mb-3">
              {filteredItems.slice(0, 6).map(item => (
                <button key={item.id} type="button" onClick={() => addItem(item)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors flex items-center justify-between">
                  <span className="text-white">{item.name} <span className="text-slate-500 text-xs">{item.itemCode}</span></span>
                  <span className="text-xs text-brand-400"><Plus size={12} /></span>
                </button>
              ))}
            </div>
          )}

          {items.length > 0 && (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 text-xs text-slate-500 uppercase tracking-wider px-2">
                <span>Item</span>
                <span className="w-28 text-center">Price / Unit</span>
                <span className="w-24 text-center">Min Qty</span>
                <span className="w-24 text-center">Max Qty</span>
                <span className="w-8" />
              </div>
              {items.map((row, idx) => (
                <div key={row.itemId} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center glass-card rounded-lg px-2 py-2">
                  <div>
                    <p className="text-sm text-white">{row.itemName}</p>
                    <p className="text-xs text-slate-500">{row.itemCode} · {row.unitType}</p>
                  </div>
                  <input type="number" min="0" step="0.0001" value={row.price}
                    onChange={e => updateItem(idx, 'price', e.target.value)}
                    placeholder="Price" required
                    className="w-28 bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white text-center focus:outline-none focus:border-brand-500/40" />
                  <input type="number" min="0" step="0.0001" value={row.minQty}
                    onChange={e => updateItem(idx, 'minQty', e.target.value)}
                    placeholder="—"
                    className="w-24 bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white text-center focus:outline-none focus:border-brand-500/40" />
                  <input type="number" min="0" step="0.0001" value={row.maxQty}
                    onChange={e => updateItem(idx, 'maxQty', e.target.value)}
                    placeholder="—"
                    className="w-24 bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white text-center focus:outline-none focus:border-brand-500/40" />
                  <button type="button" onClick={() => removeItem(idx)}
                    className="w-8 flex justify-center text-slate-500 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate('/quotations')} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 px-5 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? 'Creating…' : 'Create Quotation'}
          </button>
        </div>
      </form>
    </div>
  );
}
