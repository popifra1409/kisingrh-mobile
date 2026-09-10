import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NetworkConfigProvider } from './src/context/NetworkConfigContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { AppInfoProvider } from './src/context/AppInfoContext';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <NetworkConfigProvider>
      <ThemeProvider>
        <AppInfoProvider>
          <AuthProvider>
            <StatusBar style="auto" />
            <RootNavigator />
          </AuthProvider>
        </AppInfoProvider>
      </ThemeProvider>
    </NetworkConfigProvider>
  );
}