// src/features/tasks/components/LeadCaptureModal.tsx
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, KeyboardAvoidingView, Platform, Animated, ActivityIndicator } from 'react-native';

interface Task {
  icon?: string;
  label?: string;
  credits?: number;
  taskType?: string;
  [key: string]: any;
}

interface Props {
  visible: boolean;
  task: Task | null;
  onSubmit: (email: string, mobile: string) => Promise<void>;
  onClose: () => void;
}

export default function LeadCaptureModal({ visible, task, onSubmit, onClose }: Props) {
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [emailErr, setEmailErr] = useState('');
  const [mobileErr, setMobileErr] = useState('');
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      setEmail(''); setMobile(''); setEmailErr(''); setMobileErr('');
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 400, duration: 250, useNativeDriver: true }).start();
    }
  }, [visible]);

  const validate = (): boolean => {
    let ok = true;
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) { setEmailErr('Valid email zaroori hai'); ok = false; } else setEmailErr('');
    if (!mobile.trim() || !/^[6-9]\d{9}$/.test(mobile)) { setMobileErr('Valid 10-digit mobile number daalo'); ok = false; } else setMobileErr('');
    return ok;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try { await onSubmit(email.trim(), mobile.trim()); } finally { setSubmitting(false); }
  };

  if (!task) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.handle} />
          <View style={styles.taskBanner}>
            <View style={styles.taskIconCircle}><Text style={styles.taskIconText}>{task.icon}</Text></View>
            <View style={styles.taskBannerInfo}>
              <Text style={styles.taskBannerLabel}>{task.label}</Text>
              <View style={styles.creditPill}><Text style={styles.creditPillText}>+{task.credits} Credits</Text></View>
            </View>
          </View>
          <Text style={styles.heading}>Apni Details Bharo</Text>
          <Text style={styles.subHeading}>Apna email aur mobile number submit karo — phir partner site ka link unlock ho jayega!</Text>
          <Text style={styles.label}>Email Address</Text>
          <View style={[styles.inputWrap, emailErr ? styles.inputError : null]}>
            <Text style={styles.inputIcon}>📧</Text>
            <TextInput style={styles.input} placeholder="aapka@email.com" placeholderTextColor="#bbb" value={email}
              onChangeText={(t) => { setEmail(t); setEmailErr(''); }} keyboardType="email-address" autoCapitalize="none" returnKeyType="next" />
          </View>
          {emailErr ? <Text style={styles.errText}>{emailErr}</Text> : null}
          <Text style={styles.label}>Mobile Number</Text>
          <View style={[styles.inputWrap, mobileErr ? styles.inputError : null]}>
            <Text style={styles.inputIcon}>📱</Text>
            <Text style={styles.countryCode}>+91</Text>
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="98XXXXXXXX" placeholderTextColor="#bbb" value={mobile}
              onChangeText={(t) => { setMobile(t); setMobileErr(''); }} keyboardType="phone-pad" maxLength={10} returnKeyType="done" onSubmitEditing={handleSubmit} />
          </View>
          {mobileErr ? <Text style={styles.errText}>{mobileErr}</Text> : null}
          <Text style={styles.privacyNote}>🔒 Aapka data secure hai. Sirf partner site ke liye use hoga.</Text>
          <TouchableOpacity style={[styles.ctaBtn, submitting && { opacity: 0.7 }]} onPress={handleSubmit} disabled={submitting} activeOpacity={0.85}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaBtnText}>Unlock Link & Earn {task.credits} Credits →</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingBottom: 36, paddingTop: 12 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#e0e0e0', alignSelf: 'center', marginBottom: 20 },
  taskBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f4ff', borderRadius: 16, padding: 14, marginBottom: 20 },
  taskIconCircle: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 2, marginRight: 14 },
  taskIconText: { fontSize: 26 },
  taskBannerInfo: { flex: 1 },
  taskBannerLabel: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  creditPill: { alignSelf: 'flex-start', marginTop: 5, backgroundColor: '#d4edda', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  creditPillText: { color: '#28a745', fontWeight: '700', fontSize: 12 },
  heading: { fontSize: 20, fontWeight: '900', color: '#1a1a2e', marginBottom: 6 },
  subHeading: { fontSize: 13, color: '#666', lineHeight: 19, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 7 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f7f8fa', borderWidth: 1.5, borderColor: '#e8ecf0', borderRadius: 14, paddingHorizontal: 14, marginBottom: 6, height: 52 },
  inputError: { borderColor: '#dc3545' },
  inputIcon: { fontSize: 16, marginRight: 10 },
  countryCode: { fontSize: 15, color: '#333', fontWeight: '600', marginRight: 6 },
  input: { flex: 1, fontSize: 15, color: '#222', paddingVertical: 0 },
  errText: { color: '#dc3545', fontSize: 12, marginBottom: 10, marginTop: -2 },
  privacyNote: { fontSize: 12, color: '#999', textAlign: 'center', marginTop: 4, marginBottom: 20 },
  ctaBtn: { backgroundColor: '#0d6efd', borderRadius: 16, paddingVertical: 16, alignItems: 'center', elevation: 4, shadowColor: '#0d6efd', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  ctaBtnText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  cancelBtn: { alignItems: 'center', marginTop: 14 },
  cancelText: { color: '#aaa', fontSize: 14 },
});
