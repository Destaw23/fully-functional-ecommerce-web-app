import React, { useContext, useEffect, useReducer } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import LoadingBox from '../components/common/LoadingBox';
import MessageBox from '../components/common/MessageBox';
import { Store } from '../context/Store';
import { getError } from '../utils/helpers';

const reducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_REQUEST':
      return { ...state, loading: true };
    case 'FETCH_SUCCESS':
      return { ...state, orders: action.payload, loading: false };
    case 'FETCH_FAIL':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

export default function OrderHistoryScreen() {
  const { state } = useContext(Store);
  const { userInfo, accessToken } = state;
  const navigate = useNavigate();

  const [{ loading, error, orders }, dispatch] = useReducer(reducer, {
    loading: true,
    error: '',
    orders: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      dispatch({ type: 'FETCH_REQUEST' });
      try {
        const token = accessToken || localStorage.getItem('accessToken');
        const { data } = await axios.get(`/api/orders/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        dispatch({ type: 'FETCH_SUCCESS', payload: data });
      } catch (error) {
        dispatch({
          type: 'FETCH_FAIL',
          payload: getError(error),
        });
      }
    };
    fetchData();
  }, [userInfo]);

  return (
    <div className="py-6 max-w-6xl mx-auto px-4">
      <Helmet>
        <title>Order History</title>
      </Helmet>

      <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-8">Order History</h1>
      {loading ? (
        <LoadingBox></LoadingBox>
      ) : error ? (
        <MessageBox variant="danger">{error}</MessageBox>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-xs">
                  <th className="p-4">ID</th>
                  <th className="p-4">DATE</th>
                  <th className="p-4">TOTAL</th>
                  <th className="p-4">PAID</th>
                  <th className="p-4">DELIVERED</th>
                  <th className="p-4">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-mono text-xs text-slate-500">{order._id}</td>
                    <td className="p-4">{order.createdAt ? order.createdAt.substring(0, 10) : 'N/A'}</td>
                    <td className="p-4 font-bold text-slate-900">Br{order.totalPrice ? Number(order.totalPrice).toFixed(2) : '0.00'}</td>
                    <td className="p-4">
                      {order.isPaid ? (
                        <span className="bg-green-50 text-green-700 border border-green-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                          {order.paidAt ? order.paidAt.substring(0, 10) : 'N/A'}
                        </span>
                      ) : (
                        <span className="bg-red-50 text-red-700 border border-red-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                          No
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {order.isDelivered ? (
                        <span className="bg-green-50 text-green-700 border border-green-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                          {order.deliveredAt ? order.deliveredAt.substring(0, 10) : 'N/A'}
                        </span>
                      ) : (
                        <span className="bg-red-50 text-red-700 border border-red-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                          No
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => {
                          navigate(`/order/${order._id}`);
                        }}
                        className="bg-slate-100 hover:bg-blue-600 hover:text-white border border-slate-200 hover:border-blue-600 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
