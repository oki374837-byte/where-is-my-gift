import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, string>();

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async (key: string) => store.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => { store.set(key, value); }),
    multiRemove: vi.fn(async (keys: string[]) => { keys.forEach((key) => store.delete(key)); }),
  },
}));

import { GAME_CHARACTERS } from "../lib/characters";
import { hasSelectedCharacter, loadSelectedCharacter, saveSelectedCharacter } from "../lib/character-storage";
import { completeMapCharacterOnboarding, hasCompletedMapCharacterOnboarding, loadRealityMode, loadSelectedMap, saveRealityMode, saveSelectedMap } from "../lib/map-storage";
import { DEFAULT_REALITY_MODE } from "../lib/map-worlds";

describe("account-scoped local storage", () => {
  beforeEach(() => store.clear());

  it("keeps character choices separate for guest and authenticated accounts", async () => {
    await saveSelectedCharacter(GAME_CHARACTERS[1]!, "account-a");
    await saveSelectedCharacter(GAME_CHARACTERS[2]!, "account-b");

    expect((await loadSelectedCharacter("account-a")).id).toBe(GAME_CHARACTERS[1]!.id);
    expect((await loadSelectedCharacter("account-b")).id).toBe(GAME_CHARACTERS[2]!.id);
    expect(await hasSelectedCharacter(null)).toBe(false);
  });

  it("keeps map, AR mode, and onboarding separate per account", async () => {
    await saveSelectedMap("riyadh", "account-a");
    await saveRealityMode("game-world", "account-a");
    await completeMapCharacterOnboarding("account-a");
    await saveSelectedMap("jeddah", "account-b");

    expect(await loadSelectedMap("account-a")).toBe("riyadh");
    expect(await loadRealityMode("account-a")).toBe("game-world");
    expect(await hasCompletedMapCharacterOnboarding("account-a")).toBe(true);
    expect(await loadSelectedMap("account-b")).toBe("jeddah");
    expect(await loadRealityMode("account-b")).toBe(DEFAULT_REALITY_MODE);
    expect(await hasCompletedMapCharacterOnboarding("account-b")).toBe(false);
  });
});
