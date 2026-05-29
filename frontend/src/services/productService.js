import axios from 'axios';

const API_BASE = '/api/products';

export const productService = {
  getProducts: async (params = {}) => {
    const response = await axios.get(`${API_BASE}/`, { params });
    return response.data;
  },

  getProductBySlug: async (slug) => {
    const response = await axios.get(`${API_BASE}/slug/${slug}`);
    return response.data;
  },

  getProductById: async (id) => {
    const response = await axios.get(`${API_BASE}/${id}`);
    return response.data;
  },

  getCategories: async () => {
    const response = await axios.get(`${API_BASE}/categories/`);
    return response.data;
  },

  createProduct: async (productData) => {
    const response = await axios.post(`${API_BASE}/`, productData);
    return response.data;
  },

  updateProduct: async (id, productData) => {
    const response = await axios.put(`${API_BASE}/${id}`, productData);
    return response.data;
  },

  deleteProduct: async (id) => {
    const response = await axios.delete(`${API_BASE}/${id}`);
    return response.data;
  },

  addReview: async (productId, reviewData) => {
    const response = await axios.post(`${API_BASE}/${productId}/reviews`, reviewData);
    return response.data;
  },
};
