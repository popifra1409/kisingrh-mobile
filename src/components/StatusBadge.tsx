import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';

type Status = 'pending' | 'validated' | 'rejected';

function getColors(status: Status, isDark: boolean) {
    const palette = {
        pending: isDark ? { bg: '#78350f', text: '#fde68a' } : { bg: '#fef3c7', text: '#92400e' },
        validated: isDark ? { bg: '#064e3b', text: '#a7f3d0' } : { bg: '#d1fae5', text: '#065f46' },
        rejected: isDark ? { bg: '#7f1d1d', text: '#fecaca' } : { bg: '#fee2e2', text: '#991b1b' },
    };
    return palette[status] ?? palette.pending;
}

export default function StatusBadge({ status, label }: { status: Status; label: string }) {
    const { resolvedScheme, scaledFont } = useAppTheme();
    const colors = getColors(status, resolvedScheme === 'dark');

    return (
        <View style={[styles.badge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.text, { color: colors.text, fontSize: scaledFont(11) }]}>{label}</Text>
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
    text: { fontWeight: '600' },
});