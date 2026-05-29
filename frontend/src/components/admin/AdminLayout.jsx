import React, { useContext, useState } from 'react';
import axios from 'axios';
import { Store } from '../../context/Store';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

export default function AdminLayout({ children }) {
  const { state, dispatch: ctxDispatch } = useContext(Store);
  const { userInfo } = state;
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row relative">
      {/* Backdrop overlay for mobile sidebars */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <AdminSidebar
        mobileSidebarOpen={mobileSidebarOpen}
        setMobileSidebarOpen={setMobileSidebarOpen}
        signoutHandler={signoutHandler}
      />

      {/* Main viewport panels */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          setMobileSidebarOpen={setMobileSidebarOpen}
          userInfo={userInfo}
        />

        {/* Content viewport area */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
