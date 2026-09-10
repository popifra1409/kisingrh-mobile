import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { fetchDependents, deleteDependent, Dependent } from '../api/dependents';
import { extractApiError } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import { useAppTheme, ThemeColors } from '../context/ThemeContext';
import type { AppStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'Dependents'>;

export default function DependentsScreen({ navigation }: Props) {
    const { colors, scaledFont } = useAppTheme();
    const styles = createStyles(colors, scaledFont);

    const [dependents, setDependents] = useState<Dependent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const load = useCallback(async () => {
        try {
            const data = await fetchDependents();
            setDependents(data);
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

    function confirmDelete(dependent: Dependent) {
        if (dependent.validation_status !== 'pending') {
            Alert.alert('Non modifiable', 'Cet ayant droit a déjà été traité par les RH et ne peut plus être retiré ici.');
            return;
        }

        Alert.alert('Retirer cet ayant droit ?', dependent.full_name, [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Retirer',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteDependent(dependent.id);
                        load();
                    } catch (error) {
                        Alert.alert('Erreur', extractApiError(error).message);
                    }
                },
            },
        ]);
    }

    return (
        <View style={styles.flex}>
            <FlatList
                data={dependents}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); load(); }} />}
                ListEmptyComponent={
                    isLoading ? (
                        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
                    ) : (
                        <Text style={styles.emptyText}>Aucun ayant droit déclaré pour le moment.</Text>
                    )
                }
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.card} onLongPress={() => confirmDelete(item)}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>{item.full_name}</Text>
                            <StatusBadge status={item.validation_status} label={item.validation_status_label} />
                        </View>
                        <Text style={styles.cardSubtitle}>
                            {item.relationship_label}
                            {item.age !== null ? ` · ${item.age} ans` : ''}
                        </Text>
                        {item.validation_status === 'rejected' && item.rejection_reason && (
                            <Text style={styles.rejectionReason}>Motif : {item.rejection_reason}</Text>
                        )}
                    </TouchableOpacity>
                )}
            />

            <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddDependent')}>
                <Text style={styles.fabText}>+ Déclarer un ayant droit</Text>
            </TouchableOpacity>
        </View>
    );
}

function createStyles(colors: ThemeColors, scaledFont: (n: number) => number) {
    return StyleSheet.create({
        flex: { flex: 1, backgroundColor: colors.background },
        list: { padding: 16, paddingBottom: 90 },
        emptyText: { textAlign: 'center', color: colors.textSecondary, marginTop: 40, fontSize: scaledFont(13) },
        card: {
            backgroundColor: colors.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 14,
            marginBottom: 12,
        },
        cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
        cardTitle: { fontSize: scaledFont(15), fontWeight: '600', color: colors.text, flex: 1, marginRight: 8 },
        cardSubtitle: { fontSize: scaledFont(13), color: colors.textSecondary },
        rejectionReason: { fontSize: scaledFont(12), color: colors.danger, marginTop: 6 },
        fab: {
            position: 'absolute',
            bottom: 20,
            left: 16,
            right: 16,
            backgroundColor: colors.primary,
            borderRadius: 10,
            paddingVertical: 14,
            alignItems: 'center',
        },
        fabText: { color: colors.primaryText, fontWeight: '700', fontSize: scaledFont(14) },
    });
}