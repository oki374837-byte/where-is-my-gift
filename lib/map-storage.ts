import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_GAME_MAP, DEFAULT_REALITY_MODE, type GameMapId, type RealityMode } from "@/lib/map-worlds";

type AccountScope = number | string | null | undefined;

const BASE_MAP_KEY = "worldquest.selected-map";
const BASE_MODE_KEY = "worldquest.reality-mode";
const BASE_ONBOARDING_KEY = "worldquest.map-character-onboarding-complete";

function scopedKey(base: string, scope: AccountScope) {
  return `${base}.${scope == null ? "guest" : String(scope)}`;
}

async function readScoped(base: string, scope: AccountScope) {
  const key = scopedKey(base, scope);
  const scopedValue = await AsyncStorage.getItem(key);
  if (scopedValue !== null || scope != null) return scopedValue;
  const legacyValue = await AsyncStorage.getItem(base);
  if (legacyValue !== null) await AsyncStorage.setItem(key, legacyValue);
  return legacyValue;
}

export async function loadSelectedMap(scope?: AccountScope): Promise<GameMapId> {
  const value = await readScoped(BASE_MAP_KEY, scope);
  return value === "jeddah" || value === "makkah" || value === "riyadh" ? value : DEFAULT_GAME_MAP;
}

export async function saveSelectedMap(mapId: GameMapId, scope?: AccountScope): Promise<void> {
  await AsyncStorage.setItem(scopedKey(BASE_MAP_KEY, scope), mapId);
}

export async function loadRealityMode(scope?: AccountScope): Promise<RealityMode> {
  const value = await readScoped(BASE_MODE_KEY, scope);
  return value === "game-world" ? "game-world" : DEFAULT_REALITY_MODE;
}

export async function saveRealityMode(mode: RealityMode, scope?: AccountScope): Promise<void> {
  await AsyncStorage.setItem(scopedKey(BASE_MODE_KEY, scope), mode);
}

export async function hasCompletedMapCharacterOnboarding(scope?: AccountScope): Promise<boolean> {
  return (await readScoped(BASE_ONBOARDING_KEY, scope)) === "true";
}

export async function completeMapCharacterOnboarding(scope?: AccountScope): Promise<void> {
  await AsyncStorage.setItem(scopedKey(BASE_ONBOARDING_KEY, scope), "true");
}

export async function resetMapCharacterOnboarding(scope?: AccountScope): Promise<void> {
  await AsyncStorage.multiRemove([
    scopedKey(BASE_MAP_KEY, scope),
    scopedKey(BASE_MODE_KEY, scope),
    scopedKey(BASE_ONBOARDING_KEY, scope),
  ]);
}
