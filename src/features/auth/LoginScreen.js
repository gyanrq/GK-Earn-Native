// src/features/auth/LoginScreen.js
import React, { useState, useContext, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
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

  const [mfaData, setMfaData] = useState(null);
  const [mfaStep, setMfaStep] = useState(null);
  const [mfaOtp, setMfaOtp] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState('');
  const [completedSteps, setCompletedSteps] = useState(new Set());

  // ✅ FIX: Moved configuration inside useEffect so it initializes after native modules are ready
  useEffect(() => {
    GoogleSignin.configure({
  webClientId: '282729654983-58lk2ggr2a37ujfr0496782dimplvflr.apps.googleusercontent.com',
  offlineAccess: true,
});
  }, []);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const getFirstPendingStep = (challenge, done) => {
    if (challenge.emailRequired && !done.has('email')) return 'email';
    if (challenge.mobileRequired && !done.has('mobile')) return 'mobile';
    if (challenge.totpRequired && !done.has('totp')) return 'totp';
    return null;
  };

  // ── Normal Login ───────────────────────────────────────────────────────────
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
      const payload = res.data || res;
      if (payload.mfaRequired) {
        setMfaData(payload.mfaChallenge);
        setMfaStep(getFirstPendingStep(payload.mfaChallenge, new Set()));
      } else {
        await login(payload);
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
  setError('');
  setLoading(true);
  try {
    console.log('🔵 STEP 1: Checking Play Services...');
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    console.log('✅ STEP 1: Play Services OK');

    console.log('🔵 STEP 2: Starting Google SignIn...');
    const response = await GoogleSignin.signIn();
    console.log('✅ STEP 2: Response type:', response.type);
    console.log('✅ STEP 2: Full response:', JSON.stringify(response));

    if (response.type === 'cancelled') {
      setLoading(false);
      return;
    }

    const idToken = response.data?.idToken || response.idToken;
    console.log('🔵 STEP 3: idToken exists?', !!idToken);
    if (!idToken) throw new Error('No ID token received from Google');

    console.log('🔵 STEP 4: Calling backend /auth/google...');
    const { data: res } = await api.post('/auth/google', { credential: idToken });
    console.log('✅ STEP 4: Backend response:', JSON.stringify(res));

    const payload = res.data || res;
    if (payload.mfaRequired) {
      setMfaData(payload.mfaChallenge);
      setMfaStep(getFirstPendingStep(payload.mfaChallenge, new Set()));
    } else {
      await login(payload);
    }

  } catch (e) {
    // 🔴 MOST IMPORTANT LOGS
    console.log('❌ ERROR CODE:', e.code);
    console.log('❌ ERROR MESSAGE:', e.message);
    console.log('❌ ERROR nativeErrorMessage:', e.nativeErrorMessage);
    console.log('❌ FULL ERROR:', JSON.stringify(e));

    if (e.code === statusCodes.SIGN_IN_CANCELLED) {
      setLoading(false);
      return;
    } else if (e.code === statusCodes.IN_PROGRESS) {
      setError('Google Sign-In is already in progress');
    } else if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      setError('Play Services not available');
    } else {
      // Show exact error in UI bhi
      setError(`[${e.code}] ${e.nativeErrorMessage || e.message}`);
    }
  } finally {
    setLoading(false);
  }
};

  // ── MFA Step Submit ────────────────────────────────────────────────────────
  const submitMfaStep = async () => {
    setMfaError('');
    if (!mfaOtp.trim()) { setMfaError('Please enter the code'); return; }
    setMfaLoading(true);
    try {
      if (mfaStep === 'email') {
        await api.post('/auth/mfa/verify-email-otp', {
          sessionToken: mfaData.sessionToken,
          otp: mfaOtp.trim(),
        });
      } else if (mfaStep === 'mobile') {
        await api.post('/auth/mfa/verify-mobile-otp', {
          sessionToken: mfaData.sessionToken,
          otp: mfaOtp.trim(),
        });
      } else if (mfaStep === 'totp') {
        await api.post('/auth/mfa/verify-totp', {
          sessionToken: mfaData.sessionToken,
          code: mfaOtp.trim(),
        });
      }

      const newDone = new Set(completedSteps);
      newDone.add(mfaStep);
      setCompletedSteps(newDone);
      setMfaOtp('');

      const next = getFirstPendingStep(mfaData, newDone);
      if (next) {
        setMfaStep(next);
      } else {
        await completeMfa();
      }
    } catch (e) {
      setMfaError(e.response?.data?.message || 'Invalid code. Please try again.');
    } finally {
      setMfaLoading(false);
    }
  };

  const completeMfa = async () => {
    setMfaLoading(true);
    try {
      const { data: res } = await api.post('/auth/mfa/complete', {
        sessionToken: mfaData.sessionToken,
      });
      await login(res.data || res);
    } catch (e) {
      setMfaError(e.response?.data?.message || 'MFA completion failed');
    } finally {
      setMfaLoading(false);
    }
  };

  const resetMfa = () => {
    setMfaData(null);
    setMfaStep(null);
    setCompletedSteps(new Set());
    setMfaOtp('');
    setMfaError('');
  };

  // ── MFA Screen ─────────────────────────────────────────────────────────────
  if (mfaData) {
    const stepLabel = {
      email: `Email OTP (sent to ${mfaData.maskedEmail || 'your email'})`,
      mobile: `Mobile OTP (sent to ${mfaData.maskedPhone || 'your phone'})`,
      totp: 'Authenticator Code (Google Authenticator)',
    };
    const stepIcon = { email: '📧', mobile: '📱', totp: '🔐' };

    const allSteps = [
      mfaData.emailRequired && 'email',
      mfaData.mobileRequired && 'mobile',
      mfaData.totpRequired && 'totp',
    ].filter(Boolean);

    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
        <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.logo}>💎 GK Earn</Text>
            <Text style={styles.tagline}>Two-Step Verification</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>🔐 Verify Identity</Text>
            <Text style={styles.subtitle}>
              {allSteps.length > 1
                ? `Step ${completedSteps.size + 1} of ${allSteps.length}`
                : 'Complete verification to continue'}
            </Text>

            {allSteps.length > 1 && (
              <View style={styles.stepRow}>
                {allSteps.map((s) => (
                  <View
                    key={s}
                    style={[
                      styles.stepDot,
                      completedSteps.has(s) && styles.stepDotDone,
                      s === mfaStep && styles.stepDotActive,
                    ]}
                  />
                ))}
              </View>
            )}

            {mfaError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {mfaError}</Text>
              </View>
            ) : null}

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                {stepIcon[mfaStep]} {stepLabel[mfaStep]}
              </Text>
            </View>

            <Input
              label={mfaStep === 'totp' ? '6-Digit Authenticator Code' : '6-Digit OTP'}
              value={mfaOtp}
              onChangeText={setMfaOtp}
              placeholder={mfaStep === 'totp' ? 'Enter code from Google Authenticator' : 'Enter OTP'}
              leftIcon="🔑"
              keyboardType="number-pad"
              maxLength={6}
            />

            <Button
              title="Verify & Continue"
              onPress={submitMfaStep}
              loading={mfaLoading}
              style={{ marginTop: 8 }}
            />

            <TouchableOpacity onPress={resetMfa} style={{ alignItems: 'center', marginTop: 16 }}>
              <Text style={{ color: Colors.gray, fontSize: FontSize.sm }}>← Back to Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── Normal Login Screen ────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <View style={styles.header}>
          <Text style={styles.logo}>💎 GK Earn</Text>
          <Text style={styles.tagline}>Earn. Refer. Grow.</Text>
        </View>

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
            autoCapitalize="none"
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

          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleGoogleLogin}
            disabled={loading}
          >
            <Text style={styles.googleBtnText}>🅶  Continue with Google</Text>
          </TouchableOpacity>

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
  infoBox: {
    backgroundColor: '#f0f7ff', borderRadius: Radius.md,
    padding: 12, marginBottom: Spacing.md, borderLeftWidth: 3, borderLeftColor: Colors.primary,
  },
  infoText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '600' },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: Spacing.md, marginTop: -8 },
  forgotText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '600' },
  loginBtn: { marginBottom: Spacing.md },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#dadce0', borderRadius: Radius.md,
    paddingVertical: 12, marginBottom: Spacing.md, backgroundColor: '#fff',
  },
  googleBtnText: { fontSize: FontSize.md, color: '#3c4043', fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { marginHorizontal: 12, color: Colors.gray, fontSize: FontSize.sm },
  terms: { textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: FontSize.xs, margin: 20 },
  stepRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: Spacing.md },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.border },
  stepDotActive: { backgroundColor: Colors.primary, width: 24 },
  stepDotDone: { backgroundColor: Colors.success },
});