// src/core/api/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🚀 Production backend
export const API_BASE_URL = 'https://earnx-backend-9z5t.onrender.com/api';
// 🧪 Local dev (uncomment and update IP as needed):
// export const API_BASE_URL = 'http://10.0.3.2:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Attach JWT on every request ───────────────────────────────────────────────
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch (_) {}
    return config;
  },
  (err) => Promise.reject(err)
);

// ── Handle 401 → clear session ────────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (!err.response) {
      const e = new Error('Network error — check WiFi / server connection');
      e.isNetworkError = true;
      return Promise.reject(e);
    }
    if (err.response?.status === 401) {
      try {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('refreshToken');
        await AsyncStorage.removeItem('userInfo');
      } catch (_) {}
    }
    return Promise.reject(err);
  }
);

export default api;