import { useState, useEffect, useCallback } from 'react';
import { quotationsAPI } from '../../api/inv.js';
import { Plus, Loader2, FileSearch, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function QuotationList() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await quotationsAPI.list(); setQuotations(data); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
        <FileSearch size={18} className="text-brand-400" />
        <h1 className="font-semibold text-white flex-1">Quotations</h1>
        <button onClick={() => navigate('/quotations/new')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus size={14} /> New Quotation
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={24} className="text-slate-500 animate-spin" /></div>
        ) : quotations.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-500">
            <FileSearch size={36} className="mb-3 opacity-30" />
            <p className="text-sm">No quotations yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 glass">
              <tr className="text-left text-xs text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Supplier</th>
                <th className="px-4 py-3 font-medium">Linked PR</th>
                <th className="px-4 py-3 font-medium">Valid From</th>
                <th className="px-4 py-3 font-medium">Valid To</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {quotations.map(q => (
                <tr key={q.id} onClick={() => navigate(`/quotations/${q.id}`)}
                  className="hover:bg-white/3 transition-colors cursor-pointer">
                  <td className="px-6 py-3 font-mono text-xs text-brand-400">{q.quotationCode}</td>
                  <td className="px-4 py-3 text-white">{q.supplier?.name}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{q.purchaseRequest?.prCode || '—'}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{q.fromDate ? new Date(q.fromDate).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{q.toDate   ? new Date(q.toDate).toLocaleDateString()   : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${q.isActive ? 'bg-green-500/10 text-green-400' : 'bg-slate-500/10 text-slate-500'}`}>
                      {q.isActive ? 'Active' : 'Inactive'}
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
