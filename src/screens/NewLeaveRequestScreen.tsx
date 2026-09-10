import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    Switch,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { fetchLeaveTypes, fetchLeaveBalance, createLeave, LeaveType, LeaveBalance } from '../api/leaves';
import { extractApiError } from '../api/client';
import { enqueue } from '../offline/queue';
import { persistPickedFile } from '../offline/fileStorage';
import { useAppTheme, ThemeColors } from '../context/ThemeContext';
import axios from 'axios';
import type { AppStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'NewLeaveRequest'>;

type PickedFile = { uri: string; name: string; type: string };

export default function NewLeaveRequestScreen({ navigation }: Props) {
    const { colors, scaledFont } = useAppTheme();
    const styles = createStyles(colors, scaledFont);

    const [types, setTypes] = useState<LeaveType[]>([]);
    const [isLoadingTypes, setIsLoadingTypes] = useState(true);
    const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
    const [balance, setBalance] = useState<LeaveBalance | null>(null);
    const [isLoadingBalance, setIsLoadingBalance] = useState(false);

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isSplit, setIsSplit] = useState(false);
    const [startDate2, setStartDate2] = useState('');
    const [endDate2, setEndDate2] = useState('');
    const [reason, setReason] = useState('');
    const [destination, setDestination] = useState('');
    const [address, setAddress] = useState('');
    const [childrenUnder6, setChildrenUnder6] = useState('');
    const [document, setDocument] = useState<PickedFile | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const data = await fetchLeaveTypes();
                setTypes(data);
                if (data.length > 0) setSelectedTypeId(data[0].id);
            } catch (error) {
                Alert.alert('Erreur', extractApiError(error).message);
            } finally {
                setIsLoadingTypes(false);
            }
        })();
    }, []);

    useEffect(() => {
        if (!selectedTypeId) return;
        setIsLoadingBalance(true);
        fetchLeaveBalance(selectedTypeId)
            .then(setBalance)
            .catch(() => setBalance(null))
            .finally(() => setIsLoadingBalance(false));
    }, [selectedTypeId]);

    const selectedType = types.find((t) => t.id === selectedTypeId);
    const isPermission = selectedType?.code === 'PERM';
    const showChildrenField = selectedType?.code === 'CA' || selectedType?.code === 'CMAT';

    async function pickDocument() {
        const result = await DocumentPicker.getDocumentAsync({
            type: ['application/pdf', 'image/*'],
            copyToCacheDirectory: true,
        });

        if (result.canceled || !result.assets?.[0]) return;

        const asset = result.assets[0];
        setDocument({ uri: asset.uri, name: asset.name, type: asset.mimeType ?? 'application/octet-stream' });
    }

    function isValidDate(value: string): boolean {
        return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
    }

    async function handleSubmit() {
        setErrorMessage(null);

        if (!selectedTypeId) {
            setErrorMessage('Sélectionnez un type de congé.');
            return;
        }

        if (!isValidDate(startDate) || !isValidDate(endDate)) {
            setErrorMessage('Format de date attendu : AAAA-MM-JJ (ex: 2026-07-01).');
            return;
        }

        if (isSplit && (!isValidDate(startDate2) || !isValidDate(endDate2))) {
            setErrorMessage('Renseignez des dates valides pour la 2ème prise (AAAA-MM-JJ).');
            return;
        }

        if (!reason.trim()) {
            setErrorMessage('Le motif est obligatoire.');
            return;
        }

        if (selectedType?.requires_document && !document) {
            setErrorMessage('Un document justificatif est requis pour ce type de congé.');
            return;
        }

        setIsSubmitting(true);

        const payload = {
            leave_type_id: selectedTypeId,
            start_date: startDate.trim(),
            end_date: endDate.trim(),
            is_split: isSplit,
            start_date_2: isSplit ? startDate2.trim() : undefined,
            end_date_2: isSplit ? endDate2.trim() : undefined,
            reason: reason.trim(),
            destination: isPermission ? destination.trim() || undefined : undefined,
            address_during_leave: !isPermission ? address.trim() || undefined : undefined,
            children_under_6_at_request: showChildrenField && childrenUnder6 ? parseInt(childrenUnder6, 10) : undefined,
        };

        try {
            await createLeave({ ...payload, documentFile: document ?? undefined });

            Alert.alert('Envoyée', 'Votre demande a été soumise et le circuit de validation a démarré.');
            navigation.goBack();
        } catch (error) {
            if (axios.isAxiosError(error) && !error.response) {
                try {
                    const persistedUri = document ? await persistPickedFile(document.uri, document.name) : undefined;

                    await enqueue('create_leave', {
                        ...payload,
                        _persistedFileUri: persistedUri,
                        _fileName: document?.name,
                        _fileType: document?.type,
                    });

                    Alert.alert(
                        'Enregistrée localement',
                        "Le serveur n'est pas joignable actuellement. Votre demande sera envoyée automatiquement dès que vous serez sur le réseau de l'hôpital (bouton Synchroniser dans Paramètres)."
                    );
                    navigation.goBack();
                } catch (persistError) {
                    setErrorMessage("Impossible d'enregistrer la demande localement. Réessayez.");
                }
            } else {
                setErrorMessage(extractApiError(error).message);
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoadingTypes) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
            <Text style={styles.label}>Type de congé</Text>
            <View style={styles.chipsColumn}>
                {types.map((t) => (
                    <TouchableOpacity
                        key={t.id}
                        style={[styles.chip, selectedTypeId === t.id && styles.chipActive]}
                        onPress={() => setSelectedTypeId(t.id)}
                    >
                        <Text style={[styles.chipText, selectedTypeId === t.id && styles.chipTextActive]}>{t.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.balanceBox}>
                {isLoadingBalance ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                ) : balance ? (
                    balance.eligible === false ? (
                        <Text style={styles.balanceWarning}>
                            ⚠️ Pas encore éligible{balance.next_eligibility_date ? ` (à partir du ${balance.next_eligibility_date})` : ''}.
                        </Text>
                    ) : balance.available !== undefined ? (
                        <Text style={styles.balanceText}>
                            Solde : {balance.available} j disponible(s) sur {balance.entitlement} (cycle en cours)
                        </Text>
                    ) : (
                        <Text style={styles.balanceText}>{balance.message ?? 'Pas de solde applicable pour ce type.'}</Text>
                    )
                ) : null}
            </View>

            <Field label="Date de début (1ère prise) *" value={startDate} onChangeText={setStartDate} placeholder="2026-07-01" styles={styles} colors={colors} />
            <Field label="Date de fin (1ère prise) *" value={endDate} onChangeText={setEndDate} placeholder="2026-07-15" styles={styles} colors={colors} />

            <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Fractionner en 2 prises</Text>
                <Switch value={isSplit} onValueChange={setIsSplit} />
            </View>

            {isSplit && (
                <>
                    <Field label="Date de début (2ème prise) *" value={startDate2} onChangeText={setStartDate2} placeholder="2026-09-01" styles={styles} colors={colors} />
                    <Field label="Date de fin (2ème prise) *" value={endDate2} onChangeText={setEndDate2} placeholder="2026-09-08" styles={styles} colors={colors} />
                </>
            )}

            {isPermission ? (
                <Field label="Destination" value={destination} onChangeText={setDestination} styles={styles} colors={colors} />
            ) : (
                <Field label="Adresse pendant le congé" value={address} onChangeText={setAddress} styles={styles} colors={colors} />
            )}

            {showChildrenField && (
                <Field
                    label="Enfants < 6 ans (femme salariée)"
                    value={childrenUnder6}
                    onChangeText={setChildrenUnder6}
                    keyboardType="number-pad"
                    styles={styles}
                    colors={colors}
                />
            )}

            <View style={styles.field}>
                <Text style={styles.fieldLabel}>Motif *</Text>
                <TextInput
                    style={[styles.fieldInput, styles.textArea]}
                    value={reason}
                    onChangeText={setReason}
                    multiline
                    numberOfLines={3}
                    placeholderTextColor={colors.textSecondary}
                />
            </View>

            <TouchableOpacity style={styles.docButton} onPress={pickDocument}>
                <Text style={styles.docButtonLabel}>
                    Document justificatif{selectedType?.requires_document ? ' *' : ' (optionnel)'}
                </Text>
                <Text style={styles.docButtonHint}>Décision signée, planning de service, ou autre justificatif</Text>
                <Text style={styles.docButtonValue} numberOfLines={1}>
                    {document ? `✅ ${document.name}` : 'Choisir un fichier (PDF/image)'}
                </Text>
            </TouchableOpacity>

            {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color={colors.primaryText} /> : <Text style={styles.submitButtonText}>Soumettre la demande</Text>}
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

function createStyles(colors: ThemeColors, scaledFont: (n: number) => number) {
    return StyleSheet.create({
        container: { padding: 20, paddingBottom: 60 },
        centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
        label: { fontSize: scaledFont(13), fontWeight: '600', color: colors.text, marginBottom: 8 },
        chipsColumn: { gap: 8, marginBottom: 12 },
        chip: {
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
        },
        chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
        chipText: { fontSize: scaledFont(13), color: colors.text },
        chipTextActive: { color: colors.primaryText, fontWeight: '600' },
        balanceBox: {
            backgroundColor: colors.surface,
            borderRadius: 8,
            padding: 10,
            marginBottom: 16,
            minHeight: 20,
            justifyContent: 'center',
        },
        balanceText: { fontSize: scaledFont(12), color: colors.primary },
        balanceWarning: { fontSize: scaledFont(12), color: colors.warning },
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
        textArea: { minHeight: 80, textAlignVertical: 'top' },
        switchRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
            paddingVertical: 4,
        },
        switchLabel: { fontSize: scaledFont(13), fontWeight: '600', color: colors.text },
        docButton: {
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            padding: 12,
            marginBottom: 10,
        },
        docButtonLabel: { fontSize: scaledFont(12), fontWeight: '600', color: colors.textSecondary, marginBottom: 2 },
        docButtonHint: { fontSize: scaledFont(11), color: colors.textSecondary, marginBottom: 6 },
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