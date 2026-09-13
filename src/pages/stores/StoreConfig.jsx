import { useState, useEffect, useCallback } from 'react';
import { storesAPI } from '../../api/inv.js';
import { Plus, Pencil, Loader2, Warehouse, Check, X } from 'lucide-react';

function StoreForm({ store, onClose, onSaved }) {
  const [form, setForm] = useState({ name: store?.name ?? '', location: store?.location ?? '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (store) await storesAPI.update(store.id, form);
      else await storesAPI.create(form);
      onSaved();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  const inputClass = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 transition-colors';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="glass w-full max-w-sm rounded-2xl border border-white/8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="font-semibold text-white">{store ? 'Edit Store' : 'Add Store'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Name <span className="text-red-400">*</span></label>
            <input className={inputClass} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Main Store" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Location</label>
            <input className={inputClass} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Ground Floor, Block B" />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 px-5 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
              {loading && <Loader2 size={13} className="animate-spin" />}
              {store ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StoreConfig() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingStore, setEditingStore] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await storesAPI.list(); setStores(data); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
        <Warehouse size={18} className="text-brand-400" />
        <h1 className="font-semibold text-white flex-1">Stores</h1>
        <button onClick={() => { setEditingStore(null); setFormOpen(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus size={14} /> Add Store
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 size={20} className="text-slate-500 animate-spin" /></div>
        ) : stores.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No stores configured.</p>
        ) : (
          <div className="space-y-2 max-w-lg">
            {stores.map(s => (
              <div key={s.id} className="flex items-center gap-3 glass-card rounded-lg px-4 py-3">
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">{s.name}</p>
                  {s.location && <p className="text-xs text-slate-500 mt-0.5">{s.location}</p>}
                </div>
                <button onClick={() => { setEditingStore(s); setFormOpen(true); }}
                  className="text-slate-500 hover:text-blue-400 transition-colors"><Pencil size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {formOpen && (
        <StoreForm
          store={editingStore}
          onClose={() => { setFormOpen(false); setEditingStore(null); }}
          onSaved={() => { setFormOpen(false); setEditingStore(null); load(); }}
        />
      )}
    </div>
  );
}
