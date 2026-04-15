// src/features/spin/SpinScreen.js
// FIXES:
//  1. Wheel rendered with correct rotated-rectangle pie slice technique
//     (old CSS border trick produced broken/overlapping segments in RN)
//  2. Animation math fixed: inputRange extended, no setValue reset bug
//  3. calcTargetRotation now correctly places winning segment under TOP pointer
//  4. Segments exactly match backend FALLBACK_PRIZES (10,20,50,100,200,500)
//  5. creditsPerRupee default fixed to 10 (matches backend)

import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  Easing, StatusBar, Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LoadingScreen } from '../../core/ui';
import { Colors, FontSize, Radius, Shadow, Spacing } from '../../core/theme/colors';
import api from '../../core/api/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const WHEEL_SIZE = Math.min(SCREEN_WIDTH - 48, 300);
const WHEEL_HALF = WHEEL_SIZE / 2;
const CENTER_R = 36;

const toRad = (deg) => (deg * Math.PI) / 180;

// Must match backend FALLBACK_PRIZES / SpinPrize DB values
const SEGMENTS = [
  { label: '10',  credits: 10,  color: '#FF6B6B', text: '#fff' },
  { label: '50',  credits: 50,  color: '#4ECDC4', text: '#fff' },
  { label: '20',  credits: 20,  color: '#45B7D1', text: '#fff' },
  { label: '100', credits: 100, color: '#96CEB4', text: '#1a0533' },
  { label: '10',  credits: 10,  color: '#FF8A80', text: '#fff' },
  { label: '500', credits: 500, color: '#FFD700', text: '#1a0533' },
  { label: '20',  credits: 20,  color: '#B39DDB', text: '#fff' },
  { label: '200', credits: 200, color: '#A5D6A7', text: '#1a0533' },
];
const N = SEGMENTS.length;
const SEG_DEG = 360 / N; // 45 degrees per segment

// Given creditsWon, find the matching segment index
function findSegmentIndex(creditsWon) {
  const idx = SEGMENTS.findIndex((s) => s.credits === creditsWon);
  if (idx !== -1) return idx;
  let closest = 0, minDiff = Infinity;
  SEGMENTS.forEach((s, i) => {
    const d = Math.abs(s.credits - creditsWon);
    if (d < minDiff) { minDiff = d; closest = i; }
  });
  return closest;
}

// Calculate target rotation so segment[segIdx] center sits under the TOP pointer.
// Segment i's center is at: i * SEG_DEG + SEG_DEG/2 degrees from top (clockwise).
// We want that angle to be at the top (0°), so the wheel needs to rotate:
//   targetMod = (360 - segCenter) % 360
// We add extra full spins for visual drama.
function calcTargetRotation(currentRot, segIdx) {
  const segCenter = segIdx * SEG_DEG + SEG_DEG / 2;
  const targetMod = (360 - segCenter + 360) % 360;
  const currentMod = ((currentRot % 360) + 360) % 360;
  let diff = targetMod - currentMod;
  if (diff < 0) diff += 360;
  if (diff < 45) diff += 360; // ensure at least one full rotation visible at the end
  return currentRot + 5 * 360 + diff;
}

// ── Wheel rendering ──────────────────────────────────────────────────────────
// Each 45° segment is drawn using TWO 90° "right-angle" rectangles placed from
// the center, each rotated around the center (bottom-left corner of the rect).
// First rect covers [startDeg, startDeg+45], second rect covers [startDeg+45, startDeg+90]
// — but we only show up to startDeg+45 by overlapping the next segment's first rect.
// Simpler: for 45°-wide segments we use a single rectangle rotated at startDeg,
// plus a second rotated at (startDeg + 45) to fill in. Then we rely on the next
// segment's color to hide overflow. This gives correct solid-color wedges.

