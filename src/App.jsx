import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AppLayout     from './components/AppLayout.jsx';

// Auth
import Login from './pages/Login.jsx';

// Sprint 0 — master data
import ItemList            from './pages/items/ItemList.jsx';
import SupplierList        from './pages/suppliers/SupplierList.jsx';
import TaxClassConfig      from './pages/taxclasses/TaxClassConfig.jsx';
import ApprovalLevelConfig from './pages/approvallevels/ApprovalLevelConfig.jsx';

// Supporting masters
import DepartmentConfig    from './pages/departments/DepartmentConfig.jsx';
import StoreConfig         from './pages/stores/StoreConfig.jsx';

// Sprint 1 — Purchase Requests
import PurchaseRequestList   from './pages/pr/PurchaseRequestList.jsx';
import PurchaseRequestForm   from './pages/pr/PurchaseRequestForm.jsx';
import PurchaseRequestDetail from './pages/pr/PurchaseRequestDetail.jsx';

// Sprint 2 — Quotations & Purchase Orders
import QuotationList      from './pages/quotations/QuotationList.jsx';
import QuotationForm      from './pages/quotations/QuotationForm.jsx';
import PurchaseOrderList  from './pages/purchaseorders/PurchaseOrderList.jsx';
import PurchaseOrderForm  from './pages/purchaseorders/PurchaseOrderForm.jsx';

// Sprint 3 — GRN
import GRNForm          from './pages/grn/GRNForm.jsx';
import GRNApprovalQueue from './pages/grn/GRNApprovalQueue.jsx';
import GRNDetail        from './pages/grn/GRNDetail.jsx';

// PR list wrapper — handles new/detail navigation inline
import { useState } from 'react';

function PurchaseRequestsPage() {
  const [view, setView] = useState('list'); // 'list' | 'new' | number (id)
  if (view === 'new') return <PurchaseRequestForm onClose={() => setView('list')} onSaved={() => setView('list')} />;
  return <PurchaseRequestList onSelect={(idOrNew) => setView(idOrNew)} />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/purchase-requests" replace />} />

          {/* Procurement */}
          <Route path="purchase-requests"        element={<PurchaseRequestsPage />} />
          <Route path="purchase-requests/:id"    element={<PurchaseRequestDetail />} />
          <Route path="quotations"               element={<QuotationList />} />
          <Route path="quotations/new"           element={<QuotationForm />} />
          <Route path="purchase-orders"          element={<PurchaseOrderList />} />
          <Route path="purchase-orders/new"      element={<PurchaseOrderForm />} />
          <Route path="grn"                      element={<GRNApprovalQueue />} />
          <Route path="grn/new"                  element={<GRNForm />} />
          <Route path="grn/:id"                  element={<GRNDetail />} />

          {/* Master data */}
          <Route path="items"                    element={<ItemList />} />
          <Route path="suppliers"                element={<SupplierList />} />

          {/* Configuration */}
          <Route path="tax-classes"              element={<TaxClassConfig />} />
          <Route path="approval-levels"          element={<ApprovalLevelConfig />} />
          <Route path="departments"              element={<DepartmentConfig />} />
          <Route path="stores"                   element={<StoreConfig />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/purchase-requests" replace />} />
    </Routes>
  );
}
