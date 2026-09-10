import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NetworkConfigProvider } from './src/context/NetworkConfigContext';
import { ThemeProvider, useAppTheme } from './src/context/ThemeContext';
import { AppInfoProvider } from './src/context/AppInfoContext';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';

function AppContent() {
  const { resolvedScheme } = useAppTheme();

  return (
    <>
      <StatusBar style={resolvedScheme === 'dark' ? 'light' : 'dark'} />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <NetworkConfigProvider>
      <ThemeProvider>
        <AppInfoProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </AppInfoProvider>
      </ThemeProvider>
    </NetworkConfigProvider>
  );
}