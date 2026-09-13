import { useState, useEffect, useCallback } from 'react';
import { grnAPI, approvalLevelsAPI } from '../../api/inv.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { Loader2, PackageCheck, Check, X } from 'lucide-react';

export default function GRNApprovalQueue() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [grns, setGrns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(null);
  const [comment, setComment] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await grnAPI.list({ status: 'pending_approval' });
      // Get levels so we can filter to the user's responsibility
      const levels = await approvalLevelsAPI.list('grn_receiving');
      const userLevels = levels.data.filter(l => l.requiredRole === user?.role || user?.role === 'admin');
      const relevant = data.filter(grn =>
        userLevels.some(l => l.levelOrder === grn.currentLevel)
      );
      setGrns(relevant);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (grn, action) => {
    if (action === 'reject' && !comment.trim()) return;
    setActioning(`${grn.id}-${action}`);
    try {
      // Get the correct level id
      const levels = await approvalLevelsAPI.list('grn_receiving');
      const level = levels.data.find(l => l.levelOrder === grn.currentLevel);
      if (!level) return;
      if (action === 'approve') await grnAPI.approve(grn.id, { levelId: level.id, comment: comment || undefined });
      else await grnAPI.reject(grn.id, { levelId: level.id, comment });
      setComment('');
      await load();
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed');
    } finally { setActioning(null); }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
        <PackageCheck size={18} className="text-brand-400" />
        <div className="flex-1">
          <h1 className="font-semibold text-white">GRN Approval Queue</h1>
          <p className="text-xs text-slate-500 mt-0.5">GRNs pending your approval (role: <span className="text-brand-400 font-mono">{user?.role}</span>)</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 size={24} className="text-slate-500 animate-spin" /></div>
        ) : grns.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-500">
            <PackageCheck size={36} className="mb-3 opacity-30" />
            <p className="text-sm">No GRNs pending your approval</p>
          </div>
        ) : (
          grns.map(grn => (
            <div key={grn.id} className="glass-card rounded-xl border border-white/5 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-brand-400">{grn.grnCode}</span>
                    <span className="text-xs text-slate-500">Level {grn.currentLevel}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    PO: {grn.purchaseOrder?.poCode} · {grn.supplier?.name} · Store: {grn.store?.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    Received: {grn.receivedDate ? new Date(grn.receivedDate).toLocaleDateString() : '—'} ·
                    Net: <span className="text-slate-300 font-mono">{Number(grn.netValue).toFixed(2)}</span>
                  </p>
                </div>
                <button onClick={() => navigate(`/grn/${grn.id}`)}
                  className="text-xs text-slate-500 hover:text-brand-400 transition-colors underline">
                  Details
                </button>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                <input value={comment} onChange={e => setComment(e.target.value)}
                  placeholder="Optional comment (required for rejection)…"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50" />
                <button
                  onClick={() => handleAction(grn, 'approve')}
                  disabled={!!actioning}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-500/15 border border-green-500/30 hover:bg-green-500/25 text-green-400 text-sm rounded-lg transition-colors disabled:opacity-40">
                  {actioning === `${grn.id}-approve` ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  Approve
                </button>
                <button
                  onClick={() => handleAction(grn, 'reject')}
                  disabled={!!actioning || !comment.trim()}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-sm rounded-lg transition-colors disabled:opacity-40">
                  {actioning === `${grn.id}-reject` ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
