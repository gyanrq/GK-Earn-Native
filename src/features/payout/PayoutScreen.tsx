// src/features/payout/PayoutScreen.js
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Button, Input, Card, LoadingScreen, EmptyState, Badge } from '../../core/ui';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../core/theme/colors';
import api from '../../core/api/api';
import 'react-native-get-random-values';

const PAYOUT_TYPES = [
  { key: 'UPI', label: '📲 UPI', placeholder: 'Enter UPI ID (e.g., name@upi)' },
  { key: 'BANK', label: '🏦 Bank Transfer', placeholder: 'Account No | IFSC | Name' },
  { key: 'PAYTM', label: '💳 Paytm', placeholder: 'Enter Paytm mobile number' },
];

const STATUS_COLORS = {
  PENDING: Colors.warning, APPROVED: Colors.success,
  REJECTED: Colors.danger, PROCESSING: Colors.info, PAID: Colors.success,
};

export default function PayoutScreen() {
  const [balance, setBalance] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [form, setForm] = useState({ amount: '', payoutType: 'UPI', payoutDetails: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [balRes, payRes, cfgRes] = await Promise.all([
        api.get('/rewards/balance'),
        api.get('/payouts/my?page=0&size=20'),
        api.get('/rewards/config'),
      ]);
      setBalance(balRes.data.data || balRes.data);
      const payData = payRes.data.data || payRes.data;
      setPayouts(payData.content || payData || []);
      setConfig(cfgRes.data.data || cfgRes.data);
    } catch (e: any) {
      console.log('Payout error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // FIX: creditsPerRupee default is 10 (not 100) — matches backend RewardConfig.defaults()
  // FIX: balance fields are totalCredits/redeemedCredits/pendingCredits (not creditBalance)
  const creditsPerRupee = config?.creditsPerRupee || 10;
  const minCredits = config?.minRedeemCredits || 1000;
  const minRupees = (minCredits / creditsPerRupee).toFixed(0);
  const totalCredits = balance?.totalCredits || 0;
  const redeemedCredits = balance?.redeemedCredits || 0;
  const pendingCredits = balance?.pendingCredits || 0;
  const creditBalance = Math.max(0, totalCredits - redeemedCredits - pendingCredits);
  const rupeesAvailable = (creditBalance / creditsPerRupee).toFixed(2);

  const handleSubmit = async () => {
    setError(''); setSuccess('');
    const amt = parseFloat(form.amount);
    if (!form.amount || isNaN(amt) || amt < 10) { setError(`Minimum withdrawal is ₹10 (need ₹${minRupees})`); return; }
    if (amt * creditsPerRupee > creditBalance) { setError('Insufficient balance'); return; }
    if (!form.payoutDetails.trim()) { setError('Please enter payment details'); return; }

    setSubmitting(true);
    try {
      const idempotencyKey = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      await api.post('/payouts/request', {
        amount: amt,
        payoutType: form.payoutType,
        payoutDetails: form.payoutDetails.trim(),
        idempotencyKey,
      });
      setSuccess('✅ Withdrawal request submitted! Admin will process within 24 hours.');
      setForm((f) => ({ ...f, amount: '', payoutDetails: '' }));
      load();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen message="Loading withdrawal info..." />;

  const selectedType = PAYOUT_TYPES.find((t) => t.key === form.payoutType) || PAYOUT_TYPES[0];
  const canWithdraw = creditBalance >= minCredits;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.danger} />
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[Colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: Colors.danger }]}>
          <Text style={styles.headerTitle}>📤 Withdraw</Text>
          <View style={styles.balCard}>
            <Text style={styles.balLabel}>Available Balance</Text>
            <Text style={styles.balValue}>₹{rupeesAvailable}</Text>
            <Text style={styles.balCredits}>{creditBalance.toLocaleString()} credits</Text>
          </View>
          {!canWithdraw && (
            <View style={styles.lockInfo}>
              <Text style={styles.lockText}>
                🔒 Need ₹{minRupees} ({minCredits} credits) to withdraw. Earn {(minCredits - creditBalance)} more credits!
              </Text>
            </View>
          )}
        </View>

        {/* Withdrawal Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Request Withdrawal</Text>

          {error ? <View style={styles.errorBox}><Text style={styles.errorText}>⚠️ {error}</Text></View> : null}
          {success ? <View style={styles.successBox}><Text style={styles.successText}>{success}</Text></View> : null}

          {/* Payout Type Selection */}
          <Text style={styles.fieldLabel}>Payment Method</Text>
          <View style={styles.typeRow}>
            {PAYOUT_TYPES.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.typeBtn, form.payoutType === t.key && styles.typeBtnActive]}
                onPress={() => setForm((f) => ({ ...f, payoutType: t.key }))}
              >
                <Text style={[styles.typeBtnText, form.payoutType === t.key && styles.typeBtnTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Amount (₹)"
            value={form.amount}
            onChangeText={(v) => setForm((f) => ({ ...f, amount: v }))}
            placeholder={`Min ₹10 | Available ₹${rupeesAvailable}`}
            leftIcon="₹"
            keyboardType="numeric"
          />

          <Input
            label={`${selectedType.label} Details`}
            value={form.payoutDetails}
            onChangeText={(v) => setForm((f) => ({ ...f, payoutDetails: v }))}
            placeholder={selectedType.placeholder}
            leftIcon="📝"
          />

          <Button
            title="Submit Withdrawal Request"
            onPress={handleSubmit}
            loading={submitting}
            disabled={!canWithdraw}
            style={{ marginTop: 8 }}
          />

          {!canWithdraw && (
            <Text style={styles.disabledNote}>
              Complete more tasks or refer friends to reach the minimum withdrawal amount.
            </Text>
          )}
        </View>

        {/* My Payouts History */}
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>📋 My Withdrawal History</Text>
          {payouts.length === 0
            ? <EmptyState icon="📤" title="No withdrawals yet" subtitle="Your withdrawal history will appear here" />
            : payouts.map((p, i) => (
              <View key={p.id || i} style={styles.payoutItem}>
                <View style={styles.payoutLeft}>
                  <Text style={styles.payoutType}>{p.payoutType}</Text>
                  <Text style={styles.payoutDetails} numberOfLines={1}>{p.payoutDetails}</Text>
                  <Text style={styles.payoutDate}>
                    {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                  </Text>
                </View>
                <View style={styles.payoutRight}>
                  <Text style={styles.payoutAmount}>₹{parseFloat(p.amount).toFixed(2)}</Text>
                  <Badge label={p.status || 'PENDING'} color={STATUS_COLORS[p.status] || Colors.gray} />
                </View>
              </View>
            ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { padding: 20, paddingTop: 50, paddingBottom: 24 },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: '900', color: Colors.white, marginBottom: 16 },
  balCard: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'center' },
  balLabel: { color: 'rgba(255,255,255,0.85)', fontSize: FontSize.sm },
  balValue: { fontSize: 40, fontWeight: '900', color: Colors.white },
  balCredits: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.sm, marginTop: 4 },
  lockInfo: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: Radius.md, padding: 10, marginTop: 12 },
  lockText: { color: Colors.white, fontSize: FontSize.xs, textAlign: 'center' },

  formCard: { margin: 16, backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, ...Shadow.sm },
  formTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.dark, marginBottom: 16 },
  errorBox: { backgroundColor: '#fff3f3', borderRadius: Radius.md, padding: 10, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: Colors.danger },
  errorText: { color: Colors.danger, fontSize: FontSize.sm },
  successBox: { backgroundColor: '#f0fff4', borderRadius: Radius.md, padding: 10, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: Colors.success },
  successText: { color: Colors.success, fontSize: FontSize.sm },
  fieldLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.dark, marginBottom: 8 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  typeBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border },
  typeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeBtnText: { fontSize: FontSize.xs, color: Colors.gray, fontWeight: '600' },
  typeBtnTextActive: { color: Colors.white },
  disabledNote: { fontSize: FontSize.xs, color: Colors.gray, textAlign: 'center', marginTop: 8 },

  historySection: { paddingHorizontal: 16 },
  historyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.dark, marginBottom: 12 },
  payoutItem: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: Radius.md, padding: 14, marginBottom: 8, ...Shadow.sm },
  payoutLeft: { flex: 1 },
  payoutType: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.dark },
  payoutDetails: { fontSize: FontSize.xs, color: Colors.gray, marginTop: 2 },
  payoutDate: { fontSize: FontSize.xs, color: Colors.textLight, marginTop: 4 },
  payoutRight: { alignItems: 'flex-end', gap: 6 },
  payoutAmount: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.dark },
});