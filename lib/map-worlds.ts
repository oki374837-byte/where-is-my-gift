import type { Coordinates, QuestPoint } from "@/lib/worldquest-types";

export type GameMapId = "riyadh" | "jeddah" | "makkah";
export type RealityMode = "real-world" | "game-world";

export type CityCharacter = {
  id: string;
  name: string;
  emoji: string;
  role: "anime" | "cartoon" | "athlete" | "artist";
  location: Coordinates;
  color: string;
};

export type GameMapDefinition = {
  id: GameMapId;
  name: string;
  subtitle: string;
  city: string;
  center: Coordinates;
  accent: string;
  description: string;
  landmarks: string[];
  points: QuestPoint[];
  cityCharacters: CityCharacter[];
};

export const GAME_MAPS: GameMapDefinition[] = [
  {
    id: "riyadh",
    name: "عاصمة شبرا",
    subtitle: "ماب الرياض",
    city: "الرياض",
    center: { latitude: 24.7136, longitude: 46.6753 },
    accent: "#22C55E",
    description: "مدينة الاستكشاف الرئيسية، شوارعها ومواقعها الحقيقية هي بوابة عالم اللعبة.",
    landmarks: ["بوابة الشمال", "الشرارة الزرقاء", "الممر الخفي"],
      points: [
        { id: "riyadh-north-gate", title: "بوابة الشمال", kind: "أثر نادر", reward: "+120 XP", color: "#F5B84B", latitude: 24.718, longitude: 46.679 },
        { id: "riyadh-blue-spark", title: "الشرارة الزرقاء", kind: "عنصر قابل للجمع", reward: "+40 XP", color: "#35C2D4", latitude: 24.709, longitude: 46.671 },
        { id: "riyadh-hidden-path", title: "الممر الخفي", kind: "نقطة استطلاع", reward: "+80 XP", color: "#49D17D", latitude: 24.716, longitude: 46.668 },
      ],
      cityCharacters: [
        { id: "riyadh-anime-guide", name: "ليان المرشدة", emoji: "🌸", role: "anime", location: { latitude: 24.714, longitude: 46.676 }, color: "#F472B6" },
        { id: "riyadh-cartoon-artist", name: "راشد الرسام", emoji: "🎨", role: "cartoon", location: { latitude: 24.711, longitude: 46.674 }, color: "#A78BFA" },
        { id: "riyadh-football-star", name: "نجم الملاعب", emoji: "⚽", role: "athlete", location: { latitude: 24.717, longitude: 46.672 }, color: "#22C55E" },
      ],
  },
  {
    id: "jeddah",
    name: "ممشى البحر",
    subtitle: "ماب جدة",
    city: "جدة",
    center: { latitude: 21.5433, longitude: 39.1728 },
    accent: "#38BDF8",
    description: "مدينة بحرية هادئة للاستكشاف وجمع الهدايا والتفاعل مع الشخصيات.",
    landmarks: ["بوابة الكورنيش", "منارة البحر", "سوق الحكايات"],
      points: [
        { id: "jeddah-corniche-gate", title: "بوابة الكورنيش", kind: "نقطة استكشاف", reward: "+120 XP", color: "#38BDF8", latitude: 21.571, longitude: 39.112 },
        { id: "jeddah-lighthouse", title: "منارة البحر", kind: "هدية نادرة", reward: "+80 XP", color: "#F5B84B", latitude: 21.555, longitude: 39.130 },
        { id: "jeddah-story-market", title: "سوق الحكايات", kind: "موقع تفاعلي", reward: "+60 XP", color: "#A78BFA", latitude: 21.486, longitude: 39.186 },
      ],
      cityCharacters: [
        { id: "jeddah-anime-guide", name: "جود الرحّالة", emoji: "🧭", role: "anime", location: { latitude: 21.552, longitude: 39.121 }, color: "#38BDF8" },
        { id: "jeddah-cartoon-artist", name: "مرجان الكرتوني", emoji: "🦋", role: "cartoon", location: { latitude: 21.548, longitude: 39.126 }, color: "#F472B6" },
        { id: "jeddah-music-artist", name: "صوت البحر", emoji: "🎤", role: "artist", location: { latitude: 21.559, longitude: 39.118 }, color: "#F59E0B" },
      ],
  },
  {
    id: "makkah",
    name: "طريق النور",
    subtitle: "ماب مكة",
    city: "مكة المكرمة",
    center: { latitude: 21.3891, longitude: 39.8579 },
    accent: "#F59E0B",
    description: "ماب استكشاف محترم وهادئ يعتمد على المواقع العامة والمناطق الآمنة فقط.",
    landmarks: ["بوابة النور", "ساحة الرحلة", "ممر الهدية"],
      points: [
        { id: "makkah-light-gate", title: "بوابة النور", kind: "نقطة استكشاف", reward: "+120 XP", color: "#F59E0B", latitude: 21.405, longitude: 39.826 },
        { id: "makkah-journey-square", title: "ساحة الرحلة", kind: "موقع تفاعلي", reward: "+80 XP", color: "#F97316", latitude: 21.416, longitude: 39.879 },
        { id: "makkah-gift-path", title: "ممر الهدية", kind: "عنصر قابل للجمع", reward: "+60 XP", color: "#FBBF24", latitude: 21.373, longitude: 39.862 },
      ],
      cityCharacters: [
        { id: "makkah-anime-guide", name: "نور الدليل", emoji: "✨", role: "anime", location: { latitude: 21.397, longitude: 39.842 }, color: "#FBBF24" },
        { id: "makkah-cartoon-artist", name: "حكايات الطريق", emoji: "📚", role: "cartoon", location: { latitude: 21.392, longitude: 39.851 }, color: "#A78BFA" },
        { id: "makkah-athlete", name: "عدّاء الرحلة", emoji: "🏃", role: "athlete", location: { latitude: 21.386, longitude: 39.856 }, color: "#22C55E" },
      ],
  },
];

export const DEFAULT_GAME_MAP: GameMapId = "riyadh";
export const DEFAULT_REALITY_MODE: RealityMode = "real-world";

export function getGameMap(mapId: GameMapId): GameMapDefinition {
  return GAME_MAPS.find((map) => map.id === mapId) ?? GAME_MAPS[0];
}

export function getMapPoints(mapId: GameMapId): QuestPoint[] {
  return getGameMap(mapId).points;
}

export function getCityCharacters(mapId: GameMapId): CityCharacter[] {
  return getGameMap(mapId).cityCharacters;
}
