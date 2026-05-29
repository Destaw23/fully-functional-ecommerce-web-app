import axios from 'axios';

const API_BASE = '/api/recommendations';

const getAuthHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
});

export const recommendationService = {
  getTrending: async (limit = 8) => {
    const response = await axios.get(`${API_BASE}/trending/`, {
      params: { limit },
    });
    return response.data;
  },

  getPersonalized: async (token, limit = 8) => {
    const response = await axios.get(`${API_BASE}/personalized/`, {
      params: { limit },
      headers: getAuthHeaders(token),
    });
    return response.data;
  },

  getRelated: async (productId, limit = 8) => {
    const response = await axios.get(`${API_BASE}/related/${productId}/`, {
      params: { limit },
    });
    return response.data;
  },

  getSimilar: async (productId, limit = 8) => {
    const response = await axios.get(`${API_BASE}/similar/${productId}/`, {
      params: { limit },
    });
    return response.data;
  },

  trackInteraction: async (productId, action, token) => {
    if (!productId || !token) return;

    try {
      await axios.post(
        `${API_BASE}/track/`,
        { product_id: productId, action },
        { headers: getAuthHeaders(token) }
      );
    } catch (error) {
      console.error('Failed to track recommendation interaction', error);
    }
  },
};
