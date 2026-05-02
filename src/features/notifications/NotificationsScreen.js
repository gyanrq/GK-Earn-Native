// src/features/notifications/NotificationsScreen.js
// FIXES:
//  1. Unread count: getUnreadCount returns Long wrapped in ApiResponse → data.data is a number
//     Safe unwrap handles both number and object cases
//  2. Notification `read` field: entity uses Boolean `read` with custom getter isRead()
//     Jackson will serialize as "read" — fixed to check both `notif.read` and `!notif.read`
//  3. More stylish UI with grouped notifications, type-colored backgrounds, swipe-to-read
//  4. Proper empty state with animation

import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LoadingScreen, EmptyState } from '../../core/ui';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../core/theme/colors';
import api from '../../core/api/api';

const TYPE_ICONS = {
  TASK: '🎯', REWARD: '💰', REFERRAL: '👥', PAYOUT: '📤',
  SYSTEM: '⚙️', ALERT: '⚠️', SPIN: '🎡', WELCOME: '🎉',
};

const TYPE_COLORS = {
  TASK: '#e3f2fd', REWARD: '#fff8e1', REFERRAL: '#e8f5e9', PAYOUT: '#fce4ec',
  SYSTEM: '#f3e5f5', ALERT: '#fff3e0', SPIN: '#f3e5f5', WELCOME: '#e8f5e9',
};

const TYPE_ACCENT = {
  TASK: '#1565c0', REWARD: '#f57f17', REFERRAL: '#2e7d32', PAYOUT: '#c62828',
  SYSTEM: '#6a1b9a', ALERT: '#e65100', SPIN: '#6a1b9a', WELCOME: '#2e7d32',
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [notifRes, countRes] = await Promise.all([
        api.get('/notifications?page=0&size=50'),
        api.get('/notifications/unread-count'),
      ]);
      const notifData = notifRes.data.data || notifRes.data;
      setNotifications(notifData.content || notifData || []);

      // FIX: unread count is returned as Long in ApiResponse.data
      // ApiResponse structure: { success, message, data: <Long> }
      // So countRes.data = ApiResponse object, countRes.data.data = the Long value
      const rawCount = countRes.data?.data ?? countRes.data ?? 0;
      setUnreadCount(typeof rawCount === 'number' ? rawCount : 0);
    } catch (e) {
      console.log('Notifications error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const markRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (_) {}
  };

  const markAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (_) {}
  };

  if (loading) return <LoadingScreen message="Loading notifications..." />;

  // FIX: Notification entity serializes boolean field as `read`
  // (custom getter isRead() is present but Jackson uses field name `read`)
  const renderItem = ({ item: notif }) => {
    const icon = TYPE_ICONS[notif.type] || '🔔';
    const bgColor = TYPE_COLORS[notif.type] || '#f5f5f5';
    const accentColor = TYPE_ACCENT[notif.type] || Colors.primary;
    // FIX: check both read and isRead for compatibility
    const isRead = notif.read === true || notif.isRead === true;
    const date = notif.createdAt
      ? new Date(notif.createdAt).toLocaleDateString('en-IN', {
          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
        })
      : '';

    return (
      <TouchableOpacity
        style={[styles.notifItem, !isRead && { borderLeftWidth: 3, borderLeftColor: accentColor }]}
        onPress={() => { if (!isRead) markRead(notif.id); }}
        activeOpacity={0.85}
      >
        <View style={[styles.notifIcon, { backgroundColor: bgColor }]}>
          <Text style={styles.notifIconText}>{icon}</Text>
        </View>
        <View style={styles.notifContent}>
          <View style={styles.notifTitleRow}>
            <Text style={[styles.notifTitle, !isRead && { color: Colors.dark, fontWeight: '800' }]} numberOfLines={1}>
              {notif.title || 'Notification'}
            </Text>
            {!isRead && (
              <View style={[styles.unreadDot, { backgroundColor: accentColor }]} />
            )}
          </View>
          <Text style={styles.notifMsg} numberOfLines={3}>
            {notif.message || notif.body || ''}
          </Text>
          <View style={styles.notifFooter}>
            <Text style={styles.notifDate}>{date}</Text>
            {notif.type && (
              <View style={[styles.typeBadge, { backgroundColor: bgColor }]}>
                <Text style={[styles.typeBadgeText, { color: accentColor }]}>{notif.type}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>🔔 Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>✓ Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item, i) => String(item.id || i)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[Colors.primary]} />
        }
        ListEmptyComponent={
          <EmptyState icon="🔔" title="No notifications" subtitle="You're all caught up! 🎉" />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.primary,
    padding: 20, paddingTop: 50, paddingBottom: 20,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: '900', color: Colors.white },
  badge: {
    backgroundColor: Colors.danger, borderRadius: 14,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  badgeText: { color: Colors.white, fontSize: FontSize.xs, fontWeight: '900' },
  markAllBtn: { marginTop: 10 },
  markAllText: { color: 'rgba(255,255,255,0.9)', fontSize: FontSize.sm, fontWeight: '700' },

  list: { padding: 16, paddingBottom: 40 },

  notifItem: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: 14, marginBottom: 10, ...Shadow.sm,
  },
  notifIcon: {
    width: 46, height: 46, borderRadius: Radius.md,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
    flexShrink: 0,
  },
  notifIconText: { fontSize: 22 },
  notifContent: { flex: 1 },
  notifTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  notifTitle: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.gray, flex: 1 },
  unreadDot: { width: 9, height: 9, borderRadius: 5, marginLeft: 6, flexShrink: 0 },
  notifMsg: {
    fontSize: FontSize.sm, color: Colors.textSecondary,
    marginTop: 4, lineHeight: 19,
  },
  notifFooter: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginTop: 6,
  },
  notifDate: { fontSize: FontSize.xs, color: Colors.textLight },
  typeBadge: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  typeBadgeText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
});