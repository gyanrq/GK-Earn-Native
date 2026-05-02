// src/core/ui/ErrorBoundary.tsx
import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from './index';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Crash Bach Gaya! Error details:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Oops! 🙈</Text>
          <Text style={styles.message}>Kuch toh gadbad ho gayi app mein. Tension mat lo, bas niche button dabao.</Text>
          <Button
            title="Try Again"
            onPress={this.resetError}
            style={{ width: 200 }}
            textStyle={undefined}
            disabled={false}
            loading={false}
            icon={undefined}
          />
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f4f6f8' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  message: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30 },
});
