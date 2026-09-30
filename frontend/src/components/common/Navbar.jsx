import React from 'react';
import { Link } from 'react-router-dom';
import {
  Menu,
  ShoppingCart,
  Heart,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  History,
  Settings,
  Users,
  Box,
  ClipboardList,
  Truck,
  User,
  Map,
  Store as StoreIcon,
} from 'lucide-react';
import SearchBox from './SearchBox';
import { isUserAdmin } from '../../utils/auth';

const getMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return null;

  const normalized = url.trim();
  if (!normalized) return null;
  if (/^https?:\/\//i.test(normalized) || normalized.startsWith('//') || /^data:/i.test(normalized)) {
    return normalized;
  }

  const mediaHost = import.meta.env.VITE_MEDIA_HOST || '';
  return `${mediaHost}${normalized.startsWith('/') ? '' : '/'}${normalized}`;
};

const dropdownClass =
  'absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200/80 bg-white py-1.5 z-50 shadow-card animate-fade-in';

const dropdownItemClass =
  'flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-300';

export default function Navbar({
  sidebarIsOpen,
  setSidebarIsOpen,
  userInfo,
  totalCartItems,
  userDropdownOpen,
  adminDropdownOpen,
  toggleUserDropdown,
  toggleAdminDropdown,
  signoutHandler,
}) {
  return (
    <header className="nav-glass">
      <div className="page-container">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-[401px]:gap-3 shrink-0">
            <button
              onClick={() => setSidebarIsOpen(!sidebarIsOpen)}
              className="rounded-xl border border-slate-200/80 bg-white p-2 text-slate-600 shadow-soft transition-all hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 shrink-0"
              aria-label="Toggle categories menu"
            >
              <Menu size={20} strokeWidth={2} />
            </button>

            <Link
              to="/"
              className="text-lg min-[401px]:text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 transition-colors hover:text-brand-600 shrink-0"
            >
              <span className="hidden min-[401px]:inline">Electro<span className="text-brand-600">Merce</span></span>
              <span className="min-[401px]:hidden">E<span className="text-brand-600">M</span></span>
            </Link>
          </div>

          <div className="hidden md:flex flex-1 max-w-lg mx-4">
            <SearchBox />
          </div>

          <div className="flex items-center gap-1.5 min-[401px]:gap-2 sm:gap-3 shrink-0">
            <Link
              to="/stores"
              className="flex items-center gap-1.5 rounded-xl px-2 py-1.5 min-[401px]:px-3 min-[401px]:py-2 text-slate-700 font-medium transition-all hover:bg-slate-100 hover:text-brand-600"
              title="Stores"
            >
              <StoreIcon size={19} strokeWidth={2} className="text-brand-600 shrink-0" />
              <span className="text-sm font-semibold hidden min-[401px]:inline">Stores</span>
            </Link>

            <Link
              to="/cart"
              className="relative flex items-center gap-1.5 rounded-xl px-2 py-1.5 min-[401px]:px-3 min-[401px]:py-2 text-slate-600 transition-all hover:bg-slate-100 hover:text-brand-600"
              aria-label="Shopping cart"
              title="Cart"
            >
              <ShoppingCart size={20} strokeWidth={2} className="shrink-0" />
              <span className="text-sm font-medium hidden min-[401px]:inline">Cart</span>
              {totalCartItems > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 min-[401px]:h-5 min-[401px]:min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] min-[401px]:text-[10px] font-bold text-white ring-2 ring-white">
                  {totalCartItems}
                </span>
              )}
            </Link>

            {userInfo ? (
              <div className="relative">
                <button
                  onClick={toggleUserDropdown}
                  className="flex items-center gap-1 rounded-full bg-slate-50 p-1.5 min-[401px]:p-2 text-slate-700 transition-all hover:bg-slate-100"
                  aria-label="Open user menu"
                >
                  {userInfo.profile_picture ? (
                    <img
                      src={getMediaUrl(userInfo.profile_picture)}
                      alt="Profile"
                      className="h-7 w-7 min-[401px]:h-8 min-[401px]:w-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-7 w-7 min-[401px]:h-8 min-[401px]:w-8 items-center justify-center rounded-full bg-slate-100">
                      <User size={16} className="text-slate-500" />
                    </span>
                  )}
                  <ChevronDown
                    size={14}
                    className={`text-slate-400 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {userDropdownOpen && (
                  <div className={dropdownClass}>
                    <Link to="/profile" onClick={toggleUserDropdown} className={dropdownItemClass}>
                      <Settings size={16} className="text-slate-400" />
                      <span>Profile</span>
                    </Link>

                    <Link to="/vendor/dashboard" onClick={toggleUserDropdown} className={dropdownItemClass}>
                      <StoreIcon size={16} className="text-brand-600" />
                      <span>Vendor Portal</span>
                    </Link>

                    <Link to="/wishlist" onClick={toggleUserDropdown} className={dropdownItemClass}>
                      <Heart size={16} className="text-slate-400" />
                      <span>Wishlist</span>
                    </Link>
                    <Link to="/map" onClick={toggleUserDropdown} className={dropdownItemClass}>
                      <Map size={16} className="text-slate-400" />
                      <span>Live Map</span>
                    </Link>
                    {userInfo?.role === 'delivery' && (
                      <Link to="/delivery" onClick={toggleUserDropdown} className={dropdownItemClass}>
                        <Truck size={16} className="text-slate-400" />
                        <span>Delivery Dashboard</span>
                      </Link>
                    )}
                    <Link to="/orderhistory" onClick={toggleUserDropdown} className={dropdownItemClass}>
                      <History size={16} className="text-slate-400" />
                      <span>Order History</span>
                    </Link>
                    <button
                      onClick={() => {
                        toggleUserDropdown();
                        signoutHandler();
                      }}
                      className={`${dropdownItemClass} w-full border-t border-slate-100 text-red-600 hover:bg-orange-100 hover:text-red-700`}
                    >
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/signin"
                className="btn-primary !py-1.5 !px-2.5 max-[400px]:text-xs max-[400px]:!py-1 max-[400px]:!px-2 min-[401px]:!py-2 min-[401px]:!px-4 text-xs min-[401px]:text-sm shrink-0 shadow-sm"
              >
                Sign In
              </Link>
            )}

            {userInfo && isUserAdmin(userInfo) && (
              <div className="relative">
                <button
                  onClick={toggleAdminDropdown}
                  className="flex items-center gap-1.5 rounded-xl border border-brand-200/80 bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-800 transition-all hover:bg-brand-100"
                >
                  <span>Admin</span>
                  <ChevronDown
                    size={16}
                    className={`text-brand-500 transition-transform ${adminDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {adminDropdownOpen && (
                  <div className={dropdownClass}>
                    <Link
                      to="/admin/dashboard"
                      onClick={toggleAdminDropdown}
                      className={dropdownItemClass}
                    >
                      <LayoutDashboard size={16} className="text-slate-400" />
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      to="/admin/products"
                      onClick={toggleAdminDropdown}
                      className={dropdownItemClass}
                    >
                      <Box size={16} className="text-slate-400" />
                      <span>Products</span>
                    </Link>
                    <Link
                      to="/admin/orders"
                      onClick={toggleAdminDropdown}
                      className={dropdownItemClass}
                    >
                      <ClipboardList size={16} className="text-slate-400" />
                      <span>Orders</span>
                    </Link>
                    <Link
                      to="/admin/users"
                      onClick={toggleAdminDropdown}
                      className={dropdownItemClass}
                    >
                      <Users size={16} className="text-slate-400" />
                      <span>Users</span>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
