// File: src/core/ui/ToastContext.js
// ✅ FIXED: Toast moved to top with a smooth slide-down animation to avoid keyboards

import React, { createContext, useState, useCallback, useRef } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';

export const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const slideAnim = useRef(new Animated.Value(-100)).current; // Start hidden above the screen

  const showToast = useCallback((message, type = 'success') => {
    setToast({ visible: true, message, type });
    
    // Slide Down
    Animated.timing(slideAnim, {
      toValue: 60, // Distance from top
      duration: 350,
      useNativeDriver: true,
    }).start();

    // Slide Up after 3 seconds
    setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: -150, // Move back off-screen
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
    top: 0, // Animation handles the actual Y positioning
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