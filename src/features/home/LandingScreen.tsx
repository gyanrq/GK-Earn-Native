// src/features/home/LandingScreen.tsx
// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC LANDING PAGE — app open hote hi dikhti hai, login zaruri nahi
// Attractive offers + tasks preview dikhata hai, Login/Register optional hai
// ─────────────────────────────────────────────────────────────────────────────

import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Animated, Dimensions, FlatList,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, FontSize, Radius, Spacing } from '../../core/theme/colors';

const { width: W } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

// ── Static offer / task data (replace with real API later) ───────────────────
const OFFERS = [
  { id: '1', emoji: '🎁', title: 'Welcome Bonus',     desc: 'Sign up & get ₹50 instantly',   color: '#ff6b6b', bg: '#fff5f5' },
  { id: '2', emoji: '📋', title: 'Complete Tasks',    desc: 'Earn up to ₹500/day',           color: '#0d6efd', bg: '#f0f4ff' },
  { id: '3', emoji: '🔗', title: 'Refer Friends',     desc: '₹100 per successful referral',  color: '#198754', bg: '#f0fff4' },
  { id: '4', emoji: '🎡', title: 'Daily Spin',        desc: 'Win coins every day — FREE',    color: '#6f42c1', bg: '#f8f0ff' },
  { id: '5', emoji: '🏆', title: 'Top Earner Bonus',  desc: 'Extra ₹1000 for #1 this week',  color: '#ffc107', bg: '#fffbf0' },
];

const TASKS = [
  { id: 't1', emoji: '📱', title: 'Install App',        reward: '₹30',  tag: 'Easy',   tagColor: '#198754' },
  { id: 't2', emoji: '📝', title: 'Fill Survey',        reward: '₹20',  tag: 'Quick',  tagColor: '#0d6efd' },
  { id: 't3', emoji: '🎮', title: 'Play Game 5 min',    reward: '₹50',  tag: 'Fun',    tagColor: '#6f42c1' },
  { id: 't4', emoji: '🛒', title: 'Shopping Offer',     reward: '₹150', tag: 'Hot 🔥', tagColor: '#dc3545' },
  { id: 't5', emoji: '📺', title: 'Watch Video',        reward: '₹10',  tag: 'Easy',   tagColor: '#198754' },
  { id: 't6', emoji: '💳', title: 'Apply Credit Card',  reward: '₹500', tag: 'High',   tagColor: '#ff6b6b' },
];

const STATS = [
  { label: 'Users',        value: '50K+', emoji: '👥' },
  { label: 'Paid Out',     value: '₹2Cr+',emoji: '💸' },
  { label: 'Tasks Daily',  value: '200+', emoji: '📋' },
  { label: 'Avg Earning',  value: '₹300', emoji: '📈' },
];

// ── Hero Banner auto-scroll ──────────────────────────────────────────────────
const BANNERS = [
  { id: 'b1', emoji: '💰', title: 'Earn ₹500/Day!',        sub: 'Complete simple tasks from home', grad: ['#0d6efd', '#6f42c1'] },
  { id: 'b2', emoji: '🎁', title: 'Welcome Bonus ₹50',     sub: 'Just sign up — no investment',   grad: ['#198754', '#20c997'] },
  { id: 'b3', emoji: '🏆', title: 'Refer & Earn ₹100',     sub: 'Share with friends, earn forever', grad: ['#dc3545', '#fd7e14'] },
];

