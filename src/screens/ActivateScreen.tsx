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
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { extractApiError } from '../api/client';
import type { AuthStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'Activate'>;

export default function ActivateScreen({ navigation }: Props) {
  const { activate } = useAuth();

  const [matricule, setMatricule] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function handleSubmit() {
    setErrorMessage(null);
    setFieldErrors({});

    if (!matricule.trim() || !temporaryPassword || !password || !passwordConfirmation) {
      setErrorMessage('Veuillez remplir tous les champs.');
      return;
    }

    if (password !== passwordConfirmation) {
      setErrorMessage('Les deux mots de passe ne correspondent pas.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    setIsSubmitting(true);

    try {
      await activate({
        matricule: matricule.trim(),
        temporary_password: temporaryPassword,
        password,
        password_confirmation: passwordConfirmation,
      });
    } catch (error) {
      const apiError = extractApiError(error);
      setErrorMessage(apiError.message);
      if (apiError.errors) {
        setFieldErrors(apiError.errors);
      }
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
        <Text style={styles.title}>Activer mon compte</Text>
        <Text style={styles.subtitle}>
          Utilisez le matricule et le mot de passe temporaire communiqués par les
          Ressources Humaines, puis choisissez votre mot de passe définitif.
        </Text>

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
          {fieldErrors.matricule && <Text style={styles.fieldError}>{fieldErrors.matricule[0]}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Mot de passe temporaire</Text>
          <TextInput
            style={styles.input}
            placeholder="Donné par les RH"
            secureTextEntry
            value={temporaryPassword}
            onChangeText={setTemporaryPassword}
          />
          {fieldErrors.temporary_password && (
            <Text style={styles.fieldError}>{fieldErrors.temporary_password[0]}</Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Nouveau mot de passe</Text>
          <TextInput
            style={styles.input}
            placeholder="8 caractères minimum"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          {fieldErrors.password && <Text style={styles.fieldError}>{fieldErrors.password[0]}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Confirmer le mot de passe</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            secureTextEntry
            value={passwordConfirmation}
            onChangeText={setPasswordConfirmation}
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
            <Text style={styles.buttonText}>Activer mon compte</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>Déjà activé ? Se connecter</Text>
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
  title: { fontSize: 26, fontWeight: '700', color: '#1e3a5f', marginBottom: 8 },
  subtitle: { fontSize: 13, color: '#6b7280', marginBottom: 28, lineHeight: 18 },
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
  fieldError: { color: '#dc2626', fontSize: 12, marginTop: 4 },
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
