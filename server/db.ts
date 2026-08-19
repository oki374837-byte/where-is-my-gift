import { and, desc, eq, inArray, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  chatMessages,
  friendships,
  gameWorldState,
  InsertPlayerProgress,
  InsertUser,
  PlayerProgress,
  playerPresence,
  playerProgress,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getGameWorldState(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(gameWorldState).where(eq(gameWorldState.userId, userId)).limit(1);
  return result[0];
}

export async function upsertGameWorldState(input: {
  userId: number;
  mapId: string;
  realityMode: "real-world" | "game-world";
  city: string;
  latitude?: number;
  longitude?: number;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(gameWorldState).values({
    userId: input.userId,
    mapId: input.mapId,
    realityMode: input.realityMode,
    city: input.city,
    latitudeE6: input.latitude == null ? null : Math.round(input.latitude * 1_000_000),
    longitudeE6: input.longitude == null ? null : Math.round(input.longitude * 1_000_000),
    lastSyncAt: new Date(),
  }).onDuplicateKeyUpdate({
    set: {
      mapId: input.mapId,
      realityMode: input.realityMode,
      city: input.city,
      latitudeE6: input.latitude == null ? null : Math.round(input.latitude * 1_000_000),
      longitudeE6: input.longitude == null ? null : Math.round(input.longitude * 1_000_000),
      lastSyncAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

export async function getPlayerProgress(userId: number): Promise<PlayerProgress | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(playerProgress).where(eq(playerProgress.userId, userId)).limit(1);
  return result[0];
}

export async function getLeaderboard(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({
      userId: users.id,
      name: users.name,
      xp: playerProgress.xp,
      coins: playerProgress.coins,
      visitedCount: playerProgress.visitedCount,
    })
    .from(playerProgress)
    .innerJoin(users, eq(playerProgress.userId, users.id))
    .orderBy(desc(playerProgress.xp), desc(playerProgress.visitedCount))
    .limit(Math.max(1, Math.min(limit, 100)));
  return result.map((entry, index) => ({
    rank: index + 1,
    name: entry.name || "مستكشف مجهول",
    xp: entry.xp,
    coins: entry.coins,
    visitedCount: entry.visitedCount,
  }));
}

export async function upsertPlayerProgress(progress: InsertPlayerProgress): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(playerProgress).values(progress).onDuplicateKeyUpdate({
    set: {
      xp: progress.xp,
      coins: progress.coins,
      collectedIds: progress.collectedIds,
      inventory: progress.inventory,
      distanceWalkedMeters: progress.distanceWalkedMeters,
      visitedCount: progress.visitedCount,
      playTimeSeconds: progress.playTimeSeconds,
      updatedAt: new Date(),
    },
  });
}

export function getFriendCode(userId: number) {
  return `WQ-${String(userId).padStart(6, "0")}`;
}

async function getFriendshipBetween(userId: number, otherUserId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(friendships)
    .where(
      or(
        and(eq(friendships.requesterId, userId), eq(friendships.addresseeId, otherUserId)),
        and(eq(friendships.requesterId, otherUserId), eq(friendships.addresseeId, userId)),
      ),
    )
    .limit(1);
  return result[0];
}

export async function getSocialProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
  const profile = result[0];
  return profile ? { ...profile, friendCode: getFriendCode(profile.id) } : null;
}

export async function getFriendRequests(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: friendships.id,
      requesterId: friendships.requesterId,
      name: users.name,
      email: users.email,
      createdAt: friendships.createdAt,
    })
    .from(friendships)
    .innerJoin(users, eq(friendships.requesterId, users.id))
    .where(and(eq(friendships.addresseeId, userId), eq(friendships.status, "pending")))
    .orderBy(desc(friendships.createdAt));
}

export async function getFriends(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const links = await db
    .select({ requesterId: friendships.requesterId, addresseeId: friendships.addresseeId })
    .from(friendships)
    .where(and(or(eq(friendships.requesterId, userId), eq(friendships.addresseeId, userId)), eq(friendships.status, "accepted")));
  const friendIds = links.map((link) => (link.requesterId === userId ? link.addresseeId : link.requesterId));
  if (friendIds.length === 0) return [];
  const friendRows = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, friendIds));
  const presenceRows = await db.select().from(playerPresence).where(inArray(playerPresence.userId, friendIds));
  const presenceByUser = new Map(presenceRows.map((presence) => [presence.userId, presence]));
  return friendRows.map((friend) => {
    const presence = presenceByUser.get(friend.id);
    return {
      id: friend.id,
      name: friend.name || "مستكشف",
      email: friend.email,
      friendCode: getFriendCode(friend.id),
      location: presence
        ? { latitude: presence.latitudeE6 / 1_000_000, longitude: presence.longitudeE6 / 1_000_000 }
        : null,
      status: presence?.status ?? "offline",
      avatarEmoji: presence?.avatarEmoji ?? "🧭",
      updatedAt: presence?.updatedAt ?? null,
    };
  });
}

