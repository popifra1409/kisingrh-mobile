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

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const { appInfo } = useAppInfo();
  const { colors, scaledFont } = useAppTheme();
  const styles = createStyles(colors, scaledFont);

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
            placeholderTextColor={colors.textSecondary}
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
            placeholderTextColor={colors.textSecondary}
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
            <ActivityIndicator color={colors.primaryText} />
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

function createStyles(colors: ThemeColors, scaledFont: (n: number) => number) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    container: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 24,
      backgroundColor: colors.background,
    },
    logoContainer: { alignItems: 'center', marginBottom: 24 },
    logo: { width: 96, height: 96, marginBottom: 8 },
    logoPlaceholder: {
      width: 96,
      height: 96,
      borderRadius: 16,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    logoPlaceholderText: { color: colors.primaryText, fontSize: scaledFont(36), fontWeight: '700' },
    hospitalName: { fontSize: scaledFont(13), fontWeight: '600', color: colors.text, textAlign: 'center' },
    title: { fontSize: scaledFont(28), fontWeight: '700', color: colors.primary, marginBottom: 4 },
    subtitle: { fontSize: scaledFont(14), color: colors.textSecondary, marginBottom: 32 },
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