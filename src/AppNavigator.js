// src/AppNavigator.js
//
// ROOT NAVIGATOR
// ──────────────────────────────────────────────────────────────────────────────
// Behavior:
//   • App open karte waqt AsyncStorage mein token check hota hai.
//   • Token MILA  → seedha MainLayout (Dashboard tab) khulta hai  ✅
//   • Token NAHI  → Auth stack (Login screen) dikhta hai          🔒
//   • Logout karne par automatically Auth stack par redirect        🔄
// ──────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { useAuth } from './core/auth/AuthContext';   // userToken, isLoading

// Auth Screens
import LoginScreen          from './features/auth/LoginScreen';
import RegisterScreen       from './features/auth/RegisterScreen';
import ForgotPasswordScreen from './features/auth/ForgotPasswordScreen';

// Main App (tabs + nested screens)
import MainLayout from './layouts/MainLayout';

const Stack = createStackNavigator();

// ── Splash / Loading screen ───────────────────────────────────────────────────
function SplashScreen() {
  return (
    <View style={styles.splash}>
      <ActivityIndicator size="large" color="#0d6efd" />
    </View>
  );
}

// ── Auth Stack (login, register, forgot password) ─────────────────────────────
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login"          component={LoginScreen} />
      <Stack.Screen name="Register"       component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

// ── Root Navigator ─────────────────────────────────────────────────────────────
export default function AppNavigator() {
  const { isLoading, userToken } = useAuth();

  // Pehli baar AsyncStorage se token load ho raha hai — loading spinner dikhao
  if (isLoading) return <SplashScreen />;

  return (
    <NavigationContainer>
      {userToken
        ? <MainLayout />   // ✅ Token hai → Dashboard seedha khulta hai
        : <AuthStack />    // 🔒 Token nahi → Login screen
      }
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});