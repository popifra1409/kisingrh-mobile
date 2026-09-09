import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import ActivateScreen from '../screens/ActivateScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import DependentsScreen from '../screens/DependentsScreen';
import AddDependentScreen from '../screens/AddDependentScreen';
import DiplomasScreen from '../screens/DiplomasScreen';
import AddDiplomaScreen from '../screens/AddDiplomaScreen';

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
    </AppStack.Navigator>
  );
}

export default function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e3a5f" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
});