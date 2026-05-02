// src/core/auth/AuthContext.tsx
// ─────────────────────────────────────────────────────────────────────────────
// FIXED v3:
// ✅ Network error pe token clear NAHI hoga (sirf 401/403 pe hoga)
// ✅ _clearSession me pehle state clear, phir storage (order fix)
// ✅ multiRemove hataya — loop use kiya (safe for all RN versions)
// ✅ isLoading false hone se pehle state consistent
// ✅ api.ts me isLoggingOut flag reset fix
// ─────────────────────────────────────────────────────────────────────────────

import React, {
  createContext, useState, useEffect, useContext, ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/api'; // ✅ static import

// ── Global logout callback (api.ts → AuthContext) ────────────────────────────
let _globalLogoutCallback: (() => void) | null = null;

export const setGlobalLogoutCallback = (cb: () => void) => {
  _globalLogoutCallback = cb;
};

export const triggerGlobalLogout = () => {
  _globalLogoutCallback?.();
};

// ── Types ───────────────────────────────────────────────────────────────────
interface UserInfo {
  id?: string | number;
  name?: string;
  email?: string;
  phone?: string;
  [key: string]: any;
}

interface AuthContextType {
  isLoading: boolean;
  userToken: string | null;
  userInfo: UserInfo | null;
  login: (payload: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUserInfo: (updatedUser: Partial<UserInfo>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

// ── Provider ────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userInfo, setUserInfo]   = useState<UserInfo | null>(null);

  // ── Internal session clear ────────────────────────────────────────────────
  // ✅ FIX: pehle state update karo, phir storage — race condition avoid
  const _clearSession = async () => {
    // State pehle clear karo (navigation seedha react karega)
    setUserToken(null);
    setUserInfo(null);

    // Phir storage clear karo
    try {
      const keys = ['userToken', 'refreshToken', 'userInfo'];
      for (const key of keys) {
        await AsyncStorage.removeItem(key);
      }
    } catch (e) {
      console.log('Storage clear error:', e);
    }
  };

  // ── Register global logout callback ───────────────────────────────────────
  useEffect(() => {
    setGlobalLogoutCallback(() => {
      _clearSession();
    });

    return () => {
      setGlobalLogoutCallback(() => {});
    };
  }, []);

  // ── Startup: token load + backend verify ─────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const token  = await AsyncStorage.getItem('userToken');
        const stored = await AsyncStorage.getItem('userInfo');

        if (token) {
          // ✅ Pehle token set karo — user logged in dikhega
          setUserToken(token);
          setUserInfo(stored ? JSON.parse(stored) : null);

          // ✅ FIX: Backend verify — SIRF 401/403 pe clear karo
          // Network error / timeout pe token mat hatao!
          try {
            await api.get('/auth/me');
            // ✅ Token valid hai — kuch mat karo
          } catch (verifyErr: any) {
            const status = verifyErr?.response?.status;

            if (status === 401 || status === 403) {
              // ✅ Token expired/invalid — tab hi logout karo
              console.log('Token invalid (401/403) — clearing session');
              await _clearSession();
            } else {
              // ⚠️ Network error, timeout, server down — token mat hatao!
              // User ka token valid ho sakta hai, bas internet nahi hai
              console.log('Verify skipped (network/server error):', verifyErr?.message);
            }
          }
        }
      } catch (e) {
        console.log('Startup error:', e);
        // Storage read fail hua — koi state change nahi
      }

      // ✅ Sab kuch hone ke baad loading false karo
      setIsLoading(false);
    })();
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = async (payload: any) => {
    const token = payload?.accessToken || payload?.token;
    if (!token) throw new Error('Token not received from server');

    const user = payload?.user || { name: 'User' };

    await AsyncStorage.setItem('userToken', token);

    if (payload?.refreshToken) {
      await AsyncStorage.setItem('refreshToken', payload.refreshToken);
    }

    await AsyncStorage.setItem('userInfo', JSON.stringify(user));

    setUserToken(token);
    setUserInfo(user);
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = async () => {
    await _clearSession();
  };

  // ── Update user info ──────────────────────────────────────────────────────
  const updateUserInfo = async (updatedUser: Partial<UserInfo>) => {
    const merged = { ...userInfo, ...updatedUser };
    await AsyncStorage.setItem('userInfo', JSON.stringify(merged));
    setUserInfo(merged);
  };

  return (
    <AuthContext.Provider
      value={{
        login,
        logout,
        updateUserInfo,
        isLoading,
        userToken,
        userInfo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};