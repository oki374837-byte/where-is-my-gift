import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_GAME_MAP, DEFAULT_REALITY_MODE, type GameMapId, type RealityMode } from "@/lib/map-worlds";

const MAP_KEY = "worldquest.selected-map";
const MODE_KEY = "worldquest.reality-mode";
const ONBOARDING_KEY = "worldquest.map-character-onboarding-complete";

export async function loadSelectedMap(): Promise<GameMapId> {
  const value = await AsyncStorage.getItem(MAP_KEY);
  return value === "jeddah" || value === "makkah" || value === "riyadh" ? value : DEFAULT_GAME_MAP;
}

export async function saveSelectedMap(mapId: GameMapId): Promise<void> {
  await AsyncStorage.setItem(MAP_KEY, mapId);
}

export async function loadRealityMode(): Promise<RealityMode> {
  const value = await AsyncStorage.getItem(MODE_KEY);
  return value === "game-world" ? "game-world" : DEFAULT_REALITY_MODE;
}

export async function saveRealityMode(mode: RealityMode): Promise<void> {
  await AsyncStorage.setItem(MODE_KEY, mode);
}

export async function hasCompletedMapCharacterOnboarding(): Promise<boolean> {
  return (await AsyncStorage.getItem(ONBOARDING_KEY)) === "true";
}

export async function completeMapCharacterOnboarding(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, "true");
}

export async function resetMapCharacterOnboarding(): Promise<void> {
  await AsyncStorage.multiRemove([MAP_KEY, MODE_KEY, ONBOARDING_KEY]);
}
