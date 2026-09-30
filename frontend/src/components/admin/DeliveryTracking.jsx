import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { Store } from '../../context/Store';
import LoadingBox from '../common/LoadingBox';
import MessageBox from '../common/MessageBox';
import { toast } from 'react-toastify';
import { getError } from '../../utils/helpers';
import {
  Truck,
  Package,
  MapPin,
  Phone,
  User,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  Navigation,
  Edit,
  Save,
  X,
  AlertTriangle,
  MessageSquare,
  UserPlus,
} from 'lucide-react';

export default function DeliveryTracking() {
  const { state } = useContext(Store);
  const { userInfo } = state;

  const [orders, setOrders] = useState([]);
  const [deliveryUsers, setDeliveryUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Edit Modal State
  const [editingOrder, setEditingOrder] = useState(null);
  const [editDeliveryStatus, setEditDeliveryStatus] = useState('pending');
  const [editTrackingCode, setEditTrackingCode] = useState('');
  const [editDeliveryPerson, setEditDeliveryPerson] = useState('');
  const [editAdminNotes, setEditAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = userInfo?.token || localStorage.getItem('accessToken');
      
      const [ordersRes, usersRes] = await Promise.all([
        axios.get('/api/admin/orders/', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/admin/users/', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const orderList = ordersRes.data.results || ordersRes.data;
      const userList = usersRes.data.results || usersRes.data;

      setOrders(Array.isArray(orderList) ? orderList : []);
      // Filter delivery personnel or active staff
      setDeliveryUsers(Array.isArray(userList) ? userList : []);
    } catch (err) {
      console.error('Error fetching delivery tracking data:', err);
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userInfo) {
      fetchData();
    }
  }, [userInfo]);

  const openEditModal = (order) => {
    setEditingOrder(order);
    setEditDeliveryStatus(order.delivery_status || 'pending');
    setEditTrackingCode(order.tracking_code || '');
    setEditDeliveryPerson(order.assigned_delivery_person || '');
    setEditAdminNotes(order.admin_notes || '');
  };

  const closeEditModal = () => {
    setEditingOrder(null);
  };

  const handleUpdateDelivery = async (e) => {
    e.preventDefault();
    if (!editingOrder) return;

    try {
      setSubmitting(true);
      const token = userInfo?.token || localStorage.getItem('accessToken');
      const orderId = editingOrder.id || editingOrder._id;

      const payload = {
        delivery_status: editDeliveryStatus,
        tracking_code: editTrackingCode,
        assigned_delivery_person: editDeliveryPerson ? Number(editDeliveryPerson) : null,
        admin_notes: editAdminNotes,
      };

      if (editDeliveryStatus === 'delivered') {
        payload.status = 'delivered';
      }

      await axios.patch(`/api/admin/orders/${orderId}/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(`Order #${editingOrder.order_number || orderId} delivery details updated!`);
      closeEditModal();
      fetchData();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const quickUpdateStatus = async (order, newStatus) => {
    try {
      const token = userInfo?.token || localStorage.getItem('accessToken');
      const orderId = order.id || order._id;

      const payload = { delivery_status: newStatus };
      if (newStatus === 'delivered') payload.status = 'delivered';

      await axios.patch(`/api/admin/orders/${orderId}/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(`Status changed to ${newStatus.replace('_', ' ')}`);
      fetchData();
    } catch (err) {
      toast.error(getError(err));
    }
  };

  const handleInlineAssignDriver = async (orderId, driverId) => {
    try {
      const token = userInfo?.token || localStorage.getItem('accessToken');
      const payload = {
        assigned_delivery_person: driverId ? Number(driverId) : null,
        delivery_status: driverId ? 'assigned' : 'pending',
      };
      await axios.patch(`/api/admin/orders/${orderId}/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(driverId ? 'Driver assigned successfully!' : 'Order driver unassigned');
      fetchData();
    } catch (err) {
      toast.error(getError(err));
    }
  };

  const deliveryOnlyUsers = deliveryUsers.filter((u) => u.role === 'delivery');
  const otherUsers = deliveryUsers.filter((u) => u.role !== 'delivery');
  const sortedDeliveryUsers = [...deliveryOnlyUsers, ...otherUsers];


  const problemOrders = orders.filter(
    (o) => (o.delivery_status || '') === 'problematic' || (o.delivery_status || '') === 'failed' || Boolean(o.problem_notes)
  );

  const filteredOrders = orders.filter((o) => {
    const trackingStr = o.tracking_code || '';
    const orderNumStr = o.order_number || (o.id || '').toString();
    const customerStr = o.shipping_name || o.user_name || o.user_email || '';
    const cityStr = o.shipping_city || '';

    const matchesSearch =
      trackingStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      orderNumStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cityStr.toLowerCase().includes(searchTerm.toLowerCase());

    const dStatus = (o.delivery_status || 'pending').toLowerCase();
    const oStatus = (o.status || 'pending').toLowerCase();
    const hasDriver = Boolean(o.assigned_delivery_person || o.assigned_delivery_person_name);

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'unassigned' && (!hasDriver || dStatus === 'pending')) ||
      (statusFilter === 'assigned' && (hasDriver || dStatus === 'assigned')) ||
      (statusFilter === 'picked_up' && dStatus === 'picked_up') ||
      (statusFilter === 'in_transit' && (dStatus === 'in_transit' || dStatus === 'picked_up')) ||
      (statusFilter === 'delivered' && (dStatus === 'delivered' || oStatus === 'delivered')) ||
      (statusFilter === 'problematic' && (dStatus === 'problematic' || dStatus === 'failed' || Boolean(o.problem_notes))) ||
      (statusFilter === 'pending' && (dStatus === 'pending' || !hasDriver));

    return matchesSearch && matchesStatus;
  });


  const getStatusBadge = (status) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
            <CheckCircle2 size={12} /> Delivered
          </span>
        );
      case 'in_transit':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[10px] font-bold text-blue-700">
            <Navigation size={12} /> Out for Delivery
          </span>
        );
      case 'picked_up':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700">
            <Truck size={12} /> Picked Up
          </span>
        );
      case 'assigned':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-200 px-2.5 py-0.5 text-[10px] font-bold text-purple-700">
            <User size={12} /> Assigned
          </span>
        );
      case 'problematic':
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-[10px] font-bold text-red-700">
            <AlertTriangle size={12} /> Issue Reported
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
            <Clock size={12} /> Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Truck className="text-brand-600" size={22} />
            <span>Delivery & Logistics Command Center</span>
          </h2>
          <p className="text-slate-500 text-xs font-semibold">Monitor real-time package status, assign couriers, respond to delivery problems, and send driver instructions.</p>
        </div>

        <button
          onClick={fetchData}
          className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs py-2 px-3.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw size={14} />
          <span>Reload Registry</span>
        </button>
      </div>

      {/* Problematic Deliveries Panel Alert */}
      {problemOrders.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-red-800 font-black text-sm">
            <AlertTriangle size={18} className="text-red-600 shrink-0" />
            <span>Problematic Delivery Reports ({problemOrders.length} Issues Flagged)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {problemOrders.slice(0, 4).map((o) => (
              <div key={o.id || o._id} className="bg-white border border-red-150 p-3.5 rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Order #{o.order_number}</span>
                  <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded uppercase">
                    {o.problem_reason ? o.problem_reason.replace('_', ' ') : 'Issue Flagged'}
                  </span>
                </div>
                <p className="text-slate-600"><span className="font-bold">Driver Note:</span> {o.problem_notes || 'No description provided'}</p>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => openEditModal(o)}
                    className="px-2.5 py-1 text-[11px] font-bold bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition"
                  >
                    Respond & Send Instructions
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full max-w-md bg-white border border-slate-200 p-2.5 rounded-2xl shadow-sm">
          <Search className="absolute left-6 top-6 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by Tracking Code, Order #, Customer, or City..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:ring-1 focus:ring-brand-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500 shrink-0">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto border border-slate-200 rounded-xl p-2.5 text-xs font-bold bg-white text-slate-700 outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="all">All Delivery Statuses</option>
            <option value="unassigned">Pending / Needs Courier</option>
            <option value="assigned">Assigned Driver</option>
            <option value="picked_up">Picked Up</option>
            <option value="in_transit">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="problematic">Problematic / Issues</option>

          </select>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <LoadingBox message="Loading delivery shipments..." />
      ) : error ? (
        <MessageBox variant="danger">{error}</MessageBox>
      ) : filteredOrders.length === 0 ? (
        <MessageBox variant="info">No delivery tracking records found matching filter criteria.</MessageBox>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-xs">
                  <th className="p-4">Order / Tracking</th>
                  <th className="p-4">Recipient & Destination</th>
                  <th className="p-4">Assigned Driver</th>
                  <th className="p-4">Delivery Status</th>
                  <th className="p-4">Admin Instructions</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredOrders.map((order) => {
                  const orderId = order.id || order._id;
                  const currentStatus = order.delivery_status || 'pending';
                  const recipientName = order.shipping_name || order.user_name || order.user_email || 'Customer';

                  return (
                    <tr key={orderId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Package size={15} className="text-brand-600" />
                          <span>#{order.order_number || orderId}</span>
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          Code: <span className="font-bold text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded">{order.tracking_code || 'Unassigned'}</span>
                        </div>
                      </td>

                      <td className="p-4 text-xs">
                        <div className="font-bold text-slate-800">{recipientName}</div>
                        <div className="text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin size={12} className="text-slate-400 shrink-0" />
                          <span>{order.shipping_address ? `${order.shipping_address}, ${order.shipping_city}` : order.shipping_city || 'N/A'}</span>
                        </div>
                        {order.shipping_phone && (
                          <div className="text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone size={12} className="shrink-0" />
                            <span>{order.shipping_phone}</span>
                          </div>
                        )}
                      </td>

                      {/* Driver Assignment Dropdown */}
                      <td className="p-4 text-xs">
                        <div className="space-y-1 min-w-[140px]">
                          {order.assigned_delivery_person_name && (
                            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-150">
                              <User size={12} className="shrink-0" />
                              <span className="truncate max-w-[120px]">{order.assigned_delivery_person_name}</span>
                            </div>
                          )}
                          <select
                            value={order.assigned_delivery_person || ''}
                            onChange={(e) => handleInlineAssignDriver(orderId, e.target.value)}
                            className="w-full text-[11px] font-bold border border-slate-200 rounded-lg py-1 px-1.5 bg-white text-slate-800 outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                            title="Quick assign delivery driver"
                          >
                            <option value="">+ Select Driver</option>
                            {deliveryOnlyUsers.length > 0 && (
                              <optgroup label="🚚 Delivery Personnel">
                                {deliveryOnlyUsers.map((u) => (
                                  <option key={u.id} value={u.id}>
                                    🚚 {u.username || u.name || u.email}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            <optgroup label="Other Accounts & Staff">
                              {otherUsers.map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.username || u.name || u.email} ({u.role || 'user'})
                                </option>
                              ))}
                            </optgroup>
                          </select>
                        </div>
                      </td>


                      <td className="p-4">{getStatusBadge(currentStatus)}</td>

                      <td className="p-4 text-xs text-slate-600 max-w-[180px]">
                        {order.admin_notes ? (
                          <div className="bg-slate-50 border border-slate-200 p-1.5 rounded-lg text-[11px] font-medium text-slate-700 truncate" title={order.admin_notes}>
                            {order.admin_notes}
                          </div>
                        ) : (
                          <span className="text-slate-300 italic">None sent</span>
                        )}
                        {order.problem_notes && (
                          <div className="text-[10px] text-red-600 font-bold mt-1 flex items-center gap-1" title={order.problem_notes}>
                            <AlertTriangle size={10} className="shrink-0" />
                            <span className="truncate">Note: {order.problem_notes}</span>
                          </div>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => openEditModal(order)}
                            className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors border border-brand-100 bg-brand-50/20 flex items-center gap-1 text-xs font-bold px-2.5"
                            title="Edit & Send Instructions"
                          >
                            <Edit size={14} />
                            <span>Manage</span>
                          </button>

                          {currentStatus !== 'delivered' && (
                            <button
                              onClick={() => quickUpdateStatus(order, 'delivered')}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
                              title="Quick mark as delivered"
                            >
                              Mark Delivered
                            </button>
                          )}
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

      {/* Edit Delivery & Send Instructions Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-150 pb-4">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Truck className="text-brand-600" size={20} />
                <span>Manage Delivery & Instructions (Order #{editingOrder.order_number})</span>
              </h3>
              <button onClick={closeEditModal} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {/* If driver reported an issue, display it inside modal */}
            {editingOrder.problem_notes && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-xs space-y-1 text-red-900">
                <div className="font-bold flex items-center gap-1.5 text-red-700 uppercase tracking-wider text-[10px]">
                  <AlertTriangle size={14} />
                  <span>Driver Problem Report: {editingOrder.problem_reason ? editingOrder.problem_reason.replace('_', ' ') : 'Issue Flagged'}</span>
                </div>
                <p><span className="font-bold">Courier Note:</span> {editingOrder.problem_notes}</p>
              </div>
            )}

            <form onSubmit={handleUpdateDelivery} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tracking Code</label>
                <input
                  type="text"
                  value={editTrackingCode}
                  onChange={(e) => setEditTrackingCode(e.target.value)}
                  placeholder="e.g. DLV-998877"
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-800 font-mono focus:ring-1 focus:ring-brand-500 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Delivery Status</label>
                <select
                  value={editDeliveryStatus}
                  onChange={(e) => setEditDeliveryStatus(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-800 font-semibold focus:ring-1 focus:ring-brand-500 outline-none"
                >
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="picked_up">Picked Up</option>
                  <option value="in_transit">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="problematic">Problematic / Issue</option>
                  <option value="failed">Failed Delivery</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assign Courier / Driver</label>
                <select
                  value={editDeliveryPerson}
                  onChange={(e) => setEditDeliveryPerson(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-800 font-semibold focus:ring-1 focus:ring-brand-500 outline-none"
                >
                  <option value="">Unassigned</option>
                  {deliveryOnlyUsers.length > 0 && (
                    <optgroup label="🚚 Delivery Personnel">
                      {deliveryOnlyUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          🚚 {u.username || u.name || u.email}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="Other Accounts & Staff">
                    {otherUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.username || u.name || u.email} ({u.role || 'user'})
                      </option>
                    ))}
                  </optgroup>
                </select>

              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Send Driver / Courier Instructions</label>
                <textarea
                  rows={3}
                  value={editAdminNotes}
                  onChange={(e) => setEditAdminNotes(e.target.value)}
                  placeholder="Enter specific instructions or notes for the delivery driver..."
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-800 focus:ring-1 focus:ring-brand-500 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
                >
                  <Save size={16} />
                  <span>{submitting ? 'Saving...' : 'Save & Send Instructions'}</span>
                </button>
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-sm transition-colors"
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

