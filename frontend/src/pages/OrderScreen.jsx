import axios from 'axios';
import React, { useContext, useEffect, useReducer } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import LoadingBox from '../components/common/LoadingBox';
import MessageBox from '../components/common/MessageBox';
import { Store } from '../context/Store';
import { getError, getMediaUrl } from '../utils/helpers';
import { toast } from 'react-toastify';
import { Package, Truck, CreditCard, ChevronLeft } from 'lucide-react';

function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_REQUEST':
      return { ...state, loading: true, error: '' };
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, order: action.payload, error: '' };
    case 'FETCH_FAIL':
      return { ...state, loading: false, error: action.payload };
    case 'PAY_REQUEST':
      return { ...state, loadingPay: true };
    case 'PAY_SUCCESS':
      return { ...state, loadingPay: false, successPay: true };
    case 'PAY_FAIL':
      return { ...state, loadingPay: false };
    case 'PAY_RESET':
      return { ...state, loadingPay: false, successPay: false };

    case 'DELIVER_REQUEST':
      return { ...state, loadingDeliver: true };
    case 'DELIVER_SUCCESS':
      return { ...state, loadingDeliver: false, successDeliver: true };
    case 'DELIVER_FAIL':
      return { ...state, loadingDeliver: false };
    case 'DELIVER_RESET':
      return {
        ...state,
        loadingDeliver: false,
        successDeliver: false,
      };
    default:
      return state;
  }
}

