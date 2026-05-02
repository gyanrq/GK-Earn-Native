// src/core/ui/ToastContext.tsx
import React, { createContext, useState, useCallback, useRef, ReactNode } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const ToastContext = createContext<ToastContextType>({} as ToastContextType);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const slideAnim = useRef(new Animated.Value(-100)).current;

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ visible: true, message, type });

    Animated.timing(slideAnim, {
      toValue: 60,
      duration: 350,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: -150,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setToast({ visible: false, message: '', type: 'success' }));
    }, 3000);
  }, [slideAnim]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast.visible && (
        <Animated.View style={[
            styles.toastContainer,
            { transform: [{ translateY: slideAnim }] },
            toast.type === 'error' ? styles.errorBg : styles.successBg
        ]}>
          <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    zIndex: 9999,
  },
  successBg: { backgroundColor: '#28a745' },
  errorBg: { backgroundColor: '#dc3545' },
  toastText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
});
