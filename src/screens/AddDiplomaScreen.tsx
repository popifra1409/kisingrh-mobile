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
import { createDiploma, NewDiplomaPayload } from '../api/diplomas';
import { extractApiError } from '../api/client';
import type { AppStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'AddDiploma'>;

type PickedFile = { uri: string; name: string; type: string };

const TYPES: { value: NewDiplomaPayload['type']; label: string }[] = [
    { value: 'recruitment_diploma', label: 'Diplôme de Recrutement' },
    { value: 'highest_diploma', label: 'Diplôme le Plus Élevé' },
    { value: 'training', label: 'Formation' },
];

export default function AddDiplomaScreen({ navigation }: Props) {
    const [type, setType] = useState<NewDiplomaPayload['type']>('training');
    const [title, setTitle] = useState('');
    const [institution, setInstitution] = useState('');
    const [year, setYear] = useState('');
    const [document, setDocument] = useState<PickedFile | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    async function pickDocument() {
        const result = await DocumentPicker.getDocumentAsync({
            type: ['application/pdf', 'image/*'],
            copyToCacheDirectory: true,
        });

        if (result.canceled || !result.assets?.[0]) return;

        const asset = result.assets[0];
        setDocument({ uri: asset.uri, name: asset.name, type: asset.mimeType ?? 'application/octet-stream' });
    }

    async function handleSubmit() {
        setErrorMessage(null);

        const yearNumber = parseInt(year.trim(), 10);
        const currentYear = new Date().getFullYear();

        if (!title.trim() || !institution.trim()) {
            setErrorMessage("L'intitulé et l'établissement sont obligatoires.");
            return;
        }

        if (!yearNumber || yearNumber < 1950 || yearNumber > currentYear) {
            setErrorMessage(`Année invalide (entre 1950 et ${currentYear}).`);
            return;
        }

        if (!document) {
            setErrorMessage('Le document justificatif est obligatoire.');
            return;
        }

        setIsSubmitting(true);

        try {
            await createDiploma({
                type,
                title: title.trim(),
                institution: institution.trim(),
                year_obtained: yearNumber,
                documentFile: document,
            });

            Alert.alert('Envoyé', 'Diplôme déclaré, en attente de validation par les RH.');
            navigation.goBack();
        } catch (error) {
            setErrorMessage(extractApiError(error).message);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.label}>Type</Text>
            <View style={styles.chipsColumn}>
                {TYPES.map((t) => (
                    <TouchableOpacity
                        key={t.value}
                        style={[styles.chip, type === t.value && styles.chipActive]}
                        onPress={() => setType(t.value)}
                    >
                        <Text style={[styles.chipText, type === t.value && styles.chipTextActive]}>{t.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Field label="Intitulé *" value={title} onChangeText={setTitle} placeholder="Ex: Licence en Sciences Infirmières" />
            <Field label="École / Université / Organisme *" value={institution} onChangeText={setInstitution} />
            <Field label="Année d'obtention *" value={year} onChangeText={setYear} keyboardType="number-pad" placeholder="2020" />

            <TouchableOpacity style={styles.docButton} onPress={pickDocument}>
                <Text style={styles.docButtonLabel}>Document justificatif *</Text>
                <Text style={styles.docButtonValue} numberOfLines={1}>
                    {document ? `✅ ${document.name}` : 'Choisir un fichier (PDF/image)'}
                </Text>
            </TouchableOpacity>

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
    keyboardType?: 'default' | 'number-pad';
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

const styles = StyleSheet.create({
    container: { padding: 20, paddingBottom: 60 },
    label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
    chipsColumn: { gap: 8, marginBottom: 16 },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 8,
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