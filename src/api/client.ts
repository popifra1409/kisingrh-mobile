import axios, { AxiosError, AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_TIMEOUT_MS } from '../config/env';

export const TOKEN_STORAGE_KEY = '@kisingrh/auth_token';

// ⚠️ Pas de baseURL ici : elle est définie dynamiquement au démarrage par
// NetworkConfigProvider (src/context/NetworkConfigContext.tsx), à partir de
// l'adresse enregistrée par l'utilisateur — voir Paramètres > Réseau.
export const apiClient: AxiosInstance = axios.create({
  timeout: API_TIMEOUT_MS,
  headers: {
    Accept: 'application/json',
  },
});

// Injecte automatiquement le token Sanctum sur chaque requête (s'il existe)
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Type d'erreur normalisé pour toute l'app : { message, errors? }
 * (correspond au format de réponse de l'API Laravel).
 */
export interface ApiErrorPayload {
  message: string;
  errors?: Record<string, string[]>;
}

export function extractApiError(error: unknown): ApiErrorPayload {
  if (axios.isAxiosError(error)) {
    const err = error as AxiosError<ApiErrorPayload>;
    if (err.response?.data) {
      return err.response.data;
    }
    if (err.code === 'ECONNABORTED') {
      return { message: "La requête a expiré. Vérifiez votre connexion réseau." };
    }
    if (!err.response) {
      return { message: "Impossible de joindre le serveur. Vérifiez l'URL de l'API et votre connexion réseau." };
    }
  }
  return { message: "Une erreur inattendue s'est produite." };
}