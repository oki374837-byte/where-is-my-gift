import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  acceptFriendRequest,
  getDirectMessages,
  getFriendRequests,
  getFriends,
  getGameWorldState,
  getLeaderboard,
  getPlayerProgress,
  getSocialProfile,
  requestFriend,
  sendDirectMessage,
  updatePlayerPresence,
  upsertGameWorldState,
  upsertPlayerProgress,
} from "./db";
import { z } from "zod";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  social: router({
    profile: protectedProcedure.query(({ ctx }) => getSocialProfile(ctx.user.id)),
    friends: protectedProcedure.query(({ ctx }) => getFriends(ctx.user.id)),
    requests: protectedProcedure.query(({ ctx }) => getFriendRequests(ctx.user.id)),
    requestFriend: protectedProcedure
      .input(z.object({ friendCode: z.string().trim().min(4).max(32) }))
      .mutation(({ ctx, input }) => requestFriend(ctx.user.id, input.friendCode)),
    acceptRequest: protectedProcedure
      .input(z.object({ friendshipId: z.number().int().positive() }))
      .mutation(({ ctx, input }) => acceptFriendRequest(ctx.user.id, input.friendshipId)),
    messages: protectedProcedure
      .input(z.object({ friendId: z.number().int().positive() }))
      .query(({ ctx, input }) => getDirectMessages(ctx.user.id, input.friendId)),
    sendMessage: protectedProcedure
      .input(z.object({ friendId: z.number().int().positive(), text: z.string().trim().min(1).max(500) }))
      .mutation(({ ctx, input }) => sendDirectMessage(ctx.user.id, input.friendId, input.text)),
    updatePresence: protectedProcedure
      .input(z.object({ latitude: z.number(), longitude: z.number(), status: z.enum(["online", "exploring", "offline"]), avatarEmoji: z.string().max(16) }))
      .mutation(({ ctx, input }) => updatePlayerPresence(ctx.user.id, input.latitude, input.longitude, input.status, input.avatarEmoji)),
  }),

  world: router({
    state: protectedProcedure.query(({ ctx }) => getGameWorldState(ctx.user.id)),
    syncState: protectedProcedure
      .input(z.object({
        mapId: z.string().min(1).max(32),
        realityMode: z.enum(["real-world", "game-world"]),
        city: z.string().min(1).max(80),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      }))
      .mutation(({ ctx, input }) => upsertGameWorldState({ userId: ctx.user.id, ...input })),
  }),

  game: router({
    leaderboard: protectedProcedure.query(async () => getLeaderboard()),
    getProgress: protectedProcedure.query(async ({ ctx }) => {
      const progress = await getPlayerProgress(ctx.user.id);
      return progress ?? null;
    }),
    saveProgress: protectedProcedure
      .input(z.object({
        xp: z.number().int().min(0),
        coins: z.number().int().min(0),
        collectedIds: z.array(z.string()).max(500),
        inventory: z.record(z.string(), z.number().int().min(0)),
        distanceWalkedMeters: z.number().int().min(0),
        visitedCount: z.number().int().min(0),
        playTimeSeconds: z.number().int().min(0),
      }))
      .mutation(async ({ ctx, input }) => {
        await upsertPlayerProgress({ userId: ctx.user.id, ...input });
        return { success: true } as const;
      }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
