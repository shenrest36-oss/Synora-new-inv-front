import { useState, useEffect } from 'react';
import { itemsAPI, categoriesAPI, taxClassesAPI } from '../../api/inv.js';
import { X, Loader2 } from 'lucide-react';

const UNIT_TYPES = ['kg', 'g', 'l', 'ml', 'pcs', 'box', 'bottle', 'can', 'dozen', 'bag', 'packet', 'roll', 'sheet', 'pair'];

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-colors';

export default function ItemForm({ item, onClose, onSaved }) {
  const editing = !!item;

  const [form, setForm] = useState({
    itemCode:      item?.itemCode      ?? '',
    name:          item?.name          ?? '',
    description:   item?.description  ?? '',
    categoryId:    item?.categoryId    ?? '',
    unitType:      item?.unitType      ?? '',
    reorderLevel:  item?.reorderLevel  ?? '',
    reorderQty:    item?.reorderQty    ?? '',
    minQty:        item?.minQty        ?? '',
    maxQty:        item?.maxQty        ?? '',
    taxClassId:    item?.taxClassId    ?? '',
    chartOfAccount: item?.chartOfAccount ?? '',
    isActive:      item?.isActive      ?? true,
  });

  const [categories, setCategories] = useState([]);
  const [taxClasses, setTaxClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    categoriesAPI.list().then(r => setCategories(r.data));
    taxClassesAPI.list().then(r => setTaxClasses(r.data));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        categoryId:   form.categoryId   ? Number(form.categoryId)  : undefined,
        taxClassId:   form.taxClassId   ? Number(form.taxClassId)  : null,
        reorderLevel: form.reorderLevel !== '' ? Number(form.reorderLevel) : null,
        reorderQty:   form.reorderQty   !== '' ? Number(form.reorderQty)   : null,
        minQty:       form.minQty       !== '' ? Number(form.minQty)       : null,
        maxQty:       form.maxQty       !== '' ? Number(form.maxQty)       : null,
      };
      if (editing) {
        await itemsAPI.update(item.id, payload);
      } else {
        await itemsAPI.create(payload);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  // Group categories by level for a readable select
  const leafCategories = categories.filter(c => c.level === 3 || !categories.some(ch => ch.parentId === c.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="glass w-full max-w-2xl rounded-2xl border border-white/8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 sticky top-0 glass z-10">
          <h2 className="font-semibold text-white">{editing ? 'Edit Item' : 'Add Item'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Item Code" required>
              <input className={inputClass} value={form.itemCode}
                onChange={e => set('itemCode', e.target.value)} required placeholder="e.g. F-001" />
            </Field>
            <Field label="Name" required>
              <input className={inputClass} value={form.name}
                onChange={e => set('name', e.target.value)} required placeholder="Item name" />
            </Field>
          </div>

          <Field label="Description">
            <textarea className={`${inputClass} resize-none`} rows={2} value={form.description}
              onChange={e => set('description', e.target.value)} placeholder="Optional description" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Category" required>
              <select className={inputClass} value={form.categoryId}
                onChange={e => set('categoryId', e.target.value)} required>
                <option value="">Select category…</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {'  '.repeat(c.level - 1)}{c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Unit Type" required>
              <select className={inputClass} value={form.unitType}
                onChange={e => set('unitType', e.target.value)} required>
                <option value="">Select unit…</option>
                {UNIT_TYPES.map(u => <option key={u} value={u}>{u}</option>)}
                <option value="custom">Other (type below)</option>
              </select>
              {form.unitType === 'custom' && (
                <input className={`${inputClass} mt-2`} placeholder="Custom unit"
                  onChange={e => set('unitType', e.target.value)} />
              )}
            </Field>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {[['reorderLevel','Reorder Level'],['reorderQty','Reorder Qty'],['minQty','Min Qty'],['maxQty','Max Qty']].map(([k,l]) => (
              <Field key={k} label={l}>
                <input type="number" min="0" step="0.0001" className={inputClass} value={form[k]}
                  onChange={e => set(k, e.target.value)} placeholder="—" />
              </Field>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Tax Class">
              <select className={inputClass} value={form.taxClassId}
                onChange={e => set('taxClassId', e.target.value)}>
                <option value="">None</option>
                {taxClasses.map(tc => (
                  <option key={tc.id} value={tc.id}>
                    {tc.name} ({tc.rates.map(r => `${r.taxName} ${r.rate}%`).join(', ')})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Chart of Account">
              <input className={inputClass} value={form.chartOfAccount}
                onChange={e => set('chartOfAccount', e.target.value)} placeholder="e.g. 5-1000" />
            </Field>
          </div>

          {editing && (
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-400">Active</label>
              <button
                type="button"
                onClick={() => set('isActive', !form.isActive)}
                className={`relative w-10 h-5 rounded-full transition-colors ${form.isActive ? 'bg-brand-500' : 'bg-slate-700'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 px-5 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? 'Saving…' : editing ? 'Update Item' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
