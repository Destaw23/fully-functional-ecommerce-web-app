import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import { Store } from '../context/Store';
import { getError, getMediaUrl } from '../utils/helpers';
import LoadingBox from '../components/common/LoadingBox';
import MessageBox from '../components/common/MessageBox';
import { toast } from 'react-toastify';
import {
  Truck,
  Package,
  MapPin,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Eye,
  X,
  Navigation,
  Send,
  CheckSquare,
  HelpCircle,
  FileText,
} from 'lucide-react';

export default function DeliveryDashboardPage() {
  const { state } = useContext(Store);
  const { userInfo } = state;

  const [activeTab, setActiveTab] = useState('active'); // active, available, history
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);

  // Modal State for Order Details Inspection
  const [inspectOrder, setInspectOrder] = useState(null);

  // Modal State for Delivery Problem Reporting
  const [problemModalOrder, setProblemModalOrder] = useState(null);
  const [problemReason, setProblemReason] = useState('customer_unavailable');
  const [problemNotes, setProblemNotes] = useState('');
  const [submittingProblem, setSubmittingProblem] = useState(false);

  const fetchDeliveryOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const token = userInfo?.token || localStorage.getItem('accessToken');
      
      const [assignedRes, availableRes] = await Promise.all([
        axios.get('/api/orders/delivery/', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/orders/delivery/available/', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const assignedList = assignedRes.data.results || assignedRes.data;
      const availableList = availableRes.data.results || availableRes.data;

      setAssignedOrders(Array.isArray(assignedList) ? assignedList : []);
      setAvailableOrders(Array.isArray(availableList) ? availableList : []);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userInfo) {
      fetchDeliveryOrders();
    }
  }, [userInfo]);

  const handleClaimOrder = async (orderId) => {
    try {
      const token = userInfo?.token || localStorage.getItem('accessToken');
      await axios.post(`/api/orders/delivery/claim/${orderId}/`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Order claimed successfully! Added to your active deliveries.');
      fetchDeliveryOrders();
    } catch (err) {
      toast.error(getError(err));
    }
  };

  const handleUpdateStatus = async (orderId, newDeliveryStatus) => {
    try {
      const token = userInfo?.token || localStorage.getItem('accessToken');
      await axios.patch(
        `/api/orders/delivery/update/${orderId}/`,
        { delivery_status: newDeliveryStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Delivery status updated to ${newDeliveryStatus.replace('_', ' ')}`);
      fetchDeliveryOrders();
    } catch (err) {
      toast.error(getError(err));
    }
  };

  const handleOpenProblemModal = (order) => {
    setProblemModalOrder(order);
    setProblemReason('customer_unavailable');
    setProblemNotes('');
  };

  const handleReportProblemSubmit = async (e) => {
    e.preventDefault();
    if (!problemModalOrder) return;

    try {
      setSubmittingProblem(true);
      const token = userInfo?.token || localStorage.getItem('accessToken');
      const orderId = problemModalOrder.id || problemModalOrder._id;

      await axios.patch(
        `/api/orders/delivery/update/${orderId}/`,
        {
          delivery_status: 'problematic',
          problem_reason: problemReason,
          problem_notes: problemNotes,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.warn('Delivery issue reported to Admin console.');
      setProblemModalOrder(null);
      fetchDeliveryOrders();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setSubmittingProblem(false);
    }
  };

  // Filter assigned orders into Active in-progress vs History
  const activeDeliveries = assignedOrders.filter(
    (o) => (o.delivery_status || 'pending') !== 'delivered' && (o.delivery_status || '') !== 'failed'
  );

  const historyDeliveries = assignedOrders.filter(
    (o) => (o.delivery_status || '') === 'delivered' || (o.delivery_status || '') === 'failed' || (o.delivery_status || '') === 'problematic'
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'delivered':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase inline-flex items-center gap-1"><CheckCircle2 size={12} /> Delivered</span>;
      case 'in_transit':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase inline-flex items-center gap-1"><Navigation size={12} /> Out for Delivery</span>;
      case 'picked_up':
        return <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase inline-flex items-center gap-1"><Package size={12} /> Picked Up</span>;
      case 'problematic':
      case 'failed':
        return <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase inline-flex items-center gap-1"><AlertTriangle size={12} /> Issue Reported</span>;
      default:
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase inline-flex items-center gap-1"><Clock size={12} /> Assigned</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 pb-12 animate-fade-in">
      <Helmet>
        <title>Courier Delivery Portal — ElectroMerce</title>
      </Helmet>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-brand-950 to-indigo-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-brand-500/20 border border-brand-400/30 flex items-center justify-center text-brand-300">
            <Truck size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Courier Delivery Console</h1>
            <p className="text-xs text-slate-300">Manage real-time assigned orders, navigate destinations, contact customers, and log completed deliveries.</p>
          </div>
        </div>

        <button
          onClick={fetchDeliveryOrders}
          className="rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-4 py-2 text-xs font-bold text-white transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw size={14} />
          <span>Sync Deliveries</span>
        </button>
      </div>

      {/* Metric Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Available to Claim</span>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{availableOrders.length}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Package size={22} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Deliveries</span>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{activeDeliveries.length}</h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Truck size={22} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed & Logs</span>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{historyDeliveries.length}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 size={22} />
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center border-b border-slate-200 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'active'
              ? 'text-brand-600 border-b-2 border-brand-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck size={16} />
          <span>My Active Deliveries ({activeDeliveries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('available')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'available'
              ? 'text-brand-600 border-b-2 border-brand-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package size={16} />
          <span>Available Orders ({availableOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'history'
              ? 'text-brand-600 border-b-2 border-brand-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckSquare size={16} />
          <span>Delivery History ({historyDeliveries.length})</span>
        </button>
      </div>

      {loading ? (
        <LoadingBox message="Syncing delivery queue..." />
      ) : error ? (
        <MessageBox variant="danger">{error}</MessageBox>
      ) : (
        <>
          {/* TAB 1: ACTIVE DELIVERIES */}
          {activeTab === 'active' && (
            <div className="space-y-4">
              {activeDeliveries.length === 0 ? (
                <MessageBox variant="info">You currently have no active deliveries in progress. Switch to "Available Orders" to claim new packages.</MessageBox>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeDeliveries.map((order) => {
                    const orderId = order.id || order._id;
                    const status = order.delivery_status || 'assigned';

                    return (
                      <div key={orderId} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 hover:shadow transition-shadow">
                        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                          <div>
                            <span className="text-xs font-mono font-bold text-brand-600 uppercase">#{order.order_number || orderId}</span>
                            <h3 className="text-base font-black text-slate-800">{order.shipping_name}</h3>
                            <p className="text-xs text-slate-400 font-mono">Tracking: {order.tracking_code || 'N/A'}</p>
                          </div>
                          <div>{getStatusBadge(status)}</div>
                        </div>

                        {/* Customer & Location */}
                        <div className="space-y-2 text-xs">
                          <div className="flex items-start gap-2 text-slate-700 font-medium">
                            <MapPin size={15} className="text-slate-400 shrink-0 mt-0.5" />
                            <span>{order.shipping_address}, {order.shipping_city}</span>
                          </div>

                          {order.shipping_phone && (
                            <div className="flex items-center gap-2">
                              <Phone size={14} className="text-emerald-600 shrink-0" />
                              <a
                                href={`tel:${order.shipping_phone}`}
                                className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg hover:bg-emerald-100 transition-colors inline-flex items-center gap-1.5"
                              >
                                Call Customer: {order.shipping_phone}
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Admin instructions notice if any */}
                        {order.admin_notes && (
                          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 space-y-1">
                            <span className="font-bold uppercase tracking-wider text-[10px] text-amber-700 block">Admin Instructions:</span>
                            <p>{order.admin_notes}</p>
                          </div>
                        )}

                        {/* Action Toolbar */}
                        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                          <button
                            onClick={() => setInspectOrder(order)}
                            className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5"
                          >
                            <Eye size={14} />
                            <span>View Order Items</span>
                          </button>

                          <div className="flex flex-wrap items-center gap-2">
                            {status === 'assigned' && (
                              <button
                                onClick={() => handleUpdateStatus(orderId, 'picked_up')}
                                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white transition shadow-sm"
                              >
                                Picked Up
                              </button>
                            )}

                            {(status === 'assigned' || status === 'picked_up') && (
                              <button
                                onClick={() => handleUpdateStatus(orderId, 'in_transit')}
                                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition shadow-sm"
                              >
                                Out for Delivery
                              </button>
                            )}

                            {status !== 'delivered' && (
                              <button
                                onClick={() => handleUpdateStatus(orderId, 'delivered')}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition shadow-sm"
                              >
                                Mark Delivered
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenProblemModal(order)}
                              className="px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-xs font-bold text-red-700 transition"
                              title="Report a problem with delivery"
                            >
                              Report Issue
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AVAILABLE ORDERS TO CLAIM */}
          {activeTab === 'available' && (
            <div className="space-y-4">
              {availableOrders.length === 0 ? (
                <MessageBox variant="info">No paid packages waiting to be claimed right now.</MessageBox>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {availableOrders.map((order) => {
                    const orderId = order.id || order._id;

                    return (
                      <div key={orderId} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                          <div>
                            <span className="text-xs font-mono font-bold text-brand-600 uppercase">#{order.order_number || orderId}</span>
                            <h3 className="text-base font-black text-slate-800">{order.shipping_name}</h3>
                            <p className="text-xs text-slate-400 font-mono">Amount: Br{Number(order.total_amount || 0).toFixed(2)}</p>
                          </div>
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase">Paid & Ready</span>
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-600">
                          <div className="flex items-start gap-2">
                            <MapPin size={15} className="text-slate-400 shrink-0 mt-0.5" />
                            <span>{order.shipping_address}, {order.shipping_city}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone size={14} className="text-slate-400 shrink-0" />
                            <span>Phone: {order.shipping_phone}</span>
                          </div>
                        </div>

                        <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                          <button
                            onClick={() => setInspectOrder(order)}
                            className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition"
                          >
                            Inspect Package
                          </button>

                          <button
                            onClick={() => handleClaimOrder(orderId)}
                            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-xs font-bold text-white transition shadow-sm flex items-center gap-1.5"
                          >
                            <CheckSquare size={14} />
                            <span>Claim & Accept Delivery</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DELIVERY HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {historyDeliveries.length === 0 ? (
                <MessageBox variant="info">No completed or logged deliveries in history yet.</MessageBox>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-xs">
                          <th className="p-4">Order / Tracking</th>
                          <th className="p-4">Customer</th>
                          <th className="p-4">Destination</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Log Notes</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {historyDeliveries.map((order) => {
                          const orderId = order.id || order._id;
                          const status = order.delivery_status || 'delivered';

                          return (
                            <tr key={orderId} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-4">
                                <div className="font-bold text-slate-900">#{order.order_number || orderId}</div>
                                <div className="text-xs text-slate-400 font-mono">Code: {order.tracking_code || 'N/A'}</div>
                              </td>

                              <td className="p-4 font-semibold text-slate-800 text-xs">
                                {order.shipping_name}
                              </td>

                              <td className="p-4 text-xs text-slate-600">
                                {order.shipping_city}
                              </td>

                              <td className="p-4">{getStatusBadge(status)}</td>

                              <td className="p-4 text-xs text-slate-500 max-w-[200px] truncate">
                                {order.problem_notes || order.admin_notes || <span className="text-slate-300 italic">No notes logged</span>}
                              </td>

                              <td className="p-4 text-right">
                                <button
                                  onClick={() => setInspectOrder(order)}
                                  className="p-1.5 text-brand-600 hover:bg-brand-50 border border-brand-100 rounded-lg transition"
                                  title="View Details"
                                >
                                  <Eye size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Inspect Order Items Modal */}
      {inspectOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-150 pb-4">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Package className="text-brand-600" size={20} />
                <span>Package Content List (Order #{inspectOrder.order_number})</span>
              </h3>
              <button onClick={() => setInspectOrder(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-xs space-y-1">
                <p><span className="font-bold text-slate-700">Recipient:</span> {inspectOrder.shipping_name}</p>
                <p><span className="font-bold text-slate-700">Address:</span> {inspectOrder.shipping_address}, {inspectOrder.shipping_city}</p>
                <p><span className="font-bold text-slate-700">Phone:</span> {inspectOrder.shipping_phone}</p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Itemized Products</h4>
                <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                  {(inspectOrder.items || []).length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">No items list attached.</p>
                  ) : (
                    (inspectOrder.items || []).map((item, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                        <div className="font-semibold text-slate-800 truncate">{item.quantity}x {item.product_name}</div>
                        <div className="font-extrabold text-slate-900 shrink-0">Br{Number(item.subtotal || item.product_price * item.quantity).toFixed(2)}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center text-xs font-bold text-slate-800 border-t border-slate-150">
                <span>Total Amount:</span>
                <span className="text-base font-black text-slate-900">Br{Number(inspectOrder.total_amount || 0).toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => setInspectOrder(null)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs transition"
            >
              Close Window
            </button>
          </div>
        </div>
      )}

      {/* Report Delivery Problem Modal */}
      {problemModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-150 pb-4">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <AlertTriangle className="text-red-600" size={20} />
                <span>Report Delivery Problem (Order #{problemModalOrder.order_number})</span>
              </h3>
              <button onClick={() => setProblemModalOrder(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleReportProblemSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Problem Category *</label>
                <select
                  value={problemReason}
                  onChange={(e) => setProblemReason(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-800 font-semibold focus:ring-1 focus:ring-brand-500 outline-none"
                >
                  <option value="customer_unavailable">Customer Unavailable / Unreachable</option>
                  <option value="wrong_address">Incorrect / Wrong Delivery Address</option>
                  <option value="damaged_package">Damaged Package / Hardware Issue</option>
                  <option value="customer_refused">Customer Refused Order</option>
                  <option value="other">Other Delivery Issue</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Problem Description & Notes *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain why delivery could not be completed and what instructions are needed..."
                  value={problemNotes}
                  onChange={(e) => setProblemNotes(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-800 focus:ring-1 focus:ring-brand-500 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submittingProblem}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
                >
                  <Send size={15} />
                  <span>{submittingProblem ? 'Submitting...' : 'Submit Report to Admin'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProblemModalOrder(null)}
                  className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-sm transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