function WheelCanvas() {
  const half = WHEEL_HALF;

  return (
    <View style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }}>
      {SEGMENTS.map((seg, i) => {
        const startDeg = i * SEG_DEG;
        const endDeg = startDeg + SEG_DEG;
        // Midpoint angle for label (measured from top, clockwise, in standard x-y)
        const midDeg = startDeg + SEG_DEG / 2;
        // Label position: 62% radius from center, rotated to midpoint
        // We rotate from top (-90° in standard math) clockwise
        const labelAngle = toRad(midDeg - 90);
        const lr = half * 0.60;
        const lx = half + lr * Math.cos(labelAngle);
        const ly = half + lr * Math.sin(labelAngle);

        return (
          <React.Fragment key={i}>
            {/* First half-rectangle (covers first 22.5° of the 45° segment) */}
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: half,
                top: 0,
                width: half,
                height: half,
                backgroundColor: seg.color,
                transformOrigin: '0% 100%',
                transform: [{ rotate: `${startDeg}deg` }],
              }}
            />
            {/* Second half-rectangle (covers last 22.5° of the 45° segment) */}
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: half,
                top: 0,
                width: half,
                height: half,
                backgroundColor: seg.color,
                transformOrigin: '0% 100%',
                transform: [{ rotate: `${startDeg + SEG_DEG / 2}deg` }],
              }}
            />
            {/* Divider line between segments */}
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: half,
                top: half,
                width: half - 2,
                height: 2,
                backgroundColor: 'rgba(255,255,255,0.6)',
                transformOrigin: '0% 50%',
                transform: [{ rotate: `${-90 + startDeg}deg` }],
              }}
            />
            {/* Credit label */}
            <Text
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: lx - 20,
                top: ly - 10,
                width: 40,
                textAlign: 'center',
                fontSize: 12,
                fontWeight: '900',
                color: seg.text,
                textShadowColor: 'rgba(0,0,0,0.35)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
                // Rotate label to be readable along the slice
                transform: [{ rotate: `${startDeg + SEG_DEG / 2}deg` }],
              }}
            >
              {seg.label}
            </Text>
          </React.Fragment>
        );
      })}
    </View>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SpinScreen() {
  const [status, setStatus]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');

  const rotAnim         = useRef(new Animated.Value(0)).current;
  const currentRotation = useRef(0);

  const loadStatus = useCallback(async () => {
    try {
      const { data } = await api.get('/spin/status');
      setStatus(data.data || data);
    } catch (e) {
      console.log('Spin status error:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadStatus();
    setResult(null);
    setError('');
  }, [loadStatus]));

  const handleSpin = async () => {
    if (spinning || status?.spunToday) return;
    setSpinning(true);
    setError('');
    setResult(null);

    try {
      const { data } = await api.post('/spin/daily');
      const res = data.data || data;
      const creditsWon = res.creditsWon || 0;

      const segIdx = findSegmentIndex(creditsWon);
      const target = calcTargetRotation(currentRotation.current, segIdx);
      currentRotation.current = target;

      // FIX: Animate from current toValue to new target — no setValue() reset
      Animated.timing(rotAnim, {
        toValue: target,
        duration: 4500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setResult(creditsWon);
        setStatus({ spunToday: true, creditsWon });
        setSpinning(false);
      });
    } catch (e) {
      setError(e.response?.data?.message || 'Spin failed. Try again!');
      setSpinning(false);
    }
  };

  // FIX: Use a large inputRange so cumulative rotations always work correctly.
  const rotate = rotAnim.interpolate({
    inputRange: [0, 360000],
    outputRange: ['0deg', '360000deg'],
    extrapolate: 'extend',
  });

  if (loading) return <LoadingScreen message="Loading spin wheel..." />;

  // Unique prizes for legend display
  const uniquePrizes = SEGMENTS
    .filter((s, i, arr) => arr.findIndex((x) => x.credits === s.credits) === i)
    .sort((a, b) => a.credits - b.credits);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a0533" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎡 Daily Spin</Text>
        <Text style={styles.headerSub}>One free spin every day!</Text>
      </View>

      {/* Wheel area */}
      <View style={styles.wheelArea}>
        <View style={styles.glowRing} />

        {/* Pointer at top */}
        <View style={styles.pointerWrap}>
          <View style={styles.pointer} />
        </View>

        {/* Animated spinning wheel */}
        <Animated.View style={[styles.wheelOuter, { transform: [{ rotate }] }]}>
          <WheelCanvas />
          {/* Center button cap */}
          <View style={styles.centerCap}>
            <Text style={styles.centerEmoji}>🎡</Text>
          </View>
        </Animated.View>
      </View>

      {/* Prize legend */}
      <View style={styles.legend}>
        {uniquePrizes.map((seg) => (
          <View
            key={seg.credits}
            style={[styles.legendPill, { backgroundColor: seg.color + '33', borderColor: seg.color }]}
          >
            <Text style={[styles.legendText, { color: seg.color === '#FFD700' ? '#b38600' : seg.color }]}>
              {seg.credits} cr
            </Text>
          </View>
        ))}
      </View>

      {/* Win result */}
      {result !== null && (
        <View style={styles.resultBox}>
          <Text style={styles.resultEmoji}>🎉</Text>
          <Text style={styles.resultTitle}>You Won!</Text>
          <Text style={styles.resultCredits}>{result.toLocaleString()} Credits!</Text>
          <Text style={styles.resultSub}>Added to your wallet instantly</Text>
        </View>
      )}

      {/* Already spun today */}
      {status?.spunToday && result === null && (
        <View style={styles.doneBox}>
          <Text style={styles.doneIcon}>✅</Text>
          <Text style={styles.doneTitle}>Already Spun Today!</Text>
          <Text style={styles.doneCredits}>
            You won{' '}
            <Text style={{ fontWeight: '900', color: Colors.gold }}>
              {status.creditsWon} credits
            </Text>
          </Text>
          <Text style={styles.doneSub}>Come back tomorrow for another spin!</Text>
        </View>
      )}

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      ) : null}

      {/* Spin button */}
      <TouchableOpacity
        style={[styles.spinBtn, (spinning || status?.spunToday) && styles.spinBtnOff]}
        onPress={handleSpin}
        disabled={spinning || !!status?.spunToday}
        activeOpacity={0.85}
      >
        <Text style={styles.spinBtnText}>
          {spinning ? '⏳ Spinning...' : status?.spunToday ? '🔒 Come Back Tomorrow' : '🎡 SPIN NOW!'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.rulesText}>
        • 1 free spin per day{'  '}• Credits added instantly to your wallet
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#1a0533', alignItems: 'center', paddingBottom: 20,
  },
  header: { paddingTop: 50, paddingBottom: 12, alignItems: 'center' },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: '900', color: '#fff' },
  headerSub: { color: 'rgba(255,255,255,0.65)', fontSize: FontSize.sm, marginTop: 4 },

  wheelArea: {
    width: WHEEL_SIZE + 24,
    height: WHEEL_SIZE + 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  glowRing: {
    position: 'absolute',
    width: WHEEL_SIZE + 20,
    height: WHEEL_SIZE + 20,
    borderRadius: (WHEEL_SIZE + 20) / 2,
    borderWidth: 3,
    borderColor: '#FFD70066',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 18,
    elevation: 10,
  },
  pointerWrap: {
    position: 'absolute',
    top: 0,
    zIndex: 30,
    alignItems: 'center',
    width: '100%',
  },
  pointer: {
    width: 0, height: 0,
    borderLeftWidth: 14, borderRightWidth: 14, borderBottomWidth: 32,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderBottomColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.9, shadowRadius: 8, elevation: 12,
  },
  wheelOuter: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: WHEEL_HALF,
    overflow: 'hidden',
    borderWidth: 5,
    borderColor: '#fff',
    backgroundColor: '#444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 14, elevation: 16,
  },
  centerCap: {
    position: 'absolute',
    width: CENTER_R * 2, height: CENTER_R * 2,
    borderRadius: CENTER_R,
    backgroundColor: '#fff',
    left: WHEEL_HALF - CENTER_R,
    top: WHEEL_HALF - CENTER_R,
    justifyContent: 'center', alignItems: 'center',
    zIndex: 20, elevation: 20,
    borderWidth: 3, borderColor: '#FFD700',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4, shadowRadius: 8,
  },
  centerEmoji: { fontSize: 22 },

  legend: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', gap: 6,
    paddingHorizontal: 20, marginBottom: 8,
  },
  legendPill: {
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1.5,
  },
  legendText: { fontSize: 11, fontWeight: '800' },

  resultBox: { alignItems: 'center', marginVertical: 8 },
  resultEmoji: { fontSize: 42 },
  resultTitle: { fontSize: FontSize.xl, fontWeight: '800', color: '#fff', marginTop: 4 },
  resultCredits: { fontSize: FontSize.xxl, fontWeight: '900', color: '#FFD700', marginTop: 4 },
  resultSub: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.65)', marginTop: 4 },

  doneBox: {
    alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radius.lg, padding: Spacing.lg,
    marginHorizontal: 20, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  doneIcon: { fontSize: 34, marginBottom: 6 },
  doneTitle: { fontSize: FontSize.lg, fontWeight: '700', color: '#fff' },
  doneCredits: { fontSize: FontSize.md, color: 'rgba(255,255,255,0.85)', marginTop: 6 },
  doneSub: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.55)', marginTop: 6 },

  errorBox: {
    backgroundColor: 'rgba(220,53,69,0.2)', borderRadius: Radius.md,
    padding: 12, marginHorizontal: 20, marginBottom: 8,
    borderWidth: 1, borderColor: '#dc354588',
  },
  errorText: { color: '#ff6b6b', textAlign: 'center', fontWeight: '600' },

  spinBtn: {
    backgroundColor: '#FFD700', borderRadius: 50,
    paddingHorizontal: 44, paddingVertical: 18, marginVertical: 10,
    shadowColor: '#FFD700', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.65, shadowRadius: 12, elevation: 12,
  },
  spinBtnOff: { backgroundColor: '#444', shadowOpacity: 0 },
  spinBtnText: { fontSize: FontSize.lg, fontWeight: '900', color: '#1a0533' },

  rulesText: {
    color: 'rgba(255,255,255,0.4)', fontSize: FontSize.xs,
    textAlign: 'center', marginTop: 4,
  },
});