// src/features/dashboard/DashboardScreen.js
import React, { useState, useCallback, useContext, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, StatusBar, Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../core/auth/AuthContext';
import { Card, LoadingScreen, Badge, SectionHeader } from '../../core/ui';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../core/theme/colors';
import api from '../../core/api/api';

export default function DashboardScreen({ navigation }) {
  const { userInfo } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [dashRes, notifRes] = await Promise.all([
        api.get('/users/dashboard'),
        api.get('/notifications/unread-count').catch(() => ({ data: { data: 0 } })),
      ]);
      // FIX: Backend returns totalCredits not creditBalance
      setData(dashRes.data.data || dashRes.data);
      // FIX: unread count is wrapped in ApiResponse as data.data
      const cnt = notifRes.data?.data ?? notifRes.data ?? 0;
      setUnreadCount(typeof cnt === 'number' ? cnt : 0);
    } catch (e) {
      console.log('Dashboard error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    load();
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [load]));

  if (loading) return <LoadingScreen message="Loading your dashboard..." />;

  const name = (data?.name || userInfo?.name || 'User').split(' ')[0];
  // FIX: correct field name from API
  const balance = data?.totalCredits || 0;
  const totalReferrals = data?.totalReferrals || 0;
  const successfulReferrals = data?.successfulReferrals || 0;
  const emailVerified = data?.emailVerified || false;
  const pendingLeads = data?.pendingLeads || 0;
  const rewardedLeads = data?.rewardedLeads || 0;

  const quickActions = [
    { icon: '🎯', label: 'Daily Tasks', screen: 'Tasks', color: '#e3f2fd', accent: '#1565c0' },
    { icon: '🎡', label: 'Spin Wheel', screen: 'Spin', color: '#f3e5f5', accent: '#6a1b9a' },
    { icon: '👥', label: 'Refer & Earn', screen: 'Referral', color: '#e8f5e9', accent: '#2e7d32' },
    { icon: '💰', label: 'My Wallet', screen: 'Rewards', color: '#fff8e1', accent: '#f57f17' },
    { icon: '📤', label: 'Withdraw', screen: 'Payout', color: '#fce4ec', accent: '#c62828' },
    { icon: '🚀', label: 'Campaigns', screen: 'Campaigns', color: '#e0f2f1', accent: '#00695c' },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[Colors.primary]} />}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Hero Header */}
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <Text style={styles.greeting}>Hi, {name} 👋</Text>
            <Text style={styles.subGreeting}>Welcome back to GK Earn!</Text>
          </Animated.View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            style={styles.notifBtn}
          >
            <Text style={styles.notifIcon}>🔔</Text>
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <Animated.View style={[styles.balanceCard, { opacity: fadeAnim }]}>
          <Text style={styles.balanceLabel}>💎 Credit Balance</Text>
          <Text style={styles.balanceValue}>{balance.toLocaleString()}</Text>
          <Text style={styles.balanceSub}>≈ ₹{(balance / 100).toFixed(2)}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Payout')} style={styles.withdrawBtn}>
            <Text style={styles.withdrawBtnText}>Withdraw Now →</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{successfulReferrals}</Text>
            <Text style={styles.statLabel}>Referrals ✅</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{rewardedLeads}</Text>
            <Text style={styles.statLabel}>Tasks Done</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: emailVerified ? '#69f0ae' : '#ffd740' }]}>
              {emailVerified ? '✓' : '!'}
            </Text>
            <Text style={styles.statLabel}>{emailVerified ? 'Verified' : 'Unverified'}</Text>
          </View>
        </View>
      </View>

      {/* Email Verification Warning */}
      {!emailVerified && (
        <TouchableOpacity style={styles.verifyBanner} onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.verifyBannerText}>⚠️ Please verify your email to unlock withdrawals →</Text>
        </TouchableOpacity>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <SectionHeader title="Quick Actions" />
        <View style={styles.actionsGrid}>
          {quickActions.map((item) => (
            <TouchableOpacity
              key={item.screen}
              style={[styles.actionCard, { backgroundColor: item.color, borderBottomWidth: 3, borderBottomColor: item.accent + '55' }]}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.75}
            >
              <Text style={styles.actionIcon}>{item.icon}</Text>
              <Text style={[styles.actionLabel, { color: item.accent }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.section}>
        <SectionHeader title="Today's Activity" />
        <View style={styles.statsCards}>
          <View style={[styles.miniCard, { backgroundColor: '#e8f5e9' }]}>
            <Text style={styles.miniCardIcon}>🎯</Text>
            <Text style={styles.miniCardVal}>{rewardedLeads}</Text>
            <Text style={styles.miniCardLbl}>Tasks Done</Text>
          </View>
          <View style={[styles.miniCard, { backgroundColor: '#e3f2fd' }]}>
            <Text style={styles.miniCardIcon}>👥</Text>
            <Text style={styles.miniCardVal}>{totalReferrals}</Text>
            <Text style={styles.miniCardLbl}>Total Refs</Text>
          </View>
          <View style={[styles.miniCard, { backgroundColor: '#fff8e1' }]}>
            <Text style={styles.miniCardIcon}>⏳</Text>
            <Text style={styles.miniCardVal}>{pendingLeads}</Text>
            <Text style={styles.miniCardLbl}>Pending</Text>
          </View>
        </View>
      </View>

      {/* Referral Code */}
      {(data?.referralCode || userInfo?.referralCode) ? (
        <View style={styles.section}>
          <Card style={styles.referralCard}>
            <Text style={styles.referralTitle}>🎁 Your Referral Code</Text>
            <View style={styles.codeBox}>
              <Text style={styles.referralCode}>{data?.referralCode || userInfo?.referralCode}</Text>
            </View>
            <Text style={styles.referralHint}>Share this code and earn rewards for every successful referral!</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Referral')} style={styles.referralBtn}>
              <Text style={styles.referralBtnText}>View All Referrals →</Text>
            </TouchableOpacity>
          </Card>
        </View>
      ) : null}

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  hero: { backgroundColor: Colors.primary, paddingTop: 50, paddingHorizontal: 20, paddingBottom: 30 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greeting: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.white },
  subGreeting: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  notifBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  notifIcon: { fontSize: 22 },
  notifBadge: {
    position: 'absolute', top: 2, right: 2,
    backgroundColor: Colors.danger, borderRadius: 8,
    minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3,
  },
  notifBadgeText: { color: Colors.white, fontSize: 9, fontWeight: '800' },

  balanceCard: {
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: Radius.lg,
    padding: Spacing.lg, alignItems: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  balanceLabel: { color: 'rgba(255,255,255,0.85)', fontSize: FontSize.sm, marginBottom: 6 },
  balanceValue: { fontSize: 46, fontWeight: '900', color: Colors.white },
  balanceSub: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.sm, marginTop: 4 },
  withdrawBtn: { marginTop: 14, backgroundColor: Colors.white, borderRadius: Radius.full, paddingHorizontal: 24, paddingVertical: 10 },
  withdrawBtnText: { color: Colors.primary, fontWeight: '800', fontSize: FontSize.sm },

  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: Radius.md, padding: 14 },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.25)' },
  statValue: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.white },
  statLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  verifyBanner: { backgroundColor: '#fff3cd', margin: 16, borderRadius: Radius.md, padding: 12, borderLeftWidth: 3, borderLeftColor: Colors.warning },
  verifyBannerText: { color: '#856404', fontSize: FontSize.sm, fontWeight: '600' },

  section: { paddingHorizontal: 16, marginTop: 20 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: {
    width: '30%', aspectRatio: 1, borderRadius: Radius.lg,
    justifyContent: 'center', alignItems: 'center', ...Shadow.sm,
    minWidth: 90,
  },
  actionIcon: { fontSize: 28, marginBottom: 6 },
  actionLabel: { fontSize: FontSize.xs, fontWeight: '800', textAlign: 'center' },

  statsCards: { flexDirection: 'row', gap: 10 },
  miniCard: {
    flex: 1, borderRadius: Radius.lg, padding: 14,
    alignItems: 'center', ...Shadow.sm,
  },
  miniCardIcon: { fontSize: 22, marginBottom: 4 },
  miniCardVal: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.dark },
  miniCardLbl: { fontSize: FontSize.xs, color: Colors.gray, marginTop: 2 },

  referralCard: {
    backgroundColor: Colors.primaryLight, borderWidth: 1,
    borderColor: Colors.primary + '40', borderRadius: Radius.lg, padding: Spacing.md,
  },
  referralTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.dark, marginBottom: 8 },
  codeBox: { backgroundColor: Colors.primary + '15', borderRadius: Radius.md, padding: 12, alignItems: 'center', marginBottom: 8 },
  referralCode: { fontSize: FontSize.xxl, fontWeight: '900', color: Colors.primary, letterSpacing: 3 },
  referralHint: { fontSize: FontSize.xs, color: Colors.gray },
  referralBtn: { marginTop: 12, alignSelf: 'flex-start' },
  referralBtnText: { color: Colors.primary, fontWeight: '700', fontSize: FontSize.sm },
});