import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, ExternalLink, User } from 'lucide-react';

export default function AdminHeader({ setMobileSidebarOpen, userInfo }) {
  const location = useLocation();

  const getPageTitle = () => {
    const segments = location.pathname.split('/').filter(Boolean);
    if (segments.length <= 1) return 'Control Panel';
    const sub = segments[1].toLowerCase();
    switch (sub) {
      case 'dashboard':
        return 'Overview Dashboard';
      case 'products':
        return 'Products Catalog';
      case 'product':
        return segments[2] === 'new' ? 'Add New Product' : 'Modify Product Details';
      case 'categories':
        return 'Categories Management';
      case 'orders':
        return 'Orders Log Registry';
      case 'users':
        return 'User Accounts Directory';
      default:
        return 'Admin Console';
    }
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="flex md:hidden items-center justify-between bg-slate-900 text-white px-4 py-3 shadow-md w-full">
        <span className="font-extrabold tracking-tight">
          Electro<span className="text-brand-400">Merce</span> Admin
        </span>
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Desktop Header */}
      <header className="hidden md:flex h-16 items-center justify-between border-b border-slate-200/80 bg-white px-8 shadow-sm w-full shrink-0">
        <h2 className="text-lg font-extrabold text-slate-800 tracking-tight whitespace-nowrap">
          {getPageTitle()}
        </h2>

        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900"
          >
            <ExternalLink size={11} />
            <span>View Store</span>
          </Link>

          <div className="h-4 w-px bg-slate-200" />

          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 border border-slate-200">
              <User size={16} className="text-slate-600" />
            </span>
            <div className="flex flex-col text-left">
              <span className="text-xs font-black text-slate-800 leading-tight">Admin Console</span>
              <span className="text-[10px] font-bold text-slate-400 leading-none truncate max-w-[150px]">
                {userInfo?.email || 'Administrator'}
              </span>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
