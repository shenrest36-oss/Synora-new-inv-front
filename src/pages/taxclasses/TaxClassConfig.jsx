import { useState, useEffect, useCallback } from 'react';
import { taxClassesAPI } from '../../api/inv.js';
import { Plus, Pencil, Trash2, Loader2, ReceiptText, Check, X, ChevronDown, ChevronRight } from 'lucide-react';

function RateRow({ rate, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ taxName: rate.taxName, rate: String(rate.rate) });

  const save = async () => {
    await onUpdate(rate.id, { taxName: form.taxName, rate: Number(form.rate) });
    setEditing(false);
  };

  if (editing) {
    return (
      <tr className="bg-white/3">
        <td className="px-3 py-2">
          <input value={form.taxName} onChange={e => setForm(f => ({ ...f, taxName: e.target.value }))}
            className="bg-white/5 border border-brand-500/40 rounded px-2 py-1 text-xs text-white w-24 focus:outline-none" />
        </td>
        <td className="px-3 py-2">
          <input type="number" step="0.01" value={form.rate} onChange={e => setForm(f => ({ ...f, rate: e.target.value }))}
            className="bg-white/5 border border-brand-500/40 rounded px-2 py-1 text-xs text-white w-20 focus:outline-none" />
          <span className="text-slate-500 text-xs ml-1">%</span>
        </td>
        <td className="px-3 py-2">
          <div className="flex gap-1">
            <button onClick={save} className="text-brand-400 hover:text-brand-300"><Check size={13} /></button>
            <button onClick={() => setEditing(false)} className="text-slate-500 hover:text-slate-300"><X size={13} /></button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-white/3 group">
      <td className="px-3 py-2 text-xs text-slate-300 font-medium">{rate.taxName}</td>
      <td className="px-3 py-2 text-xs text-slate-400">{Number(rate.rate).toFixed(2)}%</td>
      <td className="px-3 py-2">
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setEditing(true)} className="text-slate-500 hover:text-blue-400"><Pencil size={12} /></button>
          <button onClick={() => onDelete(rate.id)} className="text-slate-500 hover:text-red-400"><Trash2 size={12} /></button>
        </div>
      </td>
    </tr>
  );
}

function AddRateRow({ taxClassId, onAdded }) {
  const [form, setForm] = useState({ taxName: '', rate: '' });
  const [loading, setLoading] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    if (!form.taxName || !form.rate) return;
    setLoading(true);
    try {
      await taxClassesAPI.addRate(taxClassId, { taxName: form.taxName, rate: Number(form.rate) });
      setForm({ taxName: '', rate: '' });
      onAdded();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add rate');
    } finally { setLoading(false); }
  };

  return (
    <tr className="border-t border-white/5">
      <td className="px-3 py-2">
        <input value={form.taxName} onChange={e => setForm(f => ({ ...f, taxName: e.target.value }))}
          placeholder="e.g. VAT"
          className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white w-24 focus:outline-none focus:border-brand-500/40" />
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          <input type="number" step="0.01" min="0" value={form.rate} onChange={e => setForm(f => ({ ...f, rate: e.target.value }))}
            placeholder="0.00"
            className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white w-20 focus:outline-none focus:border-brand-500/40" />
          <span className="text-slate-500 text-xs">%</span>
        </div>
      </td>
      <td className="px-3 py-2">
        <button onClick={save} disabled={loading || !form.taxName || !form.rate}
          className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 disabled:opacity-40 transition-colors">
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Add
        </button>
      </td>
    </tr>
  );
}

function TaxClassCard({ tc, onSave, onDelete }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(tc.name);
  const [rates, setRates] = useState(tc.rates);

  const reloadRates = async () => {
    const { data } = await taxClassesAPI.get(tc.id);
    setRates(data.rates);
  };

  const saveEdit = async () => {
    await onSave(tc.id, { name });
    setEditing(false);
  };

  const handleUpdateRate = async (rateId, data) => {
    await taxClassesAPI.updateRate(tc.id, rateId, data);
    await reloadRates();
  };

  const handleDeleteRate = async (rateId) => {
    if (!confirm('Remove this tax rate?')) return;
    await taxClassesAPI.deleteRate(tc.id, rateId);
    await reloadRates();
  };

  const totalRate = rates.reduce((sum, r) => sum + Number(r.rate), 0);

  return (
    <div className="glass-card rounded-xl border border-white/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => setOpen(v => !v)} className="text-slate-500 hover:text-slate-300 transition-colors">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        {editing ? (
          <div className="flex items-center gap-2 flex-1">
            <input value={name} onChange={e => setName(e.target.value)} autoFocus
              className="bg-white/5 border border-brand-500/40 rounded px-2 py-1 text-sm text-white flex-1 focus:outline-none" />
            <button onClick={saveEdit} className="text-brand-400 hover:text-brand-300"><Check size={14} /></button>
            <button onClick={() => { setName(tc.name); setEditing(false); }} className="text-slate-500 hover:text-slate-300"><X size={14} /></button>
          </div>
        ) : (
          <div className="flex-1 flex items-center gap-3">
            <span className="font-medium text-white text-sm">{tc.name}</span>
            <span className="text-xs text-slate-500">
              {rates.length === 0 ? 'No rates' : `${totalRate.toFixed(2)}% total`}
            </span>
            {rates.map(r => (
              <span key={r.id} className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded">
                {r.taxName} {Number(r.rate).toFixed(2)}%
              </span>
            ))}
          </div>
        )}

        {!editing && (
          <div className="flex items-center gap-1">
            <button onClick={() => setEditing(true)} className="p-1 text-slate-500 hover:text-blue-400 transition-colors" title="Rename">
              <Pencil size={14} />
            </button>
            <button onClick={() => onDelete(tc.id)} className="p-1 text-slate-500 hover:text-red-400 transition-colors" title="Delete class">
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Rates table */}
      {open && (
        <div className="border-t border-white/5 px-2 pb-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-3 py-2 text-left font-medium">Tax Name</th>
                <th className="px-3 py-2 text-left font-medium">Rate</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rates.map(r => (
                <RateRow key={r.id} rate={r} onUpdate={handleUpdateRate} onDelete={handleDeleteRate} />
              ))}
              <AddRateRow taxClassId={tc.id} onAdded={reloadRates} />
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function TaxClassConfig() {
  const [taxClasses, setTaxClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await taxClassesAPI.list();
      setTaxClasses(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await taxClassesAPI.create({ name: newName.trim() });
      setNewName('');
      await load();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
    finally { setAdding(false); }
  };

  const handleSave = async (id, data) => {
    await taxClassesAPI.update(id, data);
    await load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this tax class? This will fail if items are assigned to it.')) return;
    try {
      await taxClassesAPI.remove(id);
      await load();
    } catch (err) { alert(err.response?.data?.error || 'Delete failed'); }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
        <ReceiptText size={18} className="text-brand-400" />
        <h1 className="font-semibold text-white flex-1">Tax Classes</h1>

        {/* Quick add */}
        <form onSubmit={handleAdd} className="flex items-center gap-2">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="New tax class name…"
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 w-48" />
          <button type="submit" disabled={adding || !newName.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
            {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add
          </button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 size={24} className="text-slate-500 animate-spin" /></div>
        ) : taxClasses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <ReceiptText size={36} className="mb-3 opacity-30" />
            <p className="text-sm">No tax classes yet. Add one above.</p>
          </div>
        ) : (
          taxClasses.map(tc => (
            <TaxClassCard key={tc.id} tc={tc} onSave={handleSave} onDelete={handleDelete} />
          ))
        )}
      </div>
    </div>
  );
}
