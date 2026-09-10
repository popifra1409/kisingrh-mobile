import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useAppTheme, ThemeColors } from '../context/ThemeContext';
import type { AppStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const { colors, scaledFont } = useAppTheme();
  const styles = createStyles(colors, scaledFont);

  return (
    <View style={styles.container}>
      {user?.employee?.photo ? (
        <Image source={{ uri: user.employee.photo }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitial}>
            {(user?.employee?.full_name ?? user?.name ?? '?').charAt(0)}
          </Text>
        </View>
      )}

      <Text style={styles.name}>{user?.employee?.full_name ?? user?.name}</Text>
      {user?.employee?.matricule && (
        <Text style={styles.matricule}>{user.employee.matricule}</Text>
      )}

      <Text style={styles.welcome}>Bienvenue dans votre espace employé.</Text>

      <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('Profile')}>
        <Text style={styles.menuButtonText}>👤 Mon Profil</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('Leaves')}>
        <Text style={styles.menuButtonText}>🏖️ Mes Congés</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('Settings')}>
        <Text style={styles.menuButtonText}>⚙️ Paramètres</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}

function createStyles(colors: ThemeColors, scaledFont: (n: number) => number) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: colors.background,
    },
    avatar: { width: 88, height: 88, borderRadius: 44, marginBottom: 16 },
    avatarPlaceholder: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    avatarInitial: { color: colors.primaryText, fontSize: scaledFont(32), fontWeight: '700' },
    name: { fontSize: scaledFont(20), fontWeight: '700', color: colors.text },
    matricule: { fontSize: scaledFont(13), color: colors.textSecondary, marginTop: 2, marginBottom: 16 },
    welcome: { fontSize: scaledFont(14), color: colors.text, marginBottom: 24, textAlign: 'center' },
    menuButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 14,
      paddingHorizontal: 32,
      marginBottom: 12,
      width: '100%',
      alignItems: 'center',
    },
    menuButtonText: { color: colors.primaryText, fontWeight: '600', fontSize: scaledFont(15) },
    logoutButton: {
      borderWidth: 1,
      borderColor: colors.danger,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 24,
      marginTop: 8,
    },
    logoutText: { color: colors.danger, fontWeight: '600' },
  });
}