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
    const [relationship, setRelationship] = useState<NewDependentPayload['relationship']>('child');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [birthDate, setBirthDate] = useState(''); // YYYY-MM-DD
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
        <ScrollView contentContainerStyle={styles.container}>
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

            <Field label="Prénom(s)" value={firstName} onChangeText={setFirstName} />
            <Field label="Nom *" value={lastName} onChangeText={setLastName} />
            <Field label="Date de naissance * (AAAA-MM-JJ)" value={birthDate} onChangeText={setBirthDate} placeholder="2018-02-10" />
            <Field label="Lieu de naissance" value={birthPlace} onChangeText={setBirthPlace} />

            <Text style={styles.label}>Sexe</Text>
            <View style={styles.chipsRow}>
                <TouchableOpacity style={[styles.chip, gender === 'M' && styles.chipActive]} onPress={() => setGender('M')}>
                    <Text style={[styles.chipText, gender === 'M' && styles.chipTextActive]}>Masculin</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.chip, gender === 'F' && styles.chipActive]} onPress={() => setGender('F')}>
                    <Text style={[styles.chipText, gender === 'F' && styles.chipTextActive]}>Féminin</Text>
                </TouchableOpacity>
            </View>

            <Field label="Téléphone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

            <Text style={styles.sectionTitle}>Documents justificatifs</Text>

            <DocButton
                label="Acte de naissance *"
                file={birthCertificate}
                onPress={() => pickDocument(setBirthCertificate)}
            />

            {relationship === 'spouse' && (
                <DocButton
                    label="Acte de mariage *"
                    file={marriageCertificate}
                    onPress={() => pickDocument(setMarriageCertificate)}
                />
            )}

            <DocButton label="Carte d'identité (optionnel)" file={idCard} onPress={() => pickDocument(setIdCard)} />

            {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Envoyer</Text>}
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
}) {
    return (
        <View style={styles.field}>
            <Text style={styles.fieldLabel}>{props.label}</Text>
            <TextInput
                style={styles.fieldInput}
                value={props.value}
                onChangeText={props.onChangeText}
                placeholder={props.placeholder}
                keyboardType={props.keyboardType ?? 'default'}
            />
        </View>
    );
}

function DocButton({ label, file, onPress }: { label: string; file: PickedFile | null; onPress: () => void }) {
    return (
        <TouchableOpacity style={styles.docButton} onPress={onPress}>
            <Text style={styles.docButtonLabel}>{label}</Text>
            <Text style={styles.docButtonValue} numberOfLines={1}>
                {file ? `✅ ${file.name}` : 'Choisir un fichier (PDF/image)'}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20, paddingBottom: 60 },
    label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 8 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1e3a5f', marginTop: 16, marginBottom: 10 },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#d1d5db',
    },
    chipActive: { backgroundColor: '#1e3a5f', borderColor: '#1e3a5f' },
    chipText: { fontSize: 13, color: '#374151' },
    chipTextActive: { color: '#fff', fontWeight: '600' },
    field: { marginBottom: 14 },
    fieldLabel: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 4 },
    fieldInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
    },
    docButton: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
    },
    docButtonLabel: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 4 },
    docButtonValue: { fontSize: 13, color: '#1e3a5f' },
    error: { color: '#dc2626', fontSize: 13, marginBottom: 12, textAlign: 'center' },
    submitButton: {
        backgroundColor: '#1e3a5f',
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 10,
    },
    submitButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});