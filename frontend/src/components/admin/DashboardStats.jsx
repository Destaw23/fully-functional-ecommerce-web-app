import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { Loader, Users, ShoppingCart, DollarSign, Package, AlertTriangle, Calendar, TrendingUp } from 'lucide-react';
import { Store } from '../../context/Store';
import { getError } from '../../utils/helpers';
import MessageBox from '../common/MessageBox';

export default function DashboardStats() {
  const { state } = useContext(Store);
  const { userInfo } = state;

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const token = userInfo?.token || localStorage.getItem('accessToken');
        const { data } = await axios.get('/api/admin/stats/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(data);
      } catch (err) {
        setError(getError(err));
      } finally {
        setLoading(false);
      }
    };

    if (userInfo) {
      fetchStats();
    }
  }, [userInfo]);

  if (loading) {
    return (
      <div className="h-40 flex items-center justify-center bg-white border border-slate-200 rounded-2xl shadow-sm">
        <Loader className="animate-spin text-brand-600" size={28} />
      </div>
    );
  }

  if (error) {
    return <MessageBox variant="danger">{error}</MessageBox>;
  }

  const { overview, weekly, monthly, products, users } = stats || {};

  return (
    <div className="space-y-6">
      {/* Main Metric Cards - 2 per row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-7">
        {/* Total Sales */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow min-w-0">
          <div className="space-y-2 min-w-0 flex-1 pr-4">
            <span className="text-sm sm:text-base font-black text-slate-600 uppercase tracking-wide block">Total Sales</span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight break-words">
              Br{overview?.total_revenue ? Number(overview.total_revenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </h3>
          </div>
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0">
            <TrendingUp size={28} />
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow min-w-0">
          <div className="space-y-2 min-w-0 flex-1 pr-4">
            <span className="text-sm sm:text-base font-black text-slate-600 uppercase tracking-wide block">Total Orders</span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">{overview?.total_orders || 0}</h3>
          </div>
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
            <ShoppingCart size={28} />
          </div>
        </div>

        {/* Total Users */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow min-w-0">
          <div className="space-y-2 min-w-0 flex-1 pr-4">
            <span className="text-sm sm:text-base font-black text-slate-600 uppercase tracking-wide block">Total Users</span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">{users?.total || 0}</h3>
          </div>
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0">
            <Users size={28} />
          </div>
        </div>

        {/* Products Count */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow min-w-0">
          <div className="space-y-2 min-w-0 flex-1 pr-4">
            <span className="text-sm sm:text-base font-black text-slate-600 uppercase tracking-wide block">Products Count</span>
            <div className="flex items-baseline flex-wrap gap-2.5">
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900">{products?.total || 0}</h3>
              {products?.low_stock > 0 && (
                <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200/60 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                  <AlertTriangle size={12} />
                  {products.low_stock} low
                </span>
              )}
            </div>
          </div>
          <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl shrink-0">
            <Package size={28} />
          </div>
        </div>
      </div>

      {/* Performance Timelines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 min-w-0 overflow-hidden">
          <div className="flex items-center gap-2 text-brand-600">
            <Calendar size={18} />
            <h4 className="text-sm font-black uppercase tracking-wide text-slate-700">Weekly Performance</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-lg sm:text-xl font-black text-slate-800">{weekly?.orders || 0}</p>
              <p className="text-xs text-slate-500 font-medium">Orders placed</p>
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-black text-slate-850 tracking-tight">
                Br{weekly?.revenue ? Number(weekly.revenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
              </p>
              <p className="text-xs text-slate-500 font-medium">Weekly revenue</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 min-w-0 overflow-hidden">
          <div className="flex items-center gap-2 text-brand-600">
            <TrendingUp size={18} />
            <h4 className="text-sm font-black uppercase tracking-wide text-slate-700">Monthly Performance</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-lg sm:text-xl font-black text-slate-800">{monthly?.orders || 0}</p>
              <p className="text-xs text-slate-500 font-medium">Orders placed</p>
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-black text-slate-850 tracking-tight">
                Br{monthly?.revenue ? Number(monthly.revenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
              </p>
              <p className="text-xs text-slate-500 font-medium">Monthly revenue</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
