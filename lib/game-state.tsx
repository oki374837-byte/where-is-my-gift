// WorldQuest AR — shared local game state: exploration, rewards, inventory, statistics, offline queue.

import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { distanceInMeters } from "@/lib/game-math";
import type { Coordinates, QuestPoint } from "@/lib/worldquest-types";
import { getInventoryTotal, INVENTORY_CAPACITY } from "@/lib/item-catalog";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

type InventoryRecord = Record<string, number>;

type PendingAction = {
  id: string;
  type: "collect" | "movement";
  createdAt: number;
  payload: Record<string, string | number>;
};

export type GameState = {
  xp: number;
  coins: number;
  collectedIds: string[];
  inventory: InventoryRecord;
  distanceWalkedMeters: number;
  visitedCount: number;
  playTimeSeconds: number;
  lastLocation: Coordinates | null;
  lastActiveAt: number;
  pendingActions: PendingAction[];
  dailyStreak: number;
  lastDailyClaimAt: number | null;
};

const STORAGE_KEY = "worldquest.game-state";

function getStorageKey(userId: number | string | null | undefined) {
  return userId == null ? `${STORAGE_KEY}.guest` : `${STORAGE_KEY}.user.${String(userId)}`;
}

export const DEFAULT_GAME_STATE: GameState = {
  xp: 240,
  coins: 85,
  collectedIds: [],
  inventory: { crystal: 3, map: 7, seed: 2 },
  distanceWalkedMeters: 0,
  visitedCount: 0,
  playTimeSeconds: 0,
  lastLocation: null,
  lastActiveAt: Date.now(),
  pendingActions: [],
  dailyStreak: 0,
  lastDailyClaimAt: null,
};

function normalizeState(raw: Partial<GameState>): GameState {
  return {
    ...DEFAULT_GAME_STATE,
    ...raw,
    xp: Number.isFinite(raw.xp) ? Math.max(0, Number(raw.xp)) : DEFAULT_GAME_STATE.xp,
    coins: Number.isFinite(raw.coins) ? Math.max(0, Number(raw.coins)) : DEFAULT_GAME_STATE.coins,
    collectedIds: Array.isArray(raw.collectedIds) ? raw.collectedIds.filter((id): id is string => typeof id === "string") : [],
    inventory: raw.inventory && typeof raw.inventory === "object" ? raw.inventory : {},
    distanceWalkedMeters: Number.isFinite(raw.distanceWalkedMeters) ? Math.max(0, Number(raw.distanceWalkedMeters)) : 0,
    visitedCount: Number.isFinite(raw.visitedCount) ? Math.max(0, Number(raw.visitedCount)) : 0,
    playTimeSeconds: Number.isFinite(raw.playTimeSeconds) ? Math.max(0, Number(raw.playTimeSeconds)) : 0,
    lastLocation: raw.lastLocation ?? null,
    lastActiveAt: Number.isFinite(raw.lastActiveAt) ? Number(raw.lastActiveAt) : Date.now(),
    pendingActions: Array.isArray(raw.pendingActions) ? raw.pendingActions : [],
    dailyStreak: Number.isFinite(raw.dailyStreak) ? Math.max(0, Math.floor(Number(raw.dailyStreak))) : 0,
    lastDailyClaimAt: raw.lastDailyClaimAt == null ? null : (Number.isFinite(raw.lastDailyClaimAt) ? Number(raw.lastDailyClaimAt) : null),
  };
}

function toProgressPayload(state: GameState) {
  return {
    xp: Math.round(state.xp),
    coins: Math.round(state.coins),
    collectedIds: state.collectedIds,
    inventory: state.inventory,
    distanceWalkedMeters: Math.round(state.distanceWalkedMeters),
    visitedCount: Math.round(state.visitedCount),
    playTimeSeconds: Math.round(state.playTimeSeconds),
  };
}

async function persistState(state: GameState, storageKey: string) {
  await AsyncStorage.multiSet([
    [storageKey, JSON.stringify(state)],
    ["worldquest.collected", JSON.stringify(state.collectedIds)],
    ["worldquest.xp", String(state.xp)],
    ["worldquest.coins", String(state.coins)],
    ["worldquest.distance", String(state.distanceWalkedMeters)],
    ["worldquest.visited", String(state.visitedCount)],
  ]);
}

type GameStateContextValue = {
  state: GameState;
  hydrated: boolean;
  isOnline: boolean;
  collectQuest: (point: QuestPoint) => Promise<boolean>;
  recordLocation: (location: Coordinates) => void;
  addItem: (itemId: string, quantity?: number) => boolean;
  spendCoins: (amount: number) => boolean;
  consumeItem: (itemId: string, quantity?: number) => boolean;
  removeItem: (itemId: string) => void;
  claimDailyReward: () => { claimed: boolean; coins: number; xp: number; streak: number };
  resetGame: () => Promise<void>;
};

