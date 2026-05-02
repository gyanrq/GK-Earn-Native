// src/core/ui/index.js — All shared UI components

import React from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, TextInput, Modal, ScrollView,
} from 'react-native';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../theme/colors';

// ── Button ────────────────────────────────────────────────────────────────────
export const Button = ({
  title, onPress, loading, disabled, variant = 'primary',
  style, textStyle, icon,
}) => {
  const bgColor = {
    primary: Colors.primary, secondary: Colors.secondary,
    success: Colors.success, danger: Colors.danger,
    outline: 'transparent', ghost: 'transparent',
  }[variant] || Colors.primary;

  const isOutline = variant === 'outline' || variant === 'ghost';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.btn,
        { backgroundColor: bgColor },
        isOutline && { borderWidth: 1.5, borderColor: Colors.primary },
        (disabled || loading) && { opacity: 0.6 },
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator color={isOutline ? Colors.primary : Colors.white} size="small" />
        : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {icon ? <Text style={{ fontSize: 16 }}>{icon}</Text> : null}
            <Text style={[
              styles.btnText,
              isOutline && { color: Colors.primary },
              textStyle,
            ]}>{title}</Text>
          </View>
        )}
    </TouchableOpacity>
  );
};

// ── Input ─────────────────────────────────────────────────────────────────────
export const Input = ({
  label, value, onChangeText, placeholder, secureTextEntry,
  keyboardType, error, leftIcon, rightIcon, multiline, editable = true,
  style, inputStyle,
}) => (
  <View style={[styles.inputWrapper, style]}>
    {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
    <View style={[
      styles.inputBox,
      error && { borderColor: Colors.danger },
      !editable && { backgroundColor: Colors.lightGray },
    ]}>
      {leftIcon ? <Text style={styles.inputIcon}>{leftIcon}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textLight}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType || 'default'}
        multiline={multiline}
        editable={editable}
        style={[styles.inputText, multiline && { height: 80, textAlignVertical: 'top' }, inputStyle]}
        autoCapitalize="none"
      />
      {rightIcon ? <View style={styles.inputRightIcon}>{rightIcon}</View> : null}
    </View>
    {error ? <Text style={styles.inputError}>{error}</Text> : null}
  </View>
);

// ── Card ──────────────────────────────────────────────────────────────────────
export const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
);

// ── Badge ─────────────────────────────────────────────────────────────────────
export const Badge = ({ label, color = Colors.primary, style }) => (
  <View style={[styles.badge, { backgroundColor: color + '22' }, style]}>
    <Text style={[styles.badgeText, { color }]}>{label}</Text>
  </View>
);

// ── LoadingScreen ─────────────────────────────────────────────────────────────
export const LoadingScreen = ({ message = 'Loading...' }) => (
  <View style={styles.loadingScreen}>
    <ActivityIndicator size="large" color={Colors.primary} />
    <Text style={styles.loadingText}>{message}</Text>
  </View>
);

// ── EmptyState ────────────────────────────────────────────────────────────────
export const EmptyState = ({ icon = '📭', title, subtitle }) => (
  <View style={styles.empty}>
    <Text style={styles.emptyIcon}>{icon}</Text>
    <Text style={styles.emptyTitle}>{title}</Text>
    {subtitle ? <Text style={styles.emptySub}>{subtitle}</Text> : null}
  </View>
);

// ── SectionHeader ─────────────────────────────────────────────────────────────
export const SectionHeader = ({ title, action, onAction }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {action ? (
      <TouchableOpacity onPress={onAction}>
        <Text style={styles.sectionAction}>{action}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

// ── ConfirmModal ──────────────────────────────────────────────────────────────
export const ConfirmModal = ({ visible, title, message, onConfirm, onCancel, confirmText = 'Confirm', danger }) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.modalOverlay}>
      <View style={styles.modalBox}>
        <Text style={styles.modalTitle}>{title}</Text>
        <Text style={styles.modalMsg}>{message}</Text>
        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.modalCancel} onPress={onCancel}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalConfirm, danger && { backgroundColor: Colors.danger }]}
            onPress={onConfirm}
          >
            <Text style={styles.modalConfirmText}>{confirmText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

// ── Toast (simple inline) ─────────────────────────────────────────────────────
export const Toast = ({ message, type = 'info', visible }) => {
  if (!visible || !message) return null;
  const bg = { success: Colors.success, error: Colors.danger, info: Colors.primary, warning: Colors.warning }[type] || Colors.primary;
  return (
    <View style={[styles.toast, { backgroundColor: bg }]}>
      <Text style={styles.toastText}>{message}</Text>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 14, paddingHorizontal: 20,
    borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center',
    ...Shadow.sm,
  },
  btnText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.md },

  inputWrapper: { marginBottom: Spacing.md },
  inputLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.dark, marginBottom: 6 },
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md,
    backgroundColor: Colors.white, paddingHorizontal: 12,
  },
  inputIcon: { fontSize: 18, marginRight: 8 },
  inputText: { flex: 1, fontSize: FontSize.md, color: Colors.dark, paddingVertical: 13 },
  inputRightIcon: { paddingLeft: 8 },
  inputError: { fontSize: FontSize.xs, color: Colors.danger, marginTop: 4 },

  card: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.md, ...Shadow.sm,
  },

  badge: { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: FontSize.xs, fontWeight: '700' },

  loadingScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  loadingText: { marginTop: 12, color: Colors.gray, fontSize: FontSize.md },

  empty: { alignItems: 'center', padding: Spacing.xl },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.dark },
  emptySub: { fontSize: FontSize.sm, color: Colors.gray, marginTop: 4, textAlign: 'center' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.dark },
  sectionAction: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, width: '85%' },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.dark, marginBottom: 8 },
  modalMsg: { fontSize: FontSize.md, color: Colors.gray, marginBottom: Spacing.lg },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, padding: 12, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  modalCancelText: { color: Colors.gray, fontWeight: '600' },
  modalConfirm: { flex: 1, padding: 12, borderRadius: Radius.md, backgroundColor: Colors.primary, alignItems: 'center' },
  modalConfirmText: { color: Colors.white, fontWeight: '700' },

  toast: {
    position: 'absolute', bottom: 30, left: 20, right: 20,
    padding: 14, borderRadius: Radius.md, alignItems: 'center',
    ...Shadow.md,
  },
  toastText: { color: Colors.white, fontWeight: '600', fontSize: FontSize.sm },
});