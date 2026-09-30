import { useContext } from 'react';
import { Store } from '../context/Store';
import { Helmet } from 'react-helmet-async';
import MessageBox from '../components/common/MessageBox';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Trash2, Minus, Plus } from 'lucide-react';
import { getMediaUrl } from '../utils/helpers';

export default function CartScreen() {
  const navigate = useNavigate();
  const { state, dispatch: ctxDispatch } = useContext(Store);
  const {
    cart: { cartItems },
  } = state;

  const getProductId = (item) => item._id || item.id;
  const getStockCount = (data) =>
    data.countInStock ?? data.stock_quantity ?? (data.is_in_stock ? 10 : 0);

  const getMaxStock = (item) =>
    item.countInStock ?? item.stock_quantity ?? (item.is_in_stock ? 10 : 0);

  const setItemQuantity = async (item, quantity) => {
    if (quantity < 1) {
      removeItemHandler(item);
      return;
    }

    let availableStock = getMaxStock(item);

    try {
      if (item.slug) {
        const { data } = await axios.get(`/api/products/slug/${item.slug}`);
        availableStock = getStockCount(data);
      }
    } catch (err) {
      console.warn('Could not refresh stock; using cart value.', err);
    }

    if (quantity > availableStock) {
      window.alert(`Only ${availableStock} available in stock`);
      return;
    }

    ctxDispatch({
      type: 'CART_ADD_ITEM',
      payload: {
        ...item,
        quantity,
        countInStock: availableStock,
        _id: getProductId(item),
      },
    });
  };

  const increaseQuantity = (item) => {
    setItemQuantity(item, item.quantity + 1);
  };

  const decreaseQuantity = (item) => {
    setItemQuantity(item, item.quantity - 1);
  };

  const removeItemHandler = (item) => {
    ctxDispatch({ type: 'CART_REMOVE_ITEM', payload: { ...item, _id: getProductId(item) } });
  };

  const checkoutHandler = () => {
    navigate('/signin?redirect=/shipping');
  };

  const totalItems = cartItems.reduce((a, c) => a + c.quantity, 0);
  const totalPrice = cartItems.reduce((a, c) => a + c.price * c.quantity, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <Helmet>
        <title>Shopping Cart — ElectroMerce</title>
      </Helmet>

      <div>
        <h1 className="section-heading">Shopping cart</h1>
        <p className="section-subheading text-yellow-900">Review items before checkout</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {cartItems.length === 0 ? (
            <MessageBox>
              Cart is empty.{' '}
              <Link to="/" className="link-brand">
                Go shopping
              </Link>
            </MessageBox>
          ) : (
            <div className="card-elevated divide-y divide-slate-100 overflow-hidden">
              {cartItems.map((item) => {
                const maxStock = getMaxStock(item);
                const lineTotal = Number(item.price) * item.quantity;

                return (
                  <div
                    key={getProductId(item)}
                    className="flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center"
                  >
                    <div className="flex flex-1 items-center gap-4">
                      <img
                        src={getMediaUrl(item.image || item.main_image)}
                        alt={item.name}
                        className="h-16 w-16 shrink-0 rounded-xl border border-slate-200 bg-slate-50 object-cover"
                      />
                      <div>
                        <Link
                          to={`/product/${item.slug}`}
                          className="line-clamp-1 text-sm font-semibold text-slate-800 transition-colors hover:text-brand-600"
                        >
                          {item.name}
                        </Link>
                        <p className="text-xs text-slate-400">
                          {maxStock} in stock · Br{Number(item.price).toLocaleString()} each
                        </p>
                      </div>
                    </div>

                    <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end sm:gap-6">
                      <div
                        className="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                        role="group"
                        aria-label={`Quantity for ${item.name}`}
                      >
                        <button
                          type="button"
                          onClick={() => decreaseQuantity(item)}
                          className="p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="min-w-[2.5rem] px-3 text-center text-sm font-bold text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => increaseQuantity(item)}
                          disabled={item.quantity >= maxStock}
                          className="p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"
                          aria-label="Increase quantity"
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      <div className="min-w-[5rem] text-right text-sm font-bold text-slate-900">
                        Br{lineTotal.toLocaleString()}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItemHandler(item)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        title="Remove item"
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card-elevated h-fit space-y-6 p-6">
          <h3 className="border-b border-slate-100 pb-3 text-base font-bold text-slate-800">
            Order summary
          </h3>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Items ({totalItems})</span>
            <span className="text-lg font-bold text-slate-900">
              Br{totalPrice.toLocaleString()}
            </span>
          </div>

          <button
            type="button"
            onClick={checkoutHandler}
            disabled={cartItems.length === 0}
            className="btn-primary w-full !py-3 !bg-green-800 hover:!bg-green-900"
          >
            Proceed to checkout
          </button>
        </div>
      </div>
    </div>
  );
}
