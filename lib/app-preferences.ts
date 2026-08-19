import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemePreference = "system" | "light" | "dark";
export type AppPreferences = {
  soundEnabled: boolean;
  musicEnabled: boolean;
  hapticsEnabled: boolean;
  notificationsEnabled: boolean;
  cameraEnabled: boolean;
  arLabelsEnabled: boolean;
  theme: ThemePreference;
  language: "ar" | "en";
};

export const DEFAULT_PREFERENCES: AppPreferences = {
  soundEnabled: true,
  musicEnabled: true,
  hapticsEnabled: true,
  notificationsEnabled: false,
  cameraEnabled: true,
  arLabelsEnabled: true,
  theme: "system",
  language: "ar",
};

const KEY = "worldquest.preferences";

export function mergePreferences(patch: Partial<AppPreferences>, base: AppPreferences = DEFAULT_PREFERENCES): AppPreferences {
  return { ...base, ...patch };
}

export async function loadPreferences(): Promise<AppPreferences> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return mergePreferences(JSON.parse(raw) as Partial<AppPreferences>);
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function savePreferences(patch: Partial<AppPreferences>): Promise<AppPreferences> {
  const next = mergePreferences(patch, await loadPreferences());
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export async function clearLocalPreferences(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