export async function requestFriend(userId: number, friendCode: string) {
  const normalized = friendCode.trim().toUpperCase().replace(/\s+/g, "");
  const match = /^WQ-(\d{1,12})$/.exec(normalized);
  if (!match) return { success: false as const, reason: "invalid_code" as const };
  const targetUserId = Number(match[1]);
  if (!Number.isSafeInteger(targetUserId) || targetUserId === userId) return { success: false as const, reason: "invalid_target" as const };
  const db = await getDb();
  if (!db) return { success: false as const, reason: "database_unavailable" as const };
  const target = await db.select({ id: users.id }).from(users).where(eq(users.id, targetUserId)).limit(1);
  if (!target[0]) return { success: false as const, reason: "not_found" as const };
  const existing = await getFriendshipBetween(userId, targetUserId);
  if (existing?.status === "accepted") return { success: false as const, reason: "already_friends" as const };
  if (existing?.status === "pending") return { success: false as const, reason: "pending" as const };
  await db.insert(friendships).values({ requesterId: userId, addresseeId: targetUserId, status: "pending" });
  return { success: true as const };
}

export async function acceptFriendRequest(userId: number, friendshipId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(friendships).set({ status: "accepted", updatedAt: new Date() }).where(and(eq(friendships.id, friendshipId), eq(friendships.addresseeId, userId), eq(friendships.status, "pending")));
  return result[0]?.affectedRows === 1;
}

export async function getDirectMessages(userId: number, friendId: number) {
  const db = await getDb();
  if (!db || !(await getFriendshipBetween(userId, friendId))?.status || (await getFriendshipBetween(userId, friendId))?.status !== "accepted") return [];
  return db
    .select({ id: chatMessages.id, senderId: chatMessages.senderId, recipientId: chatMessages.recipientId, text: chatMessages.body, timestamp: chatMessages.sentAt })
    .from(chatMessages)
    .where(or(and(eq(chatMessages.senderId, userId), eq(chatMessages.recipientId, friendId)), and(eq(chatMessages.senderId, friendId), eq(chatMessages.recipientId, userId))))
    .orderBy(chatMessages.sentAt);
}

export async function sendDirectMessage(userId: number, friendId: number, text: string) {
  const db = await getDb();
  const body = text.trim().slice(0, 500);
  if (!db || !body || (await getFriendshipBetween(userId, friendId))?.status !== "accepted") return null;
  const result = await db.insert(chatMessages).values({ senderId: userId, recipientId: friendId, body });
  const messageId = Number(result[0]?.insertId ?? 0);
  return { id: messageId, senderId: userId, recipientId: friendId, text: body, timestamp: new Date() };
}

export async function updatePlayerPresence(userId: number, latitude: number, longitude: number, status: "online" | "exploring" | "offline", avatarEmoji: string) {
  const db = await getDb();
  if (!db || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
  await db.insert(playerPresence).values({ userId, latitudeE6: Math.round(latitude * 1_000_000), longitudeE6: Math.round(longitude * 1_000_000), status, avatarEmoji: avatarEmoji.slice(0, 16) }).onDuplicateKeyUpdate({ set: { latitudeE6: Math.round(latitude * 1_000_000), longitudeE6: Math.round(longitude * 1_000_000), status, avatarEmoji: avatarEmoji.slice(0, 16), updatedAt: new Date() } });
  return true;
}
