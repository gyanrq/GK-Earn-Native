// src/features/settings/SettingsScreen.js
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, StatusBar, Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Button, Input, Card, LoadingScreen, ConfirmModal } from '../../core/ui';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../core/theme/colors';
import { useAuth } from '../../core/auth/AuthContext';
import api from '../../core/api/api';

export default function SettingsScreen() {
  const { userInfo, logout, updateUserInfo } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [section, setSection] = useState(null);
  const [logoutModal, setLogoutModal] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const { data } = await api.get('/users/me');
      setProfile(data.data || data);
    } catch (e) {
      console.log('Profile error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <LoadingScreen message="Loading settings..." />;

  // Backend UserResponseDTO uses `name` (not fullName), `phone` (not mobile)
  const name = profile?.name || userInfo?.name || 'User';
  const email = profile?.email || userInfo?.email || '';
  const phone = profile?.phone || '';
  const emailVerified = profile?.isEmailVerified || false;
  const avatarLetter = name.charAt(0).toUpperCase();

  const menuSections = [
    {
      title: 'Account',
      items: [
        { icon: '👤', label: 'Edit Profile', onPress: () => setSection('profile') },
        { icon: '🔒', label: 'Change Password', onPress: () => setSection('password') },
      ],
    },
    {
      title: 'Verification',
      items: [
        {
          icon: emailVerified ? '✅' : '📧',
          label: emailVerified ? 'Email Verified' : 'Verify Email',
          onPress: () => !emailVerified && setSection('email'),
          badge: emailVerified ? 'Verified' : 'Unverified',
          badgeColor: emailVerified ? Colors.success : Colors.warning,
          disabled: emailVerified,
        },
      ],
    },
    {
      title: 'App',
      items: [
        { icon: '📋', label: 'Terms & Conditions', onPress: () => {} },
        { icon: 'ℹ️', label: 'About EarnX3', onPress: () => {} },
        { icon: '🚪', label: 'Logout', onPress: () => setLogoutModal(true), danger: true },
      ],
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[Colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{avatarLetter}</Text></View>
          <Text style={styles.profileName}>{name}</Text>
          <Text style={styles.profileEmail}>{email}</Text>
          {phone ? <Text style={styles.profileMobile}>📱 {phone}</Text> : null}
          {userInfo?.referralCode ? (
            <View style={styles.refBadge}>
              <Text style={styles.refBadgeText}>🔗 {userInfo.referralCode}</Text>
            </View>
          ) : null}
        </View>

        {/* Menu Sections */}
        {menuSections.map((sec) => (
          <View key={sec.title} style={styles.menuSection}>
            <Text style={styles.menuSectionTitle}>{sec.title}</Text>
            <View style={styles.menuCard}>
              {sec.items.map((item, i) => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.menuItem, i < sec.items.length - 1 && styles.menuItemBorder, item.disabled && { opacity: 0.5 }]}
                  onPress={item.onPress}
                  disabled={item.disabled}
                >
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                  <Text style={[styles.menuLabel, item.danger && { color: Colors.danger }]}>{item.label}</Text>
                  {item.badge ? (
                    <View style={[styles.badgeChip, { backgroundColor: item.badgeColor + '22' }]}>
                      <Text style={[styles.badgeChipText, { color: item.badgeColor }]}>{item.badge}</Text>
                    </View>
                  ) : null}
                  {!item.disabled && !item.danger && <Text style={styles.menuArrow}>›</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <Text style={styles.version}>EarnX3 v1.0.0</Text>
        <View style={{ height: 40 }} />
      </ScrollView>

      <EditProfileModal
        visible={section === 'profile'}
        profile={profile}
        onClose={() => setSection(null)}
        onSuccess={(updated) => {
          setProfile((p) => ({ ...p, ...updated }));
          updateUserInfo(updated);
          showToast('✅ Profile updated!');
          setSection(null);
        }}
      />

      <ChangePasswordModal
        visible={section === 'password'}
        onClose={() => setSection(null)}
        onSuccess={() => { showToast('✅ Password changed!'); setSection(null); }}
      />

      <VerifyEmailModal
        visible={section === 'email'}
        onClose={() => setSection(null)}
        onSuccess={() => { setProfile((p) => ({ ...p, isEmailVerified: true })); showToast('✅ Email verified!'); setSection(null); }}
      />

      <ConfirmModal
        visible={logoutModal}
        title="Logout"
        message="Are you sure you want to logout from EarnX3?"
        confirmText="Logout"
        danger
        onConfirm={logout}
        onCancel={() => setLogoutModal(false)}
      />

      {toast ? (
        <View style={styles.toast}><Text style={styles.toastText}>{toast}</Text></View>
      ) : null}
    </View>
  );
}

// ── Edit Profile Modal ────────────────────────────────────────────────────────
function EditProfileModal({ visible, profile, onClose, onSuccess }) {
  // Backend UserProfileUpdateDTO uses `name` (not fullName), no `phone/mobile` field
  const [form, setForm] = useState({ name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  React.useEffect(() => {
    if (visible && profile) setForm({ name: profile.name || '' });
  }, [visible, profile]);

  const save = async () => {
    setError('');
    if (!form.name.trim()) { setError('Full name is required'); return; }
    setLoading(true);
    try {
      const { data } = await api.put('/users/me', { name: form.name.trim() });
      onSuccess(data.data || data);
    } catch (e) {
      setError(e.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={mStyles.overlay}>
        <View style={mStyles.box}>
          <Text style={mStyles.title}>✏️ Edit Profile</Text>
          {error ? <View style={mStyles.errorBox}><Text style={mStyles.errorText}>⚠️ {error}</Text></View> : null}
          <Input label="Full Name" value={form.name} onChangeText={set('name')} placeholder="Your name" leftIcon="👤" />
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
            <Button title="Cancel" variant="outline" onPress={onClose} style={{ flex: 1 }} />
            <Button title="Save" onPress={save} loading={loading} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Change Password Modal ─────────────────────────────────────────────────────
function ChangePasswordModal({ visible, onClose, onSuccess }) {
  // Backend ChangePasswordDTO uses `oldPassword` (not currentPassword), min 8 chars
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setError('');
    if (!form.oldPassword) { setError('Current password is required'); return; }
    if (!form.newPassword || form.newPassword.length < 8) { setError('New password must be at least 8 characters'); return; }
    if (form.newPassword !== form.confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await api.post('/users/change-password', {
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
      });
      onSuccess();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={mStyles.overlay}>
        <View style={mStyles.box}>
          <Text style={mStyles.title}>🔒 Change Password</Text>
          {error ? <View style={mStyles.errorBox}><Text style={mStyles.errorText}>⚠️ {error}</Text></View> : null}
          <Input label="Current Password" value={form.oldPassword} onChangeText={set('oldPassword')} placeholder="Enter current password" leftIcon="🔑" secureTextEntry />
          <Input label="New Password" value={form.newPassword} onChangeText={set('newPassword')} placeholder="Min 8 characters" leftIcon="🔒" secureTextEntry />
          <Input label="Confirm New Password" value={form.confirmPassword} onChangeText={set('confirmPassword')} placeholder="Re-enter new password" leftIcon="🔐" secureTextEntry />
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
            <Button title="Cancel" variant="outline" onPress={onClose} style={{ flex: 1 }} />
            <Button title="Change" onPress={save} loading={loading} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Verify Email Modal ────────────────────────────────────────────────────────
function VerifyEmailModal({ visible, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendOtp = async () => {
    setError(''); setLoading(true);
    try {
      await api.post('/users/send-email-verification');
      setStep(2);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const verify = async () => {
    setError('');
    if (!otp.trim()) { setError('Enter the OTP'); return; }
    setLoading(true);
    try {
      await api.post('/users/verify-email', { otp: otp.trim() });
      onSuccess();
    } catch (e) {
      setError(e.response?.data?.message || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={mStyles.overlay}>
        <View style={mStyles.box}>
          <Text style={mStyles.title}>📧 Verify Email</Text>
          {error ? <View style={mStyles.errorBox}><Text style={mStyles.errorText}>⚠️ {error}</Text></View> : null}
          {step === 1 ? (
            <>
              <Text style={mStyles.desc}>We'll send an OTP to your registered email address to verify it.</Text>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                <Button title="Cancel" variant="outline" onPress={onClose} style={{ flex: 1 }} />
                <Button title="Send OTP" onPress={sendOtp} loading={loading} style={{ flex: 1 }} />
              </View>
            </>
          ) : (
            <>
              <Text style={mStyles.desc}>Enter the OTP sent to your email.</Text>
              <Input label="OTP Code" value={otp} onChangeText={setOtp} placeholder="6-digit OTP" leftIcon="🔑" keyboardType="number-pad" />
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                <Button title="Back" variant="outline" onPress={() => setStep(1)} style={{ flex: 1 }} />
                <Button title="Verify" onPress={verify} loading={loading} style={{ flex: 1 }} />
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  profileHeader: { backgroundColor: Colors.primary, alignItems: 'center', paddingTop: 50, paddingBottom: 30, paddingHorizontal: 20 },
  avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center', marginBottom: 12, elevation: 4 },
  avatarText: { fontSize: 34, color: Colors.primary, fontWeight: '900' },
  profileName: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.white },
  profileEmail: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginTop: 3 },
  profileMobile: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  refBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 5, marginTop: 10 },
  refBadgeText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.sm },
  menuSection: { paddingHorizontal: 16, marginTop: 20 },
  menuSectionTitle: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.gray, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  menuCard: { backgroundColor: Colors.white, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 16 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
  menuIcon: { fontSize: 20, marginRight: 12 },
  menuLabel: { flex: 1, fontSize: FontSize.md, color: Colors.dark, fontWeight: '500' },
  menuArrow: { fontSize: 22, color: Colors.gray },
  badgeChip: { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3, marginRight: 8 },
  badgeChipText: { fontSize: FontSize.xs, fontWeight: '700' },
  version: { textAlign: 'center', color: Colors.textLight, fontSize: FontSize.xs, marginTop: 24 },
  toast: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: Colors.dark, padding: 14, borderRadius: Radius.md, alignItems: 'center' },
  toastText: { color: Colors.white, fontWeight: '600' },
});

const mStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  box: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg },
  title: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.dark, marginBottom: Spacing.md },
  desc: { fontSize: FontSize.sm, color: Colors.gray, marginBottom: Spacing.md },
  errorBox: { backgroundColor: '#fff3f3', borderRadius: Radius.md, padding: 10, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: Colors.danger },
  errorText: { color: Colors.danger, fontSize: FontSize.sm },
});