import { useState, useEffect, useCallback } from 'react';
import { purchaseRequestsAPI, departmentsAPI, itemsAPI } from '../../api/inv.js';
import { Plus, Trash2, FileText, Loader2, Search } from 'lucide-react';

const STATUS_COLORS = {
  pending:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  approved:  'bg-green-500/10 text-green-400 border-green-500/20',
  rejected:  'bg-red-500/10 text-red-400 border-red-500/20',
  cancelled: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

function StatusBadge({ status, currentLevel, levels }) {
  const cls = STATUS_COLORS[status] || STATUS_COLORS.pending;
  const label = status === 'pending' && levels
    ? `Pending L${currentLevel}/${levels.length}`
    : status.charAt(0).toUpperCase() + status.slice(1);
  return <span className={`text-xs px-2 py-0.5 rounded-full border ${cls}`}>{label}</span>;
}

export { StatusBadge };

export default function PurchaseRequestList({ onSelect }) {
  const [prs, setPrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', departmentId: '' });
  const [departments, setDepartments] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.departmentId) params.departmentId = filters.departmentId;
      const { data } = await purchaseRequestsAPI.list(params);
      setPrs(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => {
    departmentsAPI.list().then(r => setDepartments(r.data));
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
        <FileText size={18} className="text-brand-400" />
        <h1 className="font-semibold text-white flex-1">Purchase Requests</h1>

        <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <select value={filters.departmentId} onChange={e => setFilters(f => ({ ...f, departmentId: e.target.value }))}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none">
          <option value="">All departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>

        {onSelect && (
          <button onClick={() => onSelect('new')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors">
            <Plus size={14} /> New PR
          </button>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={24} className="text-slate-500 animate-spin" /></div>
        ) : prs.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-500">
            <FileText size={36} className="mb-3 opacity-30" />
            <p className="text-sm">No purchase requests found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 glass">
              <tr className="text-left text-xs text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-3 font-medium">PR Code</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {prs.map(pr => (
                <tr key={pr.id}
                  onClick={() => onSelect && onSelect(pr.id)}
                  className={`hover:bg-white/3 transition-colors ${onSelect ? 'cursor-pointer' : ''}`}>
                  <td className="px-6 py-3 font-mono text-xs text-brand-400">{pr.prCode}</td>
                  <td className="px-4 py-3 text-slate-300">{pr.subDepartment?.name || '—'}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {new Date(pr.requestedDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={pr.approvalRequest.status}
                      currentLevel={pr.approvalRequest.currentLevel}
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {new Date(pr.createdAt).toLocaleDateString()}
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
