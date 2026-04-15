// src/features/tasks/components/TaskCard.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const CATEGORY_COLORS = {
  DAILY:  { bg: '#EEF2FF', accent: '#4F46E5', pill: '#c7d2fe' },
  CRYPTO: { bg: '#FFF7ED', accent: '#EA580C', pill: '#fed7aa' },
  DEMAT:  { bg: '#F0FDF4', accent: '#16A34A', pill: '#bbf7d0' },
  APP:    { bg: '#FFF1F2', accent: '#E11D48', pill: '#fecdd3' },
  KYC:    { bg: '#F0F9FF', accent: '#0284C7', pill: '#bae6fd' },
};

export default function TaskCard({ task, onPress }) {
  const colors = CATEGORY_COLORS[task.category] || CATEGORY_COLORS.DAILY;

  const state = task.completed
    ? 'done'
    : task.leadSubmitted
    ? 'go'       // lead submitted, show "Go to Site" + complete
    : task.requiresLead
    ? 'unlock'   // needs lead capture first
    : 'claim';   // simple claim

  return (
    <TouchableOpacity
      style={[styles.card, task.completed && styles.cardDone]}
      onPress={() => !task.completed && onPress(task)}
      activeOpacity={task.completed ? 1 : 0.8}
    >
      {/* Left icon */}
      <View style={[styles.iconBox, { backgroundColor: colors.bg }]}>
        <Text style={styles.iconText}>{task.icon}</Text>
        {task.completed && (
          <View style={styles.doneOverlay}>
            <Text style={styles.doneOverlayTick}>✓</Text>
          </View>
        )}
      </View>

      {/* Body */}
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={[styles.label, task.completed && styles.labelDone]} numberOfLines={1}>
            {task.label}
          </Text>
          <View style={[styles.creditBadge, { backgroundColor: colors.pill }]}>
            <Text style={[styles.creditText, { color: colors.accent }]}>
              +{task.credits}
            </Text>
          </View>
        </View>

        <Text style={styles.desc} numberOfLines={2}>{task.description}</Text>

        {/* Bottom row */}
        {task.completed ? (
          <View style={styles.completedRow}>
            <Text style={styles.completedText}>✅ Completed — Credits Added</Text>
          </View>
        ) : (
          <View style={styles.actionRow}>
            {state === 'done' ? null :
             state === 'go' ? (
              <View style={styles.goRow}>
                <View style={[styles.actionPill, { backgroundColor: colors.accent }]}>
                  <Text style={styles.actionPillText}>🌐 Go to Site</Text>
                </View>
                <View style={[styles.actionPill, styles.completePill]}>
                  <Text style={styles.completePillText}>✅ Mark Done</Text>
                </View>
              </View>
             ) : state === 'unlock' ? (
              <View style={[styles.actionPill, { backgroundColor: '#f0f4ff', borderWidth: 1.5, borderColor: colors.accent }]}>
                <Text style={[styles.actionPillText, { color: colors.accent }]}>🔓 Fill Details & Unlock</Text>
              </View>
             ) : (
              <View style={[styles.actionPill, { backgroundColor: colors.accent }]}>
                <Text style={styles.actionPillText}>Claim Now →</Text>
              </View>
             )
            }
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  cardDone: { opacity: 0.65 },

  iconBox: {
    width: 56, height: 56, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 14, position: 'relative',
  },
  iconText: { fontSize: 28 },
  doneOverlay: {
    position: 'absolute', top: -4, right: -4,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#28a745',
    justifyContent: 'center', alignItems: 'center',
  },
  doneOverlayTick: { color: '#fff', fontSize: 11, fontWeight: '900' },

  body: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  label: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1a1a2e', marginRight: 8 },
  labelDone: { textDecorationLine: 'line-through', color: '#aaa' },

  creditBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
  },
  creditText: { fontSize: 12, fontWeight: '800' },

  desc: { fontSize: 12, color: '#888', lineHeight: 16, marginBottom: 10 },

  completedRow: { marginTop: 2 },
  completedText: { fontSize: 11, color: '#28a745', fontWeight: '600' },

  actionRow: { flexDirection: 'row' },
  goRow: { flexDirection: 'row', flexWrap: 'wrap' },

  actionPill: {
    borderRadius: 20, paddingVertical: 7, paddingHorizontal: 14,
    marginRight: 8, marginBottom: 4,
  },
  actionPillText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  completePill: { backgroundColor: '#d4edda' },
  completePillText: { color: '#28a745', fontWeight: '700', fontSize: 12 },
});