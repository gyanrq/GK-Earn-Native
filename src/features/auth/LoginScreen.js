// src/features/auth/LoginScreen.js
import React, { useState, useContext } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { AuthContext } from '../../core/auth/AuthContext';
import { Button, Input } from '../../core/ui';
import { Colors, Spacing, FontSize, Radius } from '../../core/theme/colors';
import api from '../../core/api/api';

export default function LoginScreen({ navigation }) {
  const { login } = useContext(AuthContext);
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const handleLogin = async () => {
    setError('');
    if (!form.username.trim() || !form.password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const { data: res } = await api.post('/auth/login', {
        username: form.username.trim(),
        password: form.password,
      });
      // Backend wraps response in ApiResponse: { success, message, data: { accessToken, refreshToken, user } }
      await login(res.data || res);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>💎 EarnX3</Text>
          <Text style={styles.tagline}>Earn. Refer. Grow.</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          <Input
            label="Email or Mobile"
            value={form.username}
            onChangeText={set('username')}
            placeholder="Enter email or mobile number"
            leftIcon="📧"
            keyboardType="email-address"
          />

          <Input
            label="Password"
            value={form.password}
            onChangeText={set('password')}
            placeholder="Enter your password"
            leftIcon="🔒"
            secureTextEntry={!showPass}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                <Text style={{ fontSize: 16 }}>{showPass ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            }
          />

          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <Button title="Sign In" onPress={handleLogin} loading={loading} style={styles.loginBtn} />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            title="Create New Account"
            onPress={() => navigation.navigate('Register')}
            variant="outline"
          />
        </View>

        <Text style={styles.terms}>
          By continuing, you agree to our{' '}
          <Text style={{ color: Colors.primaryLight }}>Terms & Conditions</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  content: { paddingBottom: 40 },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 40 },
  logo: { fontSize: 36, fontWeight: '900', color: Colors.white, letterSpacing: 1 },
  tagline: { fontSize: FontSize.md, color: 'rgba(255,255,255,0.8)', marginTop: 6 },
  card: {
    backgroundColor: Colors.white, borderRadius: 24,
    marginHorizontal: 20, padding: Spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.dark, marginBottom: 4 },
  subtitle: { fontSize: FontSize.sm, color: Colors.gray, marginBottom: Spacing.lg },
  errorBox: {
    backgroundColor: '#fff3f3', borderRadius: Radius.md,
    padding: 12, marginBottom: Spacing.md, borderLeftWidth: 3, borderLeftColor: Colors.danger,
  },
  errorText: { color: Colors.danger, fontSize: FontSize.sm },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: Spacing.md, marginTop: -8 },
  forgotText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '600' },
  loginBtn: { marginBottom: Spacing.md },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { marginHorizontal: 12, color: Colors.gray, fontSize: FontSize.sm },
  terms: { textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: FontSize.xs, margin: 20 },
});
