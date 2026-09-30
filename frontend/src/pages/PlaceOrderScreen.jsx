import axios from 'axios';
import React, { useContext, useEffect, useReducer } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { Store } from '../context/Store';
import CheckoutSteps from '../components/layout/CheckoutSteps';
import LoadingBox from '../components/common/LoadingBox';
import { toast } from 'react-toastify';
import { getError, getMediaUrl } from '../utils/helpers';
import { Package, Truck, CreditCard, ArrowRight } from 'lucide-react';

const reducer = (state, action) => {
  switch (action.type) {
    case 'CREATE_REQUEST':
      return { ...state, loading: true };
    case 'CREATE_SUCCESS':
      return { ...state, loading: false };
    case 'CREATE_FAIL':
      return { ...state, loading: false };
    default:
      return state;
  }
};

export default function PlaceOrderScreen() {
  const navigate = useNavigate();

  const [{ loading }, dispatch] = useReducer(reducer, {
    loading: false,
  });

  const { state, dispatch: ctxDispatch } = useContext(Store);
  const { cart, userInfo, accessToken } = state;

  const round2 = (num) => Math.round(num * 100 + Number.EPSILON) / 100;

  cart.itemsPrice = round2(
    cart.cartItems.reduce((a, c) => a + c.quantity * c.price, 0)
  );
  cart.shippingPrice = cart.itemsPrice > 100 ? round2(0) : round2(10);
  cart.taxPrice = round2(0.15 * cart.itemsPrice);
  cart.totalPrice = cart.itemsPrice + cart.shippingPrice + cart.taxPrice;

  const placeOrderHandler = async () => {
    if (!cart.shippingAddress?.phone) {
      toast.error('Please enter your phone number in the shipping address.');
      return;
    }

    try {
      dispatch({ type: 'CREATE_REQUEST' });

      const { data } = await axios.post(
        '/api/orders',
        {
          orderItems: cart.cartItems,
          shippingAddress: cart.shippingAddress,
          paymentMethod: cart.paymentMethod,
          itemsPrice: cart.itemsPrice,
          shippingPrice: cart.shippingPrice,
          taxPrice: cart.taxPrice,
          totalPrice: cart.totalPrice,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken || userInfo?.token || localStorage.getItem('accessToken')}`,
          },
        }
      );
      ctxDispatch({ type: 'CART_CLEAR' });
      dispatch({ type: 'CREATE_SUCCESS' });
      localStorage.removeItem('cartItems');
      const orderId = data.order?._id || data.order?.id;
      navigate(`/order/${orderId}`);
    } catch (err) {
      dispatch({ type: 'CREATE_FAIL' });
      toast.error(getError(err));
    }
  };

  useEffect(() => {
    if (!cart.paymentMethod) {
      navigate('/payment');
    }
  }, [cart, navigate]);

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Preview Order</title>
      </Helmet>

      <CheckoutSteps step1 step2 step3 step4></CheckoutSteps>

      <h1 className="text-2xl font-black text-slate-800 tracking-tight">Preview Order</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Side: Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Address */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-800 text-base flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Truck className="text-blue-600" size={18} />
              <span>Shipping Information</span>
            </h2>
            <div className="text-sm text-slate-600 space-y-1">
              <p><strong>Name:</strong> {cart.shippingAddress.fullName}</p>
              <p>
                <strong>Address:</strong> {cart.shippingAddress.address},{' '}
                {cart.shippingAddress.city}, {cart.shippingAddress.postalCode},{' '}
                {cart.shippingAddress.country}
              </p>
              <p><strong>Phone:</strong> {cart.shippingAddress.phone || 'N/A'}</p>
            </div>
            <Link to="/shipping" className="text-xs text-blue-600 hover:text-blue-700 font-bold hover:underline">
              Edit Address
            </Link>
          </div>

          {/* Payment Method */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-800 text-base flex items-center space-x-2 border-b border-slate-100 pb-3">
              <CreditCard className="text-blue-600" size={18} />
              <span>Payment Details</span>
            </h2>
            <p className="text-sm text-slate-600">
              <strong>Method:</strong> {cart.paymentMethod}
            </p>
            <Link to="/payment" className="text-xs text-blue-600 hover:text-blue-700 font-bold hover:underline">
              Edit Method
            </Link>
          </div>

          {/* Cart Items list */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-800 text-base flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Package className="text-blue-600" size={18} />
              <span>Review Items</span>
            </h2>
            <div className="divide-y divide-slate-100">
              {cart.cartItems.map((item) => (
                <div key={item._id} className="flex items-center justify-between py-3.5 gap-4">
                  <div className="flex items-center space-x-4">
                    <img
                      src={getMediaUrl(item.image || item.main_image)}
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
            <Link to="/cart" className="text-xs text-blue-600 hover:text-blue-700 font-bold hover:underline">
              Edit Cart
            </Link>
          </div>
        </div>

        {/* Right Side: Summary Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-fit space-y-6">
          <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-3">Order Summary</h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Items Total</span>
              <span className="font-semibold text-slate-800">Br{cart.itemsPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Shipping cost</span>
              <span className="font-semibold text-slate-800">
                {cart.shippingPrice === 0 ? <span className="text-green-600 font-bold">FREE</span> : `Br${cart.shippingPrice.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Estimated Tax (15%)</span>
              <span className="font-semibold text-slate-800">Br{cart.taxPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Contact</span>
              <span className="font-semibold text-slate-800">{cart.shippingAddress.phone || 'N/A'}</span>
            </div>
            <div className="pt-4 border-t border-slate-100 flex justify-between text-base font-black text-slate-900">
              <span>Order Total</span>
              <span>Br{cart.totalPrice.toFixed(2)}</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={placeOrderHandler}
              disabled={cart.cartItems.length === 0 || loading}
              className="w-full bg-green-800 hover:bg-green-900 text-white font-bold py-3 rounded-lg text-sm flex items-center justify-center space-x-2 transition-colors shadow disabled:opacity-50"
            >
              <span>{loading ? 'Processing...' : 'Place Order'}</span>
              <ArrowRight size={16} />
            </button>
            {loading && <LoadingBox></LoadingBox>}
          </div>
        </div>

      </div>
    </div>
  );
}
