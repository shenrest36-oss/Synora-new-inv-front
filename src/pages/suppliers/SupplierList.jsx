import { useState, useEffect, useCallback } from 'react';
import { suppliersAPI } from '../../api/inv.js';
import { Plus, Search, Pencil, PowerOff, Loader2, Truck, X, Check } from 'lucide-react';

function SupplierForm({ supplier, onClose, onSaved }) {
  const editing = !!supplier;
  const [form, setForm] = useState({
    name: supplier?.name ?? '',
    contactInfo: supplier?.contactInfo ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (editing) await suppliersAPI.update(supplier.id, form);
      else await suppliersAPI.create(form);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-colors';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="glass w-full max-w-md rounded-2xl border border-white/8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="font-semibold text-white">{editing ? 'Edit Supplier' : 'Add Supplier'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">{error}</div>}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Name <span className="text-red-400">*</span></label>
            <input className={inputClass} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Supplier name" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Contact Info</label>
            <textarea className={`${inputClass} resize-none`} rows={3} value={form.contactInfo}
              onChange={e => setForm(f => ({ ...f, contactInfo: e.target.value }))}
              placeholder="Phone, email, address…" />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 px-5 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? 'Saving…' : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SupplierList() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { isActive: filterActive };
      if (search) params.search = search;
      const { data } = await suppliersAPI.list(params);
      setSuppliers(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [search, filterActive]);

  useEffect(() => { load(); }, [load]);

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this supplier?')) return;
    await suppliersAPI.deactivate(id);
    load();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
        <Truck size={18} className="text-brand-400" />
        <h1 className="font-semibold text-white flex-1">Suppliers</h1>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search suppliers…"
            className="pl-8 pr-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 w-52" />
        </div>
        <button onClick={() => setFilterActive(v => !v)}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
            filterActive ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-white/5 border-white/10 text-slate-400'
          }`}>
          {filterActive ? 'Active only' : 'Show all'}
        </button>
        <button onClick={() => { setEditingSupplier(null); setFormOpen(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus size={14} /> Add Supplier
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={24} className="text-slate-500 animate-spin" /></div>
        ) : suppliers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Truck size={36} className="mb-3 opacity-30" />
            <p className="text-sm">No suppliers found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 glass">
              <tr className="text-left text-xs text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {suppliers.map(s => (
                <tr key={s.id} className="hover:bg-white/3 transition-colors">
                  <td className="px-6 py-3 text-white font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs whitespace-pre-wrap max-w-xs">{s.contactInfo || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.isActive ? 'bg-green-500/10 text-green-400' : 'bg-slate-500/10 text-slate-500'}`}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setEditingSupplier(s); setFormOpen(true); }}
                        className="p-1.5 text-slate-500 hover:text-blue-400 transition-colors" title="Edit">
                        <Pencil size={14} />
                      </button>
                      {s.isActive && (
                        <button onClick={() => handleDeactivate(s.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 transition-colors" title="Deactivate">
                          <PowerOff size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {formOpen && (
        <SupplierForm
          supplier={editingSupplier}
          onClose={() => { setFormOpen(false); setEditingSupplier(null); }}
          onSaved={() => { setFormOpen(false); setEditingSupplier(null); load(); }}
        />
      )}
    </div>
  );
}
