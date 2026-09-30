import axios from 'axios';
import React, { useContext, useEffect, useReducer } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ShoppingCart, Trash2 } from 'lucide-react';
import LoadingBox from '../components/common/LoadingBox';
import MessageBox from '../components/common/MessageBox';
import { Store } from '../context/Store';
import { getError, getMediaUrl } from '../utils/helpers';

const reducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_REQUEST':
      return { ...state, loading: true, error: '' };
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, wishlist: action.payload, error: '' };
    case 'FETCH_FAIL':
      return { ...state, loading: false, error: action.payload };
    case 'REMOVE_ITEM':
      return {
        ...state,
        wishlist: state.wishlist.filter((item) => item.id !== action.payload),
      };
    default:
      return state;
  }
};

export default function WishlistScreen() {
  const { state, dispatch: ctxDispatch } = useContext(Store);
  const { userInfo, accessToken, cart } = state;
  const navigate = useNavigate();
  const [{ loading, error, wishlist }, dispatch] = useReducer(reducer, {
    loading: true,
    wishlist: [],
    error: '',
  });

  useEffect(() => {
    const fetchWishlist = async () => {
      dispatch({ type: 'FETCH_REQUEST' });
      try {
        const { data } = await axios.get('/api/products/wishlist/', {
          headers: { Authorization: `Bearer ${accessToken || localStorage.getItem('accessToken')}` },
        });
        const wishlistItems = Array.isArray(data) ? data : data.results || [];
        dispatch({ type: 'FETCH_SUCCESS', payload: wishlistItems });
      } catch (err) {
        dispatch({ type: 'FETCH_FAIL', payload: getError(err) });
      }
    };

    if (!userInfo) {
      dispatch({ type: 'FETCH_SUCCESS', payload: [] });
      return;
    }
    fetchWishlist();
  }, [userInfo, accessToken]);

  const getProductId = (item) => item._id || item.id;

  const addToCartHandler = (product) => {
    const existItem = cart.cartItems.find((x) => getProductId(x) === getProductId(product));
    const quantity = existItem ? existItem.quantity + 1 : 1;
    ctxDispatch({
      type: 'CART_ADD_ITEM',
      payload: { ...product, quantity, _id: getProductId(product) },
    });
    navigate('/cart');
  };

  const removeFromWishlist = async (productId) => {
    try {
      await axios.delete(
        '/api/products/wishlist/',
        {
          data: { product_id: productId },
          headers: { Authorization: `Bearer ${accessToken || localStorage.getItem('accessToken')}` },
        }
      );
      dispatch({ type: 'REMOVE_ITEM', payload: productId });
      toast.success('Removed from wishlist');
    } catch (err) {
      toast.error(getError(err));
    }
  };

  return (
    <div className="py-6 max-w-6xl mx-auto px-4">
      <Helmet>
        <title>My Wishlist</title>
      </Helmet>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">My Wishlist</h1>
          <p className="text-sm text-slate-500 mt-1">
            Save products you want to buy later and access them anytime.
          </p>
        </div>
      </div>

      {!userInfo ? (
        <MessageBox>
          Please <Link to="/signin?redirect=/wishlist" className="font-semibold text-blue-600 hover:underline">sign in</Link> to view your wishlist.
        </MessageBox>
      ) : loading ? (
        <LoadingBox />
      ) : error ? (
        <MessageBox variant="danger">{error}</MessageBox>
      ) : wishlist.length === 0 ? (
        <MessageBox>
          Your wishlist is empty. <Link to="/">Browse products</Link> to add some.
        </MessageBox>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {wishlist.map((item) => (
            <div key={item.id} className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="flex flex-col sm:flex-row gap-4 p-6">
                <div className="h-40 w-full max-w-[220px] overflow-hidden rounded-3xl bg-slate-50">
                  <img
                    src={getMediaUrl(item.product?.image || item.product?.main_image) || undefined}
                    alt={item.product?.name}
                    className="h-full w-full object-cover object-center block"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between gap-4">
                  <div className="space-y-3">
                    <div className="text-xs uppercase tracking-[0.25em] text-slate-400">
                      {item.product?.category_name || item.product?.category?.name || 'Electronics'}
                    </div>
                    <Link
                      to={`/product/${item.product?.slug}`}
                      className="text-lg font-bold text-slate-900 hover:text-brand-600 transition-colors"
                    >
                      {item.product?.name}
                    </Link>
                    <div className="flex flex-wrap gap-2 text-sm text-slate-500">
                      <span>Br{Number(item.product?.price || 0).toFixed(2)}</span>
                      <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-500">
                        {item.product?.condition || 'New'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={() => navigate(`/product/${item.product?.slug}`)}
                      className="btn-outline px-4 py-2 text-sm"
                    >
                      View Product
                    </button>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => addToCartHandler(item.product)}
                        className="btn-primary px-4 py-2 text-sm"
                      >
                        <ShoppingCart size={16} />
                        <span>Add to Cart</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromWishlist(item.product?.id)}
                        className="btn-secondary px-4 py-2 text-sm"
                      >
                        <Trash2 size={16} />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
