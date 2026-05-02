// src/core/api/api.ts
// ─────────────────────────────────────────────────────────────────────────────
// FIXED v2:
// ✅ isLoggingOut flag reset kiya (warna ek baar ke baad logout kaam nahi karta)
// ✅ multiRemove nahi — loop use kiya
// ✅ Network error pe logout nahi — sirf 401 pe
// ─────────────────────────────────────────────────────────────────────────────

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { triggerGlobalLogout } from '../auth/AuthContext';

export const API_BASE_URL = 'https://earnx-backend-9z5t.onrender.com/api'; // Production

// Use 10.0.2.2 for Android emulator, or your PC's LAN IP for real device
// e.g. 'http://192.168.1.5:8080/api'  ← replace with your PC's IP

//export const API_BASE_URL = 'http://10.0.2.2:8080/api'; // Android emulator
// export const API_BASE_URL = 'http://192.168.X.X:8080/api';   // Real device → replace X.X with your IP
// export const API_BASE_URL = 'https://earnx-backend-9z5t.onrender.com/api'; // Production
//export const API_BASE_URL = 'http://10.0.3.2:8080/api';


const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: token attach karo ───────────────────────────────────
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.log('Token fetch error:', e);
    }
    return config;
  },
  (err: any) => Promise.reject(err)
);

// ── Response interceptor: 401 pe force logout ────────────────────────────────
let isLoggingOut = false;

api.interceptors.response.use(
  (res) => {
    // ✅ FIX: Successful response pe flag reset karo
    isLoggingOut = false;
    return res;
  },
  async (err: any) => {
    // Network error (no response)
    if (!err.response) {
      const e: Error & { isNetworkError?: boolean } = new Error(
        'Network error — check WiFi / server connection'
      );
      e.isNetworkError = true;
      return Promise.reject(e);
    }

    // 401 pe logout — but sirf ek baar (infinite loop prevent)
    if (err.response?.status === 401 && !isLoggingOut) {
      isLoggingOut = true;

      try {
        const keys = ['userToken', 'refreshToken', 'userInfo'];
        for (const key of keys) {
          await AsyncStorage.removeItem(key);
        }
      } catch (e) {
        console.log('Storage clear error:', e);
      }

      // AuthContext ko trigger karo
      triggerGlobalLogout();

      // ✅ FIX: thodi der baad flag reset karo (next login ke liye)
      setTimeout(() => {
        isLoggingOut = false;
      }, 3000);
    }

    return Promise.reject(err);
  }
);

export default api;