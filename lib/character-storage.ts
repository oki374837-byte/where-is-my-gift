import AsyncStorage from "@react-native-async-storage/async-storage";

import { GAME_CHARACTERS, type GameCharacter } from "@/lib/characters";

const BASE_CHARACTER_KEY = "worldquest.selected-character";

type AccountScope = number | string | null | undefined;

function characterKey(scope: AccountScope) {
  return `${BASE_CHARACTER_KEY}.${scope == null ? "guest" : String(scope)}`;
}

export async function hasSelectedCharacter(scope?: AccountScope): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(characterKey(scope))) !== null;
  } catch {
    return false;
  }
}

export async function loadSelectedCharacter(scope?: AccountScope): Promise<GameCharacter> {
  try {
    const scopedKey = characterKey(scope);
    let raw = await AsyncStorage.getItem(scopedKey);
    if (!raw && scope == null) {
      raw = await AsyncStorage.getItem(BASE_CHARACTER_KEY);
      if (raw) await AsyncStorage.setItem(scopedKey, raw);
    }
    if (!raw) return GAME_CHARACTERS[0];
    const saved = JSON.parse(raw) as Partial<GameCharacter>;
    return GAME_CHARACTERS.find((character) => character.id === saved.id) ?? GAME_CHARACTERS[0];
  } catch {
    return GAME_CHARACTERS[0];
  }
}

export async function saveSelectedCharacter(character: GameCharacter, scope?: AccountScope): Promise<void> {
  await AsyncStorage.setItem(characterKey(scope), JSON.stringify({ id: character.id }));
}

export async function clearSelectedCharacter(scope?: AccountScope): Promise<void> {
  await AsyncStorage.removeItem(characterKey(scope));
}
