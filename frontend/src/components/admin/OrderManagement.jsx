import axios from 'axios';
import { useContext, useEffect, useReducer, useState } from 'react';
import { toast } from 'react-toastify';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import LoadingBox from '../common/LoadingBox';
import MessageBox from '../common/MessageBox';
import { Store } from '../../context/Store';
import { getError } from '../../utils/helpers';
import {
  Eye,
  Trash2,
  CheckCircle2,
  Truck,
  RefreshCw,
  Search,
  XCircle,
  Clock,
  Package,
  X,
  CreditCard,
  MapPin,
  Phone,
  User,
  AlertCircle,
  Filter,
} from 'lucide-react';

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
  const [statusFilter, setStatusFilter] = useState('all');
  const [inspectModalOrder, setInspectModalOrder] = useState(null);
  const [deliveryUsers, setDeliveryUsers] = useState([]);

  const fetchOrders = async () => {
    try {
      dispatch({ type: 'FETCH_REQUEST' });
      const token = userInfo?.token || localStorage.getItem('accessToken');
      
      const [ordersRes, usersRes] = await Promise.all([
        axios.get(`/api/admin/orders/`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`/api/admin/users/`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const orderList = ordersRes.data.results || ordersRes.data;
      const userList = usersRes.data.results || usersRes.data;

      dispatch({ type: 'FETCH_SUCCESS', payload: Array.isArray(orderList) ? orderList : [] });
      setDeliveryUsers(Array.isArray(userList) ? userList : []);
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

  const assignCourierHandler = async (orderId, courierUserId) => {
    try {
      dispatch({ type: 'ACTION_REQUEST' });
      const token = userInfo?.token || localStorage.getItem('accessToken');
      const payload = {
        assigned_delivery_person: courierUserId ? Number(courierUserId) : null,
        delivery_status: courierUserId ? 'assigned' : 'pending',
      };

      await axios.patch(`/api/admin/orders/${orderId}/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(`Courier ${courierUserId ? 'assigned' : 'unassigned'} successfully!`);
      dispatch({ type: 'ACTION_SUCCESS' });
      fetchOrders();
    } catch (err) {
      toast.error(getError(err));
      dispatch({ type: 'ACTION_FAIL' });
    }
  };

  const deleteHandler = async (order) => {
    const orderId = order.id || order._id;
    if (window.confirm(`Are you sure you want to delete order #${order.order_number || orderId}?`)) {
      try {
        dispatch({ type: 'ACTION_REQUEST' });
        const token = userInfo?.token || localStorage.getItem('accessToken');
        await axios.delete(`/api/admin/orders/${orderId}/`, {
          headers: { Authorization: `Bearer ${token}` },
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

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      dispatch({ type: 'ACTION_REQUEST' });
      const token = userInfo?.token || localStorage.getItem('accessToken');
      const payload = { status: newStatus };
      if (newStatus === 'delivered') payload.delivery_status = 'delivered';

      await axios.patch(`/api/admin/orders/${orderId}/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(`Order status updated to ${newStatus}`);
      dispatch({ type: 'ACTION_SUCCESS' });
      if (inspectModalOrder && (inspectModalOrder.id === orderId || inspectModalOrder._id === orderId)) {
        setInspectModalOrder(null);
      }
      fetchOrders();
    } catch (err) {
      toast.error(getError(err));
      dispatch({ type: 'ACTION_FAIL' });
    }
  };

  const updatePaymentStatus = async (orderId, newPaymentStatus) => {
    try {
      dispatch({ type: 'ACTION_REQUEST' });
      const token = userInfo?.token || localStorage.getItem('accessToken');
      await axios.patch(
        `/api/admin/orders/${orderId}/`,
        { payment_status: newPaymentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Payment status marked as ${newPaymentStatus.toUpperCase()}`);
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
    const shippingName = o.shipping_name || '';

    const matchesSearch =
      orderId.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shippingName.toLowerCase().includes(searchTerm.toLowerCase());

    const oStatus = (o.status || 'pending').toLowerCase();
    const oDeliveryStatus = (o.delivery_status || '').toLowerCase();

    const matchesStatus =
      statusFilter === 'all' ||
      oStatus === statusFilter.toLowerCase() ||
      oDeliveryStatus === statusFilter.toLowerCase() ||
      (statusFilter === 'processing' && (oStatus === 'processing' || oStatus === 'confirmed')) ||
      (statusFilter === 'delivered' && (oStatus === 'delivered' || oDeliveryStatus === 'delivered'));

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase">
            Delivered
          </span>
        );
      case 'processing':
        return (
          <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase">
            Confirmed / Processing
          </span>
        );
      case 'cancelled':
        return (
          <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase">
            Pending Approval
          </span>
        );
    }
  };

  const getDeliveryStatusBadge = (delStatus, problemReason) => {
    switch (delStatus) {
      case 'delivered':
        return (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase inline-flex items-center gap-1">
            <CheckCircle2 size={11} /> Delivered
          </span>
        );
      case 'in_transit':
        return (
          <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase inline-flex items-center gap-1">
            <Truck size={11} /> Out for Delivery
          </span>
        );
      case 'picked_up':
        return (
          <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase inline-flex items-center gap-1">
            <Package size={11} /> Picked Up
          </span>
        );
      case 'assigned':
        return (
          <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase inline-flex items-center gap-1">
            <User size={11} /> Assigned
          </span>
        );
      case 'problematic':
      case 'failed':
        return (
          <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase inline-flex items-center gap-1">
            <AlertCircle size={11} /> {problemReason ? problemReason.replace('_', ' ') : 'Issue Flagged'}
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase">
            Unassigned
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Orders Management — Admin</title>
      </Helmet>

      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Package className="text-brand-600" size={22} />
            <span>Orders & Payment Registry</span>
          </h2>
          <p className="text-slate-500 text-xs font-semibold">
            Review customer orders, confirm/cancel requests, verify payments, and monitor tracked delivery status.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs py-2 px-3.5 rounded-xl shadow-sm transition-all flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <RefreshCw size={14} />
          <span>Reload Registry</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full max-w-md bg-white border border-slate-200 p-2.5 rounded-2xl shadow-sm">
          <Search className="absolute left-6 top-6 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Filter by Order #, Customer Name, or Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:ring-1 focus:ring-brand-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500 shrink-0 flex items-center gap-1">
            <Filter size={13} /> Status Filter:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto border border-slate-200 rounded-xl p-2.5 text-xs font-bold bg-white text-slate-700 outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="all">All Order Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Confirmed / Processing</option>
            <option value="delivered">Delivered</option>
            <option value="problematic">Problematic / Issue Reports</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {loadingAction && <LoadingBox message="Executing order modification..." />}

      {loading ? (
        <LoadingBox message="Loading order records..." />
      ) : error ? (
        <MessageBox variant="danger">{error}</MessageBox>
      ) : filteredOrders.length === 0 ? (
        <MessageBox variant="info">No orders registered matching search criteria.</MessageBox>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="max-h-[600px] overflow-auto">
            <table className="w-full text-left border-collapse text-sm relative">
              <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-xs">
                  <th className="p-4">Order Number</th>
                  <th className="p-4">Customer Email</th>
                  <th className="p-4">Order Date</th>
                  <th className="p-4">Total Price</th>
                  <th className="p-4">Payment Method</th>
                  <th className="p-4">Payment Status</th>
                  <th className="p-4">Order Status</th>
                  <th className="p-4">Delivery Status</th>
                  <th className="p-4 text-right">Quick Management</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredOrders.map((order) => {
                  const orderKey = order.id || order._id || order.order_number;
                  const createdAt = order.created_at || order.createdAt;
                  const totalAmount = order.total_amount ?? order.totalPrice ?? 0;
                  const currentStatus = order.status || 'pending';
                  const deliveryStatus = order.delivery_status || 'pending';
                  const paymentStatus = order.payment_status || (order.isPaid ? 'paid' : 'unpaid');
                  const customerEmail =
                    order.user_email || (order.user?.email ?? order.user?.name ?? order.shipping_name ?? 'Unknown');

                  return (
                    <tr key={orderKey} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-mono text-xs font-bold text-brand-600">#{order.order_number || orderKey}</td>

                      <td className="p-4 font-semibold text-slate-800">{customerEmail}</td>

                      <td className="p-4 text-xs font-semibold text-slate-500">
                        {createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A'}
                      </td>

                      <td className="p-4 font-black text-slate-900">Br{Number(totalAmount).toFixed(2)}</td>

                      <td className="p-4 text-slate-700 text-xs uppercase tracking-wide font-medium">
                        {order.payment_method || 'N/A'}
                      </td>

                      {/* Payment Status Dropdown Selector */}
                      <td className="p-4">
                        <select
                          value={paymentStatus}
                          onChange={(e) => updatePaymentStatus(orderKey, e.target.value)}
                          className={`text-[11px] font-bold px-2 py-1 rounded-lg border outline-none cursor-pointer ${
                            paymentStatus === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : paymentStatus === 'refunded'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : paymentStatus === 'failed'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <option value="unpaid">UNPAID</option>
                          <option value="paid">PAID</option>
                          <option value="refunded">REFUNDED</option>
                          <option value="failed">FAILED</option>
                        </select>
                      </td>

                      {/* Order Status Badge */}
                      <td className="p-4">{getStatusBadge(currentStatus)}</td>

                      {/* Delivery Status & Courier Assignment */}
                      <td className="p-4">
                        <div className="space-y-1.5 min-w-[130px]">
                          <div>{getDeliveryStatusBadge(deliveryStatus, order.problem_reason)}</div>
                          <select
                            value={order.assigned_delivery_person || ''}
                            onChange={(e) => assignCourierHandler(orderKey, e.target.value)}
                            className="w-full text-[10px] font-bold border border-slate-200 rounded-lg py-1 px-1.5 bg-white text-slate-800 outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                            title="Select courier driver to assign to this order"
                          >
                            <option value="">+ Assign Driver</option>
                            {[...deliveryUsers]
                              .sort((a, b) => {
                                if (a.role === 'delivery' && b.role !== 'delivery') return -1;
                                if (a.role !== 'delivery' && b.role === 'delivery') return 1;
                                return (a.username || a.email || '').localeCompare(b.username || b.email || '');
                              })
                              .map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.role === 'delivery' ? '🚚 ' : ''}{u.username || u.name || u.email} ({u.role || 'user'})
                                </option>
                              ))}

                          </select>
                        </div>
                      </td>

                      {/* Quick Actions */}
                      <td className="p-4 text-right">
                        <div className="flex justify-end items-center gap-1.5">
                          {currentStatus === 'pending' && (
                            <button
                              onClick={() => updateOrderStatus(orderKey, 'processing')}
                              className="px-2.5 py-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition flex items-center gap-1"
                              title="Confirm Order"
                            >
                              <CheckCircle2 size={13} /> Confirm
                            </button>
                          )}

                          {currentStatus !== 'cancelled' && currentStatus !== 'delivered' && (
                            <button
                              onClick={() => updateOrderStatus(orderKey, 'cancelled')}
                              className="px-2.5 py-1 text-xs font-bold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 rounded-lg transition flex items-center gap-1"
                              title="Cancel Order"
                            >
                              <XCircle size={13} /> Cancel
                            </button>
                          )}

                          <button
                            onClick={() => setInspectModalOrder(order)}
                            className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 bg-white"
                            title="Inspect Order Breakdown"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            onClick={() => deleteHandler(order)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-red-100 bg-red-50/20"
                            title="Delete Order Record"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspect Order Breakdown Modal */}
      {inspectModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-150 pb-4">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Package className="text-brand-600" size={20} />
                <span>Order Details & Breakdown (Order #{inspectModalOrder.order_number})</span>
              </h3>
              <button onClick={() => setInspectModalOrder(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-150 rounded-xl p-3 text-xs">
                <div>
                  <span className="font-bold text-slate-500 uppercase block text-[10px]">Customer Name</span>
                  <span className="font-semibold text-slate-800">{inspectModalOrder.shipping_name || inspectModalOrder.user_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 uppercase block text-[10px]">Email Address</span>
                  <span className="font-semibold text-slate-800">{inspectModalOrder.user_email || inspectModalOrder.user?.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 uppercase block text-[10px]">Shipping Address</span>
                  <span className="font-semibold text-slate-800">{inspectModalOrder.shipping_address}, {inspectModalOrder.shipping_city}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 uppercase block text-[10px]">Contact Phone</span>
                  <span className="font-semibold text-slate-800">{inspectModalOrder.shipping_phone || 'N/A'}</span>
                </div>
              </div>

              {/* Courier Assignment inside Modal */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-slate-700 block">Assigned Courier Driver:</span>
                  <span className="text-slate-500 font-semibold">{inspectModalOrder.assigned_delivery_person_name || 'Unassigned'}</span>
                </div>
                <select
                  value={inspectModalOrder.assigned_delivery_person || ''}
                  onChange={(e) => assignCourierHandler(inspectModalOrder.id || inspectModalOrder._id, e.target.value)}
                  className="border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs font-bold bg-white text-slate-800 outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                >
                  <option value="">+ Assign Courier Driver</option>
                  {deliveryUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username || u.email} ({u.role || 'user'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Driver Problem Report Alert if any */}
              {(inspectModalOrder.problem_notes || inspectModalOrder.delivery_status === 'problematic' || inspectModalOrder.delivery_status === 'failed') && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-xs space-y-1 text-red-900">
                  <div className="font-bold flex items-center gap-1.5 text-red-700 uppercase tracking-wider text-[11px]">
                    <AlertCircle size={14} />
                    <span>Courier Delivery Issue Reported ({inspectModalOrder.problem_reason ? inspectModalOrder.problem_reason.replace('_', ' ') : 'Issue Flagged'})</span>
                  </div>
                  <p className="font-medium"><span className="font-bold">Driver Note:</span> {inspectModalOrder.problem_notes || 'Courier reported a delivery problem.'}</p>
                  {inspectModalOrder.assigned_delivery_person_name && (
                    <p className="text-[10px] text-slate-500">Reported by Courier Driver: {inspectModalOrder.assigned_delivery_person_name}</p>
                  )}
                </div>
              )}

              {/* Items List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Purchased Items</h4>
                <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                  {(inspectModalOrder.items || []).length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">No itemized products attached to this order.</p>
                  ) : (
                    (inspectModalOrder.items || []).map((item, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                        <div className="font-semibold text-slate-800 truncate">
                          {item.quantity}x {item.product_name}
                        </div>
                        <div className="font-black text-slate-900 shrink-0">
                          Br{Number(item.subtotal || item.product_price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-150 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Total Order Amount:</span>
                <span className="text-lg font-black text-slate-900">Br{Number(inspectModalOrder.total_amount || 0).toFixed(2)}</span>
              </div>

              <div className="flex gap-2 pt-2">
                {inspectModalOrder.status === 'pending' && (
                  <button
                    onClick={() => updateOrderStatus(inspectModalOrder.id || inspectModalOrder._id, 'processing')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-xs transition"
                  >
                    Confirm Order
                  </button>
                )}
                {inspectModalOrder.status !== 'cancelled' && inspectModalOrder.status !== 'delivered' && (
                  <button
                    onClick={() => updateOrderStatus(inspectModalOrder.id || inspectModalOrder._id, 'cancelled')}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-xl text-xs transition"
                  >
                    Cancel Order
                  </button>
                )}
                <button
                  onClick={() => setInspectModalOrder(null)}
                  className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

