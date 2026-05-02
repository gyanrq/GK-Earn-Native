// App.tsx — FINAL CLEAN VERSION
// ✅ Git merge conflict markers HATAYE
// ✅ AppNavigator use kar raha hai (Landing → Login optional)
// ✅ Fresh install pe Landing Screen dikhega, NOT Login

import React from 'react';
import { AuthProvider } from './src/core/auth/AuthContext';
import { ToastProvider } from './src/core/ui/ToastContext';
import ErrorBoundary from './src/core/ui/ErrorBoundary';
import AppNavigator from './src/AppNavigator';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <AppNavigator />
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}