import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { purchaseRequestsAPI } from '../../api/inv.js';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  ArrowLeft, Loader2, CheckCircle, XCircle, Clock, Check, X, ChevronDown, ChevronRight
} from 'lucide-react';

const STATUS_ICON = {
  approved: <CheckCircle size={14} className="text-green-400" />,
  rejected:  <XCircle    size={14} className="text-red-400" />,
};

function SnapshotTable({ items, previousItems, label }) {
  const [open, setOpen] = useState(true);

  const changedIds = new Set();
  if (previousItems) {
    for (const curr of items) {
      const prev = previousItems.find(p => p.itemId === curr.itemId);
      if (!prev || String(prev.quantity) !== String(curr.quantity) || String(prev.unitPrice) !== String(curr.unitPrice)) {
        changedIds.add(curr.itemId);
      }
    }
  }

  return (
    <div className="glass-card rounded-xl border border-white/5 overflow-hidden">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-white hover:bg-white/3 transition-colors">
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {label}
      </button>
      {open && (
        <table className="w-full text-sm border-t border-white/5">
          <thead>
            <tr className="text-xs text-slate-500 uppercase tracking-wider">
              <th className="px-4 py-2 text-left font-medium">Item</th>
              <th className="px-4 py-2 text-right font-medium">Qty</th>
              <th className="px-4 py-2 text-right font-medium">Unit Price</th>
              <th className="px-4 py-2 text-left font-medium">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {items.map(item => {
              const changed = changedIds.has(item.itemId);
              return (
                <tr key={item.id} className={changed ? 'bg-brand-500/5' : ''}>
                  <td className="px-4 py-2">
                    <span className="text-white">{item.item?.name}</span>
                    {changed && <span className="ml-2 text-xs text-brand-400">● edited</span>}
                  </td>
                  <td className={`px-4 py-2 text-right font-mono text-xs ${changed ? 'text-brand-300' : 'text-slate-300'}`}>
                    {Number(item.quantity).toFixed(4)}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-xs text-slate-400">
                    {item.unitPrice != null ? Number(item.unitPrice).toFixed(2) : '—'}
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-500">{item.reason || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ApproveRejectPanel({ pr, level, onDone }) {
  const [mode, setMode] = useState(null); // 'approve' | 'reject'
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = async () => {
    if (mode === 'reject' && !comment.trim()) return setError('Rejection reason is required');
    setError('');
    setLoading(true);
    try {
      if (mode === 'approve') {
        await purchaseRequestsAPI.approve(pr.id, { levelId: level.id, comment: comment || undefined });
      } else {
        await purchaseRequestsAPI.reject(pr.id, { levelId: level.id, comment });
      }
      onDone();
    } catch (err) {
      setError(err.response?.data?.error || 'Action failed');
    } finally { setLoading(false); }
  };

  if (!mode) {
    return (
      <div className="flex items-center gap-3 p-4 bg-brand-500/5 border border-brand-500/10 rounded-xl">
        <div className="flex-1 text-sm text-white">
          This PR is awaiting your approval (<span className="text-brand-400 font-mono">{level.levelName}</span> — level {level.levelOrder}).
        </div>
        <button onClick={() => setMode('approve')}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-500/15 border border-green-500/30 hover:bg-green-500/25 text-green-400 text-sm font-medium rounded-lg transition-colors">
          <Check size={14} /> Approve
        </button>
        <button onClick={() => setMode('reject')}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-sm font-medium rounded-lg transition-colors">
          <X size={14} /> Reject
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 glass-card rounded-xl border border-white/5 space-y-3">
      <p className="text-sm font-medium text-white capitalize">{mode === 'approve' ? '✓ Approve' : '✕ Reject'} this PR</p>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <textarea value={comment} onChange={e => setComment(e.target.value)} rows={2}
        placeholder={mode === 'reject' ? 'Rejection reason (required)…' : 'Optional comment…'}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 resize-none" />
      <div className="flex gap-2">
        <button onClick={handle} disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
            mode === 'approve'
              ? 'bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30'
              : 'bg-red-500/15 border border-red-500/25 text-red-400 hover:bg-red-500/25'
          }`}>
          {loading && <Loader2 size={13} className="animate-spin" />}
          Confirm {mode}
        </button>
        <button onClick={() => { setMode(null); setComment(''); setError(''); }}
          className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function PurchaseRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pr, setPr] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await purchaseRequestsAPI.get(id);
      setPr(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex justify-center items-center h-full">
      <Loader2 size={28} className="text-slate-500 animate-spin" />
    </div>
  );
  if (!pr) return <div className="p-6 text-slate-400">Not found</div>;

  const { approvalRequest, snapshots, levels, currentLevel } = pr;
  const canAct = approvalRequest.status === 'pending' &&
    currentLevel &&
    (user?.role === 'admin' || user?.role === currentLevel.requiredRole);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
        <button onClick={() => navigate('/purchase-requests')}
          className="text-slate-400 hover:text-white transition-colors"><ArrowLeft size={18} /></button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-semibold text-white">{pr.prCode}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${
              approvalRequest.status === 'approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
              approvalRequest.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
              'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
            }`}>
              {approvalRequest.status === 'pending'
                ? `Pending — Level ${approvalRequest.currentLevel}${levels ? `/${levels.length}` : ''}`
                : approvalRequest.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {pr.subDepartment?.name && `${pr.subDepartment.name} · `}
            Requested {new Date(pr.requestedDate).toLocaleDateString()}
            {pr.eventName && ` · Event: ${pr.eventName}`}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Approve/Reject panel */}
        {canAct && (
          <ApproveRejectPanel pr={pr} level={currentLevel} onDone={load} />
        )}

        {/* Item snapshots */}
        {snapshots && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-300">Item Snapshots</h2>
            {/* Original */}
            {snapshots.original.length > 0 && (
              <SnapshotTable items={snapshots.original} label="Original submission" />
            )}
            {/* Each level snapshot */}
            {snapshots.levels.map((snap, idx) => {
              const prevItems = idx === 0 ? snapshots.original : snapshots.levels[idx - 1].items;
              return (
                <SnapshotTable
                  key={snap.level.id}
                  items={snap.items}
                  previousItems={prevItems}
                  label={`Level ${snap.level.levelOrder}: ${snap.level.levelName}`}
                />
              );
            })}
          </div>
        )}

        {/* Approval action trail */}
        {approvalRequest.actions?.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-slate-300 mb-3">Approval Trail</h2>
            <div className="space-y-2">
              {approvalRequest.actions.map(action => (
                <div key={action.id} className="flex items-start gap-3 glass-card rounded-lg px-4 py-3">
                  {STATUS_ICON[action.action] || <Clock size={14} className="text-slate-500" />}
                  <div className="flex-1 min-w-0">
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