export default function LandingScreen({ navigation }: Props) {
  const [bannerIdx, setBannerIdx] = useState(0);
  const bannerRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  // Auto-scroll banners
  useEffect(() => {
    const t = setInterval(() => {
      setBannerIdx((prev) => {
        const next = (prev + 1) % BANNERS.length;
        bannerRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── TOP NAV ──────────────────────────────────────────────────────── */}
        <View style={s.nav}>
          <Text style={s.navLogo}>💎 GK Earn</Text>
          <View style={s.navRight}>
            <TouchableOpacity style={s.navLoginBtn} onPress={() => navigation.navigate('Login')}>
              <Text style={s.navLoginText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.navSignupBtn} onPress={() => navigation.navigate('Register')}>
              <Text style={s.navSignupText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── HERO BANNER ──────────────────────────────────────────────────── */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <FlatList
            ref={bannerRef}
            data={BANNERS}
            keyExtractor={(b) => b.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={[s.banner, { width: W }]}>
                <View style={[s.bannerGrad, { backgroundColor: item.grad[0] }]}>
                  <View style={[s.bannerGradOverlay, { backgroundColor: item.grad[1] }]} />
                  <Text style={s.bannerEmoji}>{item.emoji}</Text>
                  <Text style={s.bannerTitle}>{item.title}</Text>
                  <Text style={s.bannerSub}>{item.sub}</Text>
                  <TouchableOpacity style={s.bannerBtn} onPress={() => navigation.navigate('Register')}>
                    <Text style={s.bannerBtnText}>Start Earning Free →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            onMomentumScrollEnd={(e) => {
              setBannerIdx(Math.round(e.nativeEvent.contentOffset.x / W));
            }}
          />
          {/* Dots */}
          <View style={s.dots}>
            {BANNERS.map((_, i) => (
              <View key={i} style={[s.dot, bannerIdx === i && s.dotActive]} />
            ))}
          </View>
        </Animated.View>

        {/* ── STATS ROW ────────────────────────────────────────────────────── */}
        <Animated.View style={[s.statsRow, { opacity: fadeAnim }]}>
          {STATS.map((st) => (
            <View key={st.label} style={s.statCard}>
              <Text style={s.statEmoji}>{st.emoji}</Text>
              <Text style={s.statValue}>{st.value}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* ── OFFERS SECTION ───────────────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>🔥 Hot Offers For You</Text>
          <Text style={s.sectionSub}>Login karke unlock karein full access</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.offersRow}>
            {OFFERS.map((o) => (
              <TouchableOpacity key={o.id} style={[s.offerCard, { backgroundColor: o.bg }]}
                onPress={() => navigation.navigate('Register')}>
                <Text style={s.offerEmoji}>{o.emoji}</Text>
                <Text style={[s.offerTitle, { color: o.color }]}>{o.title}</Text>
                <Text style={s.offerDesc}>{o.desc}</Text>
                <View style={[s.offerBtn, { backgroundColor: o.color }]}>
                  <Text style={s.offerBtnText}>Claim →</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── TASKS PREVIEW ────────────────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>📋 Available Tasks</Text>
          <Text style={s.sectionSub}>Sign up aur turant kama shuru karein</Text>
          <View style={s.tasksGrid}>
            {TASKS.map((t) => (
              <TouchableOpacity key={t.id} style={s.taskCard}
                onPress={() => navigation.navigate('Register')}>
                <View style={s.taskTop}>
                  <Text style={s.taskEmoji}>{t.emoji}</Text>
                  <View style={[s.taskTag, { backgroundColor: t.tagColor + '20' }]}>
                    <Text style={[s.taskTagText, { color: t.tagColor }]}>{t.tag}</Text>
                  </View>
                </View>
                <Text style={s.taskTitle}>{t.title}</Text>
                <Text style={s.taskReward}>{t.reward}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Blur overlay to tease — login karo */}
          <View style={s.lockOverlay}>
            <Text style={s.lockEmoji}>🔒</Text>
            <Text style={s.lockTitle}>100+ aur tasks available hain!</Text>
            <Text style={s.lockSub}>Free signup karein aur sabka access paayein</Text>
            <TouchableOpacity style={s.lockBtn} onPress={() => navigation.navigate('Register')}>
              <Text style={s.lockBtnText}>🚀 Free Sign Up — Start Earning</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 10 }}>
              <Text style={s.lockLoginText}>Already have an account? <Text style={{ color: Colors.primary, fontWeight: '700' }}>Login</Text></Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>⚡ Kaise Kaam Karta Hai?</Text>
          {[
            { step: '1', icon: '📝', text: 'Free Sign Up karein' },
            { step: '2', icon: '📋', text: 'Tasks complete karein' },
            { step: '3', icon: '💸', text: 'UPI pe withdraw karein' },
          ].map((item) => (
            <View key={item.step} style={s.howRow}>
              <View style={s.howStep}><Text style={s.howStepText}>{item.step}</Text></View>
              <Text style={s.howIcon}>{item.icon}</Text>
              <Text style={s.howText}>{item.text}</Text>
            </View>
          ))}
        </View>

        {/* ── BOTTOM CTA ───────────────────────────────────────────────────── */}
        <View style={s.cta}>
          <Text style={s.ctaTitle}>💎 Abhi Join Karein!</Text>
          <Text style={s.ctaSub}>50,000+ log already kama rahe hain. Aap kab shuru karenge?</Text>
          <TouchableOpacity style={s.ctaBtn} onPress={() => navigation.navigate('Register')}>
            <Text style={s.ctaBtnText}>🚀 Free Mein Shuru Karein</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.ctaLoginBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={s.ctaLoginText}>Pehle se account hai? Login karein →</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8faff' },
  scroll: { paddingBottom: 40 },

  // Nav
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12, backgroundColor: Colors.primary },
  navLogo: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  navRight: { flexDirection: 'row', gap: 8 },
  navLoginBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.7)' },
  navLoginText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },
  navSignupBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: '#fff' },
  navSignupText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '800' },

  // Banner
  banner: { height: 220 },
  bannerGrad: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, overflow: 'hidden' },
  bannerGradOverlay: { position: 'absolute', right: -60, top: -60, width: 200, height: 200, borderRadius: 100, opacity: 0.3 },
  bannerEmoji: { fontSize: 48, marginBottom: 6 },
  bannerTitle: { fontSize: FontSize.xxl, fontWeight: '900', color: '#fff', textAlign: 'center' },
  bannerSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.85)', marginTop: 4, textAlign: 'center' },
  bannerBtn: { marginTop: 16, backgroundColor: '#fff', paddingHorizontal: 24, paddingVertical: 10, borderRadius: Radius.full },
  bannerBtnText: { fontWeight: '800', fontSize: FontSize.sm, color: Colors.primary },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 10, backgroundColor: Colors.primary },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { backgroundColor: '#fff', width: 18 },

  // Stats
  statsRow: { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 14, paddingHorizontal: 4, elevation: 3, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6 },
  statCard: { flex: 1, alignItems: 'center' },
  statEmoji: { fontSize: 20 },
  statValue: { fontSize: FontSize.lg, fontWeight: '900', color: Colors.primary, marginTop: 2 },
  statLabel: { fontSize: 10, color: Colors.gray, fontWeight: '600' },

  // Section
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '900', color: Colors.dark },
  sectionSub: { fontSize: FontSize.xs, color: Colors.gray, marginTop: 2, marginBottom: 12 },

  // Offers
  offersRow: { gap: 12, paddingBottom: 4 },
  offerCard: { width: 155, borderRadius: Radius.lg, padding: 16, elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6 },
  offerEmoji: { fontSize: 30, marginBottom: 8 },
  offerTitle: { fontSize: FontSize.md, fontWeight: '800' },
  offerDesc: { fontSize: FontSize.xs, color: Colors.gray, marginTop: 3, marginBottom: 12 },
  offerBtn: { borderRadius: Radius.full, paddingVertical: 6, alignItems: 'center' },
  offerBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.xs },

  // Tasks grid
  tasksGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  taskCard: { width: (W - 52) / 2, backgroundColor: '#fff', borderRadius: Radius.lg, padding: 14, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 5 },
  taskTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  taskEmoji: { fontSize: 24 },
  taskTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  taskTagText: { fontSize: 10, fontWeight: '700' },
  taskTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.dark },
  taskReward: { fontSize: FontSize.lg, fontWeight: '900', color: Colors.success, marginTop: 4 },

  // Lock overlay
  lockOverlay: { marginTop: 16, backgroundColor: '#fff', borderRadius: Radius.xl, padding: 24, alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  lockEmoji: { fontSize: 36, marginBottom: 8 },
  lockTitle: { fontSize: FontSize.lg, fontWeight: '900', color: Colors.dark, textAlign: 'center' },
  lockSub: { fontSize: FontSize.sm, color: Colors.gray, textAlign: 'center', marginTop: 4, marginBottom: 16 },
  lockBtn: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: 28, paddingVertical: 14, width: '100%', alignItems: 'center' },
  lockBtnText: { color: '#fff', fontWeight: '800', fontSize: FontSize.md },
  lockLoginText: { fontSize: FontSize.sm, color: Colors.gray },

  // How it works
  howRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, backgroundColor: '#fff', borderRadius: Radius.lg, padding: 14, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  howStep: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  howStepText: { color: '#fff', fontWeight: '900', fontSize: FontSize.md },
  howIcon: { fontSize: 22, marginRight: 10 },
  howText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.dark, flex: 1 },

  // CTA
  cta: { margin: 16, backgroundColor: Colors.primary, borderRadius: Radius.xl, padding: 28, alignItems: 'center', elevation: 6 },
  ctaTitle: { fontSize: FontSize.xxl, fontWeight: '900', color: '#fff' },
  ctaSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: 6, marginBottom: 20 },
  ctaBtn: { backgroundColor: '#fff', borderRadius: Radius.full, paddingHorizontal: 28, paddingVertical: 14, width: '100%', alignItems: 'center', marginBottom: 12 },
  ctaBtnText: { color: Colors.primary, fontWeight: '900', fontSize: FontSize.md },
  ctaLoginBtn: { paddingVertical: 6 },
  ctaLoginText: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.sm },
});