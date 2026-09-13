import { useState, useEffect, useCallback } from 'react';
import { categoriesAPI } from '../../api/inv.js';
import { ChevronRight, ChevronDown, Plus, Pencil, Trash2, Loader2, Check, X } from 'lucide-react';

function buildTree(categories) {
  const map = {};
  const roots = [];
  for (const cat of categories) map[cat.id] = { ...cat, children: [] };
  for (const cat of categories) {
    if (cat.parentId && map[cat.parentId]) map[cat.parentId].children.push(map[cat.id]);
    else roots.push(map[cat.id]);
  }
  roots.sort((a, b) => a.name.localeCompare(b.name));
  const sort = (nodes) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    nodes.forEach(n => sort(n.children));
  };
  sort(roots);
  return roots;
}

function InlineInput({ defaultValue = '', onConfirm, onCancel, placeholder = 'Name…' }) {
  const [val, setVal] = useState(defaultValue);
  return (
    <form
      onSubmit={e => { e.preventDefault(); if (val.trim()) onConfirm(val.trim()); }}
      className="flex items-center gap-1"
    >
      <input
        autoFocus
        value={val}
        onChange={e => setVal(e.target.value)}
        placeholder={placeholder}
        className="bg-white/5 border border-brand-500/40 rounded px-2 py-0.5 text-sm text-white w-40 focus:outline-none"
      />
      <button type="submit" className="text-brand-400 hover:text-brand-300"><Check size={14} /></button>
      <button type="button" onClick={onCancel} className="text-slate-500 hover:text-slate-300"><X size={14} /></button>
    </form>
  );
}

function CategoryNode({ node, onAdd, onEdit, onDelete, depth = 0 }) {
  const [open, setOpen] = useState(depth < 1);
  const [editing, setEditing] = useState(false);
  const [addingChild, setAddingChild] = useState(false);

  const hasChildren = node.children.length > 0;

  const handleEdit = async (name) => {
    await onEdit(node.id, { name, parentId: node.parentId, level: node.level });
    setEditing(false);
  };

  const handleAddChild = async (name) => {
    await onAdd({ name, parentId: node.id, level: node.level + 1 });
    setAddingChild(false);
    setOpen(true);
  };

  return (
    <li>
      <div
        className="flex items-center gap-1 py-1.5 px-2 rounded-lg hover:bg-white/5 group"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {/* Expand toggle */}
        <button
          onClick={() => setOpen(v => !v)}
          className={`w-4 h-4 flex items-center justify-center text-slate-500 flex-shrink-0 ${!hasChildren && 'opacity-0 pointer-events-none'}`}
        >
          {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>

        {/* Level badge */}
        <span className={`text-xs px-1 rounded font-mono flex-shrink-0 ${
          node.level === 1 ? 'bg-brand-500/20 text-brand-400' :
          node.level === 2 ? 'bg-blue-500/20 text-blue-400' :
          'bg-slate-500/20 text-slate-400'
        }`}>L{node.level}</span>

        {/* Name / edit inline */}
        {editing ? (
          <InlineInput defaultValue={node.name} onConfirm={handleEdit} onCancel={() => setEditing(false)} />
        ) : (
          <span className="flex-1 text-sm text-slate-200 truncate">{node.name}</span>
        )}

        {/* Actions — only visible on hover */}
        {!editing && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {node.level < 3 && (
              <button
                onClick={() => setAddingChild(true)}
                className="p-0.5 text-slate-500 hover:text-brand-400 transition-colors"
                title="Add sub-category"
              >
                <Plus size={13} />
              </button>
            )}
            <button
              onClick={() => setEditing(true)}
              className="p-0.5 text-slate-500 hover:text-blue-400 transition-colors"
              title="Rename"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => onDelete(node.id)}
              className="p-0.5 text-slate-500 hover:text-red-400 transition-colors"
              title="Delete"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Add-child inline form */}
      {addingChild && (
        <div style={{ paddingLeft: `${(depth + 1) * 16 + 24}px` }} className="py-1">
          <InlineInput
            placeholder={`New level ${node.level + 1} category…`}
            onConfirm={handleAddChild}
            onCancel={() => setAddingChild(false)}
          />
        </div>
      )}

      {/* Children */}
      {open && hasChildren && (
        <ul>
          {node.children.map(child => (
            <CategoryNode
              key={child.id}
              node={child}
              onAdd={onAdd}
              onEdit={onEdit}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function CategoryTree({ onSelect, selectedId }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingRoot, setAddingRoot] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await categoriesAPI.list();
      setCategories(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (data) => {
    await categoriesAPI.create(data);
    await load();
  };

  const handleEdit = async (id, data) => {
    await categoriesAPI.update(id, data);
    await load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category? This will fail if it has items or sub-categories.')) return;
    try {
      await categoriesAPI.remove(id);
      await load();
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed');
    }
  };

  const tree = buildTree(categories);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Categories</span>
        <button
          onClick={() => setAddingRoot(true)}
          className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors"
        >
          <Plus size={13} /> Add
        </button>
      </div>

      {error && <p className="text-xs text-red-400 px-3 py-2">{error}</p>}

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 size={20} className="text-slate-500 animate-spin" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto py-1">
          {addingRoot && (
            <div className="px-3 py-1">
              <InlineInput
                placeholder="New top-level category…"
                onConfirm={name => { handleAdd({ name, parentId: null, level: 1 }); setAddingRoot(false); }}
                onCancel={() => setAddingRoot(false)}
              />
            </div>
          )}
          {tree.length === 0 && !addingRoot ? (
            <p className="text-xs text-slate-500 px-3 py-2">No categories yet.</p>
          ) : (
            <ul>
              {tree.map(node => (
                <CategoryNode
                  key={node.id}
                  node={node}
                  onAdd={handleAdd}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
