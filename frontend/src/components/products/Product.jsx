import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Rating from '../common/Rating';
import axios from 'axios';
import { toast } from 'react-toastify';
import { getError, getMediaUrl } from '../../utils/helpers';
import { Store } from '../../context/Store';
import { recommendationService } from '../../services/recommendationService';
import { ShoppingCart, Heart } from 'lucide-react';

export default function Product(props) {
  const { product } = props;
  const navigate = useNavigate();

  const { state, dispatch: ctxDispatch } = useContext(Store);
  const {
    cart: { cartItems },
    userInfo,
    accessToken,
  } = state;

  const getProductId = (item) => item._id || item.id;
  const getStockCount = (data) =>
    data.countInStock ?? data.stock_quantity ?? (data.is_in_stock ? 10 : 0);

  const openProductDetail = () => {
    const authToken = accessToken || localStorage.getItem('accessToken');
    void recommendationService.trackInteraction(getProductId(product), 'view', authToken);
    navigate(`/product/${product.slug}`);
  };

  const addToCartHandler = async (event, item) => {
    event.stopPropagation();

    const existItem = cartItems.find((x) => getProductId(x) === getProductId(product));
    const quantity = existItem ? existItem.quantity + 1 : 1;

    let availableStock = item.countInStock ?? item.stock_quantity ?? (item.is_in_stock ? 10 : 0);
    try {
      const { data } = await axios.get(`/api/products/slug/${item.slug}`);
      availableStock = getStockCount(data);
    } catch (err) {
      console.error('Unable to refresh stock count:', err);
    }

    if (availableStock < quantity) {
      window.alert('Sorry. Product is out of stock');
      return;
    }

    ctxDispatch({
      type: 'CART_ADD_ITEM',
      payload: { ...item, quantity, countInStock: availableStock, _id: getProductId(item) },
    });

    const authToken = accessToken || localStorage.getItem('accessToken');
    void recommendationService.trackInteraction(getProductId(item), 'add_to_cart', authToken);
  };

  const addToWishlistHandler = async (event) => {
    event.stopPropagation();

    if (!userInfo) {
      navigate(`/signin?redirect=/product/${product.slug}`);
      return;
    }

    try {
      await axios.post(
        '/api/products/wishlist/',
        { product: getProductId(product) },
        {
          headers: {
            Authorization: `Bearer ${accessToken || localStorage.getItem('accessToken')}`,
          },
        }
      );
      const authToken = accessToken || localStorage.getItem('accessToken');
      void recommendationService.trackInteraction(getProductId(product), 'wishlist', authToken);
      toast.success('Added to wishlist');
    } catch (err) {
      toast.error(getError(err));
    }
  };

  const outOfStock = product.countInStock === 0;

  return (
    <article
      className="product-card group w-full cursor-pointer"
      role="link"
      tabIndex={0}
      onClick={openProductDetail}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openProductDetail();
        }
      }}
      aria-label={`View ${product.name} details`}
    >
      <div className="relative block aspect-square overflow-hidden rounded-3xl bg-gradient-to-br from-slate-50 to-slate-100 p-3">
        <img
          src={getMediaUrl(product.image || product.main_image) || undefined}
          alt={product.name}
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
          }}
          className="h-full w-full object-contain object-center block"
        />
        <button
          type="button"
          onClick={addToWishlistHandler}
          className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 text-slate-700 shadow-soft transition hover:bg-red-500 hover:text-white active:bg-red-600 focus:bg-red-500 focus:text-white"
          aria-label="Add to wishlist"
        >
          <Heart size={16} />
        </button>
        {product.brand && (
          <span className="absolute left-3 top-3 rounded-lg bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600 shadow-soft backdrop-blur-sm">
            {product.brand}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between p-3 sm:p-4">
        <div className="space-y-2">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-slate-800 transition-colors group-hover:text-brand-600">
            {product.name}
          </h3>
          <Rating rating={product.rating} numReviews={product.numReviews} />
          <p className="text-base font-bold text-slate-900">Br{Number(product.price).toLocaleString()}</p>
        </div>

        <div className="pt-3">
          {outOfStock ? (
            <button
              className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 py-2 text-center text-xs font-semibold text-slate-400"
              disabled
              type="button"
              onClick={(e) => e.stopPropagation()}
            >
              Out of Stock
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => addToCartHandler(e, product)}
              className="btn-primary w-full !py-2 text-xs !bg-green-800 hover:!bg-green-900"
            >
              <ShoppingCart size={15} strokeWidth={2.5} />
              <span>Add to Cart</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
