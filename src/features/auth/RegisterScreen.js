// src/features/auth/RegisterScreen.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { Button, Input } from '../../core/ui';
import { Colors, Spacing, FontSize, Radius } from '../../core/theme/colors';
import api from '../../core/api/api';

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '', referredByCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    if (!form.name.trim()) return 'Full name is required';
    if (!form.email.trim()) return 'Email is required';
    if (!/\S+@\S+\.\S+/.test(form.email)) return 'Invalid email format';
    if (!form.phone.trim() || !/^[6-9]\d{9}$/.test(form.phone.trim()))
      return 'Enter a valid 10-digit mobile number starting with 6-9';
    if (!form.password || form.password.length < 8) return 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) return 'Passwords do not match';
    return null;
  };

  const handleRegister = async () => {
    setError('');
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setLoading(true);
    try {
      // Field names match backend UserRequestDTO exactly:
      // name, email, phone, password, referredByCode
      await api.post('/auth/register', {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        referredByCode: form.referredByCode.trim() || undefined,
      });
      setSuccess(true);
    } catch (e) {
      setError(e.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successIcon}>🎉</Text>
        <Text style={styles.successTitle}>Account Created!</Text>
        <Text style={styles.successMsg}>
          Your EarnX3 account is ready. Sign in to start earning!
        </Text>
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
          <Text style={styles.logo}>💎 EarnX3</Text>
          <Text style={styles.tagline}>Join & Start Earning</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Create Account</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          <Input
            label="Full Name"
            value={form.name}
            onChangeText={set('name')}
            placeholder="Enter your full name"
            leftIcon="👤"
          />
          <Input
            label="Email Address"
            value={form.email}
            onChangeText={set('email')}
            placeholder="Enter your email"
            leftIcon="📧"
            keyboardType="email-address"
          />
          <Input
            label="Mobile Number"
            value={form.phone}
            onChangeText={set('phone')}
            placeholder="10-digit mobile (starts with 6–9)"
            leftIcon="📱"
            keyboardType="phone-pad"
          />
          <Input
            label="Password"
            value={form.password}
            onChangeText={set('password')}
            placeholder="Min 8 characters"
            leftIcon="🔒"
            secureTextEntry={!showPass}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                <Text>{showPass ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            }
          />
          <Input
            label="Confirm Password"
            value={form.confirmPassword}
            onChangeText={set('confirmPassword')}
            placeholder="Re-enter password"
            leftIcon="🔐"
            secureTextEntry={!showPass}
          />
          <Input
            label="Referral Code (Optional)"
            value={form.referredByCode}
            onChangeText={set('referredByCode')}
            placeholder="Enter referral code if you have one"
            leftIcon="🎁"
          />

          <Button title="Create Account" onPress={handleRegister} loading={loading} style={{ marginTop: 8 }} />

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
            <Text style={styles.loginLinkText}>
              Already have an account?{' '}
              <Text style={{ color: Colors.primary }}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  content: { paddingBottom: 40 },
  header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 30, alignItems: 'center' },
  backBtn: { alignSelf: 'flex-start', marginBottom: 16 },
  backText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '600' },
  logo: { fontSize: 30, fontWeight: '900', color: Colors.white },
  tagline: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  card: { backgroundColor: Colors.white, borderRadius: 24, marginHorizontal: 20, padding: Spacing.lg, elevation: 10 },
  title: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.dark, marginBottom: Spacing.md },
  errorBox: {
    backgroundColor: '#fff3f3', borderRadius: Radius.md,
    padding: 12, marginBottom: Spacing.md, borderLeftWidth: 3, borderLeftColor: Colors.danger,
  },
  errorText: { color: Colors.danger, fontSize: FontSize.sm },
  loginLink: { alignItems: 'center', marginTop: Spacing.md },
  loginLinkText: { fontSize: FontSize.sm, color: Colors.gray },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: Colors.background },
  successIcon: { fontSize: 64, marginBottom: 16 },
  successTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.dark },
  successMsg: { fontSize: FontSize.md, color: Colors.gray, textAlign: 'center', marginTop: 8 },
});
