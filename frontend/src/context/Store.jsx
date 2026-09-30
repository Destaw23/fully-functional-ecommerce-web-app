import { createContext, useReducer } from 'react';
import { normalizeUser } from '../utils/auth';

export const Store = createContext();

const initialState = {
  fullBox: false,
  userInfo: (() => {
    const raw = localStorage.getItem('userInfo');
    if (!raw) return null;
    try {
      return normalizeUser(JSON.parse(raw));
    } catch {
      return null;
    }
  })(),
  accessToken: localStorage.getItem('accessToken') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,

  cart: {
    shippingAddress: localStorage.getItem('shippingAddress')
      ? JSON.parse(localStorage.getItem('shippingAddress'))
      : { location: {} },
    paymentMethod: localStorage.getItem('paymentMethod')
      ? localStorage.getItem('paymentMethod')
      : '',
    cartItems: localStorage.getItem('cartItems')
      ? JSON.parse(localStorage.getItem('cartItems'))
      : [],
  },
};

function reducer(state, action) {
  const getItemId = (item) => item._id || item.id;

  switch (action.type) {
    case 'SET_FULLBOX_ON':
      return { ...state, fullBox: true };
    case 'SET_FULLBOX_OFF':
      return { ...state, fullBox: false };

    case 'CART_ADD_ITEM': {
      const newItem = { ...action.payload, _id: getItemId(action.payload) };
      const existItem = state.cart.cartItems.find(
        (item) => getItemId(item) === getItemId(newItem)
      );
      const cartItems = existItem
        ? state.cart.cartItems.map((item) =>
            getItemId(item) === getItemId(existItem) ? newItem : item
          )
        : [...state.cart.cartItems, newItem];
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
      return { ...state, cart: { ...state.cart, cartItems } };
    }
    case 'CART_REMOVE_ITEM': {
      const removeId = getItemId(action.payload);
      const cartItems = state.cart.cartItems.filter(
        (item) => getItemId(item) !== removeId
      );
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
      return { ...state, cart: { ...state.cart, cartItems } };
    }
    case 'CART_CLEAR':
      localStorage.removeItem('cartItems');
      return { ...state, cart: { ...state.cart, cartItems: [] } };

    case 'USER_SIGNIN': {
      const user = normalizeUser(action.payload.user || action.payload);
      return {
        ...state,
        userInfo: user,
        accessToken: action.payload.access,
        refreshToken: action.payload.refresh,
      };
    }
    case 'USER_SIGNOUT':
      return {
        ...state,
        userInfo: null,
        accessToken: null,
        refreshToken: null,
        cart: {
          cartItems: [],
          shippingAddress: {},
          paymentMethod: '',
        },
      };
    case 'SAVE_SHIPPING_ADDRESS':
      return {
        ...state,
        cart: {
          ...state.cart,
          shippingAddress: action.payload,
        },
      };
    case 'SAVE_SHIPPING_ADDRESS_MAP_LOCATION':
      return {
        ...state,
        cart: {
          ...state.cart,
          shippingAddress: {
            ...state.cart.shippingAddress,
            location: action.payload,
          },
        },
      };

    case 'SAVE_PAYMENT_METHOD':
      return {
        ...state,
        cart: { ...state.cart, paymentMethod: action.payload },
      };
    default:
      return state;
  }
}

export function StoreProvider(props) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const value = { state, dispatch };
  return <Store.Provider value={value}>{props.children} </Store.Provider>;
}
