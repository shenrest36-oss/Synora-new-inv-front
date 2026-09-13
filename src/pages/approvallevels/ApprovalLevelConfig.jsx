import { useState, useEffect, useCallback } from 'react';
import { approvalLevelsAPI } from '../../api/inv.js';
import {
  Plus, Trash2, Loader2, ShieldCheck, ArrowUp, ArrowDown, Pencil, Check, X
} from 'lucide-react';

const REQUEST_TYPES = [
  { key: 'purchase_request', label: 'Purchase Request', maxLevels: 5 },
  { key: 'store_request',    label: 'Store Request',    maxLevels: 5 },
  { key: 'kitchen_request',  label: 'Kitchen Request',  maxLevels: 3 },
];

const SUGGESTED_ROLES = ['admin', 'department_head', 'cost_controller', 'financial_controller', 'gm', 'store_manager', 'executive_chef'];

function LevelRow({ level, isFirst, isLast, onMoveUp, onMoveDown, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ levelName: level.levelName, requiredRole: level.requiredRole });

  const save = async () => {
    await onEdit(level.id, form);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-white/3 rounded-lg border border-brand-500/20">
        <span className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
          {level.levelOrder}
        </span>
        <input value={form.levelName} onChange={e => setForm(f => ({ ...f, levelName: e.target.value }))}
          placeholder="Level name" autoFocus
          className="bg-white/5 border border-brand-500/40 rounded px-2 py-1 text-sm text-white w-40 focus:outline-none" />
        <select value={form.requiredRole} onChange={e => setForm(f => ({ ...f, requiredRole: e.target.value }))}
          className="bg-slate-800 border border-brand-500/40 rounded px-2 py-1 text-sm text-white focus:outline-none">
          {SUGGESTED_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <input value={form.requiredRole} onChange={e => setForm(f => ({ ...f, requiredRole: e.target.value }))}
          placeholder="or type custom role"
          className="bg-white/5 border border-brand-500/40 rounded px-2 py-1 text-sm text-white w-36 focus:outline-none" />
        <button onClick={save} className="text-brand-400 hover:text-brand-300"><Check size={14} /></button>
        <button onClick={() => setEditing(false)} className="text-slate-500 hover:text-slate-300"><X size={14} /></button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 glass-card rounded-lg group">
      {/* Order number */}
      <span className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
        {level.levelOrder}
      </span>

      {/* Move arrows */}
      <div className="flex flex-col gap-0.5">
        <button onClick={onMoveUp} disabled={isFirst}
          className="text-slate-600 hover:text-slate-300 disabled:opacity-20 transition-colors">
          <ArrowUp size={12} />
        </button>
        <button onClick={onMoveDown} disabled={isLast}
          className="text-slate-600 hover:text-slate-300 disabled:opacity-20 transition-colors">
          <ArrowDown size={12} />
        </button>
      </div>

      {/* Level info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{level.levelName}</p>
        <p className="text-xs text-slate-500 mt-0.5">Required role: <span className="text-brand-400 font-mono">{level.requiredRole}</span></p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setEditing(true)} className="p-1 text-slate-500 hover:text-blue-400 transition-colors" title="Edit">
          <Pencil size={14} />
        </button>
        <button onClick={() => onDelete(level.id)} className="p-1 text-slate-500 hover:text-red-400 transition-colors" title="Delete">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function AddLevelForm({ requestType, nextOrder, onAdded }) {
  const [form, setForm] = useState({ levelName: '', requiredRole: '' });
  const [loading, setLoading] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    if (!form.levelName || !form.requiredRole) return;
    setLoading(true);
    try {
      await approvalLevelsAPI.create({ requestType, levelOrder: nextOrder, ...form });
      setForm({ levelName: '', requiredRole: '' });
      onAdded();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={save} className="flex items-center gap-2 pt-2 border-t border-white/5 mt-2">
      <span className="w-6 h-6 rounded-full bg-slate-700 text-slate-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
        {nextOrder}
      </span>
      <input value={form.levelName} onChange={e => setForm(f => ({ ...f, levelName: e.target.value }))}
        placeholder="Level name (e.g. Cost Controller)"
        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 flex-1" />
      <select value={form.requiredRole} onChange={e => setForm(f => ({ ...f, requiredRole: e.target.value }))}
        className="bg-slate-800/80 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-brand-500/50">
        <option value="">Select role…</option>
        {SUGGESTED_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
      </select>
      <input value={form.requiredRole} onChange={e => setForm(f => ({ ...f, requiredRole: e.target.value }))}
        placeholder="or type custom…"
        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 w-36" />
      <button type="submit" disabled={loading || !form.levelName || !form.requiredRole}
        className="flex items-center gap-1 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0">
        {loading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Add
      </button>
    </form>
  );
}

function RequestTypePanel({ requestType, label, maxLevels }) {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await approvalLevelsAPI.list(requestType);
      setLevels(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [requestType]);

  useEffect(() => { load(); }, [load]);

  const moveLevel = async (index, direction) => {
    const newLevels = [...levels];
    const swapIdx = index + direction;
    if (swapIdx < 0 || swapIdx >= newLevels.length) return;
    [newLevels[index], newLevels[swapIdx]] = [newLevels[swapIdx], newLevels[index]];
    const reordered = newLevels.map((l, i) => ({ id: l.id, levelOrder: i + 1 }));
    await approvalLevelsAPI.reorder({ requestType, levels: reordered });
    await load();
  };

  const handleEdit = async (id, data) => {
    await approvalLevelsAPI.update(id, data);
    await load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this approval level?')) return;
    await approvalLevelsAPI.remove(id);
    await load();
  };

  return (
    <div className="glass-card rounded-xl border border-white/5 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-white">{label}</h2>
        <span className="text-xs text-slate-500">{levels.length} / {maxLevels} levels</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 size={18} className="text-slate-500 animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          {levels.length === 0 && (
            <p className="text-xs text-slate-500 text-center py-3">No approval levels configured yet.</p>
          )}
          {levels.map((level, i) => (
            <LevelRow
              key={level.id}
              level={level}
              isFirst={i === 0}
              isLast={i === levels.length - 1}
              onMoveUp={() => moveLevel(i, -1)}
              onMoveDown={() => moveLevel(i, 1)}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}

          {levels.length < maxLevels && (
            <AddLevelForm
              requestType={requestType}
              nextOrder={levels.length + 1}
              onAdded={load}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function ApprovalLevelConfig() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
        <ShieldCheck size={18} className="text-brand-400" />
        <div className="flex-1">
          <h1 className="font-semibold text-white">Approval Level Configuration</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Define the chain of approvers for each request type. Levels are processed in order.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {REQUEST_TYPES.map(rt => (
          <RequestTypePanel key={rt.key} {...rt} />
        ))}
      </div>
    </div>
  );
}
