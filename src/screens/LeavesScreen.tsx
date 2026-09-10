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
import { useAppTheme, ThemeColors } from '../context/ThemeContext';
import type { AppStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'Leaves'>;

function getStatusColors(status: LeaveSummary['status'], isDark: boolean) {
    const palette = {
        pending: isDark ? { bg: '#78350f', text: '#fde68a', label: 'En attente' } : { bg: '#fef3c7', text: '#92400e', label: 'En attente' },
        approved: isDark ? { bg: '#064e3b', text: '#a7f3d0', label: 'Approuvé' } : { bg: '#d1fae5', text: '#065f46', label: 'Approuvé' },
        rejected: isDark ? { bg: '#7f1d1d', text: '#fecaca', label: 'Rejeté' } : { bg: '#fee2e2', text: '#991b1b', label: 'Rejeté' },
    };
    return palette[status];
}

export default function LeavesScreen({ navigation }: Props) {
    const { colors, scaledFont, resolvedScheme } = useAppTheme();
    const styles = createStyles(colors, scaledFont);

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
                        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
                    ) : (
                        <Text style={styles.emptyText}>Aucune demande de congé pour le moment.</Text>
                    )
                }
                renderItem={({ item }) => {
                    const statusStyle = getStatusColors(item.status, resolvedScheme === 'dark');
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
        cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
        cardTitle: { fontSize: scaledFont(15), fontWeight: '600', color: colors.text, flex: 1, marginRight: 8 },
        cardDates: { fontSize: scaledFont(13), color: colors.text },
        cardStep: { fontSize: scaledFont(12), color: colors.warning, marginTop: 6 },
        cardReturn: { fontSize: scaledFont(12), color: colors.textSecondary, marginTop: 6 },
        badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
        badgeText: { fontSize: scaledFont(11), fontWeight: '600' },
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