import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppInfoProvider } from './src/context/AppInfoContext';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <AppInfoProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <RootNavigator />
      </AuthProvider>
    </AppInfoProvider>
  );
}