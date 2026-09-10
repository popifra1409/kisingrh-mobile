import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createDependent, NewDependentPayload } from '../api/dependents';
import { extractApiError } from '../api/client';
import { useAppTheme, ThemeColors } from '../context/ThemeContext';
import type { AppStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'AddDependent'>;

type PickedFile = { uri: string; name: string; type: string };

const RELATIONSHIPS: { value: NewDependentPayload['relationship']; label: string }[] = [
    { value: 'spouse', label: 'Conjoint(e)' },
    { value: 'child', label: 'Enfant' },
    { value: 'father', label: 'Père' },
    { value: 'mother', label: 'Mère' },
];

export default function AddDependentScreen({ navigation }: Props) {
    const { colors, scaledFont } = useAppTheme();
    const styles = createStyles(colors, scaledFont);

    const [relationship, setRelationship] = useState<NewDependentPayload['relationship']>('child');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [birthPlace, setBirthPlace] = useState('');
    const [gender, setGender] = useState<'M' | 'F'>('M');
    const [phone, setPhone] = useState('');

    const [birthCertificate, setBirthCertificate] = useState<PickedFile | null>(null);
    const [marriageCertificate, setMarriageCertificate] = useState<PickedFile | null>(null);
    const [idCard, setIdCard] = useState<PickedFile | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    async function pickDocument(setter: (file: PickedFile) => void) {
        const result = await DocumentPicker.getDocumentAsync({
            type: ['application/pdf', 'image/*'],
            copyToCacheDirectory: true,
        });

        if (result.canceled || !result.assets?.[0]) return;

        const asset = result.assets[0];
        setter({
            uri: asset.uri,
            name: asset.name,
            type: asset.mimeType ?? 'application/octet-stream',
        });
    }

    async function handleSubmit() {
        setErrorMessage(null);

        if (!lastName.trim() || !birthDate.trim()) {
            setErrorMessage('Le nom et la date de naissance sont obligatoires.');
            return;
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate.trim())) {
            setErrorMessage('Format de date attendu : AAAA-MM-JJ (ex: 2018-02-10).');
            return;
        }

        if (!birthCertificate) {
            setErrorMessage("L'acte de naissance est obligatoire.");
            return;
        }

        if (relationship === 'spouse' && !marriageCertificate) {
            setErrorMessage("L'acte de mariage est obligatoire pour un(e) conjoint(e).");
            return;
        }

        setIsSubmitting(true);

        try {
            await createDependent({
                relationship,
                first_name: firstName.trim() || undefined,
                last_name: lastName.trim(),
                birth_date: birthDate.trim(),
                birth_place: birthPlace.trim() || undefined,
                gender,
                phone: phone.trim() || undefined,
                birthCertificateFile: birthCertificate,
                marriageCertificateFile: marriageCertificate ?? undefined,
                idCardFile: idCard ?? undefined,
            });

            Alert.alert('Envoyé', 'Ayant droit déclaré, en attente de validation par les RH.');
            navigation.goBack();
        } catch (error) {
            const apiError = extractApiError(error);
            setErrorMessage(apiError.message);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
            <Text style={styles.label}>Lien de parenté</Text>
            <View style={styles.chipsRow}>
                {RELATIONSHIPS.map((r) => (
                    <TouchableOpacity
                        key={r.value}
                        style={[styles.chip, relationship === r.value && styles.chipActive]}
                        onPress={() => setRelationship(r.value)}
                    >
                        <Text style={[styles.chipText, relationship === r.value && styles.chipTextActive]}>{r.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Field label="Prénom(s)" value={firstName} onChangeText={setFirstName} styles={styles} colors={colors} />
            <Field label="Nom *" value={lastName} onChangeText={setLastName} styles={styles} colors={colors} />
            <Field label="Date de naissance * (AAAA-MM-JJ)" value={birthDate} onChangeText={setBirthDate} placeholder="2018-02-10" styles={styles} colors={colors} />
            <Field label="Lieu de naissance" value={birthPlace} onChangeText={setBirthPlace} styles={styles} colors={colors} />

            <Text style={styles.label}>Sexe</Text>
            <View style={styles.chipsRow}>
                <TouchableOpacity style={[styles.chip, gender === 'M' && styles.chipActive]} onPress={() => setGender('M')}>
                    <Text style={[styles.chipText, gender === 'M' && styles.chipTextActive]}>Masculin</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.chip, gender === 'F' && styles.chipActive]} onPress={() => setGender('F')}>
                    <Text style={[styles.chipText, gender === 'F' && styles.chipTextActive]}>Féminin</Text>
                </TouchableOpacity>
            </View>

            <Field label="Téléphone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" styles={styles} colors={colors} />

            <Text style={styles.sectionTitle}>Documents justificatifs</Text>

            <DocButton
                label="Acte de naissance *"
                file={birthCertificate}
                onPress={() => pickDocument(setBirthCertificate)}
                styles={styles}
            />

            {relationship === 'spouse' && (
                <DocButton
                    label="Acte de mariage *"
                    file={marriageCertificate}
                    onPress={() => pickDocument(setMarriageCertificate)}
                    styles={styles}
                />
            )}

            <DocButton label="Carte d'identité (optionnel)" file={idCard} onPress={() => pickDocument(setIdCard)} styles={styles} />

            {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color={colors.primaryText} /> : <Text style={styles.submitButtonText}>Envoyer</Text>}
            </TouchableOpacity>
        </ScrollView>
    );
}

function Field(props: {
    label: string;
    value: string;
    onChangeText: (v: string) => void;
    placeholder?: string;
    keyboardType?: 'default' | 'phone-pad';
    styles: any;
    colors: ThemeColors;
}) {
    return (
        <View style={props.styles.field}>
            <Text style={props.styles.fieldLabel}>{props.label}</Text>
            <TextInput
                style={props.styles.fieldInput}
                value={props.value}
                onChangeText={props.onChangeText}
                placeholder={props.placeholder}
                placeholderTextColor={props.colors.textSecondary}
                keyboardType={props.keyboardType ?? 'default'}
            />
        </View>
    );
}

function DocButton({ label, file, onPress, styles }: { label: string; file: PickedFile | null; onPress: () => void; styles: any }) {
    return (
        <TouchableOpacity style={styles.docButton} onPress={onPress}>
            <Text style={styles.docButtonLabel}>{label}</Text>
            <Text style={styles.docButtonValue} numberOfLines={1}>
                {file ? `✅ ${file.name}` : 'Choisir un fichier (PDF/image)'}
            </Text>
        </TouchableOpacity>
    );
}

function createStyles(colors: ThemeColors, scaledFont: (n: number) => number) {
    return StyleSheet.create({
        container: { padding: 20, paddingBottom: 60 },
        label: { fontSize: scaledFont(13), fontWeight: '600', color: colors.text, marginBottom: 8, marginTop: 8 },
        sectionTitle: { fontSize: scaledFont(15), fontWeight: '700', color: colors.primary, marginTop: 16, marginBottom: 10 },
        chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
        chip: {
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.border,
        },
        chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
        chipText: { fontSize: scaledFont(13), color: colors.text },
        chipTextActive: { color: colors.primaryText, fontWeight: '600' },
        field: { marginBottom: 14 },
        fieldLabel: { fontSize: scaledFont(12), fontWeight: '600', color: colors.textSecondary, marginBottom: 4 },
        fieldInput: {
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            fontSize: scaledFont(14),
            color: colors.text,
            backgroundColor: colors.surface,
        },
        docButton: {
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            padding: 12,
            marginBottom: 10,
        },
        docButtonLabel: { fontSize: scaledFont(12), fontWeight: '600', color: colors.textSecondary, marginBottom: 4 },
        docButtonValue: { fontSize: scaledFont(13), color: colors.primary },
        error: { color: colors.danger, fontSize: scaledFont(13), marginBottom: 12, textAlign: 'center' },
        submitButton: {
            backgroundColor: colors.primary,
            borderRadius: 8,
            paddingVertical: 14,
            alignItems: 'center',
            marginTop: 10,
        },
        submitButtonText: { color: colors.primaryText, fontWeight: '700', fontSize: scaledFont(15) },
    });
}