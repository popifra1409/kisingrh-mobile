import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import LoginScreen from '../screens/LoginScreen';
import ActivateScreen from '../screens/ActivateScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import DependentsScreen from '../screens/DependentsScreen';
import AddDependentScreen from '../screens/AddDependentScreen';
import DiplomasScreen from '../screens/DiplomasScreen';
import AddDiplomaScreen from '../screens/AddDiplomaScreen';
import LeavesScreen from '../screens/LeavesScreen';
import LeaveDetailScreen from '../screens/LeaveDetailScreen';
import NewLeaveRequestScreen from '../screens/NewLeaveRequestScreen';
import SettingsScreen from '../screens/SettingsScreen';

export type AuthStackParamList = {
  Login: undefined;
  Activate: undefined;
};

export type AppStackParamList = {
  Home: undefined;
  Profile: undefined;
  Dependents: undefined;
  AddDependent: undefined;
  Diplomas: undefined;
  AddDiploma: undefined;
  Leaves: undefined;
  LeaveDetail: { id: number };
  NewLeaveRequest: undefined;
  Settings: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Activate" component={ActivateScreen} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  return (
    <AppStack.Navigator>
      <AppStack.Screen name="Home" component={HomeScreen} options={{ title: 'Accueil' }} />
      <AppStack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Mon Profil' }} />
      <AppStack.Screen name="Dependents" component={DependentsScreen} options={{ title: 'Ayants Droit' }} />
      <AppStack.Screen name="AddDependent" component={AddDependentScreen} options={{ title: 'Nouvel Ayant Droit' }} />
      <AppStack.Screen name="Diplomas" component={DiplomasScreen} options={{ title: 'Diplômes & Formations' }} />
      <AppStack.Screen name="AddDiploma" component={AddDiplomaScreen} options={{ title: 'Nouveau Diplôme' }} />
      <AppStack.Screen name="Leaves" component={LeavesScreen} options={{ title: 'Mes Congés' }} />
      <AppStack.Screen name="LeaveDetail" component={LeaveDetailScreen} options={{ title: 'Détail de la Demande' }} />
      <AppStack.Screen name="NewLeaveRequest" component={NewLeaveRequestScreen} options={{ title: 'Nouvelle Demande' }} />
      <AppStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Paramètres' }} />
    </AppStack.Navigator>
  );
}

export default function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors, resolvedScheme } = useAppTheme();

  const navigationTheme = resolvedScheme === 'dark'
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, primary: colors.primary, background: colors.background, card: colors.surface, text: colors.text, border: colors.border } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, primary: colors.primary, background: colors.background, card: colors.surface, text: colors.text, border: colors.border } };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});