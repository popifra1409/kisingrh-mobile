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
import { useAppTheme, ThemeColors } from '../context/ThemeContext';
import { extractApiError } from '../api/client';
import type { AuthStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'Activate'>;

export default function ActivateScreen({ navigation }: Props) {
  const { activate } = useAuth();
  const { appInfo } = useAppInfo();
  const { colors, scaledFont } = useAppTheme();
  const styles = createStyles(colors, scaledFont);

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
        </View>

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
            placeholderTextColor={colors.textSecondary}
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
            placeholderTextColor={colors.textSecondary}
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
            placeholderTextColor={colors.textSecondary}
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
            placeholderTextColor={colors.textSecondary}
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
            <ActivityIndicator color={colors.primaryText} />
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

function createStyles(colors: ThemeColors, scaledFont: (n: number) => number) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    container: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 24,
      backgroundColor: colors.background,
    },
    logoContainer: { alignItems: 'center', marginBottom: 20 },
    logo: { width: 80, height: 80 },
    logoPlaceholder: {
      width: 80,
      height: 80,
      borderRadius: 14,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoPlaceholderText: { color: colors.primaryText, fontSize: scaledFont(30), fontWeight: '700' },
    title: { fontSize: scaledFont(26), fontWeight: '700', color: colors.primary, marginBottom: 8 },
    subtitle: { fontSize: scaledFont(13), color: colors.textSecondary, marginBottom: 28, lineHeight: 18 },
    field: { marginBottom: 16 },
    label: { fontSize: scaledFont(13), fontWeight: '600', color: colors.text, marginBottom: 6 },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: scaledFont(15),
      color: colors.text,
      backgroundColor: colors.surface,
    },
    fieldError: { color: colors.danger, fontSize: scaledFont(12), marginTop: 4 },
    error: {
      color: colors.danger,
      fontSize: scaledFont(13),
      marginBottom: 12,
      textAlign: 'center',
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 8,
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: colors.primaryText, fontSize: scaledFont(16), fontWeight: '600' },
    linkButton: { marginTop: 20, alignItems: 'center' },
    linkText: { color: colors.primary, fontSize: scaledFont(14), fontWeight: '500' },
  });
}