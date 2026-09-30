import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { Loader, Download, FileSpreadsheet, BarChart2 } from 'lucide-react';
import { Store } from '../../context/Store';
import { getError } from '../../utils/helpers';
import { toast } from 'react-toastify';

export default function Reports() {
  const { state } = useContext(Store);
  const { userInfo, accessToken } = state;
  const authToken = accessToken || localStorage.getItem('accessToken') || userInfo?.token;

  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [reportType, setReportType] = useState('sales');

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
      const response = await axios.get(`/api/admin/report/export/?type=${reportType}`, {
        headers: { Authorization: `Bearer ${authToken}` },
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `admin_${reportType}_report.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Exported ${reportType.toUpperCase()} CSV report successfully.`);
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-sm space-y-6 min-w-0">
      {/* Report Generator Header & Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="space-y-1 min-w-0 flex-1">
          <h3 className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="text-brand-600 shrink-0" size={20} />
            <span className="truncate">System Analytics & Report Generator</span>
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
            Select a domain dataset and generate downloadable CSV reports for business analysis.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto shrink-0">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full sm:w-auto border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold bg-white text-slate-800 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition"
          >
            <option value="sales">Sales & Revenue Report</option>
            <option value="orders">Orders & Transactions Report</option>
            <option value="delivery">Delivery Logistics Report</option>
            <option value="products">Product Stock Inventory</option>
            <option value="users">User Accounts Directory</option>
          </select>

          <button
            type="button"
            onClick={exportReport}
            disabled={exporting}
            className="w-full sm:w-auto rounded-xl bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 shrink-0"
          >
            <Download size={14} />
            <span>{exporting ? 'Generating...' : 'Export CSV Report'}</span>
          </button>
        </div>
      </div>

      {/* Top Performing Products Section */}
      <div className="pt-1">
        <h4 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-3">
          <BarChart2 size={16} className="text-indigo-600 shrink-0" />
          <span>Top Performing Catalog Products</span>
        </h4>

        {loading ? (
          <div className="h-36 flex items-center justify-center">
            <Loader className="animate-spin text-brand-600" size={24} />
          </div>
        ) : topProducts.length === 0 ? (
          <div className="text-xs text-slate-400 italic py-6 text-center">No sales records found.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {topProducts.map((product, index) => (
              <div
                key={product.id}
                className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 px-3 rounded-xl transition-colors min-w-0"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] font-bold text-slate-400 bg-slate-100 border border-slate-200 h-5.5 w-5.5 rounded-lg flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate" title={product.name}>
                      {product.name}
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium pl-8 mt-0.5">{product.total_sold} units sold</p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs sm:text-sm font-bold text-slate-900">
                    Br{Number(product.revenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Gross Revenue</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


