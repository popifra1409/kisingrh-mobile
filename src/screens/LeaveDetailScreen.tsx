import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { fetchLeave, LeaveDetail, LeaveStep } from '../api/leaves';
import { extractApiError } from '../api/client';
import type { AppStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'LeaveDetail'>;

export default function LeaveDetailScreen({ route }: Props) {
    const { id } = route.params;
    const [leave, setLeave] = useState<LeaveDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const load = useCallback(async () => {
        try {
            const data = await fetchLeave(id);
            setLeave(data);
        } catch (error) {
            Alert.alert('Erreur', extractApiError(error).message);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#1e3a5f" />
            </View>
        );
    }

    if (!leave) {
        return (
            <View style={styles.centered}>
                <Text>Impossible de charger la demande.</Text>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.section}>
                <Text style={styles.leaveType}>{leave.leave_type}</Text>
                <Text style={styles.dates}>
                    {leave.start_date} → {leave.end_date} ({leave.total_days} jour(s))
                </Text>
                {leave.is_split && leave.start_date_2 && leave.end_date_2 && (
                    <Text style={styles.datesSecondary}>
                        2ème prise : {leave.start_date_2} → {leave.end_date_2}
                    </Text>
                )}

                <Text style={styles.reasonLabel}>Motif</Text>
                <Text style={styles.reasonValue}>{leave.reason}</Text>

                {leave.destination && (
                    <>
                        <Text style={styles.reasonLabel}>Destination</Text>
                        <Text style={styles.reasonValue}>{leave.destination}</Text>
                    </>
                )}

                {leave.address_during_leave && (
                    <>
                        <Text style={styles.reasonLabel}>Adresse pendant le congé</Text>
                        <Text style={styles.reasonValue}>{leave.address_during_leave}</Text>
                    </>
                )}

                {leave.replacement && (
                    <>
                        <Text style={styles.reasonLabel}>Intérimaire</Text>
                        <Text style={styles.reasonValue}>{leave.replacement}</Text>
                    </>
                )}
            </View>

            {leave.status === 'rejected' && (
                <View style={[styles.section, styles.rejectedBox]}>
                    <Text style={styles.rejectedTitle}>❌ Demande rejetée</Text>
                    {leave.rejection_reason && <Text style={styles.rejectedReason}>{leave.rejection_reason}</Text>}
                </View>
            )}

            {leave.status === 'approved' && (
                <View style={[styles.section, styles.approvedBox]}>
                    <Text style={styles.approvedTitle}>✅ Demande approuvée définitivement</Text>
                    <Text style={styles.returnStatus}>
                        {leave.has_returned ? 'Retour enregistré.' : "Retour pas encore enregistré par les RH."}
                    </Text>
                </View>
            )}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Circuit de validation</Text>
                {leave.steps.map((step, index) => (
                    <StepRow key={step.order} step={step} isLast={index === leave.steps.length - 1} />
                ))}
            </View>
        </ScrollView>
    );
}

function StepRow({ step, isLast }: { step: LeaveStep; isLast: boolean }) {
    const config = {
        approved: { color: '#059669', icon: '✅' },
        rejected: { color: '#dc2626', icon: '❌' },
        pending: { color: '#d97706', icon: '⏳' },
        skipped: { color: '#9ca3af', icon: '➖' },
    }[step.status];

    return (
        <View style={styles.stepRow}>
            <View style={styles.stepIconColumn}>
                <Text style={[styles.stepIcon, { color: config.color }]}>{config.icon}</Text>
                {!isLast && <View style={styles.stepLine} />}
            </View>

            <View style={styles.stepContent}>
                <Text style={[styles.stepName, { color: config.color }]}>{step.name}</Text>
                {step.resolved_by && <Text style={styles.stepMeta}>Par {step.resolved_by}</Text>}
                {step.acted_at && <Text style={styles.stepMeta}>{step.acted_at}</Text>}
                {step.comments && <Text style={styles.stepComment}>{step.comments}</Text>}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20, paddingBottom: 40 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    section: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        padding: 16,
        marginBottom: 16,
    },
    leaveType: { fontSize: 17, fontWeight: '700', color: '#1e3a5f' },
    dates: { fontSize: 14, color: '#374151', marginTop: 4 },
    datesSecondary: { fontSize: 13, color: '#6b7280', marginTop: 2 },
    reasonLabel: { fontSize: 12, fontWeight: '600', color: '#6b7280', marginTop: 12 },
    reasonValue: { fontSize: 14, color: '#111827', marginTop: 2 },
    rejectedBox: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
    rejectedTitle: { fontSize: 14, fontWeight: '700', color: '#991b1b' },
    rejectedReason: { fontSize: 13, color: '#7f1d1d', marginTop: 6 },
    approvedBox: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
    approvedTitle: { fontSize: 14, fontWeight: '700', color: '#065f46' },
    returnStatus: { fontSize: 13, color: '#065f46', marginTop: 6 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1e3a5f', marginBottom: 12 },
    stepRow: { flexDirection: 'row' },
    stepIconColumn: { alignItems: 'center', width: 28 },
    stepIcon: { fontSize: 16 },
    stepLine: { width: 2, flex: 1, backgroundColor: '#e5e7eb', marginVertical: 2 },
    stepContent: { flex: 1, paddingBottom: 16 },
    stepName: { fontSize: 13, fontWeight: '600' },
    stepMeta: { fontSize: 11, color: '#9ca3af', marginTop: 1 },
    stepComment: { fontSize: 12, color: '#374151', marginTop: 4, fontStyle: 'italic' },
});