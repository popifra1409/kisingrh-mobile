import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useAppInfo } from '../context/AppInfoContext';
import { extractApiError } from '../api/client';
import type { AuthStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const { appInfo } = useAppInfo();
  const [matricule, setMatricule] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit() {
    if (!matricule.trim() || !password) {
      setErrorMessage('Veuillez renseigner votre matricule et votre mot de passe.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await login({ matricule: matricule.trim(), password });
    } catch (error) {
      const apiError = extractApiError(error);
      setErrorMessage(apiError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainer}>
          {appInfo?.logo_url ? (
            <Image source={{ uri: appInfo.logo_url }} style={styles.logo} resizeMode="contain" />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoPlaceholderText}>
                {(appInfo?.hospital_short_name ?? 'HGY').charAt(0)}
              </Text>
            </View>
          )}
          {appInfo?.hospital_name && (
            <Text style={styles.hospitalName}>{appInfo.hospital_name}</Text>
          )}
        </View>

        <Text style={styles.title}>Connexion</Text>
        <Text style={styles.subtitle}>Accédez à votre espace employé</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Matricule</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 98240812A"
            autoCapitalize="characters"
            autoCorrect={false}
            value={matricule}
            onChangeText={setMatricule}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Mot de passe</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

        <TouchableOpacity
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Se connecter</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('Activate')}
        >
          <Text style={styles.linkText}>Première connexion ? Activer mon compte</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  logoContainer: { alignItems: 'center', marginBottom: 24 },
  logo: { width: 96, height: 96, marginBottom: 8 },
  logoPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 16,
    backgroundColor: '#1e3a5f',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoPlaceholderText: { color: '#fff', fontSize: 36, fontWeight: '700' },
  hospitalName: { fontSize: 13, fontWeight: '600', color: '#374151', textAlign: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: '#1e3a5f', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 32 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  error: {
    color: '#dc2626',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#1e3a5f',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkButton: { marginTop: 20, alignItems: 'center' },
  linkText: { color: '#1e3a5f', fontSize: 14, fontWeight: '500' },
});