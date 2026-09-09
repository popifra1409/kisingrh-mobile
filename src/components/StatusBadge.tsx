import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Status = 'pending' | 'validated' | 'rejected';

const COLORS: Record<Status, { bg: string; text: string }> = {
    pending: { bg: '#fef3c7', text: '#92400e' },
    validated: { bg: '#d1fae5', text: '#065f46' },
    rejected: { bg: '#fee2e2', text: '#991b1b' },
};

export default function StatusBadge({ status, label }: { status: Status; label: string }) {
    const colors = COLORS[status] ?? COLORS.pending;

    return (
        <View style={[styles.badge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    text: { fontSize: 11, fontWeight: '600' },
});