const GameStateContext = createContext<GameStateContextValue | null>(null);

export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(DEFAULT_GAME_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const { isAuthenticated, user } = useAuth();
  const storageKey = getStorageKey(user?.id);
  const storageKeyRef = useRef(storageKey);
  const latestState = useRef(DEFAULT_GAME_STATE);
  const remoteBootstrapHandled = useRef(false);
  const bootstrappedUserId = useRef<number | string | null>(null);
  const progressQuery = trpc.game.getProgress.useQuery(undefined, { enabled: isAuthenticated });
  const { mutate: saveProgress, mutateAsync: saveProgressAsync } = trpc.game.saveProgress.useMutation();
  const visitedPoints = useRef(new Set<string>());
  const syncingPending = useRef(false);

  useEffect(() => {
    let active = true;
    storageKeyRef.current = storageKey;
    setHydrated(false);
    AsyncStorage.getItem(storageKey).then((raw) => {
      if (!active) return;
      const next = raw ? normalizeState(JSON.parse(raw) as Partial<GameState>) : DEFAULT_GAME_STATE;
      latestState.current = next;
      setState(next);
      setHydrated(true);
    }).catch(() => {
      if (active) setHydrated(true);
    });
    return () => { active = false; };
  }, [storageKey]);

  const flushPendingActions = useCallback(async () => {
    if (!hydrated || !isAuthenticated || syncingPending.current || latestState.current.pendingActions.length === 0) return;
    syncingPending.current = true;
    try {
      const current = latestState.current;
      await saveProgressAsync(toProgressPayload(current));
      const synced = normalizeState({ ...current, pendingActions: [] });
      latestState.current = synced;
      setState(synced);
      await persistState(synced, storageKeyRef.current);
    } catch {
      // Keep queued actions locally; the next authenticated refresh will retry.
    } finally {
      syncingPending.current = false;
    }
  }, [hydrated, isAuthenticated, saveProgressAsync]);

  useEffect(() => {
    if (!isAuthenticated || user?.id == null) {
      bootstrappedUserId.current = null;
      remoteBootstrapHandled.current = false;
      return;
    }
    if (bootstrappedUserId.current !== user.id) {
      bootstrappedUserId.current = user.id;
      remoteBootstrapHandled.current = false;
    }
    if (!hydrated || progressQuery.data === undefined || remoteBootstrapHandled.current) return;
    remoteBootstrapHandled.current = true;
    if (progressQuery.data) {
      if (latestState.current.pendingActions.length > 0) {
        void flushPendingActions();
        return;
      }
      const merged = normalizeState({
        ...progressQuery.data,
        pendingActions: latestState.current.pendingActions,
      });
      latestState.current = merged;
      setState(merged);
      void persistState(merged, storageKeyRef.current);
    } else {
      saveProgress(toProgressPayload(latestState.current));
    }
  }, [flushPendingActions, hydrated, isAuthenticated, progressQuery.data, saveProgress, user?.id]);

  useEffect(() => {
    void flushPendingActions();
  }, [flushPendingActions, progressQuery.dataUpdatedAt, state.pendingActions.length]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((networkState) => {
      const online = networkState.isConnected === true && networkState.isInternetReachable !== false;
      setIsOnline(online);
      if (online) void flushPendingActions();
    });
    return unsubscribe;
  }, [flushPendingActions]);

  const commit = useCallback((update: (current: GameState) => GameState) => {
    const next = normalizeState(update(latestState.current));
    latestState.current = next;
    setState(next);
    void persistState(next, storageKeyRef.current);
    if (isAuthenticated) saveProgress(toProgressPayload(next));
    return next;
  }, [isAuthenticated, saveProgress]);

  const collectQuest = useCallback(async (point: QuestPoint) => {
    if (latestState.current.collectedIds.includes(point.id)) return false;
    const rewardXp = point.rewardXp ?? 40;
    const rewardCoins = point.rewardCoins ?? 15;
    const next = commit((current) => ({
      ...current,
      xp: current.xp + rewardXp,
      coins: current.coins + rewardCoins,
      collectedIds: [...current.collectedIds, point.id],
      visitedCount: current.visitedCount + 1,
      inventory: point.itemId ? { ...current.inventory, [point.itemId]: (current.inventory[point.itemId] ?? 0) + 1 } : current.inventory,
      pendingActions: [...current.pendingActions, {
        id: `${point.id}-${Date.now()}`,
        type: "collect",
        createdAt: Date.now(),
        payload: { pointId: point.id, xp: rewardXp, coins: rewardCoins },
      }],
      lastActiveAt: Date.now(),
    }));
    await persistState(next, storageKeyRef.current);
    return true;
  }, [commit]);

  const recordLocation = useCallback((location: Coordinates) => {
    commit((current) => {
      const delta = current.lastLocation ? distanceInMeters(current.lastLocation, location) : 0;
      const elapsedSeconds = Math.max(0.5, (Date.now() - current.lastActiveAt) / 1000);
      const speedMetersPerSecond = delta / elapsedSeconds;
      const suspiciousJump = delta > 1000 || (delta > 120 && elapsedSeconds < 30) || speedMetersPerSecond > 55;
      const validDelta = delta > 0 && !suspiciousJump ? delta : 0;
      const nextVisited = new Set(visitedPoints.current);
      nextVisited.add(`${location.latitude.toFixed(4)}:${location.longitude.toFixed(4)}`);
      visitedPoints.current = nextVisited;
      return {
        ...current,
        lastLocation: location,
        distanceWalkedMeters: current.distanceWalkedMeters + validDelta,
        visitedCount: Math.max(current.visitedCount, nextVisited.size),
        playTimeSeconds: current.playTimeSeconds + Math.min(elapsedSeconds, 300),
        lastActiveAt: Date.now(),
      };
    });
  }, [commit]);

  const addItem = useCallback((itemId: string, quantity = 1) => {
    if (quantity <= 0 || getInventoryTotal(latestState.current.inventory) + quantity > INVENTORY_CAPACITY) return false;
    commit((current) => ({ ...current, inventory: { ...current.inventory, [itemId]: (current.inventory[itemId] ?? 0) + quantity } }));
    return true;
  }, [commit]);

  const spendCoins = useCallback((amount: number) => {
    if (amount <= 0 || latestState.current.coins < amount) return false;
    commit((current) => ({ ...current, coins: current.coins - amount }));
    return true;
  }, [commit]);

  const consumeItem = useCallback((itemId: string, quantity = 1) => {
    if (quantity <= 0 || (latestState.current.inventory[itemId] ?? 0) < quantity) return false;
    commit((current) => {
      const remaining = (current.inventory[itemId] ?? 0) - quantity;
      const inventory = { ...current.inventory };
      if (remaining > 0) inventory[itemId] = remaining;
      else delete inventory[itemId];
      return { ...current, inventory };
    });
    return true;
  }, [commit]);

  const claimDailyReward = useCallback(() => {
    const now = Date.now();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const lastClaim = latestState.current.lastDailyClaimAt;
    if (lastClaim != null) {
      const previous = new Date(lastClaim);
      previous.setHours(0, 0, 0, 0);
      if (previous.getTime() === today.getTime()) {
        return { claimed: false, coins: 0, xp: 0, streak: latestState.current.dailyStreak };
      }
    }
    const yesterday = today.getTime() - 24 * 60 * 60 * 1000;
    const lastDay = lastClaim == null ? null : new Date(lastClaim);
    lastDay?.setHours(0, 0, 0, 0);
    const streak = lastDay?.getTime() === yesterday ? latestState.current.dailyStreak + 1 : 1;
    const coins = Math.min(80, 20 + streak * 5);
    const xp = 25;
    commit((current) => ({
      ...current,
      xp: current.xp + xp,
      coins: current.coins + coins,
      dailyStreak: streak,
      lastDailyClaimAt: now,
      lastActiveAt: now,
    }));
    return { claimed: true, coins, xp, streak };
  }, [commit]);

  const removeItem = useCallback((itemId: string) => {
    commit((current) => {
      const inventory = { ...current.inventory };
      delete inventory[itemId];
      return { ...current, inventory };
    });
  }, [commit]);

  const resetGame = useCallback(async () => {
    latestState.current = DEFAULT_GAME_STATE;
    setState(DEFAULT_GAME_STATE);
    visitedPoints.current.clear();
    await AsyncStorage.multiRemove([STORAGE_KEY, "worldquest.collected", "worldquest.xp", "worldquest.coins", "worldquest.distance", "worldquest.visited"]);
  }, []);

  const value = useMemo(() => ({ state, hydrated, isOnline, collectQuest, recordLocation, addItem, spendCoins, consumeItem, removeItem, claimDailyReward, resetGame }), [state, hydrated, isOnline, collectQuest, recordLocation, addItem, spendCoins, consumeItem, removeItem, claimDailyReward, resetGame]);
  return <GameStateContext.Provider value={value}>{children}</GameStateContext.Provider>;
}

export function useGameState() {
  const value = useContext(GameStateContext);
  if (!value) throw new Error("useGameState must be used inside GameStateProvider");
  return value;
}
