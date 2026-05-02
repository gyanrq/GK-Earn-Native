// Package: com.gkearnapp
// File: src/core/ui/ErrorBoundary.js

import React, { Component } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Button from './Button'; // Jo Step 4 me banaya tha

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  // Agar koi error aayi, toh ye state true ho jayegi
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  // Error ko terminal me print karne ke liye
  componentDidCatch(error, errorInfo) {
    console.error("App Crash Bach Gaya! Error details:", error, errorInfo);
  }

  // User jab Try Again dabayega
  resetError = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Oops! 🙈</Text>
          <Text style={styles.message}>Kuch toh gadbad ho gayi app mein. Tension mat lo, bas niche button dabao.</Text>
          <Button title="Try Again" onPress={this.resetError} style={{ width: 200 }} />
        </View>
      );
    }
    // Agar koi error nahi hai, toh app normally chalega
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f4f6f8' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  message: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30 },
});