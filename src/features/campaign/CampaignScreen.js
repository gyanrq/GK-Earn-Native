// src/features/campaign/CampaignScreen.js
import React, { useState, useCallback, useContext } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Button, LoadingScreen, EmptyState, Badge } from '../../core/ui';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../core/theme/colors';
import { ToastContext } from '../../core/ui/ToastContext';
import api from '../../core/api/api';

const TYPE_CONFIG = {
  LEAD_GEN:   { icon: '📝', color: Colors.info, label: 'Lead Gen' },
  SURVEY:     { icon: '📊', color: Colors.warning, label: 'Survey' },
  REFERRAL:   { icon: '🔗', color: Colors.success, label: 'Referral' },
  INSTALL:    { icon: '📲', color: Colors.danger, label: 'App Install' },
  DEFAULT:    { icon: '🚀', color: Colors.primary, label: 'Campaign' },
};

export default function CampaignScreen({ navigation }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [applying, setApplying] = useState(null);
  const { showToast } = useContext(ToastContext);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const { data } = await api.get('/campaigns');
      const content = data.data?.content || data.content || data || [];
      // Safe fallback to prevent Array method crashes
      setCampaigns(Array.isArray(content) ? content : []); 
    } catch (e) {
      console.log('Campaign fetch error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleApply = async (campaign) => {
    if (applying) return;
    setApplying(campaign.id);
    try {
      await api.post(`/campaigns/${campaign.id}/apply`);
      showToast(`Applied: ${campaign.title} ✅`, 'success');
      setCampaigns((prev) =>
        prev.map((c) => c.id === campaign.id ? { ...c, applied: true, userApplied: true } : c)
      );
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to apply';
      showToast(msg, 'error');
    } finally {
      setApplying(null);
    }
  };

  const renderItem = ({ item }) => {
    const typeKey = item.campaignType || item.type || 'DEFAULT';
    const cfg = TYPE_CONFIG[typeKey.toUpperCase()] || TYPE_CONFIG.DEFAULT;
    const isApplied = item.applied || item.userApplied;
    const isApplying = applying === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Badge label={`${cfg.icon} ${cfg.label}`} color={cfg.color} />
          <View style={styles.rewardBadge}>
            <Text style={styles.rewardText}>💰 {item.rewardAmount || item.credits || 0}</Text>
          </View>
        </View>

        <Text style={styles.title}>{item.title}</Text>
        {item.description ? <Text style={styles.desc} numberOfLines={2}>{item.description}</Text> : null}

        <View style={styles.cardFooter}>
          <Text style={styles.deadline}>
            {item.deadline ? `⏰ Ends: ${new Date(item.deadline).toLocaleDateString('en-IN')}` : ''}
          </Text>
          <Button
            title={isApplying ? 'Applying...' : isApplied ? 'Applied ✅' : 'Apply Now →'}
            onPress={() => !isApplied && handleApply(item)}
            disabled={isApplied || !!applying}
            variant={isApplied ? 'outline' : 'primary'}
            style={[styles.applyBtn, isApplied && { borderColor: Colors.success }]}
            textStyle={isApplied && { color: Colors.success }}
          />
        </View>
      </View>
    );
  };

  if (loading) return <LoadingScreen message="Loading campaigns..." />;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
           <Text style={styles.headerTitle}>🚀 Campaigns</Text>
        </View>
        <Text style={styles.headerSub}>Complete exclusive tasks to earn extra credits</Text>
      </View>

      <FlatList
        data={campaigns}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[Colors.primary]} />}
        renderItem={renderItem}
        ListEmptyComponent={<EmptyState icon="📭" title="No Active Campaigns" subtitle="Check back later for new offers!" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: Colors.primary, padding: 20, paddingTop: 50, paddingBottom: 24 },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: '900', color: Colors.white },
  headerSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.85)' },

  list: { padding: 16, paddingBottom: 30 },
  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: 14, ...Shadow.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  rewardBadge: { backgroundColor: '#d4edda', paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.sm },
  rewardText: { color: '#28a745', fontWeight: '800', fontSize: FontSize.sm },
  title: { fontSize: FontSize.md, fontWeight: '800', color: Colors.dark, marginBottom: 6 },
  desc: { fontSize: FontSize.sm, color: Colors.gray, lineHeight: 18, marginBottom: 14 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  deadline: { fontSize: FontSize.xs, color: Colors.textLight, fontWeight: '600' },
  applyBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: Radius.md },
});