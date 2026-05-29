import React, { useContext, useEffect, useReducer, useState } from 'react';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import { Store } from '../context/Store';
import { getError } from '../utils/helpers';
import LoadingBox from '../components/common/LoadingBox';
import MessageBox from '../components/common/MessageBox';

const initialState = { loading: true, error: '', available: [], assigned: [] };

const normalizeOrders = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.results)) return payload.results;
  return [];
};

function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_REQUEST':
      return { ...state, loading: true, error: '' };
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, available: action.payload.available, assigned: action.payload.assigned };
    case 'FETCH_FAIL':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}

export default function DeliveryDashboardPage() {
  const { state } = useContext(Store);
  const { userInfo } = state;
  const [statusMessage, setStatusMessage] = useState('');
  const [{ loading, error, available, assigned }, dispatch] = useReducer(reducer, initialState);

  const fetchOrders = async () => {
    try {
      dispatch({ type: 'FETCH_REQUEST' });
      const token = userInfo?.token || localStorage.getItem('accessToken');
      const [assignedRes, availableRes] = await Promise.all([
        axios.get('/api/orders/delivery/', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/orders/delivery/available/', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      dispatch({
        type: 'FETCH_SUCCESS',
        payload: {
          assigned: normalizeOrders(assignedRes.data),
          available: normalizeOrders(availableRes.data),
        },
      });
    } catch (err) {
      dispatch({ type: 'FETCH_FAIL', payload: getError(err) });
    }
  };

  useEffect(() => {
    if (userInfo) fetchOrders();
  }, [userInfo]);

  const claimOrder = async (orderId) => {
    try {
      const token = userInfo?.token || localStorage.getItem('accessToken');
      await axios.post(`/api/orders/delivery/claim/${orderId}/`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setStatusMessage('Order assigned to you.');
      fetchOrders();
    } catch (err) {
      setStatusMessage(getError(err));
    }
  };

  const updateStatus = async (orderId, deliveryStatus) => {
    try {
      const token = userInfo?.token || localStorage.getItem('accessToken');
      await axios.patch(`/api/orders/delivery/update/${orderId}/`, { delivery_status: deliveryStatus }, { headers: { Authorization: `Bearer ${token}` } });
      setStatusMessage('Delivery status updated.');
      fetchOrders();
    } catch (err) {
      setStatusMessage(getError(err));
    }
  };

  return (
    <div className="space-y-6 px-4">
      <Helmet><title>Delivery Dashboard</title></Helmet>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Delivery Dashboard</h1>
          <p className="text-sm  text-red-950">Claim orders and update delivery progress in real time.</p>
        </div>
        <button onClick={fetchOrders} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700">Refresh</button>
      </div>

      {statusMessage && <MessageBox variant="success">{statusMessage}</MessageBox>}
      {loading ? <LoadingBox /> : error ? <MessageBox variant="danger">{error}</MessageBox> : null}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-black text-slate-800">Available Orders</h2>
          <p className="mb-4 text-xs text-slate-500">Pick an order to start delivery.</p>
          <div className="space-y-3">
            {available.length === 0 && <MessageBox>No orders are waiting to be claimed.</MessageBox>}
            {available.map((order) => (
              <article key={order.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">#{order.order_number}</p>
                    <h3 className="text-sm font-black text-slate-800">{order.shipping_name}</h3>
                    <p className="text-xs text-slate-500">{order.shipping_address}, {order.shipping_city}</p>
                    <p className="text-xs text-slate-500">Phone: {order.shipping_phone}</p>
                  </div>
                  <button onClick={() => claimOrder(order.id)} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white">Claim Order</button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-black text-slate-800">My Assigned Orders</h2>
          <p className="mb-4 text-xs text-yellow-900">Update each order while you deliver it.</p>
          <div className="space-y-3">
            {assigned.length === 0 && <MessageBox>You do not have orders assigned yet.</MessageBox>}
            {assigned.map((order) => (
              <article key={order.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">#{order.order_number}</p>
                    <h3 className="text-sm font-black text-slate-800">{order.shipping_name}</h3>
                    <p className="text-xs text-slate-500">Tracking: {order.tracking_code}</p>
                    <p className="text-xs text-slate-500">Status: {order.delivery_status}</p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase text-amber-700">{order.status}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => updateStatus(order.id, 'picked_up')} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">Picked Up</button>
                  <button onClick={() => updateStatus(order.id, 'in_transit')} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">On the Way</button>
                  <button onClick={() => updateStatus(order.id, 'delivered')} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white">Delivered</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
