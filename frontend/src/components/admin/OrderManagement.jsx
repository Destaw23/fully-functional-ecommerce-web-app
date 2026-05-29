import axios from 'axios';
import { useContext, useEffect, useReducer, useState } from 'react';
import { toast } from 'react-toastify';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import LoadingBox from '../common/LoadingBox';
import MessageBox from '../common/MessageBox';
import { Store } from '../../context/Store';
import { getError } from '../../utils/helpers';
import { Eye, Trash2, CheckCircle2, Truck, RefreshCw, Search } from 'lucide-react';

const reducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_REQUEST':
      return { ...state, loading: true, error: '' };
    case 'FETCH_SUCCESS':
      return { ...state, orders: action.payload, loading: false };
    case 'FETCH_FAIL':
      return { ...state, loading: false, error: action.payload };
    case 'ACTION_REQUEST':
      return { ...state, loadingAction: true };
    case 'ACTION_SUCCESS':
      return { ...state, loadingAction: false };
    case 'ACTION_FAIL':
      return { ...state, loadingAction: false };
    default:
      return state;
  }
};

export default function OrderManagement() {
  const navigate = useNavigate();
  const { state } = useContext(Store);
  const { userInfo } = state;

  const [{ loading, error, orders, loadingAction }, dispatch] = useReducer(reducer, {
    loading: true,
    error: '',
    orders: [],
  });

  const [searchTerm, setSearchTerm] = useState('');

  const fetchOrders = async () => {
    try {
      dispatch({ type: 'FETCH_REQUEST' });
      const { data } = await axios.get(`/api/orders`, {
        headers: { Authorization: `Bearer ${userInfo?.token || localStorage.getItem('accessToken')}` },
      });
      dispatch({ type: 'FETCH_SUCCESS', payload: data });
    } catch (err) {
      dispatch({ type: 'FETCH_FAIL', payload: getError(err) });
    }
  };

  useEffect(() => {
    if (userInfo) {
      fetchOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo]);

  const deleteHandler = async (order) => {
    const orderId = order.id || order._id;
    if (window.confirm(`Are you sure you want to delete order #${order.order_number || orderId}?`)) {
      try {
        dispatch({ type: 'ACTION_REQUEST' });
        await axios.delete(`/api/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        toast.success('Order deleted successfully');
        dispatch({ type: 'ACTION_SUCCESS' });
        fetchOrders();
      } catch (err) {
        toast.error(getError(err));
        dispatch({ type: 'ACTION_FAIL' });
      }
    }
  };

  const deliverHandler = async (orderId) => {
    try {
      dispatch({ type: 'ACTION_REQUEST' });
      await axios.put(`/api/orders/${orderId}/deliver`, {}, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      toast.success('Order marked as delivered!');
      dispatch({ type: 'ACTION_SUCCESS' });
      fetchOrders();
    } catch (err) {
      toast.error(getError(err));
      dispatch({ type: 'ACTION_FAIL' });
    }
  };

  const payHandler = async (orderId) => {
    try {
      dispatch({ type: 'ACTION_REQUEST' });
      await axios.put(`/api/orders/${orderId}/pay`, {}, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      toast.success('Order marked as paid!');
      dispatch({ type: 'ACTION_SUCCESS' });
      fetchOrders();
    } catch (err) {
      toast.error(getError(err));
      dispatch({ type: 'ACTION_FAIL' });
    }
  };

  const filteredOrders = orders.filter((o) => {
    const orderId = o._id || o.id || o.order_number || '';
    const userEmail = o.user_email || (o.user?.email ?? o.user?.name ?? '');
    return orderId.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      userEmail.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Orders Management</title>
      </Helmet>

      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-800 tracking-tight">Purchase & Payment History</h2>
          <p className="text-red-950 text-xs font-semibold">Review orders, payment records, transaction IDs, and shipment status.</p>
        </div>

        <button
          onClick={fetchOrders}
          className="border border-slate-205 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs py-2 px-3 rounded-xl shadow-sm transition-all flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <RefreshCw size={14} />
          <span>Reload Registry</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative w-full max-w-md bg-white border border-slate-200 p-2.5 rounded-2xl shadow-sm">
        <Search className="absolute left-6 top-6 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Filter by Order ID or User Email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-850 focus:ring-1 focus:ring-brand-500 outline-none"
        />
      </div>

      {loadingAction && <LoadingBox />}

      {loading ? (
        <LoadingBox />
      ) : error ? (
        <MessageBox variant="danger">{error}</MessageBox>
      ) : filteredOrders.length === 0 ? (
        <MessageBox>No orders registered.</MessageBox>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-xs">
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Customer Email</th>
                  <th className="p-4">Order Date</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Payment Method</th>
                  <th className="p-4">Transaction</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Shipment</th>
                  <th className="p-4 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredOrders.map((order) => {
                  const orderKey = order.id || order._id || order.order_number;
                  const createdAt = order.createdAt || order.created_at;
                  const totalAmount = order.totalPrice ?? order.total_amount ?? order.subtotal ?? 0;
                  const paymentStatus = order.isPaid || order.payment_status === 'paid' || order.status === 'paid';
                  const deliveredStatus = order.isDelivered || order.status === 'delivered';
                  const customerEmail = order.user_email || (order.user?.email ?? order.user?.name ?? order.user ?? 'Unknown');

                  return (
                    <tr key={orderKey} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-mono text-xs font-bold text-slate-500">#{order.order_number || orderKey}</td>

                      <td className="p-4 font-semibold text-slate-800">
                        {customerEmail}
                      </td>

                      <td className="p-4 text-xs font-semibold text-slate-500">
                        {createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A'}
                      </td>

                      <td className="p-4 font-extrabold text-slate-900">Br{Number(totalAmount).toFixed(2)}</td>

                      <td className="p-4 text-slate-700 text-xs uppercase tracking-wide">{order.payment_method || 'N/A'}</td>

                      <td className="p-4 text-slate-700 text-xs font-semibold">{order.transaction_id || 'N/A'}</td>

                      {/* Payment Badge */}
                      <td className="p-4">
                        {paymentStatus ? (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase">
                            Paid
                          </span>
                        ) : (
                          <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase">
                            Unpaid
                          </span>
                        )}
                      </td>

                      {/* Shipment Badge */}
                      <td className="p-4">
                        {deliveredStatus ? (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase">
                            Shipped
                          </span>
                        ) : (
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase">
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right flex justify-end items-center gap-1">
                        {!paymentStatus && (
                          <button
                            onClick={() => { payHandler(orderKey); }}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-100 bg-emerald-50/20"
                            title="Quick Mark Paid"
                          >
                            <CheckCircle2 size={15} />
                          </button>
                        )}

                        {paymentStatus && !deliveredStatus && (
                          <button
                            onClick={() => { deliverHandler(orderKey); }}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-amber-100 bg-amber-50/20"
                            title="Quick Mark Delivered"
                          >
                            <Truck size={15} />
                          </button>
                        )}

                        <button
                          onClick={() => { navigate(`/order/${orderKey}`); }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-100 bg-slate-50/50"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          onClick={() => { deleteHandler(order); }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-red-50/50 bg-red-50/10"
                          title="Delete order"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
