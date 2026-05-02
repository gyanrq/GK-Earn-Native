// src/features/rewards/RewardsScreen.js
// ============================================================
// FIXES APPLIED:
//  1. TX_ICONS/TX_COLORS now match actual RewardSource enum values:
//     REFERRAL, CAMPAIGN, DAILY_TASK, SPIN, BONUS, MILESTONE, STREAK, ADMIN
//  2. isCredit now only checks RewardTxType.EARN (not 'CREDIT' — doesn't exist)
//     Debit type is RewardTxType.REDEEM
//  3. Balance fields correctly read from ApiResponse wrapper: res.data.data
//     UserReward has: totalCredits, redeemedCredits, pendingCredits (all Long)
//  4. Available = totalCredits - redeemedCredits - pendingCredits (correct formula)
//  5. creditsPerRupee is Integer on backend (not Long) — handled safely
//  6. Transactions: `credits` field (not `amount`), `source` enum, `type` EARN/REDEEM
//  7. PENDING transactions shown with amber badge so user knows status
//  8. Transactions from ApiResponse<PageResponse<RewardTransaction>>:
//     res.data.data.content — handled with safe fallback chain
// ============================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Card, LoadingScreen, EmptyState } from '../../core/ui';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../core/theme/colors';
import api from '../../core/api/api';

// ─── Maps to RewardSource enum values (backend: REFERRAL, CAMPAIGN, DAILY_TASK,
//     SPIN, BONUS, MILESTONE, STREAK, ADMIN) ────────────────────────────────────
const TX_ICONS = {
  REFERRAL:   '👥',
  CAMPAIGN:   '📣',
  DAILY_TASK: '🎯',
  SPIN:       '🎡',
  BONUS:      '🎁',
  MILESTONE:  '🏆',
  STREAK:     '🔥',
  ADMIN:      '⚙️',
};

const TX_COLORS = {
  REFERRAL:   Colors.info,
  CAMPAIGN:   Colors.primary,
  DAILY_TASK: Colors.success,
  SPIN:       Colors.secondary,
  BONUS:      Colors.gold,
  MILESTONE:  Colors.warning,
  STREAK:     '#FF6B35',
  ADMIN:      Colors.gray,
};

// ─── Safe data extractor for ApiResponse<T> wrapper ─────────────────────────
// Backend always returns: { success, message, data: T, timestamp }
const unwrap = (res) => res?.data?.data ?? res?.data ?? null;

// ─── Safe data extractor for ApiResponse<PageResponse<T>> ───────────────────
// PageResponse has: { content, page, size, totalElements, totalPages, last }
const unwrapPage = (res) => {
  const d = unwrap(res);
  return {
    content: d?.content ?? (Array.isArray(d) ? d : []),
    last:    d?.last    ?? true,
  };
};

