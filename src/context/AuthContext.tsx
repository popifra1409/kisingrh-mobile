import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_STORAGE_KEY } from '../api/client';
import {
  activateAccount,
  login as loginRequest,
  logout as logoutRequest,
  fetchMe,
  ActivatePayload,
  LoginPayload,
  AuthUser,
} from '../api/auth';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  activate: (payload: ActivatePayload) => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
        if (token) {
          const { user: fetchedUser } = await fetchMe();
          setUser(fetchedUser);
        }
      } catch {
        await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function persistSession(token: string, authUser: AuthUser) {
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
    setUser(authUser);
  }

  async function activate(payload: ActivatePayload) {
    const response = await activateAccount(payload);
    await persistSession(response.token, response.user);
  }

  async function login(payload: LoginPayload) {
    const response = await loginRequest(payload);
    await persistSession(response.token, response.user);
  }

  async function logout() {
    try {
      await logoutRequest();
    } catch {
      // Même si la révocation serveur échoue (ex: hors ligne), on nettoie localement.
    } finally {
      await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
      setUser(null);
    }
  }

  async function refreshUser() {
    const { user: fetchedUser } = await fetchMe();
    setUser(fetchedUser);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      activate,
      login,
      logout,
      refreshUser,
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth() doit être utilisé à l'intérieur de <AuthProvider>");
  }
  return context;
}
