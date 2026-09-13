import { useState, useEffect, useCallback } from 'react';
import { departmentsAPI } from '../../api/inv.js';
import { Plus, Pencil, Loader2, Building2, Check, X } from 'lucide-react';

export default function DepartmentConfig() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await departmentsAPI.list(); setDepartments(data); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    try { await departmentsAPI.create({ name: newName.trim() }); setNewName(''); await load(); }
    catch (err) { alert(err.response?.data?.error || 'Failed'); }
    finally { setAdding(false); }
  };

  const handleEdit = async (id) => {
    await departmentsAPI.update(id, { name: editName });
    setEditingId(null);
    await load();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
        <Building2 size={18} className="text-brand-400" />
        <h1 className="font-semibold text-white flex-1">Departments</h1>
        <form onSubmit={handleAdd} className="flex items-center gap-2">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="New department…"
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 w-48" />
          <button type="submit" disabled={adding || !newName.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
            {adding ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Add
          </button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 size={20} className="text-slate-500 animate-spin" /></div>
        ) : departments.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No departments yet.</p>
        ) : (
          <div className="space-y-2 max-w-lg">
            {departments.map(d => (
              <div key={d.id} className="flex items-center gap-3 glass-card rounded-lg px-4 py-3">
                {editingId === d.id ? (
                  <>
                    <input value={editName} onChange={e => setEditName(e.target.value)} autoFocus
                      className="flex-1 bg-white/5 border border-brand-500/40 rounded px-2 py-1 text-sm text-white focus:outline-none" />
                    <button onClick={() => handleEdit(d.id)} className="text-brand-400 hover:text-brand-300"><Check size={14} /></button>
                    <button onClick={() => setEditingId(null)} className="text-slate-500 hover:text-slate-300"><X size={14} /></button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-white">{d.name}</span>
                    <button onClick={() => { setEditingId(d.id); setEditName(d.name); }}
                      className="text-slate-500 hover:text-blue-400 transition-colors"><Pencil size={14} /></button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
