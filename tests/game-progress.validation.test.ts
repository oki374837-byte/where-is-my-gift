import { describe, expect, it } from "vitest";
import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";

function createContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "validation-user",
      email: "validation@example.com",
      name: "Validation User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", hostname: "example.com", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const baseProgress = {
  xp: 100,
  coins: 20,
  distanceWalkedMeters: 0,
  visitedCount: 0,
  playTimeSeconds: 0,
};

describe("game.saveProgress validation", () => {
  it("rejects duplicate collected point ids", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.game.saveProgress({
      ...baseProgress,
      collectedIds: ["riyadh-point-1", "riyadh-point-1"],
      inventory: {},
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects inventory above the local capacity", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.game.saveProgress({
      ...baseProgress,
      collectedIds: [],
      inventory: { crystal: 41 },
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
