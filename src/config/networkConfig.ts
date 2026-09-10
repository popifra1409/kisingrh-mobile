import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL as DEFAULT_API_BASE_URL } from './env';

const CONFIG_KEY = '@kisingrh/network_config';
const HISTORY_KEY = '@kisingrh/network_history';
const MAX_HISTORY = 5;

export interface NetworkConfig {
    protocol: 'http' | 'https';
    host: string;
    port: string;
}

function parseDefault(): NetworkConfig {
    try {
        const url = new URL(DEFAULT_API_BASE_URL);
        return {
            protocol: url.protocol.replace(':', '') as 'http' | 'https',
            host: url.hostname,
            port: url.port || '80',
        };
    } catch {
        return { protocol: 'http', host: '192.168.1.42', port: '8000' };
    }
}

export const DEFAULT_CONFIG: NetworkConfig = parseDefault();

export function buildBaseUrl(config: NetworkConfig): string {
    return `${config.protocol}://${config.host}:${config.port}/api`;
}

export function buildDisplayAddress(config: NetworkConfig): string {
    return `${config.host}:${config.port}`;
}

export async function loadNetworkConfig(): Promise<NetworkConfig> {
    try {
        const raw = await AsyncStorage.getItem(CONFIG_KEY);
        if (raw) return JSON.parse(raw);
    } catch {
        // ignore, on retombe sur la valeur par défaut
    }
    return DEFAULT_CONFIG;
}

export async function saveNetworkConfig(config: NetworkConfig): Promise<void> {
    await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    await pushToHistory(buildDisplayAddress(config));
}

export async function loadHistory(): Promise<string[]> {
    try {
        const raw = await AsyncStorage.getItem(HISTORY_KEY);
        if (raw) return JSON.parse(raw);
    } catch {
        // ignore
    }
    return [];
}

async function pushToHistory(address: string): Promise<void> {
    const history = await loadHistory();
    const updated = [address, ...history.filter((a) => a !== address)].slice(0, MAX_HISTORY);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export function parseSimpleAddress(input: string): NetworkConfig {
    const trimmed = input.trim();

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        try {
            const url = new URL(trimmed);
            return {
                protocol: url.protocol.replace(':', '') as 'http' | 'https',
                host: url.hostname,
                port: url.port || '80',
            };
        } catch {
            // continue vers le parsing simple ci-dessous
        }
    }

    const [host, port] = trimmed.split(':');
    return { protocol: 'http', host: host || DEFAULT_CONFIG.host, port: port || '8000' };
}

export async function testConnection(config: NetworkConfig): Promise<{ ok: boolean; message: string }> {
    const url = buildBaseUrl(config) + '/app-info';

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (response.ok) {
            return { ok: true, message: 'Connexion réussie ✅' };
        }
        return { ok: false, message: `Le serveur a répondu avec une erreur (${response.status}).` };
    } catch (error) {
        return { ok: false, message: "Impossible de joindre ce serveur. Vérifiez l'adresse et le réseau." };
    }
}