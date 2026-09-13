import { useState, useEffect, useCallback } from 'react';
import { itemsAPI } from '../../api/inv.js';
import CategoryTree from './CategoryTree.jsx';
import ItemForm from './ItemForm.jsx';
import { Plus, Search, Pencil, PowerOff, Loader2, Package } from 'lucide-react';

export default function ItemList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { isActive: filterActive };
      if (search) params.search = search;
      if (selectedCategoryId) params.categoryId = selectedCategoryId;
      const { data } = await itemsAPI.list(params);
      setItems(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [search, filterActive, selectedCategoryId]);

  useEffect(() => { load(); }, [load]);

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this item?')) return;
    await itemsAPI.deactivate(id);
    load();
  };

  return (
    <div className="flex h-full">
      {/* Category sidebar */}
      <div className="w-64 flex-shrink-0 glass border-r border-white/5 flex flex-col">
        <CategoryTree />
      </div>

      {/* Main panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
          <Package size={18} className="text-brand-400" />
          <h1 className="font-semibold text-white flex-1">Item Master</h1>

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search items…"
              className="pl-8 pr-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 w-52"
            />
          </div>

          {/* Active toggle */}
          <button
            onClick={() => setFilterActive(v => !v)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              filterActive
                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                : 'bg-white/5 border-white/10 text-slate-400'
            }`}
          >
            {filterActive ? 'Active only' : 'Show all'}
          </button>

          <button
            onClick={() => { setEditingItem(null); setFormOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={14} /> Add Item
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 size={24} className="text-slate-500 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <Package size={36} className="mb-3 opacity-30" />
              <p className="text-sm">No items found</p>
              <button onClick={() => { setEditingItem(null); setFormOpen(true); }}
                className="mt-3 text-xs text-brand-400 hover:text-brand-300 underline">
                Add the first item
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 glass">
                <tr className="text-left text-xs text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Unit</th>
                  <th className="px-4 py-3 font-medium">Tax Class</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs text-slate-400">{item.itemCode}</td>
                    <td className="px-4 py-3 text-white font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{item.category?.name}</td>
                    <td className="px-4 py-3 text-slate-400">{item.unitType}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {item.taxClass ? (
                        <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded px-1.5 py-0.5">
                          {item.taxClass.name}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        item.isActive
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-slate-500/10 text-slate-500'
                      }`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditingItem(item); setFormOpen(true); }}
                          className="p-1.5 text-slate-500 hover:text-blue-400 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        {item.isActive && (
                          <button
                            onClick={() => handleDeactivate(item.id)}
                            className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                            title="Deactivate"
                          >
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
      </div>

      {/* Item form modal */}
      {formOpen && (
        <ItemForm
          item={editingItem}
          onClose={() => { setFormOpen(false); setEditingItem(null); }}
          onSaved={() => { setFormOpen(false); setEditingItem(null); load(); }}
        />
      )}
    </div>
  );
}
