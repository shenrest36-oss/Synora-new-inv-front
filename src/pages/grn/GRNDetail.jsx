import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { grnAPI } from '../../api/inv.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { ArrowLeft, Loader2, CheckCircle, XCircle, Clock, Check, X, PackageCheck } from 'lucide-react';

export default function GRNDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [grn, setGrn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null);
  const [comment, setComment] = useState('');
  const [actioning, setActioning] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await grnAPI.get(id); setGrn(data); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async () => {
    if (mode === 'reject' && !comment.trim()) return setError('Rejection reason is required');
    setError('');
    setActioning(true);
    try {
      // currentLevel is the level record object from the API (GET /grn/:id adds it via getCurrentLevelRecord)
      const levelId = grn.currentLevel?.id;
      if (!levelId) return setError('Could not determine current approval level');
      if (mode === 'approve') await grnAPI.approve(grn.id, { levelId, comment: comment || undefined });
      else await grnAPI.reject(grn.id, { levelId, comment });
      setMode(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Action failed');
    } finally { setActioning(false); }
  };

  if (loading) return <div className="flex justify-center items-center h-full"><Loader2 size={28} className="text-slate-500 animate-spin" /></div>;
  if (!grn) return <div className="p-6 text-slate-400">Not found</div>;

  const { approvalRequest, levels, currentLevel } = grn;
  const isApproved = grn.status === 'approved';
  const isRejected = grn.status === 'rejected';
  const canAct = grn.status === 'pending_approval' &&
    currentLevel && (user?.role === 'admin' || user?.role === currentLevel.requiredRole);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
        <button onClick={() => navigate('/grn')} className="text-slate-400 hover:text-white"><ArrowLeft size={18} /></button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-semibold text-white">{grn.grnCode}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${
              isApproved ? 'bg-green-500/10 text-green-400 border-green-500/20' :
              isRejected ? 'bg-red-500/10 text-red-400 border-red-500/20' :
              'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
            }`}>
              {grn.status === 'pending_approval' ? `Pending L${grn.currentLevel}/${levels?.length || '?'}` : grn.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            PO: {grn.purchaseOrder?.poCode} · {grn.supplier?.name} · Store: {grn.store?.name} ·
            Received: {grn.receivedDate ? new Date(grn.receivedDate).toLocaleDateString() : '—'}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Stock post banner */}
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
          isApproved ? 'bg-green-500/5 border-green-500/20' :
          isRejected ? 'bg-red-500/5 border-red-500/20' :
          'bg-yellow-500/5 border-yellow-500/20'
        }`}>
          {isApproved ? <CheckCircle size={16} className="text-green-400" /> :
           isRejected ? <XCircle    size={16} className="text-red-400" /> :
           <Clock      size={16} className="text-yellow-400" />}
          <p className="text-sm">
            {isApproved ? `✓ Approved — stock posted to ${grn.store?.name} (Sprint 4 bin-card)` :
             isRejected ? '✕ Rejected — no stock posted' :
             '⏳ Pending approval — stock not yet posted'}
          </p>
        </div>

        {/* Approve/Reject panel */}
        {canAct && !mode && (
          <div className="flex items-center gap-3 p-4 bg-brand-500/5 border border-brand-500/10 rounded-xl">
            <p className="text-sm text-white flex-1">
              Awaiting your approval — <span className="text-brand-400 font-mono">{currentLevel?.levelName}</span>
            </p>
            <button onClick={() => setMode('approve')}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-500/15 border border-green-500/30 hover:bg-green-500/25 text-green-400 text-sm font-medium rounded-lg transition-colors">
              <Check size={14} /> Approve
            </button>
            <button onClick={() => setMode('reject')}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-sm font-medium rounded-lg transition-colors">
              <X size={14} /> Reject
            </button>
          </div>
        )}
        {canAct && mode && (
          <div className="p-4 glass-card rounded-xl border border-white/5 space-y-3">
            {error && <p className="text-xs text-red-400">{error}</p>}
            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={2}
              placeholder={mode === 'reject' ? 'Rejection reason (required)…' : 'Optional comment…'}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 resize-none" />
            <div className="flex gap-2">
              <button onClick={handleAction} disabled={actioning}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
                  mode === 'approve' ? 'bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30' : 'bg-red-500/15 border border-red-500/25 text-red-400 hover:bg-red-500/25'
                }`}>
                {actioning && <Loader2 size={13} className="animate-spin" />}
                Confirm {mode}
              </button>
              <button onClick={() => { setMode(null); setComment(''); setError(''); }}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
            </div>
          </div>
        )}

        {/* Items */}
        <div>
          <h2 className="text-sm font-semibold text-white mb-3">Received Items</h2>
          <table className="w-full text-sm">
            <thead className="glass">
              <tr className="text-left text-xs text-slate-400 uppercase tracking-wider">
                <th className="px-4 py-2 font-medium">Item</th>
                <th className="px-4 py-2 font-medium text-right">Qty</th>
                <th className="px-4 py-2 font-medium text-right">Unit Price</th>
                <th className="px-4 py-2 font-medium text-right">Net</th>
                <th className="px-4 py-2 font-medium">Expiry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {grn.items?.map(i => (
                <tr key={i.id}>
                  <td className="px-4 py-2.5">
                    <p className="text-white text-sm">{i.item?.name}</p>
                    <p className="text-xs text-slate-500">{i.item?.itemCode}</p>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs text-slate-300">{Number(i.quantity).toFixed(4)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs text-slate-400">{Number(i.unitPrice).toFixed(4)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs text-slate-300">{Number(i.netPrice).toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{i.expiryDate ? new Date(i.expiryDate).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/10">
                <td colSpan={3} className="px-4 py-2 text-right text-xs text-slate-400 font-medium">Net Total</td>
                <td className="px-4 py-2 text-right font-mono text-sm text-brand-400 font-semibold">{Number(grn.netValue).toFixed(2)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Approval trail */}
        {approvalRequest?.actions?.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-white mb-3">Approval Trail</h2>
            <div className="space-y-2">
              {approvalRequest.actions.map(action => (
                <div key={action.id} className="flex items-start gap-3 glass-card rounded-lg px-4 py-3">
                  {action.action === 'approved' ? <CheckCircle size={14} className="text-green-400" /> : <XCircle size={14} className="text-red-400" />}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white font-medium capitalize">{action.action}</span>
                      <span className="text-xs text-slate-500">by user #{action.approvedBy}</span>
                      <span className="text-xs text-slate-600">·</span>
                      <span className="text-xs text-slate-500">{new Date(action.actedAt).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-brand-400 mt-0.5">{action.level?.levelName}</p>
                    {action.comment && <p className="text-xs text-slate-400 mt-1 italic">"{action.comment}"</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
