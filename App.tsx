// App.tsx / App.js — FINAL FIXED VERSION

import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, ActivityIndicator } from 'react-native';

// Providers
import { AuthProvider, AuthContext } from './src/core/auth/AuthContext';
import { ToastProvider } from './src/core/ui/ToastContext';
import ErrorBoundary from './src/core/ui/ErrorBoundary';
import { Colors, FontSize } from './src/core/theme/colors';

// Auth Screens
import LoginScreen from './src/features/auth/LoginScreen';
import RegisterScreen from './src/features/auth/RegisterScreen';
import ForgotPasswordScreen from './src/features/auth/ForgotPasswordScreen';

// Tab Screens
import DashboardScreen from './src/features/dashboard/DashboardScreen';
import TasksScreen from './src/features/tasks/TasksScreen';
import RewardsScreen from './src/features/rewards/RewardsScreen';
import SpinScreen from './src/features/spin/SpinScreen';
import SettingsScreen from './src/features/settings/SettingsScreen';

// Global Screens
import ReferralScreen from './src/features/referral/ReferralScreen';
import PayoutScreen from './src/features/payout/PayoutScreen';
import NotificationsScreen from './src/features/notifications/NotificationsScreen';
import CampaignScreen from './src/features/campaign/CampaignScreen';

// ================= NAVIGATORS =================
const Stack = createNativeStackNavigator();

// ✅ Proper Tab Param List (REAL FIX)
type TabParamList = {
  Home: undefined;
  Tasks: undefined;
  Spin: undefined;
  Rewards: undefined;
  Settings: undefined;
};

// ✅ Typed Tab Navigator
const Tab = createBottomTabNavigator<TabParamList>();

// ✅ Icons safe
const TAB_ICONS: Record<keyof TabParamList, string> = {
  Home: '🏠',
  Tasks: '🎯',
  Spin: '🎡',
  Rewards: '💰',
  Settings: '⚙️',
};

// ================= MAIN TABS =================
function MainTabs() {
  return (
    <Tab.Navigator id={undefined}
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: focused ? 24 : 20, opacity: focused ? 1 : 0.6 }}>
            {TAB_ICONS[route.name]}
          </Text>
        ),

        tabBarLabel: ({ focused, color }) => (
          <Text style={{ fontSize: 10, color, fontWeight: focused ? '700' : '400' }}>
            {route.name}
          </Text>
        ),

        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray,

        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: Colors.lightGray,
          elevation: 10,
        },
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen name="Spin" component={SpinScreen} />
      <Tab.Screen name="Rewards" component={RewardsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

// ================= APP STACK =================
function AppStack() {
  return (
    <Stack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Payout" component={PayoutScreen} />
      <Stack.Screen name="Referral" component={ReferralScreen} />
      <Stack.Screen name="Campaigns" component={CampaignScreen} />
    </Stack.Navigator>
  );
}

// ================= AUTH STACK =================
function AuthStack() {
  return (
    <Stack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

// ================= ROOT =================
function RootNavigator() {
  const { userToken, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>💎</Text>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: 12, color: Colors.gray, fontSize: FontSize.md, fontWeight: '700' }}>
          EarnX3
        </Text>
      </View>
    );
  }

  return userToken ? <AppStack /> : <AuthStack />;
}

// ================= APP ENTRY =================
export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}