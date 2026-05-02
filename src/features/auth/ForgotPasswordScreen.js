// src/features/auth/ForgotPasswordScreen.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { Button, Input } from '../../core/ui';
import { Colors, Spacing, FontSize, Radius } from '../../core/theme/colors';
import api from '../../core/api/api';

export default function ForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState(1); // 1=enter identifier, 2=enter OTP+new pass
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSendOtp = async () => {
    setError('');
    if (!identifier.trim()) { setError('Enter your email or mobile number'); return; }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { identifier: identifier.trim() });
      setStep(2);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError('');
    if (!otp.trim()) { setError('Enter the OTP sent to you'); return; }
    if (!newPassword || newPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        identifier: identifier.trim(),
        otp: otp.trim(),
        newPassword,
      });
      setSuccess(true);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.successTitle}>Password Reset!</Text>
        <Text style={styles.successMsg}>Your password has been updated. Please login with your new password.</Text>
        <Button title="Go to Login" onPress={() => navigation.navigate('Login')} style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🔐 Reset Password</Text>
        </View>

        <View style={styles.card}>
          {step === 1 ? (
            <>
              <Text style={styles.title}>Forgot Password?</Text>
              <Text style={styles.subtitle}>
                Enter your email or mobile number and we'll send you an OTP to reset your password.
              </Text>
              {error ? <View style={styles.errorBox}><Text style={styles.errorText}>⚠️ {error}</Text></View> : null}
              <Input
                label="Email or Mobile Number"
                value={identifier}
                onChangeText={setIdentifier}
                placeholder="Enter email or mobile"
                leftIcon="📧"
                keyboardType="email-address"
              />
              <Button title="Send OTP" onPress={handleSendOtp} loading={loading} />
            </>
          ) : (
            <>
              <Text style={styles.title}>Enter OTP</Text>
              <Text style={styles.subtitle}>
                OTP sent to <Text style={{ fontWeight: '700', color: Colors.primary }}>{identifier}</Text>
              </Text>
              {error ? <View style={styles.errorBox}><Text style={styles.errorText}>⚠️ {error}</Text></View> : null}
              <Input label="OTP Code" value={otp} onChangeText={setOtp}
                placeholder="Enter 6-digit OTP" leftIcon="🔑" keyboardType="number-pad" />
              <Input label="New Password" value={newPassword} onChangeText={setNewPassword}
                placeholder="Min 6 characters" leftIcon="🔒" secureTextEntry />
              <Input label="Confirm New Password" value={confirmPassword} onChangeText={setConfirmPassword}
                placeholder="Re-enter new password" leftIcon="🔐" secureTextEntry />
              <Button title="Reset Password" onPress={handleResetPassword} loading={loading} />
              <TouchableOpacity onPress={() => setStep(1)} style={styles.resendBtn}>
                <Text style={styles.resendText}>← Back / Resend OTP</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  content: { paddingBottom: 40 },
  header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 30 },
  backBtn: { marginBottom: 16 },
  backText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '600' },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.white },
  card: { backgroundColor: Colors.white, borderRadius: 24, marginHorizontal: 20, padding: Spacing.lg, elevation: 10 },
  title: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.dark, marginBottom: 6 },
  subtitle: { fontSize: FontSize.sm, color: Colors.gray, marginBottom: Spacing.lg, lineHeight: 20 },
  errorBox: { backgroundColor: '#fff3f3', borderRadius: Radius.md, padding: 12, marginBottom: Spacing.md, borderLeftWidth: 3, borderLeftColor: Colors.danger },
  errorText: { color: Colors.danger, fontSize: FontSize.sm },
  resendBtn: { alignItems: 'center', marginTop: Spacing.md },
  resendText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '600' },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: Colors.background },
  successIcon: { fontSize: 64, marginBottom: 16 },
  successTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.dark },
  successMsg: { fontSize: FontSize.md, color: Colors.gray, textAlign: 'center', marginTop: 8 },
});