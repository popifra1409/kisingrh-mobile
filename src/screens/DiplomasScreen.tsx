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
import { fetchDiplomas, deleteDiploma, Diploma } from '../api/diplomas';
import { extractApiError } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import type { AppStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'Diplomas'>;

export default function DiplomasScreen({ navigation }: Props) {
    const [diplomas, setDiplomas] = useState<Diploma[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const load = useCallback(async () => {
        try {
            const data = await fetchDiplomas();
            setDiplomas(data);
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

    function confirmDelete(diploma: Diploma) {
        if (diploma.validation_status === 'validated') {
            Alert.alert('Non modifiable', 'Ce diplôme a déjà été validé et ne peut plus être retiré ici.');
            return;
        }

        Alert.alert('Retirer ce diplôme ?', diploma.title, [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Retirer',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteDiploma(diploma.id);
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
                data={diplomas}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); load(); }} />}
                ListEmptyComponent={
                    isLoading ? (
                        <ActivityIndicator style={{ marginTop: 40 }} color="#1e3a5f" />
                    ) : (
                        <Text style={styles.emptyText}>Aucun diplôme ou formation renseigné pour le moment.</Text>
                    )
                }
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.card} onLongPress={() => confirmDelete(item)}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                            <StatusBadge status={item.validation_status} label={item.validation_status_label} />
                        </View>
                        <Text style={styles.cardSubtitle}>{item.type_label}</Text>
                        <Text style={styles.cardMeta}>{item.institution} · {item.year_obtained}</Text>
                        {item.validation_status === 'rejected' && item.rejection_reason && (
                            <Text style={styles.rejectionReason}>Motif : {item.rejection_reason}</Text>
                        )}
                    </TouchableOpacity>
                )}
            />

            <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddDiploma')}>
                <Text style={styles.fabText}>+ Ajouter un diplôme/formation</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: '#fff' },
    list: { padding: 16, paddingBottom: 90 },
    emptyText: { textAlign: 'center', color: '#6b7280', marginTop: 40, fontSize: 13 },
    card: {
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        padding: 14,
        marginBottom: 12,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
    cardTitle: { fontSize: 15, fontWeight: '600', color: '#111827', flex: 1, marginRight: 8 },
    cardSubtitle: { fontSize: 12, color: '#1e3a5f', fontWeight: '600', marginTop: 2 },
    cardMeta: { fontSize: 13, color: '#6b7280', marginTop: 2 },
    rejectionReason: { fontSize: 12, color: '#991b1b', marginTop: 6 },
    fab: {
        position: 'absolute',
        bottom: 20,
        left: 16,
        right: 16,
        backgroundColor: '#1e3a5f',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
    },
    fabText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});