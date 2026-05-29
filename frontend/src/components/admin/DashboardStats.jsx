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
        const { data } = await axios.get('/api/admin/stats/', {
          headers: { Authorization: `Bearer ${userInfo.token}` },
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
      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-white border border-slate-200/85 rounded-2xl p-6 shadow-sm flex items-center justify-between hover:shadow transition-shadow">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Sales</span>
            <h3 className="text-2xl font-black text-slate-800">
              Br{overview?.total_revenue ? Number(overview.total_revenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            {/*<DollarSign size={22} />*/}
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white border border-slate-200/85 rounded-2xl p-6 shadow-sm flex items-center justify-between hover:shadow transition-shadow">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Orders</span>
            <h3 className="text-2xl font-black text-slate-800">{overview?.total_orders || 0}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <ShoppingCart size={22} />
          </div>
        </div>

        {/* Total Users */}
        <div className="bg-white border border-slate-200/85 rounded-2xl p-6 shadow-sm flex items-center justify-between hover:shadow transition-shadow">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Users</span>
            <h3 className="text-2xl font-black text-slate-800">{users?.total || 0}</h3>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users size={22} />
          </div>
        </div>

        {/* Products Count */}
        <div className="bg-white border border-slate-200/85 rounded-2xl p-6 shadow-sm flex items-center justify-between hover:shadow transition-shadow">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Products Count</span>
            <h3 className="text-2xl font-black text-slate-800">
              {products?.total || 0}
              {products?.low_stock > 0 && (
                <span className="ml-2 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                  <AlertTriangle size={12} />
                  {products.low_stock} low
                </span>
              )}
            </h3>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Package size={22} />
          </div>
        </div>
      </div>

      {/* Performance Timelines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-brand-600">
            <Calendar size={16} />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Weekly Performance</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-black text-slate-800">{weekly?.orders || 0}</p>
              <p className="text-xs text-slate-500 font-medium">Orders placed</p>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-850">Br{weekly?.revenue ? Number(weekly.revenue).toFixed(2) : '0.00'}</p>
              <p className="text-xs text-slate-500 font-medium">Weekly revenue</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-brand-600">
            <TrendingUp size={16} />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Monthly Performance</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-black text-slate-800">{monthly?.orders || 0}</p>
              <p className="text-xs text-slate-500 font-medium">Orders placed</p>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-850">Br{monthly?.revenue ? Number(monthly.revenue).toFixed(2) : '0.00'}</p>
              <p className="text-xs text-slate-500 font-medium">Monthly revenue</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
