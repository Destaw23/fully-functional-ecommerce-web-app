import React, { useContext, useEffect, useState } from 'react';
import Chart from 'react-google-charts';
import axios from 'axios';
import { Loader } from 'lucide-react';
import { Store } from '../../context/Store';
import { getError } from '../../utils/helpers';
import { toast } from 'react-toastify';

export default function SalesChart() {
  const { state } = useContext(Store);
  const { userInfo } = state;

  const [days, setDays] = useState(30);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchChartData = async (duration) => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/admin/sales-chart/?days=${duration}`, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      setChartData(data);
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

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-slate-800 tracking-tight">Sales & Orders Timeline</h3>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="border border-slate-200 rounded-lg py-1.5 px-3 text-xs font-bold bg-white text-slate-700 outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
        >
          <option value={7}>Last 7 Days</option>
          <option value={30}>Last 30 Days</option>
          <option value={90}>Last 90 Days</option>
        </select>
      </div>

      {loading ? (
        <div className="h-[300px] flex items-center justify-center">
          <Loader className="animate-spin text-brand-600" size={32} />
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-[300px] flex items-center justify-center text-slate-400 italic text-xs">
          No transactions recorded for this period.
        </div>
      ) : (
        <Chart
          width="100%"
          height="300px"
          chartType="AreaChart"
          loader={<div className="text-xs text-slate-400 font-semibold p-4">Loading Chart...</div>}
          data={[
            ['Date', 'Sales (Br)', 'Orders'],
            ...chartData.map((x) => [x.date, x.sales, x.orders]),
          ]}
          options={{
            colors: ['#3b82f6', '#f59e0b'],
            backgroundColor: 'transparent',
            chartArea: { width: '85%', height: '75%' },
            vAxis: { gridlines: { color: '#f1f5f9' }, textStyle: { color: '#64748b', fontSize: 10 } },
            hAxis: { gridlines: { color: 'transparent' }, textStyle: { color: '#64748b', fontSize: 10 } },
            legend: { position: 'bottom', textStyle: { color: '#475569', fontSize: 12 } },
          }}
        />
      )}
    </div>
  );
}
