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
import { useNetworkConfig } from '../context/NetworkConfigContext';
import { useAppTheme, ThemeMode, FontSize } from '../context/ThemeContext';
import { parseSimpleAddress, testConnection, loadHistory } from '../config/networkConfig';
import { getQueue, QueueItem } from '../offline/queue';
import { processQueue } from '../offline/sync';

export default function SettingsScreen() {
    const { config, displayAddress, updateConfig } = useNetworkConfig();
    const { mode, setMode, fontSize, setFontSize, colors, scaledFont } = useAppTheme();

    const [isAdvanced, setIsAdvanced] = useState(false);
    const [simpleAddress, setSimpleAddress] = useState(displayAddress);
    const [protocol, setProtocol] = useState(config.protocol);
    const [host, setHost] = useState(config.host);
    const [port, setPort] = useState(config.port);
    const [history, setHistory] = useState<string[]>([]);

    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        loadHistory().then(setHistory);
        refreshQueue();
    }, []);

    async function refreshQueue() {
        setQueue(await getQueue());
    }

    function currentConfigFromForm() {
        return isAdvanced ? { protocol, host, port } : parseSimpleAddress(simpleAddress);
    }

    async function handleTest() {
        setTestResult(null);
        setIsTesting(true);
        const result = await testConnection(currentConfigFromForm());
        setTestResult(result);
        setIsTesting(false);
    }

    async function handleSave() {
        setIsSaving(true);
        try {
            await updateConfig(currentConfigFromForm());
            Alert.alert('Enregistré', "L'adresse du serveur a été mise à jour.");
        } finally {
            setIsSaving(false);
        }
    }

    async function handleSync() {
        setIsSyncing(true);
        const result = await processQueue();
        await refreshQueue();
        setIsSyncing(false);

        if (result.total === 0) {
            Alert.alert('Rien à synchroniser', 'Aucune action en attente.');
        } else {
            Alert.alert(
                'Synchronisation terminée',
                `${result.succeeded} réussie(s), ${result.failed} échouée(s) sur ${result.total}.`
            );
        }
    }

    const styles = createStyles(colors, scaledFont);

    return (
        <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
            <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Serveur</Text>
                    <View style={styles.modeSwitch}>
                        <Text style={styles.modeSwitchLabel}>Avancé</Text>
                        <Switch value={isAdvanced} onValueChange={setIsAdvanced} />
                    </View>
                </View>

                <Text style={styles.currentValue}>Actuellement : {displayAddress}</Text>

                {isAdvanced ? (
                    <>
                        <View style={styles.chipsRow}>
                            {(['http', 'https'] as const).map((p) => (
                                <TouchableOpacity
                                    key={p}
                                    style={[styles.chip, protocol === p && styles.chipActive]}
                                    onPress={() => setProtocol(p)}
                                >
                                    <Text style={[styles.chipText, protocol === p && styles.chipTextActive]}>{p.toUpperCase()}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Field label="Adresse IP / Hôte" value={host} onChangeText={setHost} colors={colors} scaledFont={scaledFont} />
                        <Field label="Port" value={port} onChangeText={setPort} keyboardType="number-pad" colors={colors} scaledFont={scaledFont} />
                    </>
                ) : (
                    <Field
                        label="Adresse du serveur (IP:port)"
                        value={simpleAddress}
                        onChangeText={setSimpleAddress}
                        placeholder="192.168.1.42:8000"
                        colors={colors}
                        scaledFont={scaledFont}
                    />
                )}

                {history.length > 0 && (
                    <View style={styles.historyRow}>
                        <Text style={styles.historyLabel}>Récentes :</Text>
                        {history.map((addr) => (
                            <TouchableOpacity
                                key={addr}
                                style={styles.historyChip}
                                onPress={() => (isAdvanced ? setHost(addr.split(':')[0]) : setSimpleAddress(addr))}
                            >
                                <Text style={styles.historyChipText}>{addr}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {testResult && (
                    <Text style={[styles.testResult, { color: testResult.ok ? colors.success : colors.danger }]}>
                        {testResult.message}
                    </Text>
                )}

                <View style={styles.buttonsRow}>
                    <TouchableOpacity style={styles.secondaryButton} onPress={handleTest} disabled={isTesting}>
                        {isTesting ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.secondaryButtonText}>Tester</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.primaryButton} onPress={handleSave} disabled={isSaving}>
                        {isSaving ? <ActivityIndicator color={colors.primaryText} /> : <Text style={styles.primaryButtonText}>Enregistrer</Text>}
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Synchronisation</Text>
                <Text style={styles.helperText}>
                    {queue.length === 0
                        ? 'Rien en attente — tout est synchronisé.'
                        : `${queue.length} action(s) en attente d'envoi (enregistrée(s) hors-ligne).`}
                </Text>

                {queue.filter((q) => q.status === 'failed').length > 0 && (
                    <Text style={[styles.helperText, { color: colors.danger }]}>
                        {queue.filter((q) => q.status === 'failed').length} action(s) ont échoué au dernier essai — nouvel essai à la prochaine synchronisation.
                    </Text>
                )}

                <TouchableOpacity style={styles.primaryButton} onPress={handleSync} disabled={isSyncing}>
                    {isSyncing ? <ActivityIndicator color={colors.primaryText} /> : <Text style={styles.primaryButtonText}>Synchroniser maintenant</Text>}
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Apparence</Text>

                <Text style={styles.fieldLabel}>Thème</Text>
                <View style={styles.chipsRow}>
                    {([
                        { value: 'light', label: 'Clair' },
                        { value: 'dark', label: 'Sombre' },
                        { value: 'system', label: 'Système' },
                    ] as { value: ThemeMode; label: string }[]).map((option) => (
                        <TouchableOpacity
                            key={option.value}
                            style={[styles.chip, mode === option.value && styles.chipActive]}
                            onPress={() => setMode(option.value)}
                        >
                            <Text style={[styles.chipText, mode === option.value && styles.chipTextActive]}>{option.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Taille du texte</Text>
                <View style={styles.chipsRow}>
                    {([
                        { value: 'small', label: 'Petite' },
                        { value: 'medium', label: 'Normale' },
                        { value: 'large', label: 'Grande' },
                    ] as { value: FontSize; label: string }[]).map((option) => (
                        <TouchableOpacity
                            key={option.value}
                            style={[styles.chip, fontSize === option.value && styles.chipActive]}
                            onPress={() => setFontSize(option.value)}
                        >
                            <Text style={[styles.chipText, fontSize === option.value && styles.chipTextActive]}>{option.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </ScrollView>
    );
}

function Field(props: {
    label: string;
    value: string;
    onChangeText: (v: string) => void;
    placeholder?: string;
    keyboardType?: 'default' | 'number-pad';
    colors: any;
    scaledFont: (n: number) => number;
}) {
    return (
        <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: props.scaledFont(12), fontWeight: '600', color: props.colors.textSecondary, marginBottom: 4 }}>
                {props.label}
            </Text>
            <TextInput
                style={{
                    borderWidth: 1,
                    borderColor: props.colors.border,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: props.scaledFont(14),
                    color: props.colors.text,
                }}
                value={props.value}
                onChangeText={props.onChangeText}
                placeholder={props.placeholder}
                placeholderTextColor={props.colors.textSecondary}
                keyboardType={props.keyboardType ?? 'default'}
                autoCapitalize="none"
            />
        </View>
    );
}

function createStyles(colors: any, scaledFont: (n: number) => number) {
    return StyleSheet.create({
        container: { padding: 20, paddingBottom: 60 },
        section: {
            backgroundColor: colors.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 16,
            marginBottom: 16,
        },
        sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
        sectionTitle: { fontSize: scaledFont(15), fontWeight: '700', color: colors.primary },
        modeSwitch: { flexDirection: 'row', alignItems: 'center', gap: 8 },
        modeSwitchLabel: { fontSize: scaledFont(12), color: colors.textSecondary },
        currentValue: { fontSize: scaledFont(12), color: colors.textSecondary, marginBottom: 12 },
        fieldLabel: { fontSize: scaledFont(12), fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
        chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
        chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
        chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
        chipText: { fontSize: scaledFont(13), color: colors.text },
        chipTextActive: { color: colors.primaryText, fontWeight: '600' },
        historyRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 12 },
        historyLabel: { fontSize: scaledFont(12), color: colors.textSecondary, marginRight: 4 },
        historyChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: colors.card },
        historyChipText: { fontSize: scaledFont(11), color: colors.text },
        testResult: { fontSize: scaledFont(13), marginBottom: 10, textAlign: 'center' },
        buttonsRow: { flexDirection: 'row', gap: 10 },
        secondaryButton: {
            flex: 1,
            borderWidth: 1,
            borderColor: colors.primary,
            borderRadius: 8,
            paddingVertical: 12,
            alignItems: 'center',
        },
        secondaryButtonText: { color: colors.primary, fontWeight: '600', fontSize: scaledFont(14) },
        primaryButton: { flex: 1, backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
        primaryButtonText: { color: colors.primaryText, fontWeight: '700', fontSize: scaledFont(14) },
        helperText: { fontSize: scaledFont(13), color: colors.textSecondary, marginBottom: 12 },
    });
}