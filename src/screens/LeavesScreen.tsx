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
import { fetchLeaves, LeaveSummary } from '../api/leaves';
import { extractApiError } from '../api/client';
import type { AppStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'Leaves'>;

const STATUS_COLORS: Record<LeaveSummary['status'], { bg: string; text: string; label: string }> = {
    pending: { bg: '#fef3c7', text: '#92400e', label: 'En attente' },
    approved: { bg: '#d1fae5', text: '#065f46', label: 'Approuvé' },
    rejected: { bg: '#fee2e2', text: '#991b1b', label: 'Rejeté' },
};

export default function LeavesScreen({ navigation }: Props) {
    const [leaves, setLeaves] = useState<LeaveSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const load = useCallback(async () => {
        try {
            const data = await fetchLeaves();
            setLeaves(data);
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

    return (
        <View style={styles.flex}>
            <FlatList
                data={leaves}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); load(); }} />}
                ListEmptyComponent={
                    isLoading ? (
                        <ActivityIndicator style={{ marginTop: 40 }} color="#1e3a5f" />
                    ) : (
                        <Text style={styles.emptyText}>Aucune demande de congé pour le moment.</Text>
                    )
                }
                renderItem={({ item }) => {
                    const statusStyle = STATUS_COLORS[item.status];
                    return (
                        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('LeaveDetail', { id: item.id })}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>{item.leave_type}</Text>
                                <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
                                    <Text style={[styles.badgeText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
                                </View>
                            </View>

                            <Text style={styles.cardDates}>
                                {item.start_date} → {item.end_date} · {item.total_days} j{item.is_split ? ' (fractionné)' : ''}
                            </Text>

                            {item.status === 'pending' && item.current_step && (
                                <Text style={styles.cardStep}>Étape en cours : {item.current_step}</Text>
                            )}

                            {item.status === 'approved' && (
                                <Text style={styles.cardReturn}>
                                    {item.has_returned ? '✅ Retour enregistré' : '⏳ Retour non encore enregistré'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    );
                }}
            />

            <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('NewLeaveRequest')}>
                <Text style={styles.fabText}>+ Nouvelle demande</Text>
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
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
    cardTitle: { fontSize: 15, fontWeight: '600', color: '#111827', flex: 1, marginRight: 8 },
    cardDates: { fontSize: 13, color: '#374151' },
    cardStep: { fontSize: 12, color: '#92400e', marginTop: 6 },
    cardReturn: { fontSize: 12, color: '#374151', marginTop: 6 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 11, fontWeight: '600' },
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