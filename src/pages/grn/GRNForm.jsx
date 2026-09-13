import { useState, useEffect, useCallback } from 'react';
import { grnAPI, purchaseOrdersAPI, suppliersAPI, storesAPI } from '../../api/inv.js';
import { useNavigate } from 'react-router-dom';
import { Loader2, Info } from 'lucide-react';

const inputClass = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 transition-colors';

export default function GRNForm() {
  const navigate = useNavigate();

  const [openPOs, setOpenPOs] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [stores, setStores] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);

  const [form, setForm] = useState({ storeId: '', supplierId: '', supplierInvoiceNo: '', receivedDate: '' });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    purchaseOrdersAPI.list({ status: 'open' }).then(r => setOpenPOs(prev => [...r.data]));
    purchaseOrdersAPI.list({ status: 'partially_received' }).then(r => setOpenPOs(prev => [...prev, ...r.data]));
    suppliersAPI.list({ isActive: true }).then(r => setSuppliers(r.data));
    storesAPI.list({ isActive: true }).then(r => setStores(r.data));
  }, []);

  const handleSelectPO = async (poId) => {
    if (!poId) { setSelectedPO(null); setItems([]); return; }
    const { data } = await purchaseOrdersAPI.get(poId);
    setSelectedPO(data);
    setForm(f => ({ ...f, supplierId: String(data.supplierId) }));
    setItems(data.items.map(i => ({
      itemId:      i.itemId,
      poItemId:    i.id,
      itemName:    i.item?.name,
      itemCode:    i.item?.itemCode,
      unitType:    i.item?.unitType,
      ordered:     Number(i.quantity),
      receivedSoFar: Number(i.receivedQty),
      remaining:   Number(i.quantity) - Number(i.receivedQty),
      quantity:    '',
      unitPrice:   Number(i.unitPrice).toFixed(4),
      discount:    '0',
      taxValue:    '0',
      expiryDate:  '',
      serialNo:    '',
    })));
  };

  const updateItem = (idx, field, value) => setItems(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPO) return setError('Select a purchase order');
    if (!form.storeId)  return setError('Select a receiving store');
    if (!form.supplierId) return setError('Supplier is required');
    if (!form.receivedDate) return setError('Received date is required');

    const filledItems = items.filter(i => i.quantity && Number(i.quantity) > 0);
    if (filledItems.length === 0) return setError('Enter received quantity for at least one item');

    for (const i of filledItems) {
      if (Number(i.quantity) > i.remaining) {
        return setError(`${i.itemName}: quantity (${i.quantity}) exceeds remaining balance (${i.remaining.toFixed(4)})`);
      }
    }

    setError('');
    setLoading(true);
    try {
      await grnAPI.create({
        purchaseOrderId:   selectedPO.id,
        supplierId:        Number(form.supplierId),
        storeId:           Number(form.storeId),
        supplierInvoiceNo: form.supplierInvoiceNo || undefined,
        receivedDate:      form.receivedDate,
        items: filledItems.map(i => ({
          itemId:     i.itemId,
          quantity:   Number(i.quantity),
          unitPrice:  Number(i.unitPrice),
          discount:   Number(i.discount   || 0),
          taxValue:   Number(i.taxValue   || 0),
          expiryDate: i.expiryDate || undefined,
          serialNo:   i.serialNo   || undefined,
        })),
      });
      navigate('/grn');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create GRN');
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <h1 className="font-semibold text-white">New Goods Received Note</h1>
        <button onClick={() => navigate('/grn')} className="text-sm text-slate-400 hover:text-white">Cancel</button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
        {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">{error}</div>}

        {/* PO Select */}
        <div className="glass-card rounded-xl p-4 space-y-3">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Purchase Order</h2>
          <select className={inputClass} onChange={e => handleSelectPO(e.target.value)}>
            <option value="">Select open purchase order…</option>
            {openPOs.map(po => (
              <option key={po.id} value={po.id}>
                {po.poCode} — {po.supplier?.name} ({po.status.replace('_', ' ')})
              </option>
            ))}
          </select>
        </div>

        {/* Header details */}
        {selectedPO && (
          <div className="glass-card rounded-xl p-4 space-y-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Receipt Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Receiving Store <span className="text-red-400">*</span></label>
                <select className={inputClass} value={form.storeId} onChange={e => setForm(f => ({ ...f, storeId: e.target.value }))} required>
                  <option value="">Select store…</option>
                  {stores.map(s => <option key={s.id} value={s.id}>{s.name}{s.location ? ` (${s.location})` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Received Date <span className="text-red-400">*</span></label>
                <input type="date" className={inputClass} value={form.receivedDate} onChange={e => setForm(f => ({ ...f, receivedDate: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Supplier Invoice No.</label>
                <input className={inputClass} value={form.supplierInvoiceNo} onChange={e => setForm(f => ({ ...f, supplierInvoiceNo: e.target.value }))} placeholder="Optional" />
              </div>
            </div>
          </div>
        )}

        {/* Items */}
        {selectedPO && items.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-white mb-3">Items</h2>
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto] gap-2 text-xs text-slate-500 uppercase tracking-wider px-2">
                <span>Item</span>
                <span className="w-20 text-center">Ordered</span>
                <span className="w-20 text-center">Received</span>
                <span className="w-20 text-center">Remaining</span>
                <span className="w-24 text-center">Receive Now</span>
                <span className="w-24 text-center">Unit Price</span>
                <span className="w-28 text-center">Expiry</span>
              </div>
              {items.map((row, idx) => (
                <div key={row.itemId} className={`grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto] gap-2 items-center glass-card rounded-lg px-2 py-2 ${row.remaining <= 0 ? 'opacity-40' : ''}`}>
                  <div>
                    <p className="text-sm text-white">{row.itemName}</p>
                    <p className="text-xs text-slate-500">{row.itemCode} · {row.unitType}</p>
                  </div>
                  <span className="w-20 text-center font-mono text-xs text-slate-400">{row.ordered.toFixed(2)}</span>
                  <span className="w-20 text-center font-mono text-xs text-yellow-400">{row.receivedSoFar.toFixed(2)}</span>
                  <span className="w-20 text-center font-mono text-xs text-green-400">{row.remaining.toFixed(2)}</span>
                  <input type="number" min="0" max={row.remaining} step="0.000001" value={row.quantity}
                    onChange={e => updateItem(idx, 'quantity', e.target.value)}
                    disabled={row.remaining <= 0}
                    placeholder="0"
                    className="w-24 bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white text-center focus:outline-none focus:border-brand-500/40 disabled:opacity-30" />
                  <input type="number" min="0" step="0.000001" value={row.unitPrice}
                    onChange={e => updateItem(idx, 'unitPrice', e.target.value)}
                    className="w-24 bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white text-center focus:outline-none focus:border-brand-500/40" />
                  <input type="date" value={row.expiryDate}
                    onChange={e => updateItem(idx, 'expiryDate', e.target.value)}
                    className="w-28 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-brand-500/40" />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button type="button" onClick={() => navigate('/grn')} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
              <button type="submit" disabled={loading}
                className="flex items-center gap-2 px-5 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                {loading && <Loader2 size={14} className="animate-spin" />}
                {loading ? 'Submitting…' : 'Submit GRN for Approval'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
