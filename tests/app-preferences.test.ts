import { describe, expect, it } from "vitest";
import { DEFAULT_PREFERENCES, mergePreferences } from "../lib/app-preferences";

describe("app preferences", () => {
  it("uses the documented defaults", () => {
    expect(DEFAULT_PREFERENCES.theme).toBe("system");
    expect(DEFAULT_PREFERENCES.language).toBe("ar");
    expect(DEFAULT_PREFERENCES.hapticsEnabled).toBe(true);
  });

  it("updates only the requested preference", () => {
    const next = mergePreferences({ soundEnabled: false, theme: "dark" });
    expect(next.soundEnabled).toBe(false);
    expect(next.theme).toBe("dark");
    expect(next.musicEnabled).toBe(true);
    expect(next.language).toBe("ar");
  });

  it("merges persisted partial values with an existing base", () => {
    const base = { ...DEFAULT_PREFERENCES, language: "en" as const, cameraEnabled: false };
    const next = mergePreferences({ cameraEnabled: true }, base);
    expect(next.language).toBe("en");
    expect(next.cameraEnabled).toBe(true);
  });
});
