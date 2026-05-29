import axios from 'axios';

const API_BASE = '/api/orders';

export const orderService = {
  createOrder: async (orderData) => {
    const response = await axios.post(`${API_BASE}/`, orderData);
    return response.data;
  },

  getOrder: async (orderId) => {
    const response = await axios.get(`${API_BASE}/${orderId}/`);
    return response.data;
  },

  getMyOrders: async () => {
    const response = await axios.get(`${API_BASE}/`);
    return response.data;
  },

  getAllOrders: async (params = {}) => {
    const response = await axios.get(`/api/admin/orders/`, { params });
    return response.data;
  },

  updateOrderStatus: async (orderId, statusData) => {
    const response = await axios.put(`/api/admin/orders/${orderId}/`, statusData);
    return response.data;
  },

  markOrderAsDelivered: async (orderId) => {
    const response = await axios.put(`${API_BASE}/${orderId}/deliver/`);
    return response.data;
  },

  markOrderAsPaid: async (orderId) => {
    const response = await axios.put(`${API_BASE}/${orderId}/pay/`);
    return response.data;
  },
};
