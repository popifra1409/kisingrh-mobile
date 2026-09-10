import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { fetchLeave, LeaveDetail, LeaveStep } from '../api/leaves';
import { extractApiError } from '../api/client';
import { useAppTheme, ThemeColors } from '../context/ThemeContext';
import type { AppStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'LeaveDetail'>;

export default function LeaveDetailScreen({ route }: Props) {
    const { id } = route.params;
    const { colors, scaledFont } = useAppTheme();
    const styles = createStyles(colors, scaledFont);

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
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!leave) {
        return (
            <View style={styles.centered}>
                <Text style={{ color: colors.text }}>Impossible de charger la demande.</Text>
            </View>
        );
    }

    return (
        <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
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
                    <StepRow key={step.order} step={step} isLast={index === leave.steps.length - 1} colors={colors} scaledFont={scaledFont} />
                ))}
            </View>
        </ScrollView>
    );
}

function StepRow({
    step,
    isLast,
    colors,
    scaledFont,
}: {
    step: LeaveStep;
    isLast: boolean;
    colors: ThemeColors;
    scaledFont: (n: number) => number;
}) {
    const config = {
        approved: { color: colors.success, icon: '✅' },
        rejected: { color: colors.danger, icon: '❌' },
        pending: { color: colors.warning, icon: '⏳' },
        skipped: { color: colors.textSecondary, icon: '➖' },
    }[step.status];

    return (
        <View style={{ flexDirection: 'row' }}>
            <View style={{ alignItems: 'center', width: 28 }}>
                <Text style={{ fontSize: scaledFont(16), color: config.color }}>{config.icon}</Text>
                {!isLast && <View style={{ width: 2, flex: 1, backgroundColor: colors.border, marginVertical: 2 }} />}
            </View>

            <View style={{ flex: 1, paddingBottom: 16 }}>
                <Text style={{ fontSize: scaledFont(13), fontWeight: '600', color: config.color }}>{step.name}</Text>
                {step.resolved_by && <Text style={{ fontSize: scaledFont(11), color: colors.textSecondary, marginTop: 1 }}>Par {step.resolved_by}</Text>}
                {step.acted_at && <Text style={{ fontSize: scaledFont(11), color: colors.textSecondary, marginTop: 1 }}>{step.acted_at}</Text>}
                {step.comments && <Text style={{ fontSize: scaledFont(12), color: colors.text, marginTop: 4, fontStyle: 'italic' }}>{step.comments}</Text>}
            </View>
        </View>
    );
}

function createStyles(colors: ThemeColors, scaledFont: (n: number) => number) {
    return StyleSheet.create({
        container: { padding: 20, paddingBottom: 40 },
        centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
        section: {
            backgroundColor: colors.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 16,
            marginBottom: 16,
        },
        leaveType: { fontSize: scaledFont(17), fontWeight: '700', color: colors.primary },
        dates: { fontSize: scaledFont(14), color: colors.text, marginTop: 4 },
        datesSecondary: { fontSize: scaledFont(13), color: colors.textSecondary, marginTop: 2 },
        reasonLabel: { fontSize: scaledFont(12), fontWeight: '600', color: colors.textSecondary, marginTop: 12 },
        reasonValue: { fontSize: scaledFont(14), color: colors.text, marginTop: 2 },
        rejectedBox: { backgroundColor: colors.surface, borderColor: colors.danger },
        rejectedTitle: { fontSize: scaledFont(14), fontWeight: '700', color: colors.danger },
        rejectedReason: { fontSize: scaledFont(13), color: colors.text, marginTop: 6 },
        approvedBox: { backgroundColor: colors.surface, borderColor: colors.success },
        approvedTitle: { fontSize: scaledFont(14), fontWeight: '700', color: colors.success },
        returnStatus: { fontSize: scaledFont(13), color: colors.text, marginTop: 6 },
        sectionTitle: { fontSize: scaledFont(14), fontWeight: '700', color: colors.primary, marginBottom: 12 },
    });
}