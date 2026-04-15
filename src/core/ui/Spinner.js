// Package: com.earnx3app
// File: src/core/ui/Spinner.js

import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function Spinner({ size = 'large', color = '#0d6efd' }) {
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