export default function OrderScreen() {
  const { state } = useContext(Store);
  const { userInfo } = state;

  const params = useParams();
  const { id: orderId } = params;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isPaymentSuccess = searchParams.get('payment_success') === 'true';

  const [
    {
      loading,
      error,
      order,
      successPay,
      successDeliver,
      loadingDeliver,
    },
    dispatch,
  ] = useReducer(reducer, {
    loading: true,
    order: {},
    error: '',
    successPay: false,
    successDeliver: false,
    loadingDeliver: false,
  });


  useEffect(() => {
    const fetchOrder = async () => {
      try {
        dispatch({ type: 'FETCH_REQUEST' });
        const token = localStorage.getItem('accessToken');
        const { data } = await axios.get(`/api/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        dispatch({ type: 'FETCH_SUCCESS', payload: data });
      } catch (err) {
        dispatch({ type: 'FETCH_FAIL', payload: getError(err) });
      }
    };

    if (!userInfo) {
      return navigate('/signin');
    }
    if (!order._id || successPay || successDeliver || (order._id && order._id !== orderId)) {
      if (successPay) {
        dispatch({ type: 'PAY_RESET' });
      }
      if (successDeliver) {
        dispatch({ type: 'DELIVER_RESET' });
      }
      fetchOrder();
    }
  }, [
    orderId,
    userInfo,
    navigate,
    successPay,
    successDeliver,
  ]);

  async function deliverOrderHandler() {
    try {
      dispatch({ type: 'DELIVER_REQUEST' });
      const token = localStorage.getItem('accessToken');
      await axios.put(
        `/api/orders/${order._id}/deliver`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      dispatch({ type: 'DELIVER_SUCCESS' });
      toast.success('Order marked as delivered successfully');
    } catch (err) {
      toast.error(getError(err));
      dispatch({ type: 'DELIVER_FAIL' });
    }
  }

  if (loading) return <LoadingBox />;
  if (error) return <MessageBox variant="danger">{error}</MessageBox>;

  return (
    <div className="space-y-8 pb-16">
      {isPaymentSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 text-center transform scale-100 transition-all duration-300 relative overflow-hidden">
            
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />
            
            {/* Green glowing checkmark */}
            <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shadow-inner border border-emerald-100 animate-bounce">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Payment Successful!</h2>
              <p className="text-sm text-slate-400 font-medium">Your transaction has been securely processed by Chapa.</p>
            </div>
            
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left space-y-2.5 text-xs text-slate-600 font-medium">
              <div className="flex justify-between">
                <span className="text-slate-400">Order ID:</span>
                <span className="font-bold font-mono text-slate-800">#{orderId}</span>
              </div>
              {order.orderNumber && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Order Number:</span>
                  <span className="font-bold font-mono text-slate-800">{order.orderNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Paid:</span>
                <span className="font-bold text-slate-800 text-sm">Br{order.totalPrice?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">PAID</span>
              </div>
            </div>
            
            <button
              onClick={() => {
                setSearchParams({}); // Remove query parameters from URL and close modal
              }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-sm shadow transition-colors"
            >
              Close and View Order
            </button>
          </div>
        </div>
      )}

      <Helmet>
        <title>Order {orderId}</title>
      </Helmet>

      <div>
        <Link to="/orderhistory" className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1">
          <ChevronLeft size={16} />
          <span>Back to Order History</span>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Order #{orderId}</h1>
          <p className="text-xs text-slate-400 font-medium mt-1">Placed securely with ElectroMerce</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Columns */}
        <div className="lg:col-span-2 space-y-6">

          {/* Shipping Address */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Truck className="text-blue-600" size={18} />
              <span>Shipping Destination</span>
            </h3>
            <div className="text-sm text-slate-600 space-y-2">
              <p><strong>Name:</strong> {order.shippingAddress.fullName}</p>
              <p>
                <strong>Address:</strong> {order.shippingAddress.address},{' '}
                {order.shippingAddress.city}, {order.shippingAddress.postalCode},{' '}
                {order.shippingAddress.country}
              </p>
              {order.shippingAddress.location && order.shippingAddress.location.lat && (
                <div className="pt-1">
                  <a
                    target="_new"
                    href={`https://maps.google.com?q=${order.shippingAddress.location.lat},${order.shippingAddress.location.lng}`}
                    className="text-xs text-blue-600 hover:underline font-bold"
                  >
                    View Map Location
                  </a>
                </div>
              )}
            </div>

            {order.isDelivered ? (
              <div className="bg-green-50 text-green-700 border border-green-200 p-3 rounded-lg text-xs font-semibold">
                Delivered at {order.deliveredAt}
              </div>
            ) : (
              <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-lg text-xs font-semibold">
                Not Delivered
              </div>
            )}
          </div>

          {/* Payment Method details */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2 border-b border-slate-100 pb-3">
              <CreditCard className="text-blue-600" size={18} />
              <span>Payment Details</span>
            </h3>
            <p className="text-sm text-slate-600">
              <strong>Method:</strong> {order.paymentMethod}
            </p>

            {order.isPaid ? (
              <div className="bg-green-50 text-green-700 border border-green-200 p-3 rounded-lg text-xs font-semibold">
                Paid at {order.paidAt}
              </div>
            ) : (
              <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-lg text-xs font-semibold">
                Not Paid
              </div>
            )}
          </div>

          {/* Order items lists */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Package className="text-blue-600" size={18} />
              <span>Items Purchased</span>
            </h3>
            <div className="divide-y divide-slate-100">
              {order.orderItems.map((item) => (
                <div key={item._id} className="flex items-center justify-between py-4 gap-4">
                  <div className="flex items-center space-x-4">
                    <img
                      src={getMediaUrl(item.image)}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-lg border border-slate-200 bg-slate-50 flex-shrink-0"
                    />
                    <div>
                      <Link to={`/product/${item.slug}`} className="font-bold text-slate-800 text-sm hover:text-blue-600 transition-colors line-clamp-1">
                        {item.name}
                      </Link>
                      <span className="text-xs text-slate-400">Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-900">Br{item.price}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Columns Summary */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-3">Order Summary</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Items Subtotal</span>
                <span className="font-semibold text-slate-800">Br{order.itemsPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Shipping Cost</span>
                <span className="font-semibold text-slate-800">Br{order.shippingPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Calculated Tax</span>
                <span className="font-semibold text-slate-800">Br{order.taxPrice.toFixed(2)}</span>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-between text-base font-black text-slate-900">
                <span>Order Total</span>
                <span>Br{order.totalPrice.toFixed(2)}</span>
              </div>
            </div>

            {!order.isPaid && (
              <div className="pt-2 border-t border-slate-100 space-y-4">
                {order.paymentMethod === 'Chapa' ? (
                  <button
                    onClick={async () => {
                      try {
                        toast.info('Redirecting to Chapa payment portal...');
                        const token = localStorage.getItem('accessToken');
                        const { data } = await axios.post(`/api/payments/initiate/${order.orderNumber}`, {}, {
                          headers: { Authorization: `Bearer ${token}` }
                        });
                        if (data.checkout_url) {
                          window.location.href = data.checkout_url;
                        } else {
                          toast.error('Failed to get checkout URL.');
                        }
                      } catch (err) {
                        toast.error(getError(err));
                      }
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg text-sm flex items-center justify-center space-x-2 transition-colors shadow"
                  >
                    <span>Pay with Chapa</span>
                  </button>
                ) : (
                  <div className="bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg p-4 text-sm">
                    Payment actions for {order.paymentMethod} are not supported.
                  </div>
                )}
              </div>
            )}

            {userInfo.isAdmin && order.isPaid && !order.isDelivered && (
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={loadingDeliver}
                  onClick={deliverOrderHandler}
                  className="w-full bg-green-800 hover:bg-green-900 text-white font-bold py-3 rounded-lg text-sm flex items-center justify-center space-x-2 transition-colors shadow"
                >
                  {loadingDeliver ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></span>
                  ) : null}
                  <span>Mark as Delivered</span>
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
