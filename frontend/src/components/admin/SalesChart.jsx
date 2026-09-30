import React, { useContext, useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Loader, TrendingUp, ShoppingBag, Calendar } from 'lucide-react';
import { Store } from '../../context/Store';
import { getError } from '../../utils/helpers';
import { toast } from 'react-toastify';

export default function SalesChart() {
  const { state } = useContext(Store);
  const { userInfo } = state;

  const [days, setDays] = useState(30);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoverIndex, setHoverIndex] = useState(null);

  const fetchChartData = async (duration) => {
    try {
      setLoading(true);
      const token = userInfo?.token || localStorage.getItem('accessToken');
      const { data } = await axios.get(`/api/admin/sales-chart/?days=${duration}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChartData(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userInfo) {
      fetchChartData(days);
    }
  }, [days, userInfo]);

  const chartHeight = 220;

  const { maxSales, maxOrders, totals, points } = useMemo(() => {
    if (!chartData.length) {
      return { maxSales: 1, maxOrders: 1, totals: { sales: 0, orders: 0 }, points: [] };
    }

    const maxS = Math.max(...chartData.map((d) => Number(d.sales) || 0), 100);
    const maxO = Math.max(...chartData.map((d) => Number(d.orders) || 0), 10);
    const totalS = chartData.reduce((acc, curr) => acc + (Number(curr.sales) || 0), 0);
    const totalO = chartData.reduce((acc, curr) => acc + (Number(curr.orders) || 0), 0);

    const pts = chartData.map((d, i) => {
      const xPct = chartData.length > 1 ? (i / (chartData.length - 1)) * 100 : 50;
      const salesY = chartHeight - ((Number(d.sales) || 0) / maxS) * (chartHeight - 30);
      const ordersY = chartHeight - ((Number(d.orders) || 0) / maxO) * (chartHeight - 30);
      return { ...d, xPct, salesY, ordersY, index: i };
    });

    return { maxSales: maxS, maxOrders: maxO, totals: { sales: totalS, orders: totalO }, points: pts };
  }, [chartData]);

  const salesLineD = useMemo(() => {
    if (!points.length) return '';
    return points.reduce((acc, p, i) => {
      const x = (p.xPct / 100) * 700;
      return `${acc} ${i === 0 ? 'M' : 'L'} ${x} ${p.salesY}`;
    }, '');
  }, [points]);

  const salesAreaD = useMemo(() => {
    if (!points.length) return '';
    const lastX = (points[points.length - 1].xPct / 100) * 700;
    return `${salesLineD} L ${lastX} ${chartHeight} L 0 ${chartHeight} Z`;
  }, [salesLineD, points]);

  const ordersLineD = useMemo(() => {
    if (!points.length) return '';
    return points.reduce((acc, p, i) => {
      const x = (p.xPct / 100) * 700;
      return `${acc} ${i === 0 ? 'M' : 'L'} ${x} ${p.ordersY}`;
    }, '');
  }, [points]);

  const ordersAreaD = useMemo(() => {
    if (!points.length) return '';
    const lastX = (points[points.length - 1].xPct / 100) * 700;
    return `${ordersLineD} L ${lastX} ${chartHeight} L 0 ${chartHeight} Z`;
  }, [ordersLineD, points]);

  const activePoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
            <TrendingUp size={20} className="text-brand-600" />
            <span>Sales & Orders Timeline</span>
          </h3>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Offline-compatible analytics tracking transaction volume and revenue over time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer shadow-sm"
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-brand-50/70 border border-brand-150 p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700 block">Total Revenue</span>
            <span className="text-base sm:text-lg font-black text-brand-900">
              Br {totals.sales.toLocaleString()}
            </span>
          </div>
          <div className="h-9 w-9 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            Br
          </div>
        </div>

        <div className="bg-amber-50/70 border border-amber-150 p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block">Total Orders</span>
            <span className="text-base sm:text-lg font-black text-amber-900">
              {totals.orders.toLocaleString()}
            </span>
          </div>
          <div className="h-9 w-9 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-sm">
            <ShoppingBag size={18} />
          </div>
        </div>
      </div>

      {/* Offline-Native SVG Chart */}
      {loading ? (
        <div className="h-[280px] flex items-center justify-center">
          <Loader className="animate-spin text-brand-600" size={32} />
        </div>
      ) : points.length === 0 ? (
        <div className="h-[280px] flex items-center justify-center text-slate-400 italic text-xs">
          No transactions recorded for this period.
        </div>
      ) : (
        <div className="relative w-full pt-2">
          <div className="w-full overflow-x-auto overflow-y-hidden">
            <svg
              viewBox={`0 0 700 ${chartHeight + 35}`}
              className="w-full min-w-[500px] h-[280px] overflow-visible"
              onMouseLeave={() => setHoverIndex(null)}
            >
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.30" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Gridlines */}
              {[0, 0.33, 0.66, 1].map((ratio, idx) => {
                const y = chartHeight - ratio * (chartHeight - 30);
                const val = Math.round(ratio * maxSales);
                return (
                  <g key={idx}>
                    <line x1="0" y1={y} x2="700" y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                    <text x="0" y={y - 4} fill="#94a3b8" fontSize="9" fontWeight="600">
                      Br {val.toLocaleString()}
                    </text>
                  </g>
                );
              })}

              {/* Area & Line paths */}
              <path d={salesAreaD} fill="url(#salesGrad)" />
              <path d={salesLineD} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

              <path d={ordersAreaD} fill="url(#ordersGrad)" />
              <path d={ordersLineD} fill="none" stroke="#d97706" strokeWidth="2" strokeDasharray="3 3" strokeLinecap="round" strokeLinejoin="round" />

              {/* Data points & Interactive Hover Targets */}
              {points.map((p, idx) => {
                const cx = (p.xPct / 100) * 700;
                const isHovered = hoverIndex === idx;

                return (
                  <g key={idx} className="cursor-pointer">
                    <rect
                      x={cx - (700 / points.length) / 2}
                      y="0"
                      width={700 / points.length}
                      height={chartHeight + 35}
                      fill="transparent"
                      onMouseEnter={() => setHoverIndex(idx)}
                    />

                    {isHovered && (
                      <line x1={cx} y1="0" x2={cx} y2={chartHeight} stroke="#64748b" strokeWidth="1" strokeDasharray="2 2" />
                    )}

                    <circle
                      cx={cx}
                      cy={p.salesY}
                      r={isHovered ? '5' : '3'}
                      fill="#2563eb"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />

                    <circle
                      cx={cx}
                      cy={p.ordersY}
                      r={isHovered ? '4.5' : '2.5'}
                      fill="#d97706"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />

                    {(points.length <= 10 || idx % Math.ceil(points.length / 7) === 0 || idx === points.length - 1) && (
                      <text
                        x={cx}
                        y={chartHeight + 20}
                        textAnchor="middle"
                        fill="#64748b"
                        fontSize="9"
                        fontWeight="600"
                      >
                        {p.date ? p.date.substring(5) : ''}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Floating Hover Tooltip */}
          {activePoint && (
            <div
              className="absolute pointer-events-none bg-slate-900 text-white p-3 rounded-xl shadow-xl z-20 text-xs border border-slate-700 animate-fade-in"
              style={{
                left: `${Math.min(Math.max(activePoint.xPct, 12), 88)}%`,
                top: '10px',
                transform: 'translateX(-50%)',
              }}
            >
              <div className="font-extrabold text-slate-300 pb-1 border-b border-slate-800 flex items-center gap-1.5">
                <Calendar size={12} className="text-brand-400" />
                <span>{activePoint.date}</span>
              </div>
              <div className="mt-1.5 space-y-1">
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
                    Sales:
                  </span>
                  <span className="font-black text-brand-400">Br {Number(activePoint.sales || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />
                    Orders:
                  </span>
                  <span className="font-black text-amber-400">{activePoint.orders || 0} Orders</span>
                </div>
              </div>
            </div>
          )}

          {/* Chart Legend */}
          <div className="flex items-center justify-center gap-6 pt-2">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-blue-600 inline-block shadow-sm" />
              <span className="text-xs font-bold text-slate-700">Sales Volume (Br)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-amber-500 inline-block shadow-sm" />
              <span className="text-xs font-bold text-slate-700">Order Count</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
