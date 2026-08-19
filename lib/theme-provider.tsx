import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Appearance, View, useColorScheme as useSystemColorScheme } from "react-native";
import { colorScheme as nativewindColorScheme, vars } from "nativewind";

import { SchemeColors, type ColorScheme } from "@/constants/theme";
import { loadPreferences, savePreferences, type ThemePreference } from "@/lib/app-preferences";

type ThemeContextValue = {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  setThemePreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme() ?? "light";
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(systemScheme);
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>("system");
  const [preferenceLoaded, setPreferenceLoaded] = useState(false);

  const applyScheme = useCallback((scheme: ColorScheme) => {
    nativewindColorScheme.set(scheme);
    Appearance.setColorScheme?.(scheme);
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.dataset.theme = scheme;
      root.classList.toggle("dark", scheme === "dark");
      const palette = SchemeColors[scheme];
      Object.entries(palette).forEach(([token, value]) => {
        root.style.setProperty(`--color-${token}`, value);
      });
    }
  }, []);

  const setColorScheme = useCallback((scheme: ColorScheme) => {
    setThemePreferenceState(scheme);
    setColorSchemeState(scheme);
    applyScheme(scheme);
    void savePreferences({ theme: scheme });
  }, [applyScheme]);

  const setThemePreference = useCallback((preference: ThemePreference) => {
    const nextScheme = preference === "system" ? systemScheme : preference;
    setThemePreferenceState(preference);
    setColorSchemeState(nextScheme);
    applyScheme(nextScheme);
    void savePreferences({ theme: preference });
  }, [applyScheme, systemScheme]);

  useEffect(() => {
    void loadPreferences().then((preferences) => {
      setThemePreferenceState(preferences.theme);
      setColorSchemeState(preferences.theme === "system" ? systemScheme : preferences.theme);
      setPreferenceLoaded(true);
    });
  }, [systemScheme]);

  useEffect(() => {
    if (themePreference === "system") setColorSchemeState(systemScheme);
  }, [systemScheme, themePreference]);

  useEffect(() => {
    if (preferenceLoaded) applyScheme(colorScheme);
  }, [applyScheme, colorScheme, preferenceLoaded]);

  const themeVariables = useMemo(
    () =>
      vars({
        "color-primary": SchemeColors[colorScheme].primary,
        "color-background": SchemeColors[colorScheme].background,
        "color-surface": SchemeColors[colorScheme].surface,
        "color-foreground": SchemeColors[colorScheme].foreground,
        "color-muted": SchemeColors[colorScheme].muted,
        "color-border": SchemeColors[colorScheme].border,
        "color-success": SchemeColors[colorScheme].success,
        "color-warning": SchemeColors[colorScheme].warning,
        "color-error": SchemeColors[colorScheme].error,
      }),
    [colorScheme],
  );

  const value = useMemo(
    () => ({
      colorScheme,
      setColorScheme,
      setThemePreference,
    }),
    [colorScheme, setColorScheme, setThemePreference],
  );
  return (
    <ThemeContext.Provider value={value}>
      <View style={[{ flex: 1 }, themeVariables]}>{children}</View>
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeContext must be used within ThemeProvider");
  }
  return ctx;
}
