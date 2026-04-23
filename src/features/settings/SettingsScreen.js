// src/features/settings/SettingsScreen.js
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, StatusBar, Modal, Image, Switch
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

  const name = profile?.name || userInfo?.name || 'User';
  const email = profile?.email || userInfo?.email || '';
  const phone = profile?.phone || '';
  const emailVerified = profile?.isEmailVerified || false;
  const phoneVerified = profile?.isPhoneVerified || false;
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
          onPress: () => setSection('email-verify'),
          badge: emailVerified ? 'Verified' : 'Unverified',
          badgeColor: emailVerified ? Colors.success : Colors.warning,
        },
        {
          icon: phoneVerified ? '✅' : '📱',
          label: phone ? (phoneVerified ? 'Phone Verified' : 'Verify Phone') : 'Add Phone Number',
          onPress: () => setSection('phone'),
          badge: phone ? (phoneVerified ? 'Verified' : 'Unverified') : 'Not Set',
          badgeColor: phoneVerified ? Colors.success : Colors.warning,
        },
        {
          icon: '📧',
          label: 'Update Email Address',
          onPress: () => setSection('email-update'),
        },
      ],
    },
    {
      title: 'Security (MFA)',
      items: [
        {
          icon: '🛡️',
          label: 'Two-Factor Authentication',
          onPress: () => setSection('mfa'),
          badge: profile?.mfaEnabled ? 'Enabled' : 'Disabled',
          badgeColor: profile?.mfaEnabled ? Colors.success : Colors.gray,
        },
      ],
    },
    {
      title: 'App',
      items: [
        { icon: '📋', label: 'Terms & Conditions', onPress: () => {} },
        { icon: 'ℹ️', label: 'About GK Earn', onPress: () => {} },
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
                  style={[styles.menuItem, i < sec.items.length - 1 && styles.menuItemBorder]}
                  onPress={item.onPress}
                >
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                  <Text style={[styles.menuLabel, item.danger && { color: Colors.danger }]}>{item.label}</Text>
                  {item.badge ? (
                    <View style={[styles.badgeChip, { backgroundColor: item.badgeColor + '22' }]}>
                      <Text style={[styles.badgeChipText, { color: item.badgeColor }]}>{item.badge}</Text>
                    </View>
                  ) : null}
                  {!item.danger && <Text style={styles.menuArrow}>›</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <Text style={styles.version}>GK Earn v1.0.0</Text>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modals */}
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
        visible={section === 'email-verify'}
        onClose={() => setSection(null)}
        onSuccess={() => {
          setProfile((p) => ({ ...p, isEmailVerified: true }));
          showToast('✅ Email verified!');
          setSection(null);
        }}
      />

      <UpdateEmailModal
        visible={section === 'email-update'}
        onClose={() => setSection(null)}
        onSuccess={(newEmail) => {
          setProfile((p) => ({ ...p, email: newEmail, isEmailVerified: true }));
          updateUserInfo({ email: newEmail, isEmailVerified: true });
          showToast('✅ Email updated!');
          setSection(null);
        }}
      />

      <PhoneModal
        visible={section === 'phone'}
        currentPhone={phone}
        onClose={() => setSection(null)}
        onSuccess={(updatedProfile) => {
          setProfile((p) => ({ ...p, ...updatedProfile }));
          updateUserInfo(updatedProfile);
          showToast('✅ Phone verified!');
          setSection(null);
        }}
      />

      {/* MFA Modal with Fix Included */}
      <MfaSettingsModal
        visible={section === 'mfa'}
        onClose={() => setSection(null)}
        onSuccess={(mfaEnabled) => {
          // ✅ FIX: update both local profile state AND persisted userInfo
          setProfile((p) => ({ ...p, mfaEnabled }));
          updateUserInfo({ mfaEnabled });   // was missing — badge stayed stale
          showToast('✅ MFA settings saved!');
          setSection(null);
        }}
      />

      <ConfirmModal
        visible={logoutModal}
        title="Logout"
        message="Are you sure you want to logout from GK Earn?"
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

// ── Edit Profile Modal ─────────────────────────────────────────────────────────
function EditProfileModal({ visible, profile, onClose, onSuccess }) {
  const [form, setForm] = useState({ name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  React.useEffect(() => {
    if (visible && profile) setForm({ name: profile.name || '' });
    if (!visible) setError('');
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
          <View style={mStyles.row}>
            <Button title="Cancel" variant="outline" onPress={onClose} style={{ flex: 1 }} />
            <Button title="Save" onPress={save} loading={loading} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Change Password Modal ──────────────────────────────────────────────────────
function ChangePasswordModal({ visible, onClose, onSuccess }) {
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  React.useEffect(() => { if (!visible) { setError(''); setForm({ oldPassword: '', newPassword: '', confirmPassword: '' }); } }, [visible]);

  const save = async () => {
    setError('');
    if (!form.oldPassword) { setError('Current password is required'); return; }
    if (!form.newPassword || form.newPassword.length < 8) { setError('New password must be at least 8 characters'); return; }
    if (form.newPassword !== form.confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await api.post('/users/change-password', { oldPassword: form.oldPassword, newPassword: form.newPassword });
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
          <View style={mStyles.row}>
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

  React.useEffect(() => { if (!visible) { setStep(1); setOtp(''); setError(''); } }, [visible]);

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
              <Text style={mStyles.desc}>We'll send an OTP to your registered email to verify it.</Text>
              <View style={mStyles.row}>
                <Button title="Cancel" variant="outline" onPress={onClose} style={{ flex: 1 }} />
                <Button title="Send OTP" onPress={sendOtp} loading={loading} style={{ flex: 1 }} />
              </View>
            </>
          ) : (
            <>
              <Text style={mStyles.desc}>Enter the OTP sent to your email.</Text>
              <Input label="OTP Code" value={otp} onChangeText={setOtp} placeholder="6-digit OTP" leftIcon="🔑" keyboardType="number-pad" maxLength={6} />
              <View style={mStyles.row}>
                <Button title="Resend" variant="outline" onPress={sendOtp} loading={loading} style={{ flex: 1 }} />
                <Button title="Verify" onPress={verify} loading={loading} style={{ flex: 1 }} />
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ── Update Email Modal ────────────────────────────────────────────────────────
function UpdateEmailModal({ visible, onClose, onSuccess }) {
  const [step, setStep] = useState(1); 
  const [newEmail, setNewEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => { if (!visible) { setStep(1); setNewEmail(''); setOtp(''); setError(''); } }, [visible]);

  const sendOtp = async () => {
    setError('');
    if (!newEmail.trim() || !/\S+@\S+\.\S+/.test(newEmail)) { setError('Enter a valid email'); return; }
    setLoading(true);
    try {
      await api.post('/users/send-email-update-otp', { newEmail: newEmail.trim().toLowerCase() });
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
      await api.post('/users/verify-and-update-email', {
        newEmail: newEmail.trim().toLowerCase(),
        otp: otp.trim(),
      });
      onSuccess(newEmail.trim().toLowerCase());
    } catch (e) {
      setError(e.response?.data?.message || 'Invalid OTP or email update failed');
    } finally { setLoading(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={mStyles.overlay}>
        <View style={mStyles.box}>
          <Text style={mStyles.title}>📧 Update Email</Text>
          {error ? <View style={mStyles.errorBox}><Text style={mStyles.errorText}>⚠️ {error}</Text></View> : null}
          {step === 1 ? (
            <>
              <Text style={mStyles.desc}>Enter your new email address. We'll send a verification OTP to it.</Text>
              <Input
                label="New Email Address"
                value={newEmail}
                onChangeText={setNewEmail}
                placeholder="newemail@example.com"
                leftIcon="📧"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <View style={mStyles.row}>
                <Button title="Cancel" variant="outline" onPress={onClose} style={{ flex: 1 }} />
                <Button title="Send OTP" onPress={sendOtp} loading={loading} style={{ flex: 1 }} />
              </View>
            </>
          ) : (
            <>
              <Text style={mStyles.desc}>Enter the OTP sent to {newEmail}</Text>
              <Input label="OTP Code" value={otp} onChangeText={setOtp} placeholder="6-digit OTP" leftIcon="🔑" keyboardType="number-pad" maxLength={6} />
              <View style={mStyles.row}>
                <Button title="← Back" variant="outline" onPress={() => setStep(1)} style={{ flex: 1 }} />
                <Button title="Confirm" onPress={verify} loading={loading} style={{ flex: 1 }} />
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ── Phone Modal ───────────────────────────────────────────────────────────────
function PhoneModal({ visible, currentPhone, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (visible) setPhone(currentPhone || '');
    if (!visible) { setStep(1); setOtp(''); setError(''); }
  }, [visible, currentPhone]);

  const sendOtp = async () => {
    setError('');
    if (!phone.trim() || !/^[6-9]\d{9}$/.test(phone.trim())) {
      setError('Enter a valid 10-digit Indian mobile number');
      return;
    }
    setLoading(true);
    try {
      await api.post('/users/send-phone-otp', { phone: phone.trim() });
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
      const { data } = await api.post('/users/verify-phone', {
        phone: phone.trim(),
        otp: otp.trim(),
      });
      onSuccess(data.data || data);
    } catch (e) {
      setError(e.response?.data?.message || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={mStyles.overlay}>
        <View style={mStyles.box}>
          <Text style={mStyles.title}>📱 {currentPhone ? 'Update Phone' : 'Add Phone Number'}</Text>
          {error ? <View style={mStyles.errorBox}><Text style={mStyles.errorText}>⚠️ {error}</Text></View> : null}
          {step === 1 ? (
            <>
              <Text style={mStyles.desc}>Enter your mobile number. We'll send an OTP to verify it.</Text>
              <Input
                label="Mobile Number"
                value={phone}
                onChangeText={setPhone}
                placeholder="10-digit number (starts with 6–9)"
                leftIcon="📱"
                keyboardType="phone-pad"
                maxLength={10}
              />
              <View style={mStyles.row}>
                <Button title="Cancel" variant="outline" onPress={onClose} style={{ flex: 1 }} />
                <Button title="Send OTP" onPress={sendOtp} loading={loading} style={{ flex: 1 }} />
              </View>
            </>
          ) : (
            <>
              <Text style={mStyles.desc}>Enter the OTP sent to {phone}</Text>
              <Input label="OTP Code" value={otp} onChangeText={setOtp} placeholder="6-digit OTP" leftIcon="🔑" keyboardType="number-pad" maxLength={6} />
              <View style={mStyles.row}>
                <Button title="← Back" variant="outline" onPress={() => setStep(1)} style={{ flex: 1 }} />
                <Button title="Verify" onPress={verify} loading={loading} style={{ flex: 1 }} />
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ── Modernized MFA Settings Modal ──────────────────────────────────────────────
function MfaSettingsModal({ visible, onClose, onSuccess }) {
  const [mfaSettings, setMfaSettings] = useState(null);
  const [localSettings, setLocalSettings] = useState({
    mfaEnabled: false, emailOtpEnabled: false, mobileOtpEnabled: false, totpEnabled: false,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [subSection, setSubSection] = useState(null); 
  const [totpData, setTotpData] = useState(null);     
  const [totpCode, setTotpCode] = useState('');
  const [totpLoading, setTotpLoading] = useState(false);
  const [totpError, setTotpError] = useState('');

  React.useEffect(() => {
    if (visible) { fetchSettings(); setSubSection(null); setTotpData(null); setTotpCode(''); setError(''); }
  }, [visible]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users/mfa/settings');
      const s = data.data || data;
      setMfaSettings(s);
      setLocalSettings({
        mfaEnabled: s.mfaEnabled || false,
        emailOtpEnabled: s.emailOtpEnabled || false,
        mobileOtpEnabled: s.mobileOtpEnabled || false,
        totpEnabled: s.totpEnabled || false,
      });
    } catch (e) {
      setError('Failed to load MFA settings');
    } finally { setLoading(false); }
  };

  const toggle = (key) => {
    setLocalSettings((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      
      // Smart Toggle Logic
      if (key === 'mfaEnabled') {
        if (!next.mfaEnabled) {
          next.emailOtpEnabled = false;
          next.mobileOtpEnabled = false;
          next.totpEnabled = false;
        } else {
          // Auto-select Email if nothing else is selected
          if (!prev.emailOtpEnabled && !prev.mobileOtpEnabled && !prev.totpEnabled) {
            next.emailOtpEnabled = true;
          }
        }
      }
      return next;
    });
  };

  const saveSettings = async () => {
    setError('');
    if (localSettings.mfaEnabled) {
      const anyEnabled = localSettings.emailOtpEnabled || localSettings.mobileOtpEnabled || localSettings.totpEnabled;
      if (!anyEnabled) { setError('Please enable at least one verification method.'); return; }
      if (localSettings.totpEnabled && !mfaSettings?.totpVerified) {
        setError('Set up Google Authenticator first before enabling it.'); return;
      }
    }
    setSaving(true);
    try {
      await api.put('/users/mfa/settings', localSettings);
      onSuccess(localSettings.mfaEnabled);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save MFA settings');
    } finally { setSaving(false); }
  };

  const initTotpSetup = async () => {  
    setTotpError(''); setTotpLoading(true);
    try {
      const { data } = await api.post('/users/mfa/totp/setup');
      setTotpData(data.data || data);
      setSubSection('totp-setup');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to start TOTP setup');
    } finally { setTotpLoading(false); }
  };

  const verifyTotpSetup = async () => { 
    setTotpError('');
    if (!totpCode.trim()) { setTotpError('Enter the 6-digit code'); return; }
    setTotpLoading(true);
    try {
      await api.post('/users/mfa/totp/verify-setup', { code: totpCode.trim() });
      setMfaSettings((prev) => ({ ...prev, totpVerified: true }));
      setSubSection(null); setTotpData(null); setTotpCode(''); setError('');
      fetchSettings();
    } catch (e) {
      setTotpError(e.response?.data?.message || 'Invalid code. Try again.');
    } finally { setTotpLoading(false); }
  };

  const disableTotp = async () => {  
    setError('');
    try {
      await api.delete('/users/mfa/totp');
      setMfaSettings((prev) => ({ ...prev, totpVerified: false }));
      setLocalSettings((prev) => ({ ...prev, totpEnabled: false }));
      fetchSettings();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to remove authenticator');
    }
  };

  const ModernToggleRow = ({ label, icon, desc, value, onToggle, disabled, isLast }) => (
    <TouchableOpacity
      activeOpacity={disabled ? 1 : 0.7}
      onPress={disabled ? undefined : onToggle}
      style={[mStyles.modernRow, !isLast && mStyles.modernRowBorder, disabled && { opacity: 0.45 }]}
    >
      <View style={[mStyles.modernIconContainer, value && mStyles.modernIconContainerActive]}>
        <Text style={mStyles.modernIcon}>{icon}</Text>
      </View>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={[mStyles.modernLabel, value && { color: Colors.primary }]}>{label}</Text>
        {desc ? <Text style={mStyles.modernDesc}>{desc}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: '#E5E7EB', true: Colors.primary + 'BB' }}
        thumbColor={value ? Colors.primary : '#9CA3AF'}
        ios_backgroundColor="#E5E7EB"
      />
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={mStyles.overlay}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }} keyboardShouldPersistTaps="handled">
          <View style={[mStyles.box, { maxHeight: '95%', padding: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28 }]}>
            
            {/* Handle bar */}
            <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' }} />
            </View>

            {/* Header */}
            <View style={{ paddingHorizontal: Spacing.lg, paddingTop: 8, paddingBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <View style={mStyles.headerIconBg}>
                  <Text style={{ fontSize: 22 }}>{subSection === 'totp-setup' ? '🔐' : '🛡️'}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={mStyles.title}>{subSection === 'totp-setup' ? 'Setup Authenticator' : 'Security & MFA'}</Text>
                  <Text style={mStyles.headerSubtitle}>
                    {subSection === 'totp-setup' ? 'Link your authenticator app' : 'Manage two-factor authentication'}
                  </Text>
                </View>
              </View>
              {error ? (
                <View style={mStyles.errorBox}>
                  <Text style={{ fontSize: 16, marginRight: 6 }}>⚠️</Text>
                  <Text style={[mStyles.errorText, { flex: 1 }]}>{error}</Text>
                </View>
              ) : null}
            </View>

            {subSection === 'totp-setup' ? (
               <View style={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg }}>
                 {/* Step indicators */}
                 <View style={mStyles.stepRow}>
                   <View style={mStyles.stepDot}><Text style={mStyles.stepNum}>1</Text></View>
                   <Text style={mStyles.stepText}>Install Google Authenticator on your phone</Text>
                 </View>
                 <View style={mStyles.stepRow}>
                   <View style={mStyles.stepDot}><Text style={mStyles.stepNum}>2</Text></View>
                   <Text style={mStyles.stepText}>Scan the QR code or enter the key manually</Text>
                 </View>
                 <View style={mStyles.stepRow}>
                   <View style={mStyles.stepDot}><Text style={mStyles.stepNum}>3</Text></View>
                   <Text style={mStyles.stepText}>Enter the 6-digit code shown in the app</Text>
                 </View>

                 {totpData?.qrDataUri ? (
                   <View style={mStyles.qrContainer}>
                     <View style={mStyles.qrInner}>
                       <Image source={{ uri: totpData.qrDataUri }} style={{ width: 170, height: 170 }} resizeMode="contain" />
                     </View>
                     <Text style={mStyles.qrLabel}>Scan with Authenticator App</Text>
                   </View>
                 ) : null}

                 {totpData?.manualEntryKey ? (
                   <View style={mStyles.keyBox}>
                     <Text style={mStyles.keyLabel}>MANUAL ENTRY KEY</Text>
                     <Text style={mStyles.keyText} selectable>{totpData.manualEntryKey}</Text>
                     <Text style={mStyles.keyHint}>Tap to select and copy</Text>
                   </View>
                 ) : null}

                 {totpError ? (
                   <View style={[mStyles.errorBox, { marginBottom: 8 }]}>
                     <Text style={mStyles.errorText}>⚠️ {totpError}</Text>
                   </View>
                 ) : null}

                 <Input
                   label="Verification Code"
                   value={totpCode}
                   onChangeText={setTotpCode}
                   placeholder="Enter 6-digit code"
                   leftIcon="🔐"
                   keyboardType="number-pad"
                   maxLength={6}
                 />
                 <View style={mStyles.row}>
                   <Button title="← Back" variant="outline" onPress={() => setSubSection(null)} style={{ flex: 1 }} />
                   <Button title="Verify & Link" onPress={verifyTotpSetup} loading={totpLoading} style={{ flex: 1 }} />
                 </View>
               </View>
            ) : (
              <View style={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg }}>
                {loading ? (
                  <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                    <Text style={{ fontSize: 28, marginBottom: 10 }}>🔄</Text>
                    <Text style={{ textAlign: 'center', color: Colors.gray, fontSize: 14 }}>Loading security settings...</Text>
                  </View>
                ) : (
                  <>
                    {/* Master MFA Toggle */}
                    <View style={mStyles.mfaMasterCard}>
                      <View style={mStyles.mfaMasterLeft}>
                        <View style={[mStyles.mfaMasterIcon, localSettings.mfaEnabled && mStyles.mfaMasterIconActive]}>
                          <Text style={{ fontSize: 24 }}>🛡️</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={mStyles.mfaMasterLabel}>Two-Factor Authentication</Text>
                          <Text style={mStyles.mfaMasterDesc}>
                            {localSettings.mfaEnabled ? '✅ Your account is protected' : 'Add an extra layer of security'}
                          </Text>
                        </View>
                      </View>
                      <Switch
                        value={localSettings.mfaEnabled}
                        onValueChange={() => toggle('mfaEnabled')}
                        trackColor={{ false: '#E5E7EB', true: Colors.primary + 'BB' }}
                        thumbColor={localSettings.mfaEnabled ? Colors.primary : '#9CA3AF'}
                        ios_backgroundColor="#E5E7EB"
                      />
                    </View>

                    {localSettings.mfaEnabled && (
                      <View style={{ marginTop: 20 }}>
                        <Text style={mStyles.methodsTitle}>VERIFICATION METHODS</Text>
                        <Text style={mStyles.methodsSubtitle}>Choose how you receive login codes</Text>
                        <View style={[mStyles.modernCard, { marginTop: 10 }]}>
                          <ModernToggleRow
                            icon="📧"
                            label="Email OTP"
                            desc="Codes sent to your registered email"
                            value={localSettings.emailOtpEnabled}
                            onToggle={() => toggle('emailOtpEnabled')}
                          />
                          <ModernToggleRow
                            icon="📱"
                            label="SMS OTP"
                            desc="Codes sent via text message"
                            value={localSettings.mobileOtpEnabled}
                            onToggle={() => toggle('mobileOtpEnabled')}
                          />
                          <ModernToggleRow
                            icon="🔐"
                            label="Authenticator App"
                            desc={mfaSettings?.totpVerified ? '✅ App successfully linked' : 'Setup required — tap link below'}
                            value={localSettings.totpEnabled}
                            onToggle={() => toggle('totpEnabled')}
                            disabled={!mfaSettings?.totpVerified}
                            isLast={true}
                          />
                        </View>

                        {/* Authenticator App Actions */}
                        {!mfaSettings?.totpVerified && localSettings.mfaEnabled ? (
                          <TouchableOpacity style={mStyles.linkAuthButton} onPress={initTotpSetup} activeOpacity={0.8}>
                            <Text style={{ fontSize: 18, marginRight: 8 }}>🔗</Text>
                            <Text style={mStyles.linkAuthText}>Link Google Authenticator</Text>
                          </TouchableOpacity>
                        ) : localSettings.mfaEnabled ? (
                          <TouchableOpacity style={mStyles.removeAuthButton} onPress={disableTotp} activeOpacity={0.8}>
                            <Text style={mStyles.removeAuthText}>🗑  Remove Authenticator App</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    )}

                    <View style={[mStyles.row, { marginTop: 24 }]}>
                      <Button title="Cancel" variant="outline" onPress={onClose} style={{ flex: 1 }} />
                      <Button title="Save Changes" onPress={saveSettings} loading={saving} style={{ flex: 1 }} />
                    </View>
                  </>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
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
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  box: { backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: Spacing.lg },
  title: { fontSize: 20, fontWeight: '800', color: Colors.dark, marginBottom: 2 },
  headerSubtitle: { fontSize: 13, color: Colors.gray, marginTop: 1 },
  desc: { fontSize: FontSize.sm, color: Colors.gray, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 12, marginTop: 8 },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF3F3', borderRadius: Radius.md, padding: 10, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: Colors.danger },
  errorText: { color: Colors.danger, fontSize: FontSize.sm },

  // Header icon
  headerIconBg: { width: 52, height: 52, borderRadius: 16, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center' },

  // Master MFA card
  mfaMasterCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.border || '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  mfaMasterLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginBottom: 10 },
  mfaMasterIcon: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  mfaMasterIconActive: { backgroundColor: Colors.primary + '18' },
  mfaMasterLabel: { fontSize: 16, fontWeight: '800', color: Colors.dark },
  mfaMasterDesc: { fontSize: 12, color: Colors.gray, marginTop: 3, lineHeight: 17 },

  // Methods section
  methodsTitle: { fontSize: 11, fontWeight: '800', color: Colors.gray, textTransform: 'uppercase', letterSpacing: 1.2 },
  methodsSubtitle: { fontSize: 12, color: Colors.textLight || Colors.gray, marginTop: 3 },

  // Modern Card (toggle rows)
  modernCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border || '#E5E7EB',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  modernRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: Colors.white,
  },
  modernRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border || '#F3F4F6',
  },
  modernIconContainer: {
    width: 42, height: 42,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  modernIconContainerActive: {
    backgroundColor: Colors.primary + '18',
  },
  modernIcon: { fontSize: 20 },
  modernLabel: { fontSize: 14, fontWeight: '700', color: Colors.dark },
  modernDesc: { fontSize: 12, color: Colors.gray, marginTop: 2, lineHeight: 16 },

  // Action buttons (link / remove authenticator)
  linkAuthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.primary + '12',
    borderWidth: 1.5,
    borderColor: Colors.primary + '30',
    borderStyle: 'dashed',
  },
  linkAuthText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
  removeAuthButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: Colors.danger + '0D',
  },
  removeAuthText: { color: Colors.danger, fontWeight: '600', fontSize: 13 },

  // TOTP Setup steps
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  stepDot: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 10, marginTop: 1,
  },
  stepNum: { color: Colors.white, fontSize: 12, fontWeight: '800' },
  stepText: { flex: 1, fontSize: 13, color: Colors.dark, lineHeight: 20 },

  // QR code
  qrContainer: { alignItems: 'center', marginVertical: 16 },
  qrInner: {
    padding: 12, backgroundColor: Colors.white,
    borderRadius: 16, borderWidth: 1,
    borderColor: Colors.border || '#E5E7EB',
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  qrLabel: { marginTop: 10, fontSize: 12, color: Colors.gray, fontWeight: '600' },

  // Key box
  keyBox: {
    backgroundColor: '#F0F4FF',
    borderRadius: 14, padding: 14, marginBottom: 14,
    borderLeftWidth: 3, borderLeftColor: Colors.primary,
  },
  keyLabel: { fontSize: 10, color: Colors.gray, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  keyText: { fontSize: 15, fontWeight: '800', color: Colors.primary, letterSpacing: 2.5 },
  keyHint: { fontSize: 11, color: Colors.gray, marginTop: 6 },

  // Legacy / kept for backward compat
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
  toggleLabel: { fontSize: FontSize.md, fontWeight: '600', color: Colors.dark },
  toggleDesc: { fontSize: FontSize.xs, color: Colors.gray, marginTop: 2 },
  toggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: Colors.border, justifyContent: 'center', padding: 2 },
  toggleOn: { backgroundColor: Colors.primary },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.white, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },
  toggleThumbOn: { alignSelf: 'flex-end' },
  methodsBox: { backgroundColor: Colors.background, borderRadius: Radius.md, padding: 12, marginTop: 8, marginBottom: 8 },
  removeTotp: { paddingVertical: 6, alignItems: 'flex-end' },
  actionButton: { marginTop: 12, paddingVertical: 10, alignItems: 'center' },
  actionButtonText: { color: Colors.primary, fontWeight: '700', fontSize: FontSize.sm },
  actionButtonDanger: { marginTop: 12, paddingVertical: 10, alignItems: 'center' },
  actionButtonTextDanger: { color: Colors.danger, fontWeight: '600', fontSize: FontSize.sm },
});