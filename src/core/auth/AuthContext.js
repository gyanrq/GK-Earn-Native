// src/core/auth/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const stored = await AsyncStorage.getItem('userInfo');
        if (token) {
          setUserToken(token);
          setUserInfo(stored ? JSON.parse(stored) : null);
        }
      } catch (_) {}
      setIsLoading(false);
    })();
  }, []);

  /**
   * Called after a successful login (password-only or MFA complete).
   *
   * Accepts the unwrapped payload:
   *   { accessToken, refreshToken, user: { id, name, email, phone, ... } }
   *
   * Also works with Google login which returns the same shape.
   */
  const login = async (payload) => {
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

  const updateUserInfo = async (updatedUser) => {
    const merged = { ...userInfo, ...updatedUser };
    await AsyncStorage.setItem('userInfo', JSON.stringify(merged));
    setUserInfo(merged);
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('userInfo');
    } catch (_) {}
    setUserToken(null);
    setUserInfo(null);
  };

  return (
    <AuthContext.Provider value={{ login, logout, updateUserInfo, isLoading, userToken, userInfo }}>
      {children}
    </AuthContext.Provider>
  );
};