export default function RewardsScreen({ navigation }) {
  const [balance,      setBalance]      = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [config,       setConfig]       = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [page,         setPage]         = useState(0);
  const [hasMore,      setHasMore]      = useState(true);
  const [loadingMore,  setLoadingMore]  = useState(false);
  const [error,        setError]        = useState(null);

  // ── Initial / refresh load ────────────────────────────────────────────────
  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
      setPage(0);
      setTransactions([]);
      setHasMore(true);
    }
    setError(null);
    try {
      const [balRes, txRes, cfgRes] = await Promise.all([
        api.get('/rewards/balance'),
        api.get('/rewards/transactions?page=0&size=20'),
        api.get('/rewards/config'),
      ]);

      // FIX 3: ApiResponse<UserReward> → data.data
      setBalance(unwrap(balRes));

      // FIX 8: ApiResponse<PageResponse<RewardTransaction>> → data.data.content
      const txPage = unwrapPage(txRes);
      setTransactions(txPage.content);
      setHasMore(!txPage.last);
      setPage(0);

      // FIX 5: ApiResponse<PublicRewardConfigDTO> → data.data
      setConfig(unwrap(cfgRes));
    } catch (e) {
      console.error('RewardsScreen load error:', e?.message || e);
      setError('Could not load wallet. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // ── Pagination ────────────────────────────────────────────────────────────
  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const txRes    = await api.get(`/rewards/transactions?page=${nextPage}&size=20`);
      const txPage   = unwrapPage(txRes);
      setTransactions((prev) => [...prev, ...txPage.content]);
      setPage(nextPage);
      setHasMore(!txPage.last);
    } catch (e) {
      console.error('loadMore error:', e?.message || e);
    } finally {
      setLoadingMore(false);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) return <LoadingScreen message="Loading your wallet..." />;

  // ── FIX 3 + 4: Correct field names (Long on backend, always numbers) ──────
  const totalCredits    = Number(balance?.totalCredits    ?? 0);
  const redeemedCredits = Number(balance?.redeemedCredits ?? 0);
  const pendingCredits  = Number(balance?.pendingCredits  ?? 0);
  // available = what user can actually withdraw right now
  const availableCredits = Math.max(0, totalCredits - redeemedCredits - pendingCredits);

  // FIX 5: creditsPerRupee is Integer (not Long) — same safe access
  const creditsPerRupee = Number(config?.creditsPerRupee ?? 10);
  const minRedeem       = Number(config?.minRedeemCredits ?? 1000);
  const rupeesAvailable = creditsPerRupee > 0
    ? (availableCredits / creditsPerRupee).toFixed(2)
    : '0.00';

  const canWithdraw = availableCredits >= minRedeem;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.secondary} />

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            colors={[Colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>💰 My Wallet</Text>

          {/* Main Balance Card */}
          <View style={styles.balanceCard}>
            <Text style={styles.balLabel}>Available Credits</Text>
            <Text style={styles.balValue}>{availableCredits.toLocaleString('en-IN')}</Text>
            <Text style={styles.balRupee}>≈ ₹{rupeesAvailable}</Text>
          </View>

          {/* Breakdown Row */}
          <View style={styles.statsRow}>
            <StatItem value={totalCredits.toLocaleString('en-IN')}    label="Total Earned" />
            <View style={styles.statDiv} />
            <StatItem value={redeemedCredits.toLocaleString('en-IN')} label="Redeemed" />
            <View style={styles.statDiv} />
            <StatItem
              value={pendingCredits.toLocaleString('en-IN')}
              label="Pending"
              valueStyle={pendingCredits > 0 ? { color: Colors.gold } : undefined}
            />
          </View>
        </View>

        {/* ── Error Banner ───────────────────────────────────────────────── */}
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        ) : null}

        {/* ── Reward Config ──────────────────────────────────────────────── */}
        {config ? (
          <View style={styles.configCard}>
            <Text style={styles.configTitle}>ℹ️ Reward Rules</Text>
            <View style={styles.configGrid}>
              <ConfigItem label="1 Rupee ="   value={`${config.creditsPerRupee ?? 10} credits`} />
              <ConfigItem label="Min Redeem" value={`${(config.minRedeemCredits ?? 1000).toLocaleString('en-IN')} cr`} />
              <ConfigItem label="Max Daily"  value={`${(config.maxDailyEarn ?? 4000).toLocaleString('en-IN')} cr`} />
            </View>
          </View>
        ) : null}

        {/* ── Withdraw Button ────────────────────────────────────────────── */}
        <TouchableOpacity
          style={[
            styles.withdrawBtn,
            !canWithdraw && styles.withdrawBtnDisabled,
          ]}
          onPress={() => navigation.navigate('Payout')}
          disabled={!canWithdraw}
          activeOpacity={0.8}
        >
          <Text style={styles.withdrawText}>
            {canWithdraw
              ? '📤 Withdraw Earnings'
              : `🔒 Need ${minRedeem.toLocaleString('en-IN')} credits (have ${availableCredits.toLocaleString('en-IN')})`}
          </Text>
        </TouchableOpacity>

        {/* ── Transaction History ────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Transaction History</Text>

          {transactions.length === 0 ? (
            <EmptyState
              icon="📋"
              title="No transactions yet"
              subtitle="Complete tasks to see your earnings here"
            />
          ) : (
            transactions.map((tx, i) => (
              <TransactionItem key={tx.id ?? i} tx={tx} />
            ))
          )}

          {hasMore && (
            <TouchableOpacity
              style={styles.loadMore}
              onPress={loadMore}
              disabled={loadingMore}
            >
              <Text style={styles.loadMoreText}>
                {loadingMore ? '⏳ Loading...' : 'Load More ↓'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatItem({ value, label, valueStyle }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statVal, valueStyle]}>{value}</Text>
      <Text style={styles.statLbl}>{label}</Text>
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
  // FIX 1: source must match RewardSource enum exactly
  //         REFERRAL | CAMPAIGN | DAILY_TASK | SPIN | BONUS | MILESTONE | STREAK | ADMIN
  const source = tx.source ?? 'DAILY_TASK';

  // FIX 2: RewardTxType is EARN or REDEEM — 'CREDIT' does NOT exist
  const isCredit = tx.type === 'EARN';

  // FIX 7: Show PENDING status visually
  const isPending = tx.status === 'PENDING';

  const icon   = TX_ICONS[source]  ?? '💎';
  const color  = isCredit ? Colors.success : Colors.danger;
  const bgColor = (TX_COLORS[source] ?? Colors.primary) + '22';

  const date = tx.createdAt
    ? new Date(tx.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : '';

  // FIX 6: `credits` field (backend RewardTransaction has `credits`, NOT `amount`)
  const creditAmount = Number(tx.credits ?? 0);

  return (
    <View style={styles.txItem}>
      <View style={[styles.txIconBox, { backgroundColor: bgColor }]}>
        <Text style={styles.txIcon}>{icon}</Text>
      </View>

      <View style={styles.txInfo}>
        <Text style={styles.txLabel}>{tx.description ?? source}</Text>
        <View style={styles.txMeta}>
          {date ? <Text style={styles.txDate}>{date}</Text> : null}
          <View style={[styles.sourceBadge, { backgroundColor: bgColor }]}>
            <Text style={[styles.sourceBadgeText, { color: TX_COLORS[source] ?? Colors.primary }]}>
              {source.replace('_', ' ')}
            </Text>
          </View>
          {isPending && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>PENDING</Text>
            </View>
          )}
        </View>
      </View>

      <Text style={[styles.txAmount, { color: isPending ? Colors.warning : color }]}>
        {isCredit ? '+' : '-'}{creditAmount.toLocaleString('en-IN')} cr
      </Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    backgroundColor: Colors.secondary,
    padding: Spacing.lg,
    paddingTop: 50,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '900',
    color: Colors.white,
    marginBottom: 20,
  },

  // Balance card
  balanceCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: 16,
  },
  balLabel: { color: 'rgba(255,255,255,0.85)', fontSize: FontSize.sm },
  balValue: { fontSize: 48, fontWeight: '900', color: Colors.white, marginTop: 4 },
  balRupee: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.md, marginTop: 4 },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radius.md,
    padding: 14,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDiv:  { width: 1, backgroundColor: 'rgba(255,255,255,0.25)' },
  statVal:  { fontSize: FontSize.lg, fontWeight: '800', color: Colors.white },
  statLbl:  { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  // Error
  errorBanner: {
    margin: 16,
    backgroundColor: Colors.danger + '22',
    borderRadius: Radius.md,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.danger,
  },
  errorText: { color: Colors.danger, fontSize: FontSize.sm, fontWeight: '600' },

  // Config card
  configCard: {
    margin: 16,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  configTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 12,
  },
  configGrid:  { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  configItem:  {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    padding: 10,
    alignItems: 'center',
  },
  configLbl: { fontSize: FontSize.xs, color: Colors.gray, marginBottom: 4 },
  configVal: { fontSize: FontSize.sm, fontWeight: '800', color: Colors.dark },

  // Withdraw
  withdrawBtn: {
    margin: 16,
    backgroundColor: Colors.success,
    borderRadius: Radius.md,
    padding: 16,
    alignItems: 'center',
    ...Shadow.sm,
  },
  withdrawBtnDisabled: { backgroundColor: Colors.gray, opacity: 0.6 },
  withdrawText: { color: Colors.white, fontWeight: '800', fontSize: FontSize.md },

  // Section
  section:      { paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 12,
  },

  // Transaction item
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: 14,
    marginBottom: 8,
    ...Shadow.sm,
  },
  txIconBox: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txIcon: { fontSize: 22 },
  txInfo: { flex: 1 },
  txLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.dark },
  txMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  txDate: { fontSize: FontSize.xs, color: Colors.textLight },

  sourceBadge: { borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 2 },
  sourceBadgeText: { fontSize: 9, fontWeight: '700' },

  pendingBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: Colors.warning + '33',
  },
  pendingBadgeText: { fontSize: 9, fontWeight: '700', color: Colors.warning },

  txAmount: { fontSize: FontSize.md, fontWeight: '800' },

  // Load more
  loadMore:     { alignItems: 'center', padding: 16 },
  loadMoreText: { color: Colors.primary, fontWeight: '700', fontSize: FontSize.sm },
});