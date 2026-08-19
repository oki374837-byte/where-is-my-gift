import type { Coordinates, QuestPoint } from "@/lib/worldquest-types";

export const DEFAULT_LOCATION: Coordinates = { latitude: 24.7136, longitude: 46.6753 };
export const INTERACTION_RADIUS_METERS = 100;

export const QUEST_POINTS: QuestPoint[] = [
  { id: "north-star", title: "بوابة الشمال", kind: "أثر نادر", reward: "+120 XP", color: "#F5B84B", latitude: 24.718, longitude: 46.679 },
  { id: "blue-spark", title: "الشرارة الزرقاء", kind: "عنصر قابل للجمع", reward: "+40 XP", color: "#35C2D4", latitude: 24.709, longitude: 46.671 },
  { id: "hidden-path", title: "الممر الخفي", kind: "نقطة استطلاع", reward: "+80 XP", color: "#49D17D", latitude: 24.716, longitude: 46.668 },
];
