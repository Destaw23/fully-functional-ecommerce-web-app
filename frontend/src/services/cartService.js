import axios from 'axios';

const API_BASE = '/api/cart';

export const cartService = {
  getCart: async () => {
    const response = await axios.get(`${API_BASE}/`);
    return response.data;
  },

  addToCart: async (productId, quantity) => {
    const response = await axios.post(`${API_BASE}/add/`, { product_id: productId, quantity });
    return response.data;
  },

  updateCartItem: async (itemId, quantity) => {
    const response = await axios.put(`${API_BASE}/update/${itemId}/`, { quantity });
    return response.data;
  },

  removeFromCart: async (itemId) => {
    const response = await axios.delete(`${API_BASE}/remove/${itemId}/`);
    return response.data;
  },

  clearCart: async () => {
    const response = await axios.post(`${API_BASE}/clear/`);
    return response.data;
  },
};
