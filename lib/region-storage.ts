import AsyncStorage from "@react-native-async-storage/async-storage";

import type { Coordinates, QuestPoint } from "@/lib/worldquest-types";

export type RegionStructureKind = "castle" | "market" | "workshop" | "garden" | "tower" | "house";

export type RegionStructure = Coordinates & {
  id: string;
  title: string;
  kind: RegionStructureKind;
  emoji: string;
  stage: number;
  color: string;
};

export type SavedRegion = {
  id: string;
  label: string;
  center: Coordinates;
  radiusMeters: number;
  savedAt: string;
  points: QuestPoint[];
  structures: RegionStructure[];
};

const STORAGE_KEY = "worldquest.saved-region.v1";
const METERS_PER_DEGREE = 111_320;

const structureSeeds: Array<Omit<RegionStructure, "id" | "latitude" | "longitude"> & { north: number; east: number }> = [
  { title: "بوابة المدينة", kind: "castle", emoji: "🏰", stage: 1, color: "#F59E0B", north: 130, east: 0 },
  { title: "سوق الهدايا", kind: "market", emoji: "🛍️", stage: 2, color: "#F97316", north: 25, east: 125 },
  { title: "ورشة البناء", kind: "workshop", emoji: "🛠️", stage: 1, color: "#38BDF8", north: -100, east: 95 },
  { title: "حديقة الأصدقاء", kind: "garden", emoji: "🌳", stage: 3, color: "#22C55E", north: -120, east: -75 },
  { title: "برج الإشارة", kind: "tower", emoji: "🗼", stage: 2, color: "#A78BFA", north: 10, east: -140 },
  { title: "بيت المستكشف", kind: "house", emoji: "🏠", stage: 1, color: "#FB7185", north: 90, east: -105 },
];

function offsetCoordinate(center: Coordinates, northMeters: number, eastMeters: number): Coordinates {
  const latitudeRadians = (center.latitude * Math.PI) / 180;
  const longitudeScale = Math.max(Math.cos(latitudeRadians), 0.2);
  return {
    latitude: center.latitude + northMeters / METERS_PER_DEGREE,
    longitude: center.longitude + eastMeters / (METERS_PER_DEGREE * longitudeScale),
  };
}

export function createRegionSnapshot(
  center: Coordinates,
  points: QuestPoint[],
  label = "منطقة الاستكشاف",
): SavedRegion {
  const regionId = `${center.latitude.toFixed(3)}:${center.longitude.toFixed(3)}`;
  const structures = structureSeeds.map((seed) => {
    const coordinate = offsetCoordinate(center, seed.north, seed.east);
    return {
      id: `${regionId}:${seed.kind}`,
      title: seed.title,
      kind: seed.kind,
      emoji: seed.emoji,
      stage: seed.stage,
      color: seed.color,
      ...coordinate,
    };
  });

  return {
    id: regionId,
    label,
    center,
    radiusMeters: 450,
    savedAt: new Date().toISOString(),
    points: points.slice(0, 18).map(({ id, title, kind, reward, color, rewardXp, rewardCoins, itemId, latitude, longitude }) => ({
      id,
      title,
      kind,
      reward,
      color,
      rewardXp,
      rewardCoins,
      itemId,
      latitude,
      longitude,
    })),
    structures,
  };
}

export async function saveRegionSnapshot(region: SavedRegion): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(region));
}

export async function loadRegionSnapshot(): Promise<SavedRegion | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SavedRegion;
    if (!parsed?.center || !Array.isArray(parsed.points) || !Array.isArray(parsed.structures)) return null;
    return parsed;
  } catch {
    return null;
  }
}
