// src/AppNavigator.tsx
// ─────────────────────────────────────────────────────────────────────────────
// UPDATED NAVIGATION FLOW:
//
//   App open → Landing Screen (public, attractive, no login needed)
//              ↓
//   User presses Login/Register → Auth Stack
//              ↓
//   After login → Main App (Dashboard tabs)
//
//   Token already saved → seedha Main App (no landing, no login)
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { useAuth } from './core/auth/AuthContext';

// Screens
import LandingScreen       from './features/home/LandingScreen';
import LoginScreen          from './features/auth/LoginScreen';
import RegisterScreen       from './features/auth/RegisterScreen';
import ForgotPasswordScreen from './features/auth/ForgotPasswordScreen';
import MainLayout           from './layouts/MainLayout';

const Stack = createStackNavigator();

// ── Splash / Loading ─────────────────────────────────────────────────────────
function SplashScreen() {
  return (
    <View style={styles.splash}>
      <ActivityIndicator size="large" color="#0d6efd" />
    </View>
  );
}

// ── Public Stack (Landing + Auth screens, no login needed) ───────────────────
function PublicStack() {
  return (
    <Stack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
      {/* Landing pehle dikhega */}
      <Stack.Screen name="Landing"       component={LandingScreen} />
      {/* Auth screens (optional — user tab hi jaata hai jab chahe) */}
      <Stack.Screen name="Login"          component={LoginScreen} />
      <Stack.Screen name="Register"       component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

// ── Root Navigator ────────────────────────────────────────────────────────────
export default function AppNavigator() {
  const { isLoading, userToken } = useAuth();

  // AsyncStorage se token load ho raha hai
  if (isLoading) return <SplashScreen />;

  return (
    <NavigationContainer>
      {userToken
        ? <MainLayout />   // ✅ Token hai → seedha Dashboard
        : <PublicStack />  // 🏠 Token nahi → Landing screen (Login optional)
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