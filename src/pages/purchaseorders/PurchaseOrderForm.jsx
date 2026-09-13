import { useState, useEffect, useMemo } from 'react';
import { purchaseOrdersAPI, purchaseRequestsAPI, suppliersAPI, quotationsAPI } from '../../api/inv.js';
import { useNavigate } from 'react-router-dom';
import { Loader2, Info } from 'lucide-react';

const inputClass = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 transition-colors';

export default function PurchaseOrderForm() {
  const navigate = useNavigate();

  // Selections
  const [approvedPRs, setApprovedPRs] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedPR, setSelectedPR] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [selectedQuotation, setSelectedQuotation] = useState(null);

  const [form, setForm] = useState({ supplierId: '', orderDate: '', paymentType: '', deliveryAddress: '' });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    purchaseRequestsAPI.list({ status: 'approved' }).then(r => setApprovedPRs(r.data));
    suppliersAPI.list({ isActive: true }).then(r => setSuppliers(r.data));
  }, []);

  // Load PR snapshot items when a PR is selected
  const handleSelectPR = async (prId) => {
    if (!prId) { setSelectedPR(null); setItems([]); return; }
    const { data } = await purchaseRequestsAPI.get(prId);
    setSelectedPR(data);
    // Use the latest approved snapshot items
    const snapshot = data.snapshots?.levels?.at(-1)?.items ?? data.snapshots?.original ?? [];
    setItems(snapshot.map(i => ({
      itemId:      i.itemId,
      itemName:    i.item?.name,
      itemCode:    i.item?.itemCode,
      unitType:    i.item?.unitType,
      quantity:    Number(i.quantity).toFixed(4),
      unitPrice:   i.unitPrice != null ? Number(i.unitPrice).toFixed(4) : '',
      taxRate:     '0',
      discountRate: '0',
    })));
    // Load quotations linked to this PR
    const qRes = await quotationsAPI.list({ purchaseRequestId: prId });
    setQuotations(qRes.data);
  };

  // Fill prices from quotation when selected
  const handleSelectQuotation = async (quotationId) => {
    if (!quotationId) { setSelectedQuotation(null); return; }
    const { data } = await quotationsAPI.get(quotationId);
    setSelectedQuotation(data);
    setForm(f => ({ ...f, supplierId: String(data.supplierId) }));
    setItems(prev => prev.map(row => {
      const qItem = data.items.find(q => q.itemId === row.itemId);
      return qItem ? { ...row, unitPrice: Number(qItem.price).toFixed(4) } : row;
    }));
  };

  const updateItem = (idx, field, value) => setItems(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));

  // Live totals
  const totals = useMemo(() => {
    let gross = 0; let tax = 0;
    for (const i of items) {
      const qty      = Number(i.quantity)     || 0;
      const price    = Number(i.unitPrice)    || 0;
      const taxRate  = Number(i.taxRate)      || 0;
      const discRate = Number(i.discountRate) || 0;
      const lineGross = qty * price;
      const lineDisc  = lineGross * (discRate / 100);
      const lineTax   = (lineGross - lineDisc) * (taxRate / 100);
      gross += lineGross;
      tax   += lineTax;
    }
    return { gross, tax, net: gross + tax };
  }, [items]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPR) return setError('Select an approved PR');
    if (!form.supplierId) return setError('Select a supplier');
    if (!form.orderDate) return setError('Order date is required');
    if (items.some(i => !i.unitPrice || Number(i.unitPrice) <= 0)) return setError('All items need a unit price');
    setError('');
    setLoading(true);
    try {
      await purchaseOrdersAPI.create({
        purchaseRequestId: selectedPR.id,
        supplierId: Number(form.supplierId),
        orderDate: form.orderDate,
        paymentType: form.paymentType || undefined,
        deliveryAddress: form.deliveryAddress || undefined,
        items: items.map(i => ({
          itemId:       i.itemId,
          quantity:     Number(i.quantity),
          unitPrice:    Number(i.unitPrice),
          taxRate:      Number(i.taxRate     || 0),
          discountRate: Number(i.discountRate || 0),
        })),
      });
      navigate('/purchase-orders');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create purchase order');
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <h1 className="font-semibold text-white">New Purchase Order</h1>
        <button onClick={() => navigate('/purchase-orders')} className="text-sm text-slate-400 hover:text-white">Cancel</button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
        {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">{error}</div>}

        {/* Step 1 — Select approved PR */}
        <div className="glass-card rounded-xl p-4 space-y-3">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Step 1 — Approved Purchase Request</h2>
          <select className={inputClass} onChange={e => handleSelectPR(e.target.value)}>
            <option value="">Select approved PR…</option>
            {approvedPRs.map(pr => (
              <option key={pr.id} value={pr.id}>{pr.prCode} — {pr.subDepartment?.name || 'No dept'} ({new Date(pr.requestedDate).toLocaleDateString()})</option>
            ))}
          </select>
          {selectedPR && (
            <div className="flex items-center gap-2 text-xs text-green-400">
              <Info size={12} /> {items.length} item(s) loaded from the approved snapshot
            </div>
          )}
        </div>

        {/* Step 2 — Supplier & Quotation */}
        {selectedPR && (
          <div className="glass-card rounded-xl p-4 space-y-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Step 2 — Supplier & Quotation</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Quotation (optional — fills prices)</label>
                <select className={inputClass} onChange={e => handleSelectQuotation(e.target.value)}>
                  <option value="">No quotation</option>
                  {quotations.map(q => <option key={q.id} value={q.id}>{q.quotationCode} — {q.supplier?.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Supplier <span className="text-red-400">*</span></label>
                <select className={inputClass} value={form.supplierId} onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))} required>
                  <option value="">Select supplier…</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — PO details & items */}
        {selectedPR && (
          <>
            <div className="glass-card rounded-xl p-4 space-y-3">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Step 3 — Order Details</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Order Date <span className="text-red-400">*</span></label>
                  <input type="date" className={inputClass} value={form.orderDate} onChange={e => setForm(f => ({ ...f, orderDate: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Payment Type</label>
                  <input className={inputClass} value={form.paymentType} onChange={e => setForm(f => ({ ...f, paymentType: e.target.value }))} placeholder="e.g. 30-day credit" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Delivery Address</label>
                  <input className={inputClass} value={form.deliveryAddress} onChange={e => setForm(f => ({ ...f, deliveryAddress: e.target.value }))} placeholder="Optional" />
                </div>
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-white">Items</h2>
                {/* Live totals */}
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>Gross: <span className="text-white font-mono">{totals.gross.toFixed(2)}</span></span>
                  <span>Tax: <span className="text-white font-mono">{totals.tax.toFixed(2)}</span></span>
                  <span>Net: <span className="text-brand-400 font-mono font-semibold">{totals.net.toFixed(2)}</span></span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 text-xs text-slate-500 uppercase tracking-wider px-2">
                  <span>Item</span>
                  <span className="w-28 text-center">Qty</span>
                  <span className="w-28 text-center">Unit Price</span>
                  <span className="w-20 text-center">Tax %</span>
                  <span className="w-20 text-center">Disc %</span>
                </div>
                {items.map((row, idx) => (
                  <div key={row.itemId} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center glass-card rounded-lg px-2 py-2">
                    <div>
                      <p className="text-sm text-white">{row.itemName}</p>
                      <p className="text-xs text-slate-500">{row.itemCode} · {row.unitType}</p>
                    </div>
                    {[['quantity','w-28'],['unitPrice','w-28'],['taxRate','w-20'],['discountRate','w-20']].map(([field, w]) => (
                      <input key={field} type="number" min="0" step="0.0001" value={row[field]}
                        onChange={e => updateItem(idx, field, e.target.value)}
                        className={`${w} bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white text-center focus:outline-none focus:border-brand-500/40`} />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => navigate('/purchase-orders')} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
              <button type="submit" disabled={loading}
                className="flex items-center gap-2 px-5 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                {loading && <Loader2 size={14} className="animate-spin" />}
                {loading ? 'Creating…' : 'Create Purchase Order'}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
