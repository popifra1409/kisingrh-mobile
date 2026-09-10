import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';
export type FontSize = 'small' | 'medium' | 'large';

const THEME_KEY = '@kisingrh/theme_mode';
const FONT_KEY = '@kisingrh/font_size';

const FONT_SCALES: Record<FontSize, number> = {
    small: 0.9,
    medium: 1,
    large: 1.15,
};

export interface ThemeColors {
    background: string;
    surface: string;
    card: string;
    border: string;
    text: string;
    textSecondary: string;
    primary: string;
    primaryText: string;
    danger: string;
    success: string;
    warning: string;
}

const LIGHT_COLORS: ThemeColors = {
    background: '#ffffff',
    surface: '#f9fafb',
    card: '#f3f4f6',
    border: '#e5e7eb',
    text: '#111827',
    textSecondary: '#6b7280',
    primary: '#1e3a5f',
    primaryText: '#ffffff',
    danger: '#dc2626',
    success: '#059669',
    warning: '#d97706',
};

const DARK_COLORS: ThemeColors = {
    background: '#111827',
    surface: '#1f2937',
    card: '#1f2937',
    border: '#374151',
    text: '#f9fafb',
    textSecondary: '#9ca3af',
    primary: '#3b82f6',
    primaryText: '#ffffff',
    danger: '#f87171',
    success: '#34d399',
    warning: '#fbbf24',
};

interface ThemeContextValue {
    mode: ThemeMode;
    resolvedScheme: 'light' | 'dark';
    colors: ThemeColors;
    fontSize: FontSize;
    fontScale: number;
    setMode: (mode: ThemeMode) => void;
    setFontSize: (size: FontSize) => void;
    scaledFont: (base: number) => number;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemScheme = useColorScheme();
    const [mode, setModeState] = useState<ThemeMode>('system');
    const [fontSize, setFontSizeState] = useState<FontSize>('medium');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        (async () => {
            const [savedMode, savedFont] = await Promise.all([
                AsyncStorage.getItem(THEME_KEY),
                AsyncStorage.getItem(FONT_KEY),
            ]);
            if (savedMode) setModeState(savedMode as ThemeMode);
            if (savedFont) setFontSizeState(savedFont as FontSize);
            setIsLoaded(true);
        })();
    }, []);

    function setMode(newMode: ThemeMode) {
        setModeState(newMode);
        AsyncStorage.setItem(THEME_KEY, newMode);
    }

    function setFontSize(newSize: FontSize) {
        setFontSizeState(newSize);
        AsyncStorage.setItem(FONT_KEY, newSize);
    }

    const resolvedScheme: 'light' | 'dark' =
        mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;

    const colors = resolvedScheme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
    const fontScale = FONT_SCALES[fontSize];

    if (!isLoaded) return null;

    return (
        <ThemeContext.Provider
            value={{
                mode,
                resolvedScheme,
                colors,
                fontSize,
                fontScale,
                setMode,
                setFontSize,
                scaledFont: (base: number) => Math.round(base * fontScale),
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useAppTheme(): ThemeContextValue {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useAppTheme doit être utilisé dans un ThemeProvider');
    return ctx;
}