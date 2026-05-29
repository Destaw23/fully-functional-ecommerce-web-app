import axios from 'axios';

const API_BASE = '/api/auth';

export const authService = {
  login: async (email, password) => {
    const response = await axios.post(`${API_BASE}/login/`, { email, password });
    return response.data;
  },

  register: async (username, email, password, password2) => {
    const response = await axios.post(`${API_BASE}/register/`, {
      username,
      email,
      password,
      password2,
    });
    return response.data;
  },

  logout: async (refreshToken) => {
    const response = await axios.post(`${API_BASE}/logout/`, { refresh: refreshToken });
    return response.data;
  },

  getProfile: async () => {
    const response = await axios.get(`${API_BASE}/profile/`);
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await axios.put(`${API_BASE}/profile/`, profileData);
    return response.data;
  },

  changePassword: async (oldPassword, newPassword, confirmPassword) => {
    const response = await axios.post(`${API_BASE}/change-password/`, {
      old_password: oldPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    return response.data;
  },
};
