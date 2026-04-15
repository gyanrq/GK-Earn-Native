// src/features/tasks/TasksScreen.js
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Modal, Linking, StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Button, Input, LoadingScreen, EmptyState, Badge } from '../../core/ui';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../core/theme/colors';
import api from '../../core/api/api';

const CATEGORY_ICONS = {
  DAILY: '⚡', CRYPTO: '₿', DEMAT: '📈', APP: '📱', KYC: '🪪',
};

const CATEGORY_COLORS = {
  DAILY: '#e3f2fd', CRYPTO: '#fff8e1', DEMAT: '#e8f5e9', APP: '#f3e5f5', KYC: '#fce4ec',
};

export default function TasksScreen() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Lead capture modal
  const [leadModal, setLeadModal] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [leadForm, setLeadForm] = useState({ email: '', mobile: '' });
  const [leadLoading, setLeadLoading] = useState(false);
  const [leadError, setLeadError] = useState('');

  // Result toast
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const loadTasks = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const { data } = await api.get('/tasks/today');
      const taskList = data.data || data || [];
      // STRICT SAFETY: Prevent Array crash
      setTasks(Array.isArray(taskList) ? taskList : []);
    } catch (e) {
      console.log('Tasks error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadTasks(); }, [loadTasks]));

  const handleTaskPress = async (task) => {
    if (task.completed) { showToast('✅ Already completed today!'); return; }

    if (task.requiresLead && !task.leadSubmitted) {
      setActiveTask(task);
      setLeadForm({ email: '', mobile: '' });
      setLeadError('');
      setLeadModal(true);
      return;
    }

    if (task.partnerUrl) {
      await Linking.openURL(task.partnerUrl).catch(() => {});
      await markComplete(task.taskType);
      return;
    }

    await markComplete(task.taskType);
  };

  const submitLead = async () => {
    setLeadError('');
    if (!leadForm.email.trim() || !leadForm.mobile.trim()) {
      setLeadError('Email and mobile are required');
      return;
    }
    setLeadLoading(true);
    try {
      const { data } = await api.post('/tasks/submit-lead', {
        taskType: activeTask.taskType,
        email: leadForm.email.trim(),
        mobile: leadForm.mobile.trim(),
      });
      const url = data.data?.partnerUrl || data.partnerUrl;
      setLeadModal(false);
      if (url) {
        await Linking.openURL(url).catch(() => {});
        await markComplete(activeTask.taskType);
      } else {
        // Lead submitted without a redirect — show pending message
        setLeadModal(false);
        showToast('📋 Lead submitted! Credits pending admin review.');
        loadTasks();
      }
    } catch (e) {
      setLeadError(e.response?.data?.message || 'Failed to submit details');
    } finally {
      setLeadLoading(false);
    }
  };

  const markComplete = async (taskType) => {
    try {
      await api.post('/tasks/complete', { taskType });
      // FIX: Credits are NOT added instantly — admin must verify the lead first.
      // Only SPIN rewards are instant. Task/Campaign rewards go PENDING until admin approves.
      showToast('✅ Task submitted! Credits will be added after admin review.');
      loadTasks();
    } catch (e) {
      const msg = e.response?.data?.message || 'Could not complete task';
      showToast(msg.includes('already') ? '✅ Already done today!' : '❌ ' + msg);
    }
  };

  // Safe grouping
  const grouped = Array.isArray(tasks) ? tasks.reduce((acc, t) => {
    const cat = t.category || 'DAILY';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {}) : {};

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCredits = tasks.reduce((s, t) => s + (t.credits || 0), 0);

  if (loading) return <LoadingScreen message="Loading today's tasks..." />;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadTasks(true)} colors={[Colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🎯 Daily Tasks</Text>
          <Text style={styles.headerSub}>Complete tasks to earn credits</Text>
          <View style={styles.headerStats}>
            <View style={styles.headerStatItem}>
              <Text style={styles.headerStatVal}>{completedCount}/{tasks.length}</Text>
              <Text style={styles.headerStatLbl}>Done</Text>
            </View>
            <View style={styles.headerStatItem}>
              <Text style={styles.headerStatVal}>{totalCredits.toLocaleString()}</Text>
              <Text style={styles.headerStatLbl}>Total Credits</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${tasks.length ? (completedCount / tasks.length) * 100 : 0}%` }]} />
          </View>
        </View>

        {tasks.length === 0
          ? <EmptyState icon="🎯" title="No tasks today" subtitle="Check back tomorrow!" />
          : Object.entries(grouped).map(([cat, catTasks]) => (
            <View key={cat} style={styles.section}>
              <Text style={styles.categoryTitle}>
                {CATEGORY_ICONS[cat] || '📋'} {cat} Tasks
              </Text>
              {catTasks.map((task) => (
                <TaskCard
                  key={task.taskType}
                  task={task}
                  onPress={() => handleTaskPress(task)}
                  bgColor={CATEGORY_COLORS[cat] || '#f5f5f5'}
                />
              ))}
            </View>
          ))}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Lead Capture Modal */}
      <Modal visible={leadModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>📋 Quick Details</Text>
            <Text style={styles.modalSub}>
              Enter your details to unlock <Text style={{ fontWeight: '700', color: Colors.primary }}>{activeTask?.label}</Text>
            </Text>
            {leadError ? (
              <View style={styles.errorBox}><Text style={styles.errorText}>⚠️ {leadError}</Text></View>
            ) : null}
            <Input label="Email" value={leadForm.email}
              onChangeText={(v) => setLeadForm((f) => ({ ...f, email: v }))}
              placeholder="your@email.com" leftIcon="📧" keyboardType="email-address" />
            <Input label="Mobile" value={leadForm.mobile}
              onChangeText={(v) => setLeadForm((f) => ({ ...f, mobile: v }))}
              placeholder="10-digit mobile" leftIcon="📱" keyboardType="phone-pad" />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <Button title="Cancel" variant="outline" onPress={() => setLeadModal(false)} style={{ flex: 1 }} />
              <Button title="Submit & Open" onPress={submitLead} loading={leadLoading} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      {toastMsg ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toastMsg}</Text>
        </View>
      ) : null}
    </View>
  );
}

function TaskCard({ task, onPress, bgColor }) {
  return (
    <TouchableOpacity
      style={[styles.taskCard, task.completed && styles.taskCardDone]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.taskIconBox, { backgroundColor: bgColor }]}>
        <Text style={styles.taskIcon}>{task.icon || '⭐'}</Text>
      </View>
      <View style={styles.taskInfo}>
        <Text style={[styles.taskLabel, task.completed && styles.taskLabelDone]}>{task.label}</Text>
        <Text style={styles.taskDesc} numberOfLines={2}>{task.description}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <Badge label={`+${task.credits} credits`} color={task.completed ? Colors.gray : Colors.success} />
          {task.requiresLead && !task.leadSubmitted && !task.completed && (
            <Badge label="Details needed" color={Colors.warning} />
          )}
        </View>
      </View>
      <View style={styles.taskAction}>
        {task.completed
          ? <Text style={styles.doneCheck}>✅</Text>
          : <Text style={styles.goArrow}>›</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: Colors.primary, padding: 20, paddingTop: 50 },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: '900', color: Colors.white },
  headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.sm, marginTop: 2 },
  headerStats: { flexDirection: 'row', gap: 24, marginTop: 16 },
  headerStatItem: { alignItems: 'center' },
  headerStatVal: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.white },
  headerStatLbl: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.75)' },
  progressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 3, marginTop: 16 },
  progressFill: { height: 6, backgroundColor: Colors.white, borderRadius: 3 },
  section: { paddingHorizontal: 16, marginTop: 20 },
  categoryTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.dark, marginBottom: 10, textTransform: 'capitalize' },
  taskCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: 14, marginBottom: 10, ...Shadow.sm,
  },
  taskCardDone: { opacity: 0.65 },
  taskIconBox: { width: 50, height: 50, borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  taskIcon: { fontSize: 26 },
  taskInfo: { flex: 1 },
  taskLabel: { fontSize: FontSize.md, fontWeight: '700', color: Colors.dark },
  taskLabelDone: { textDecorationLine: 'line-through', color: Colors.gray },
  taskDesc: { fontSize: FontSize.xs, color: Colors.gray, marginTop: 2 },
  taskAction: { marginLeft: 8 },
  doneCheck: { fontSize: 22 },
  goArrow: { fontSize: 28, color: Colors.primary, fontWeight: '300' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.dark, marginBottom: 4 },
  modalSub: { fontSize: FontSize.sm, color: Colors.gray, marginBottom: Spacing.md },
  errorBox: { backgroundColor: '#fff3f3', borderRadius: Radius.md, padding: 10, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: Colors.danger },
  errorText: { color: Colors.danger, fontSize: FontSize.sm },
  toast: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: Colors.dark, padding: 14, borderRadius: Radius.md, alignItems: 'center' },
  toastText: { color: Colors.white, fontWeight: '600', fontSize: FontSize.sm },
});