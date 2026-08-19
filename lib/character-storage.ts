import AsyncStorage from "@react-native-async-storage/async-storage";

import { GAME_CHARACTERS, type GameCharacter } from "@/lib/characters";

const CHARACTER_KEY = "worldquest.selected-character";

export async function hasSelectedCharacter(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(CHARACTER_KEY)) !== null;
  } catch {
    return false;
  }
}

export async function loadSelectedCharacter(): Promise<GameCharacter> {
  try {
    const raw = await AsyncStorage.getItem(CHARACTER_KEY);
    if (!raw) return GAME_CHARACTERS[0];
    const saved = JSON.parse(raw) as Partial<GameCharacter>;
    return GAME_CHARACTERS.find((character) => character.id === saved.id) ?? GAME_CHARACTERS[0];
  } catch {
    return GAME_CHARACTERS[0];
  }
}

export async function saveSelectedCharacter(character: GameCharacter): Promise<void> {
  await AsyncStorage.setItem(CHARACTER_KEY, JSON.stringify({ id: character.id }));
}

export async function clearSelectedCharacter(): Promise<void> {
  await AsyncStorage.removeItem(CHARACTER_KEY);
}
