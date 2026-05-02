// src/features/referral/ReferralScreen.js
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Share, StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Card, LoadingScreen, EmptyState, Badge } from '../../core/ui';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../core/theme/colors';
import { useAuth } from '../../core/auth/AuthContext';
import api from '../../core/api/api';

export default function ReferralScreen() {
  const { userInfo } = useAuth();
  const [referrals, setReferrals] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [stats, setStats] = useState({ successfulReferrals: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('referrals'); // 'referrals' | 'milestones'

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [refRes, msRes, stRes] = await Promise.all([
        api.get('/referral/my?page=0&size=50'),
        api.get('/referral/milestones'),
        api.get('/referral/stats'),
      ]);
      const refData = refRes.data.data || refRes.data;
      setReferrals(refData.content || refData || []);
      setMilestones(msRes.data.data || msRes.data || []);
      setStats(stRes.data.data || stRes.data || {});
    } catch (e: any) {
      console.log('Referral error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleShare = async () => {
    const code = userInfo?.referralCode || '';
    try {
      await Share.share({
        message: `🎉 Join GK Earn and start earning real money!\n\nUse my referral code: ${code}\n\nSign up here: https://gkearn.com/register?ref=${code}`,
        title: 'Join GK Earn - Earn Real Money!',
      });
    } catch (_) {}
  };

  if (loading) return <LoadingScreen message="Loading referrals..." />;

  const referralCode = userInfo?.referralCode || 'N/A';

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.success} />
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[Colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: Colors.success }]}>
          <Text style={styles.headerTitle}>👥 Refer & Earn</Text>
          <Text style={styles.headerSub}>Invite friends and earn rewards together</Text>

          {/* Referral Code Card */}
          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>Your Referral Code</Text>
            <Text style={styles.code}>{referralCode}</Text>
            <Text style={styles.codeSub}>{stats.successfulReferrals || 0} successful referrals</Text>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
              <Text style={styles.shareBtnText}>📤 Share & Invite Friends</Text>
            </TouchableOpacity>
          </View>

          {/* How it works */}
          <View style={styles.howItWorks}>
            <Text style={styles.howTitle}>How it works</Text>
            <View style={styles.steps}>
              {['Share your code', 'Friend registers', 'Both earn rewards!'].map((s, i) => (
                <View key={i} style={styles.step}>
                  <View style={styles.stepNum}><Text style={styles.stepNumText}>{i + 1}</Text></View>
                  <Text style={styles.stepText}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsRow}>
          {[{ key: 'referrals', label: '👥 My Referrals' }, { key: 'milestones', label: '🏆 Milestones' }].map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, tab === t.key && styles.tabActive]}
              onPress={() => setTab(t.key)}
            >
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Referrals List */}
        {tab === 'referrals' && (
          <View style={styles.section}>
            {referrals.length === 0
              ? <EmptyState icon="👥" title="No referrals yet" subtitle="Share your code to invite friends!" />
              : referrals.map((ref, i) => (
                <ReferralItem key={ref.id || i} ref_={ref} />
              ))}
          </View>
        )}

        {/* Milestones */}
        {tab === 'milestones' && (
          <View style={styles.section}>
            {milestones.length === 0
              ? <EmptyState icon="🏆" title="No milestones yet" subtitle="Get referrals to unlock milestones!" />
              : milestones.map((ms, i) => (
                <MilestoneItem key={ms.id || i} ms={ms} />
              ))}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

function ReferralItem({ ref_ }) {
  const statusColor = {
    PENDING: Colors.warning, SUCCESS: Colors.success, FAILED: Colors.danger,
  }[ref_.status] || Colors.gray;
  const date = ref_.createdAt ? new Date(ref_.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '';

  return (
    <View style={styles.refItem}>
      <View style={styles.refAvatar}>
        <Text style={styles.refAvatarText}>{(ref_.refereeName || ref_.refereeEmail || 'U').charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.refInfo}>
        <Text style={styles.refName}>{ref_.refereeName || ref_.refereeEmail || 'Anonymous'}</Text>
        <Text style={styles.refDate}>{date}</Text>
      </View>
      <Badge label={ref_.status || 'PENDING'} color={statusColor} />
    </View>
  );
}

function MilestoneItem({ ms }) {
  const achieved = ms.achieved || ms.state === 'ACHIEVED';
  return (
    <View style={[styles.msCard, achieved && styles.msCardAchieved]}>
      <Text style={styles.msIcon}>{achieved ? '🏆' : '🎯'}</Text>
      <View style={styles.msInfo}>
        <Text style={styles.msTitle}>{ms.milestone?.name || `Milestone ${ms.milestoneType}`}</Text>
        <Text style={styles.msDesc}>{ms.milestone?.description || `${ms.milestone?.requiredReferrals || '?'} referrals needed`}</Text>
        {ms.milestone?.rewardCredits ? (
          <Text style={styles.msReward}>+{ms.milestone.rewardCredits} credits</Text>
        ) : null}
      </View>
      <View style={[styles.msStatus, { backgroundColor: achieved ? Colors.success : Colors.lightGray }]}>
        <Text style={{ color: achieved ? Colors.white : Colors.gray, fontSize: 12, fontWeight: '700' }}>
          {achieved ? 'Done' : 'Pending'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { padding: 20, paddingTop: 50, paddingBottom: 24 },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: '900', color: Colors.white },
  headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.sm, marginTop: 2, marginBottom: 20 },
  codeCard: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'center', marginBottom: 16 },
  codeLabel: { color: 'rgba(255,255,255,0.85)', fontSize: FontSize.sm },
  code: { fontSize: 32, fontWeight: '900', color: Colors.white, letterSpacing: 4, marginVertical: 6 },
  codeSub: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.sm, marginBottom: 12 },
  shareBtn: { backgroundColor: Colors.white, borderRadius: Radius.full, paddingHorizontal: 24, paddingVertical: 10 },
  shareBtnText: { color: Colors.success, fontWeight: '800', fontSize: FontSize.sm },
  howItWorks: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: Radius.md, padding: 14 },
  howTitle: { color: Colors.white, fontWeight: '700', fontSize: FontSize.sm, marginBottom: 10 },
  steps: { flexDirection: 'row', justifyContent: 'space-between' },
  step: { alignItems: 'center', flex: 1 },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  stepNumText: { color: Colors.white, fontWeight: '800', fontSize: FontSize.sm },
  stepText: { color: 'rgba(255,255,255,0.85)', fontSize: 10, textAlign: 'center' },

  tabsRow: { flexDirection: 'row', margin: 16, backgroundColor: Colors.lightGray, borderRadius: Radius.full, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: Radius.full, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.white, ...Shadow.sm },
  tabText: { fontSize: FontSize.sm, color: Colors.gray, fontWeight: '600' },
  tabTextActive: { color: Colors.dark, fontWeight: '700' },

  section: { paddingHorizontal: 16 },

  refItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: Radius.md, padding: 14, marginBottom: 8, ...Shadow.sm },
  refAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  refAvatarText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.primary },
  refInfo: { flex: 1 },
  refName: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.dark },
  refDate: { fontSize: FontSize.xs, color: Colors.gray, marginTop: 2 },

  msCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: Radius.md, padding: 14, marginBottom: 8, ...Shadow.sm },
  msCardAchieved: { borderLeftWidth: 3, borderLeftColor: Colors.success },
  msIcon: { fontSize: 28, marginRight: 12 },
  msInfo: { flex: 1 },
  msTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.dark },
  msDesc: { fontSize: FontSize.xs, color: Colors.gray, marginTop: 2 },
  msReward: { fontSize: FontSize.xs, color: Colors.success, fontWeight: '700', marginTop: 3 },
  msStatus: { borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 5 },
});