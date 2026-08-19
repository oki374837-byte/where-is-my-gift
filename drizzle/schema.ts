import { int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const playerProgress = mysqlTable("player_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  xp: int("xp").notNull().default(0),
  coins: int("coins").notNull().default(0),
  collectedIds: json("collectedIds").$type<string[]>().notNull(),
  inventory: json("inventory").$type<Record<string, number>>().notNull(),
  distanceWalkedMeters: int("distanceWalkedMeters").notNull().default(0),
  visitedCount: int("visitedCount").notNull().default(0),
  playTimeSeconds: int("playTimeSeconds").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlayerProgress = typeof playerProgress.$inferSelect;
export type InsertPlayerProgress = typeof playerProgress.$inferInsert;

export const friendships = mysqlTable("friendships", {
  id: int("id").autoincrement().primaryKey(),
  requesterId: int("requesterId").notNull(),
  addresseeId: int("addresseeId").notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "blocked"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Friendship = typeof friendships.$inferSelect;
export type InsertFriendship = typeof friendships.$inferInsert;

export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  senderId: int("senderId").notNull(),
  recipientId: int("recipientId").notNull(),
  body: text("body").notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  readAt: timestamp("readAt"),
});

export type ChatMessageRecord = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

export const playerPresence = mysqlTable("player_presence", {
  userId: int("userId").primaryKey(),
  latitudeE6: int("latitudeE6").notNull(),
  longitudeE6: int("longitudeE6").notNull(),
  status: mysqlEnum("status", ["online", "exploring", "offline"]).default("online").notNull(),
  avatarEmoji: varchar("avatarEmoji", { length: 16 }).default("🧭").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlayerPresence = typeof playerPresence.$inferSelect;
export type InsertPlayerPresence = typeof playerPresence.$inferInsert;

export const gameWorldState = mysqlTable("game_world_state", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  mapId: varchar("mapId", { length: 32 }).notNull().default("riyadh"),
  realityMode: mysqlEnum("realityMode", ["real-world", "game-world"]).notNull().default("game-world"),
  city: varchar("city", { length: 80 }).notNull().default("الرياض"),
  latitudeE6: int("latitudeE6"),
  longitudeE6: int("longitudeE6"),
  lastSyncAt: timestamp("lastSyncAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GameWorldState = typeof gameWorldState.$inferSelect;
export type InsertGameWorldState = typeof gameWorldState.$inferInsert;

