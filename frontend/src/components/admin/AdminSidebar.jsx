import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Box,
  Tags,
  ClipboardList,
  Users,
  LogOut,
  ExternalLink,
  X,
} from 'lucide-react';

export default function AdminSidebar({ mobileSidebarOpen, setMobileSidebarOpen, signoutHandler }) {
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Products', path: '/admin/products', icon: Box },
    { name: 'Categories', path: '/admin/categories', icon: Tags },
    { name: 'Orders', path: '/admin/orders', icon: ClipboardList },
    { name: 'Users', path: '/admin/users', icon: Users },
  ];

  const navLinkClass = (path) => {
    const isActive = location.pathname === path || (path !== '/admin/dashboard' && location.pathname.startsWith(path));
    return `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-200 ${
      isActive
        ? 'bg-brand-600 text-white shadow-md'
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`;
  };

  return (
    <aside
      className={`fixed md:sticky top-0 bottom-0 left-0 z-50 flex w-64 flex-col bg-slate-900 text-white shadow-xl transition-transform duration-300 ease-out md:translate-x-0 ${
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:transform-none'
      }`}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
        <Link to="/admin/dashboard" className="text-xl font-extrabold tracking-tight">
          Electro<span className="text-brand-400">Merce</span>
          <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-0.5">Control Panel</span>
        </Link>
        <button
          onClick={() => setMobileSidebarOpen(false)}
          className="md:hidden p-1 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1.5 px-4 py-6">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            onClick={() => setMobileSidebarOpen(false)}
            className={navLinkClass(item.path)}
          >
            <item.icon size={18} />
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>

      {/* Sidebar Footer Operations */}
      <div className="border-t border-slate-800 p-4 space-y-2">
        <Link
          to="/"
          className="flex items-center justify-between rounded-xl px-4 py-2.5 text-xs font-bold text-slate-400 hover:bg-slate-850 hover:text-white transition-colors"
        >
          <span className="flex items-center gap-2">
            <ExternalLink size={14} />
            <span>Go to Storefront</span>
          </span>
        </Link>

        <button
          onClick={signoutHandler}
          className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-colors"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
