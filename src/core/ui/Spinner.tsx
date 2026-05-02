// src/core/ui/Spinner.tsx
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

interface SpinnerProps {
  size?: number | 'small' | 'large';
  color?: string;
}

export default function Spinner({ size = 'large', color = '#0d6efd' }: SpinnerProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});
