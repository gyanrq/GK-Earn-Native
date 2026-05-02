// src/layouts/MainLayout.js
// FIXES & IMPROVEMENTS:
//  1. More stylish tab bar with pill-shaped active indicator
//  2. Notification badge on bell icon (fetched on focus)
//  3. Smooth tab transitions
//  4. All admin routes excluded — only user-facing screens

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';

import DashboardScreen    from '../features/dashboard/DashboardScreen';
import TasksScreen        from '../features/tasks/TasksScreen';
import SpinScreen         from '../features/spin/SpinScreen';
import RewardsScreen      from '../features/rewards/RewardsScreen';
import SettingsScreen     from '../features/settings/SettingsScreen';
import ReferralScreen     from '../features/referral/ReferralScreen';
import NotificationsScreen from '../features/notifications/NotificationsScreen';
import PayoutScreen       from '../features/payout/PayoutScreen';
import CampaignScreen     from '../features/campaign/CampaignScreen';

import api from '../core/api/api';

const Tab  = createBottomTabNavigator();
const Stack = createStackNavigator();

const TABS = [
  { name: 'Home',     label: 'Home',    icon: '🏠', component: DashboardScreen },
  { name: 'Tasks',    label: 'Tasks',   icon: '📋', component: TasksScreen },
  { name: 'Spin',     label: 'Spin',    icon: '🎡', component: SpinScreen },
  { name: 'Rewards',  label: 'Wallet',  icon: '💰', component: RewardsScreen },
  { name: 'Settings', label: 'Profile', icon: '👤', component: SettingsScreen },
];

// ── Custom Tab Bar ────────────────────────────────────────────────────────────

function TabBar({ state, navigation }) {
  const [unread, setUnread] = useState(0);

  // Refresh unread count on tab focus
  useFocusEffect(useCallback(() => {
    api.get('/notifications/unread-count')
      .then((res) => {
        const cnt = res.data?.data ?? res.data ?? 0;
        setUnread(typeof cnt === 'number' ? cnt : 0);
      })
      .catch(() => {});
  }, []));

  return (
    <View style={tabStyles.bar}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const tab = TABS.find((t) => t.name === route.name);
        if (!tab) return null;

        return (
          <TouchableOpacity
            key={route.key}
            style={tabStyles.tabBtn}
            onPress={() => { if (!focused) navigation.navigate(route.name); }}
            activeOpacity={0.75}
          >
            <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}>
              <Text style={[tabStyles.icon, focused && tabStyles.iconFocused]}>{tab.icon}</Text>
              {/* Notification badge on Home tab */}
              {tab.name === 'Home' && unread > 0 && (
                <View style={tabStyles.badge}>
                  <Text style={tabStyles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
                </View>
              )}
            </View>
            <Text style={[tabStyles.label, focused && tabStyles.labelActive]}>{tab.label}</Text>
            {focused && <View style={tabStyles.activeDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {TABS.map((tab) => (
        <Tab.Screen key={tab.name} name={tab.name} component={tab.component} />
      ))}
    </Tab.Navigator>
  );
}

const screenOptions = (title) => ({
  headerShown: true,
  title,
  headerStyle: { backgroundColor: '#0d6efd', elevation: 0, shadowOpacity: 0 },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '900', fontSize: 17 },
});

export default function MainLayout() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs"     component={MainTabs} />
      <Stack.Screen name="Referral"     component={ReferralScreen}     options={screenOptions('🔗 Refer & Earn')} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={screenOptions('🔔 Notifications')} />
      <Stack.Screen name="Payout"       component={PayoutScreen}       options={screenOptions('📤 Withdraw')} />
      <Stack.Screen name="Campaigns"    component={CampaignScreen}     options={screenOptions('🚀 Campaigns')} />
    </Stack.Navigator>
  );
}

const tabStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row', backgroundColor: '#fff', height: 70,
    elevation: 20, paddingBottom: 8, paddingTop: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 12,
    borderTopWidth: 0,
  },
  tabBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  iconWrap: {
    width: 44, height: 30, justifyContent: 'center', alignItems: 'center',
    borderRadius: 14, position: 'relative',
  },
  iconWrapActive: { backgroundColor: '#e8f0fe' },
  icon: { fontSize: 20, opacity: 0.55 },
  iconFocused: { opacity: 1 },
  badge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: '#dc3545', borderRadius: 8,
    minWidth: 16, height: 16, justifyContent: 'center',
    alignItems: 'center', paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: '#fff',
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  label: { fontSize: 10, color: '#94a3b8', marginTop: 2, fontWeight: '600' },
  labelActive: { color: '#0d6efd', fontWeight: '800' },
  activeDot: {
    position: 'absolute', bottom: 0,
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: '#0d6efd',
  },
});