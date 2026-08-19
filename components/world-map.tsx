/* eslint-disable @typescript-eslint/no-require-imports */
import { Platform } from "react-native";

import type { Coordinates, QuestPoint } from "@/lib/worldquest-types";
import type { RegionStructure } from "@/lib/region-storage";

import type { LivePlayer } from "./world-map.native";

export type WorldMapProps = {
  playerLocation: Coordinates;
  points: (QuestPoint & { distance?: number })[];
  selectedPointId?: string;
  onSelectPoint: (point: QuestPoint) => void;
  onRecenter: () => void;
  livePlayers?: LivePlayer[];
  onSelectLivePlayer?: (player: LivePlayer) => void;
  structures?: RegionStructure[];
};

export function WorldMap(props: WorldMapProps) {
  // Platform-specific implementations prevent loading native maps into the web preview.
  const implementation = Platform.OS === "web"
    ? require("./world-map.web").WorldMap
    : require("./world-map.native").WorldMap;
  return implementation(props);
}
