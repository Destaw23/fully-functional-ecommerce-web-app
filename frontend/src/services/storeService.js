import axios from 'axios';

const API_BASE = '/api/stores';

export const storeService = {
  getStores: async (params = {}) => {
    const response = await axios.get(`${API_BASE}/`, { params });
    return response.data;
  },

  getStoreDetail: async (identifier) => {
    const response = await axios.get(`${API_BASE}/${identifier}/`);
    return response.data;
  },

  getStoreProducts: async (identifier, params = {}) => {
    const response = await axios.get(`${API_BASE}/${identifier}/products/`, { params });
    return response.data;
  },

  registerStore: async (formData) => {
    const response = await axios.post(`${API_BASE}/`, formData);
    return response.data;
  },

  getMyStore: async () => {
    const response = await axios.get(`${API_BASE}/my-store/`);
    return response.data;
  },

  updateMyStore: async (formData) => {
    const response = await axios.patch(`${API_BASE}/my-store/`, formData);
    return response.data;
  },

  getMyStoreAnalytics: async () => {
    const response = await axios.get(`${API_BASE}/my-store/analytics/`);
    return response.data;
  },

  getMyStoreProducts: async () => {
    const response = await axios.get(`${API_BASE}/my-store/products/`);
    return response.data;
  },

  createVendorProduct: async (formData) => {
    const response = await axios.post(`${API_BASE}/my-store/products/`, formData);
    return response.data;
  },

  updateVendorProduct: async (id, formData) => {
    const response = await axios.patch(`${API_BASE}/my-store/products/${id}/`, formData);
    return response.data;
  },

  deleteVendorProduct: async (id) => {
    const response = await axios.delete(`${API_BASE}/my-store/products/${id}/`);
    return response.data;
  },

  deleteMyStore: async () => {
    const response = await axios.delete(`${API_BASE}/my-store/`);
    return response.data;
  },

  getAdminStores: async () => {
    const response = await axios.get(`${API_BASE}/admin/list/`);
    return response.data;
  },

  createAdminStore: async (formData) => {
    const response = await axios.post(`${API_BASE}/admin/list/`, formData);
    return response.data;
  },

  updateAdminStore: async (id, data) => {
    const response = await axios.patch(`${API_BASE}/admin/${id}/`, data);
    return response.data;
  },

  deleteAdminStore: async (id) => {
    const response = await axios.delete(`${API_BASE}/admin/${id}/`);
    return response.data;
  },
};
