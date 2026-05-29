import React, { useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { X, LayoutGrid } from 'lucide-react';
import { Store } from '../../context/Store';
import useCategories from '../../hooks/useCategories';
import { slugify } from '../../utils/helpers';
import Navbar from './Navbar';
import SearchBox from './SearchBox';

export default function Header() {
  const { state, dispatch: ctxDispatch } = useContext(Store);
  const { cart, userInfo } = state;
  const { search } = useLocation();
  const rawCategory = new URLSearchParams(search).get('category') || 'all';
  const activeCategory =
    rawCategory === 'all' ? 'all' : slugify(decodeURIComponent(rawCategory));

  const [sidebarIsOpen, setSidebarIsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const { categories, loading: categoriesLoading } = useCategories();

  const signoutHandler = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await axios.post('/api/auth/logout/', { refresh: refreshToken });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      ctxDispatch({ type: 'USER_SIGNOUT' });
      localStorage.removeItem('userInfo');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('shippingAddress');
      localStorage.removeItem('paymentMethod');
      window.location.href = '/signin';
    }
  };

  const totalCartItems = cart.cartItems.reduce((a, c) => a + c.quantity, 0);

  const toggleUserDropdown = () => {
    setUserDropdownOpen((prev) => !prev);
    setAdminDropdownOpen(false);
  };

  const toggleAdminDropdown = () => {
    setAdminDropdownOpen((prev) => !prev);
    setUserDropdownOpen(false);
  };

  const categoryLinkClass = (categorySlug, isAll = false) => {
    const isActive = isAll ? activeCategory === 'all' : activeCategory === categorySlug;
    return `flex items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-brand-600/20 text-white ring-1 ring-brand-500/40'
        : 'text-slate-300 hover:bg-white/10 hover:text-white'
    }`;
  };

  return (
    <>
      {sidebarIsOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-80 max-w-[85vw] flex-col bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100 shadow-2xl transition-transform duration-300 ease-out ${
          sidebarIsOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-5">
            <span className="text-xl font-extrabold tracking-tight text-white">
              Electro<span className="text-brand-400">Merce</span>
            </span>
            <button
              onClick={() => setSidebarIsOpen(false)}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 pl-1 text-xs font-semibold uppercase tracking-wider text-white">
              <LayoutGrid size={14} />
              <span>Shop by category</span>
            </div>
            <nav className="flex flex-col gap-1">
              <Link
                to="/search?category=all&query=all&price=all&rating=all&order=newest"
                onClick={() => setSidebarIsOpen(false)}
                className={categoryLinkClass(null, true)}
              >
                <span>All Products</span>
              </Link>
              {categoriesLoading ? (
                <div className="space-y-2 px-2 py-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-9 animate-pulse rounded-xl bg-white/10" />
                  ))}
                </div>
              ) : categories.length === 0 ? (
                <p className="px-3 py-2 text-sm text-slate-500">No categories yet</p>
              ) : (
                categories.map((category) => (
                  <Link
                    key={category.slug}
                    to={{
                      pathname: '/search',
                      search: `?category=${encodeURIComponent(category.slug)}&query=all&price=all&rating=all&order=newest`,
                    }}
                    onClick={() => setSidebarIsOpen(false)}
                    className={categoryLinkClass(category.slug)}
                  >
                    <span>{category.name}</span>
                    <span className="text-brand-400 opacity-0 transition-opacity group-hover:opacity-100">
                      →
                    </span>
                  </Link>
                ))
              )}
            </nav>
          </div>
        </div>

        <div className="border-t border-white/10 p-5 text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} ElectroMerce
        </div>
      </aside>

      <Navbar
        sidebarIsOpen={sidebarIsOpen}
        setSidebarIsOpen={setSidebarIsOpen}
        userInfo={userInfo}
        totalCartItems={totalCartItems}
        userDropdownOpen={userDropdownOpen}
        adminDropdownOpen={adminDropdownOpen}
        toggleUserDropdown={toggleUserDropdown}
        toggleAdminDropdown={toggleAdminDropdown}
        signoutHandler={signoutHandler}
      />

      <div className="border-b border-slate-200/70 bg-white/60 px-4 py-3 backdrop-blur-sm md:hidden">
        <SearchBox />
      </div>
    </>
  );
}
