import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Package, Truck, ReceiptText, ShieldCheck, LogOut, Menu, X, Hotel,
  FileText, FileSearch, ShoppingCart, PackageCheck, Building2, Warehouse,
  ChevronDown, ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

const NAV = [
  {
    group: 'Procurement',
    items: [
      { to: '/purchase-requests', label: 'Purchase Requests', icon: FileText },
      { to: '/quotations',        label: 'Quotations',        icon: FileSearch },
      { to: '/purchase-orders',   label: 'Purchase Orders',   icon: ShoppingCart },
      { to: '/grn',               label: 'GRN / Receiving',   icon: PackageCheck },
    ],
  },
  {
    group: 'Master Data',
    items: [
      { to: '/items',           label: 'Item Master',     icon: Package },
      { to: '/suppliers',       label: 'Suppliers',       icon: Truck },
    ],
  },
  {
    group: 'Configuration',
    items: [
      { to: '/tax-classes',     label: 'Tax Classes',      icon: ReceiptText },
      { to: '/approval-levels', label: 'Approval Levels',  icon: ShieldCheck },
      { to: '/departments',     label: 'Departments',      icon: Building2 },
      { to: '/stores',          label: 'Stores',           icon: Warehouse },
    ],
  },
];

function NavGroup({ group, items, collapsed }) {
  const [open, setOpen] = useState(true);

  if (collapsed) {
    return (
      <>
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} title={label}
            className={({ isActive }) =>
              `flex items-center justify-center py-2.5 rounded-lg transition-all ${
                isActive ? 'bg-brand-500/15 text-brand-400' : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
              }`
            }>
            <Icon size={18} />
          </NavLink>
        ))}
        <div className="my-1 border-t border-white/5" />
      </>
    );
  }

  return (
    <div className="mb-1">
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 w-full px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-400 transition-colors">
        {open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        {group}
      </button>
      {open && (
        <div className="space-y-0.5">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                }`
              }>
              <Icon size={18} className="flex-shrink-0" />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-60' : 'w-16'} flex flex-col flex-shrink-0 transition-all duration-200 glass border-r border-white/5`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
            <Hotel size={18} className="text-brand-400" />
          </div>
          {sidebarOpen && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">Hotel Inventory</p>
              <p className="text-xs text-slate-400 truncate">v0.3</p>
            </div>
          )}
          <button onClick={() => setSidebarOpen(v => !v)}
            className="ml-auto text-slate-400 hover:text-white transition-colors" aria-label="Toggle sidebar">
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 overflow-y-auto space-y-0.5">
          {NAV.map(group => (
            <NavGroup key={group.group} {...group} collapsed={!sidebarOpen} />
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-white/5 p-3">
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-brand-400 uppercase">{user?.username?.[0] ?? '?'}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-white truncate">{user?.fullName || user?.username}</p>
                <p className="text-xs text-slate-500 truncate capitalize">{user?.role}</p>
              </div>
              <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors" title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button onClick={handleLogout}
              className="w-full flex justify-center text-slate-500 hover:text-red-400 transition-colors py-1" title="Logout">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
