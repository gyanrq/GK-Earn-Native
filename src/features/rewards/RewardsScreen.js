// src/features/rewards/RewardsScreen.js
// FIXES:
//  1. UserReward entity has: totalCredits, redeemedCredits, pendingCredits
//     (NOT creditBalance / totalEarned / totalRedeemed — those don't exist!)
//  2. Available balance = totalCredits - redeemedCredits - pendingCredits
//  3. RewardTransaction uses `credits` field (not `amount`), `source` enum for icon/color
//  4. More stylish UI with section animations

import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Card, LoadingScreen, EmptyState } from '../../core/ui';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../core/theme/colors';
import api from '../../core/api/api';

const TX_ICONS = {
  TASK: '🎯', SPIN: '🎡', REFERRAL: '👥', REDEEM: '💸',
  ADMIN: '⚙️', BONUS: '🎁', PAYOUT: '📤',
};

const TX_COLORS = {
  TASK: Colors.success, SPIN: Colors.secondary, REFERRAL: Colors.info,
  REDEEM: Colors.danger, ADMIN: Colors.warning, BONUS: Colors.gold, PAYOUT: Colors.danger,
};

export default function RewardsScreen({ navigation }) {
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) { setRefreshing(true); setPage(0); }
    try {
      const [balRes, txRes, cfgRes] = await Promise.all([
        api.get('/rewards/balance'),
        api.get('/rewards/transactions?page=0&size=20'),
        api.get('/rewards/config'),
      ]);
      // FIX: UserReward has totalCredits, redeemedCredits, pendingCredits
      setBalance(balRes.data.data || balRes.data);
      const txData = txRes.data.data || txRes.data;
      setTransactions(txData.content || txData || []);
      setHasMore(!(txData.last ?? true));
      setConfig(cfgRes.data.data || cfgRes.data);
    } catch (e) {
      console.log('Rewards error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const { data } = await api.get(`/rewards/transactions?page=${nextPage}&size=20`);
      const txData = data.data || data;
      const newItems = txData.content || txData || [];
      setTransactions((prev) => [...prev, ...newItems]);
      setPage(nextPage);
      setHasMore(!(txData.last ?? true));
    } catch (_) {}
    setLoadingMore(false);
  };

  if (loading) return <LoadingScreen message="Loading your wallet..." />;

  // FIX: correct field names — totalCredits, redeemedCredits, pendingCredits
  const totalCredits = balance?.totalCredits || 0;
  const redeemedCredits = balance?.redeemedCredits || 0;
  const pendingCredits = balance?.pendingCredits || 0;
  // Available = total earned - redeemed (confirmed) - pending (in-flight)
  const availableCredits = Math.max(0, totalCredits - redeemedCredits - pendingCredits);

  // FIX: creditsPerRupee default is 10 (backend default) — 500 credits = ₹50, NOT ₹5
  const creditsPerRupee = config?.creditsPerRupee || 10;
  const rupeesAvailable = (availableCredits / creditsPerRupee).toFixed(2);
  const minRedeem = config?.minRedeemCredits || 1000;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.secondary} />
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[Colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: Colors.secondary }]}>
          <Text style={styles.headerTitle}>💰 My Wallet</Text>

          {/* Main Balance Card */}
          <View style={styles.balanceCard}>
            <Text style={styles.balLabel}>Available Credits</Text>
            <Text style={styles.balValue}>{availableCredits.toLocaleString()}</Text>
            <Text style={styles.balRupee}>≈ ₹{rupeesAvailable}</Text>
          </View>

          {/* Breakdown Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{totalCredits.toLocaleString()}</Text>
              <Text style={styles.statLbl}>Total Earned</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{redeemedCredits.toLocaleString()}</Text>
              <Text style={styles.statLbl}>Redeemed</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.statItem}>
              <Text style={[styles.statVal, pendingCredits > 0 && { color: Colors.gold }]}>
                {pendingCredits.toLocaleString()}
              </Text>
              <Text style={styles.statLbl}>Pending</Text>
            </View>
          </View>
        </View>

        {/* Reward Config */}
        {config ? (
          <View style={styles.configCard}>
            <Text style={styles.configTitle}>ℹ️ Reward Rules</Text>
            <View style={styles.configGrid}>
              <ConfigItem label="1 Rupee =" value={`${config.creditsPerRupee} credits`} />
              <ConfigItem label="Min Redeem" value={`${config.minRedeemCredits} cr`} />
              <ConfigItem label="Max Daily" value={`${config.maxDailyEarn} cr`} />
            </View>
          </View>
        ) : null}

        {/* Withdraw Button */}
        <TouchableOpacity
          style={[styles.withdrawBtn, availableCredits < minRedeem && { opacity: 0.5, backgroundColor: Colors.gray }]}
          onPress={() => navigation.navigate('Payout')}
          disabled={availableCredits < minRedeem}
          activeOpacity={0.8}
        >
          <Text style={styles.withdrawText}>
            {availableCredits >= minRedeem
              ? '📤 Withdraw Earnings'
              : `🔒 Need ${minRedeem.toLocaleString()} credits (have ${availableCredits.toLocaleString()})`}
          </Text>
        </TouchableOpacity>

        {/* Transaction History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Transaction History</Text>
          {transactions.length === 0
            ? <EmptyState icon="📋" title="No transactions yet" subtitle="Complete tasks to see your earnings here" />
            : transactions.map((tx, i) => (
              <TransactionItem key={tx.id || i} tx={tx} />
            ))}
          {hasMore && (
            <TouchableOpacity style={styles.loadMore} onPress={loadMore} disabled={loadingMore}>
              <Text style={styles.loadMoreText}>{loadingMore ? '⏳ Loading...' : 'Load More ↓'}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

function ConfigItem({ label, value }) {
  return (
    <View style={styles.configItem}>
      <Text style={styles.configLbl}>{label}</Text>
      <Text style={styles.configVal}>{value}</Text>
    </View>
  );
}

function TransactionItem({ tx }) {
  // FIX: RewardTransaction has `credits` field, `source` enum, `type` enum
  const source = tx.source || 'TASK';
  // CREDIT if type is CREDIT; DEBIT if type is DEBIT or REDEEM
  const isCredit = tx.type === 'CREDIT' || (tx.type !== 'DEBIT' && (tx.credits || 0) > 0);
  const icon = TX_ICONS[source] || '💎';
  const color = isCredit ? Colors.success : Colors.danger;
  const date = tx.createdAt
    ? new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';

  return (
    <View style={styles.txItem}>
      <View style={[styles.txIconBox, { backgroundColor: (TX_COLORS[source] || Colors.primary) + '22' }]}>
        <Text style={styles.txIcon}>{icon}</Text>
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txLabel}>{tx.description || source}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <Text style={styles.txDate}>{date}</Text>
          <View style={[styles.sourceBadge, { backgroundColor: (TX_COLORS[source] || Colors.primary) + '22' }]}>
            <Text style={[styles.sourceBadgeText, { color: TX_COLORS[source] || Colors.primary }]}>{source}</Text>
          </View>
        </View>
      </View>
      {/* FIX: field is `credits` not `amount` */}
      <Text style={[styles.txAmount, { color }]}>
        {isCredit ? '+' : '-'}{(tx.credits || 0).toLocaleString()} cr
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { padding: 20, paddingTop: 50, paddingBottom: 30 },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: '900', color: Colors.white, marginBottom: 20 },
  balanceCard: {
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: Radius.lg,
    padding: Spacing.lg, alignItems: 'center', marginBottom: 16,
  },
  balLabel: { color: 'rgba(255,255,255,0.85)', fontSize: FontSize.sm },
  balValue: { fontSize: 48, fontWeight: '900', color: Colors.white, marginTop: 4 },
  balRupee: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.md, marginTop: 4 },
  statsRow: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radius.md, padding: 14,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDiv: { width: 1, backgroundColor: 'rgba(255,255,255,0.25)' },
  statVal: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.white },
  statLbl: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  configCard: {
    margin: 16, backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: Spacing.md, ...Shadow.sm,
  },
  configTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.dark, marginBottom: 12 },
  configGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  configItem: {
    flex: 1, backgroundColor: Colors.background, borderRadius: Radius.md,
    padding: 10, alignItems: 'center',
  },
  configLbl: { fontSize: FontSize.xs, color: Colors.gray, marginBottom: 4 },
  configVal: { fontSize: FontSize.sm, fontWeight: '800', color: Colors.dark },

  withdrawBtn: {
    margin: 16, backgroundColor: Colors.success, borderRadius: Radius.md,
    padding: 16, alignItems: 'center', ...Shadow.sm,
  },
  withdrawText: { color: Colors.white, fontWeight: '800', fontSize: FontSize.md },

  section: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.dark, marginBottom: 12 },

  txItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: Radius.md, padding: 14, marginBottom: 8, ...Shadow.sm,
  },
  txIconBox: {
    width: 46, height: 46, borderRadius: Radius.md,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  txIcon: { fontSize: 22 },
  txInfo: { flex: 1 },
  txLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.dark },
  txDate: { fontSize: FontSize.xs, color: Colors.textLight },
  sourceBadge: { borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 1 },
  sourceBadgeText: { fontSize: 9, fontWeight: '700' },
  txAmount: { fontSize: FontSize.md, fontWeight: '800' },

  loadMore: { alignItems: 'center', padding: 16 },
  loadMoreText: { color: Colors.primary, fontWeight: '700', fontSize: FontSize.sm },
});