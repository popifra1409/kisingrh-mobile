import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen() {
  const { user, logout } = useAuth();

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

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  avatar: { width: 88, height: 88, borderRadius: 44, marginBottom: 16 },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#1e3a5f',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarInitial: { color: '#fff', fontSize: 32, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', color: '#111827' },
  matricule: { fontSize: 13, color: '#6b7280', marginTop: 2, marginBottom: 16 },
  welcome: { fontSize: 14, color: '#374151', marginBottom: 32, textAlign: 'center' },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#dc2626',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  logoutText: { color: '#dc2626', fontWeight: '600' },
});
