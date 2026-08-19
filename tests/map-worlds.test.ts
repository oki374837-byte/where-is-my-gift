import { describe, expect, it } from "vitest";

import { DEFAULT_REALITY_MODE, GAME_MAPS, getGameMap } from "../lib/map-worlds";

describe("bundled Saudi game maps", () => {
  it("ships Riyadh, Jeddah, and Makkah content locally", () => {
    expect(GAME_MAPS.map((map) => map.id)).toEqual(["riyadh", "jeddah", "makkah"]);
    for (const map of GAME_MAPS) {
      expect(map.points.length).toBeGreaterThanOrEqual(6);
      expect(map.landmarks.length).toBeGreaterThanOrEqual(3);
      expect(map.points.every((point) => point.id && point.title && point.rewardXp && point.rewardCoins)).toBe(true);
    }
  });

  it("starts offline-first in the playable game world", () => {
    expect(DEFAULT_REALITY_MODE).toBe("game-world");
    expect(getGameMap("riyadh").city).toBe("الرياض");
  });
});
