import React, { createContext, useContext, useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { apiClient } from '../api/client';
import {
    NetworkConfig,
    loadNetworkConfig,
    saveNetworkConfig,
    buildBaseUrl,
    buildDisplayAddress,
} from '../config/networkConfig';

interface NetworkConfigContextValue {
    config: NetworkConfig;
    displayAddress: string;
    updateConfig: (config: NetworkConfig) => Promise<void>;
}

const NetworkConfigContext = createContext<NetworkConfigContextValue | null>(null);

export function NetworkConfigProvider({ children }: { children: React.ReactNode }) {
    const [config, setConfig] = useState<NetworkConfig | null>(null);

    useEffect(() => {
        (async () => {
            const loaded = await loadNetworkConfig();
            apiClient.defaults.baseURL = buildBaseUrl(loaded);
            setConfig(loaded);
        })();
    }, []);

    async function updateConfig(newConfig: NetworkConfig) {
        await saveNetworkConfig(newConfig);
        apiClient.defaults.baseURL = buildBaseUrl(newConfig);
        setConfig(newConfig);
    }

    if (!config) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color="#1e3a5f" />
            </View>
        );
    }

    return (
        <NetworkConfigContext.Provider
            value={{ config, displayAddress: buildDisplayAddress(config), updateConfig }}
        >
            {children}
        </NetworkConfigContext.Provider>
    );
}

export function useNetworkConfig(): NetworkConfigContextValue {
    const ctx = useContext(NetworkConfigContext);
    if (!ctx) throw new Error('useNetworkConfig doit être utilisé dans un NetworkConfigProvider');
    return ctx;
}

const styles = StyleSheet.create({
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
});