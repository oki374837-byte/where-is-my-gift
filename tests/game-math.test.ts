import { describe, expect, it } from "vitest";
import { distanceInMeters, rewardForCollection } from "../lib/game-math";

describe("game math", () => {
  it("returns zero for identical coordinates", () => {
    expect(distanceInMeters({ latitude: 24, longitude: 46 }, { latitude: 24, longitude: 46 })).toBe(0);
  });

  it("calculates a realistic short distance", () => {
    const distance = distanceInMeters({ latitude: 24.7136, longitude: 46.6753 }, { latitude: 24.7146, longitude: 46.6753 });
    expect(distance).toBeGreaterThan(100);
    expect(distance).toBeLessThan(120);
  });

  it("adds the collection reward", () => {
    expect(rewardForCollection(240, 85)).toEqual({ xp: 280, coins: 100 });
  });
});
