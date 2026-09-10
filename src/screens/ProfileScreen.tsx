import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { fetchProfile, updateProfile, uploadProfilePhoto, EmployeeProfile } from '../api/profile';
import { extractApiError } from '../api/client';
import { enqueue } from '../offline/queue';
import { useAppTheme, ThemeColors } from '../context/ThemeContext';
import axios from 'axios';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'Profile'>;

export default function ProfileScreen({ navigation }: Props) {
    const { colors, scaledFont } = useAppTheme();
    const styles = createStyles(colors, scaledFont);

    const [profile, setProfile] = useState<EmployeeProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            const data = await fetchProfile();
            setProfile(data);
            setPhone(data.phone ?? '');
            setEmail(data.email ?? '');
            setAddress(data.address ?? '');
            setCity(data.city ?? '');
        } catch (error) {
            Alert.alert('Erreur', extractApiError(error).message);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    async function onRefresh() {
        setIsRefreshing(true);
        load();
    }

    async function handlePickPhoto() {
        Alert.alert('Changer ma photo', 'Comment souhaitez-vous procéder ?', [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Prendre une photo', onPress: () => pickFromCamera() },
            { text: 'Choisir dans la galerie', onPress: () => pickFromLibrary() },
        ]);
    }

    async function pickFromCamera() {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permission requise', "Autorisez l'accès à la caméra pour prendre une photo.");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.7,
            allowsEditing: true,
            aspect: [1, 1],
        });

        await handlePickedAsset(result);
    }

    async function pickFromLibrary() {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permission requise', "Autorisez l'accès à vos photos pour changer votre photo de profil.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.7,
            allowsEditing: true,
            aspect: [1, 1],
        });

        await handlePickedAsset(result);
    }

    async function handlePickedAsset(result: ImagePicker.ImagePickerResult) {
        if (result.canceled || !result.assets?.[0]) return;

        const asset = result.assets[0];
        setIsUploadingPhoto(true);

        try {
            await uploadProfilePhoto(
                asset.uri,
                asset.fileName ?? 'photo.jpg',
                asset.mimeType ?? 'image/jpeg'
            );
            await load();
        } catch (error) {
            Alert.alert('Erreur', extractApiError(error).message);
        } finally {
            setIsUploadingPhoto(false);
        }
    }

    async function handleSave() {
        setErrorMessage(null);
        setIsSaving(true);

        const payload = { phone, email, address, city };

        try {
            const updated = await updateProfile(payload);
            setProfile(updated);
            setIsEditing(false);
        } catch (error) {
            if (axios.isAxiosError(error) && !error.response) {
                await enqueue('update_profile', payload);
                setProfile((prev) => (prev ? { ...prev, ...payload } : prev));
                setIsEditing(false);
                Alert.alert(
                    'Enregistré localement',
                    "Le serveur n'est pas joignable actuellement. Vos modifications seront envoyées automatiquement dès que vous serez sur le réseau de l'hôpital (bouton Synchroniser dans Paramètres)."
                );
            } else {
                setErrorMessage(extractApiError(error).message);
            }
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={styles.centered}>
                <Text style={{ color: colors.text }}>Impossible de charger le profil.</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={{ backgroundColor: colors.background }}
            contentContainerStyle={styles.container}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={handlePickPhoto} disabled={isUploadingPhoto}>
                    {profile.photo_url ? (
                        <Image source={{ uri: profile.photo_url }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarInitial}>{profile.full_name.charAt(0)}</Text>
                        </View>
                    )}
                    <View style={styles.avatarEditBadge}>
                        {isUploadingPhoto ? (
                            <ActivityIndicator size="small" color={colors.primaryText} />
                        ) : (
                            <Text style={styles.avatarEditText}>✏️</Text>
                        )}
                    </View>
                </TouchableOpacity>

                <Text style={styles.name}>{profile.full_name}</Text>
                <Text style={styles.matricule}>{profile.matricule}</Text>
            </View>

            <View style={styles.quickLinks}>
                <TouchableOpacity style={styles.quickLink} onPress={() => navigation.navigate('Dependents')}>
                    <Text style={styles.quickLinkIcon}>👨‍👩‍👧</Text>
                    <Text style={styles.quickLinkLabel}>Ayants Droit</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.quickLink} onPress={() => navigation.navigate('Diplomas')}>
                    <Text style={styles.quickLinkIcon}>🎓</Text>
                    <Text style={styles.quickLinkLabel}>Diplômes</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Affectation</Text>
                <InfoRow label="Corps de métier" value={profile.trade_body} styles={styles} />
                <InfoRow label="Qualification" value={profile.qualification} styles={styles} />
                <InfoRow label="Poste" value={profile.job_title} styles={styles} />
                <InfoRow label="Service" value={profile.service ?? profile.department} styles={styles} />
                <InfoRow label="Statut" value={profile.administrative_status_label} styles={styles} />
            </View>

            <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Coordonnées</Text>
                    {!isEditing && (
                        <TouchableOpacity onPress={() => setIsEditing(true)}>
                            <Text style={styles.editLink}>Modifier</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {isEditing ? (
                    <>
                        <Field label="Téléphone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" styles={styles} colors={colors} />
                        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" styles={styles} colors={colors} />
                        <Field label="Adresse" value={address} onChangeText={setAddress} styles={styles} colors={colors} />
                        <Field label="Ville" value={city} onChangeText={setCity} styles={styles} colors={colors} />

                        {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

                        <View style={styles.editActions}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => {
                                    setIsEditing(false);
                                    setPhone(profile.phone ?? '');
                                    setEmail(profile.email ?? '');
                                    setAddress(profile.address ?? '');
                                    setCity(profile.city ?? '');
                                    setErrorMessage(null);
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Annuler</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isSaving}>
                                {isSaving ? <ActivityIndicator color={colors.primaryText} /> : <Text style={styles.saveButtonText}>Enregistrer</Text>}
                            </TouchableOpacity>
                        </View>
                    </>
                ) : (
                    <>
                        <InfoRow label="Téléphone" value={profile.phone} styles={styles} />
                        <InfoRow label="Email" value={profile.email} styles={styles} />
                        <InfoRow label="Adresse" value={profile.address} styles={styles} />
                        <InfoRow label="Ville" value={profile.city} styles={styles} />
                    </>
                )}
            </View>
        </ScrollView>
    );
}

function InfoRow({ label, value, styles }: { label: string; value: string | null; styles: any }) {
    return (
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value ?? '—'}</Text>
        </View>
    );
}

function Field(props: {
    label: string;
    value: string;
    onChangeText: (v: string) => void;
    keyboardType?: 'default' | 'phone-pad' | 'email-address';
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
                keyboardType={props.keyboardType ?? 'default'}
                autoCapitalize="none"
                placeholderTextColor={props.colors.textSecondary}
            />
        </View>
    );
}

function createStyles(colors: ThemeColors, scaledFont: (n: number) => number) {
    return StyleSheet.create({
        container: { padding: 20, paddingBottom: 40 },
        centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
        header: { alignItems: 'center', marginBottom: 20 },
        avatar: { width: 96, height: 96, borderRadius: 48 },
        avatarPlaceholder: {
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
        },
        avatarInitial: { color: colors.primaryText, fontSize: scaledFont(36), fontWeight: '700' },
        avatarEditBadge: {
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: colors.background,
        },
        avatarEditText: { fontSize: 12 },
        name: { fontSize: scaledFont(19), fontWeight: '700', color: colors.text, marginTop: 10 },
        matricule: { fontSize: scaledFont(13), color: colors.textSecondary, marginTop: 2 },
        quickLinks: { flexDirection: 'row', gap: 12, marginBottom: 20 },
        quickLink: {
            flex: 1,
            backgroundColor: colors.card,
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: 'center',
        },
        quickLinkIcon: { fontSize: 24, marginBottom: 4 },
        quickLinkLabel: { fontSize: scaledFont(13), fontWeight: '600', color: colors.text },
        section: {
            backgroundColor: colors.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 16,
            marginBottom: 16,
        },
        sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        sectionTitle: { fontSize: scaledFont(14), fontWeight: '700', color: colors.primary, marginBottom: 10 },
        editLink: { fontSize: scaledFont(13), fontWeight: '600', color: colors.primary, marginBottom: 10 },
        infoRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingVertical: 8,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        infoLabel: { fontSize: scaledFont(13), color: colors.textSecondary },
        infoValue: { fontSize: scaledFont(13), fontWeight: '600', color: colors.text, maxWidth: '60%', textAlign: 'right' },
        field: { marginBottom: 12 },
        fieldLabel: { fontSize: scaledFont(12), fontWeight: '600', color: colors.textSecondary, marginBottom: 4 },
        fieldInput: {
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            fontSize: scaledFont(14),
            color: colors.text,
            backgroundColor: colors.background,
        },
        error: { color: colors.danger, fontSize: scaledFont(12), marginBottom: 8 },
        editActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
        cancelButton: {
            flex: 1,
            paddingVertical: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
        },
        cancelButtonText: { color: colors.text, fontWeight: '600' },
        saveButton: {
            flex: 1,
            paddingVertical: 12,
            borderRadius: 8,
            backgroundColor: colors.primary,
            alignItems: 'center',
        },
        saveButtonText: { color: colors.primaryText, fontWeight: '600' },
    });
}