import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { Loader } from 'lucide-react';
import { Store } from '../../context/Store';
import { getError } from '../../utils/helpers';

export default function Reports() {
  const { state } = useContext(Store);
  const { userInfo, accessToken } = state;
  const authToken = accessToken || localStorage.getItem('accessToken') || userInfo?.token;

  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get('/api/admin/stats/', {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        setTopProducts(data.top_products || []);
      } catch (err) {
        console.error(getError(err));
      } finally {
        setLoading(false);
      }
    };

    if (userInfo) {
      fetchTopProducts();
    }
  }, [authToken, userInfo]);

  const exportReport = async () => {
    if (!authToken) return;

    try {
      setExporting(true);
      const response = await axios.get('/api/admin/report/export/', {
        headers: { Authorization: `Bearer ${authToken}` },
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'admin_report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(getError(err));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-slate-800 tracking-tight">Top Performing Products</h3>
          <p className="text-xs text-slate-400">Generate a CSV report for sales and product performance.</p>
        </div>
        <button
          type="button"
          onClick={exportReport}
          disabled={exporting}
          className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-bold text-brand-700 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {exporting ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {loading ? (
        <div className="h-40 flex items-center justify-center">
          <Loader className="animate-spin text-brand-600" size={24} />
        </div>
      ) : topProducts.length === 0 ? (
        <div className="text-xs text-slate-400 italic py-6 text-center">No sales records found.</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {topProducts.map((product, index) => (
            <div key={product.id} className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/50 px-2 rounded-lg transition-colors">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 border border-slate-150 h-6 w-6 rounded flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <p className="text-sm font-semibold text-slate-800 truncate" title={product.name}>
                    {product.name}
                  </p>
                </div>
                <p className="text-xs text-slate-400 font-medium pl-9 mt-0.5">
                  {product.total_sold} units sold
                </p>
              </div>

              <div className="text-right shrink-0">
                <p className="text-sm font-black text-slate-900">Br{Number(product.revenue).toFixed(2)}</p>
                <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Gross Revenue</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
