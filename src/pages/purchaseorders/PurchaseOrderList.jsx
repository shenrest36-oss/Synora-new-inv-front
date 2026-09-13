import { useState, useEffect, useCallback } from 'react';
import { purchaseOrdersAPI } from '../../api/inv.js';
import { Plus, Loader2, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PO_STATUS_COLORS = {
  open:               'bg-blue-500/10 text-blue-400 border-blue-500/20',
  partially_received: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  completed:          'bg-green-500/10 text-green-400 border-green-500/20',
  cancelled:          'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

export default function PurchaseOrderList() {
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const { data } = await purchaseOrdersAPI.list(params);
      setPos(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
        <ShoppingCart size={18} className="text-brand-400" />
        <h1 className="font-semibold text-white flex-1">Purchase Orders</h1>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none">
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="partially_received">Partially Received</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button onClick={() => navigate('/purchase-orders/new')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus size={14} /> New PO
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={24} className="text-slate-500 animate-spin" /></div>
        ) : pos.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-500">
            <ShoppingCart size={36} className="mb-3 opacity-30" />
            <p className="text-sm">No purchase orders found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 glass">
              <tr className="text-left text-xs text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-3 font-medium">PO Code</th>
                <th className="px-4 py-3 font-medium">Supplier</th>
                <th className="px-4 py-3 font-medium">PR</th>
                <th className="px-4 py-3 font-medium">Order Date</th>
                <th className="px-4 py-3 font-medium text-right">Net Value</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {pos.map(po => (
                <tr key={po.id} onClick={() => navigate(`/purchase-orders/${po.id}`)}
                  className="hover:bg-white/3 transition-colors cursor-pointer">
                  <td className="px-6 py-3 font-mono text-xs text-brand-400">{po.poCode}</td>
                  <td className="px-4 py-3 text-white">{po.supplier?.name}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{po.purchaseRequest?.prCode || '—'}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{new Date(po.orderDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-slate-300">{Number(po.netValue).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${PO_STATUS_COLORS[po.status]}`}>
                      {po.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
