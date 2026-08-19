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

export type MapZone = {
  id: string;
  label: string;
  x: number;
  y: number;
};

export type GameMapDefinition = {
  id: GameMapId;
  name: string;
  subtitle: string;
  city: string;
  center: Coordinates;
  accent: string;
  description: string;
  story: string;
  safetyNote: string;
  landmarks: string[];
  zones: MapZone[];
  points: QuestPoint[];
  cityCharacters: CityCharacter[];
};

export const MAP_CONTENT_VERSION = 2;

export const GAME_MAPS: GameMapDefinition[] = [
  {
    id: "riyadh",
    name: "عاصمة شبرا",
    subtitle: "ماب الرياض",
    city: "الرياض",
    center: { latitude: 24.7136, longitude: 46.6753 },
    accent: "#22C55E",
    description: "خريطة استكشاف صحراوية داخل عالم اللعبة، مليئة بنقاط الهدايا والمسارات القصيرة.",
    story: "تتبع شرارة خضراء عبر ثلاثة أحياء خيالية حتى تعثر على فانوس الغروب.",
    safetyNote: "ماب لعبة محلي؛ لا يطلب دخول مواقع خاصة أو عسكرية.",
    landmarks: ["بوابة الشمال", "الشرارة الزرقاء", "الممر الخفي"],
    zones: [
      { id: "olaya", label: "ممر العليا", x: 22, y: 24 },
      { id: "shubra", label: "حي شبرا", x: 54, y: 64 },
      { id: "wadi", label: "وادي النخيل", x: 78, y: 34 },
    ],
    points: [
      { id: "riyadh-north-gate", title: "بوابة الشمال", kind: "أثر نادر", reward: "+120 XP", rewardXp: 120, rewardCoins: 35, itemId: "north-compass", color: "#F5B84B", latitude: 24.718, longitude: 46.679 },
      { id: "riyadh-blue-spark", title: "الشرارة الزرقاء", kind: "عنصر قابل للجمع", reward: "+40 XP", rewardXp: 40, rewardCoins: 15, itemId: "blue-crystal", color: "#35C2D4", latitude: 24.709, longitude: 46.671 },
      { id: "riyadh-hidden-path", title: "الممر الخفي", kind: "نقطة استطلاع", reward: "+80 XP", rewardXp: 80, rewardCoins: 25, itemId: "path-token", color: "#49D17D", latitude: 24.716, longitude: 46.668 },
      { id: "riyadh-palm-cache", title: "مخبأ النخيل", kind: "هدية صغيرة", reward: "+60 XP", rewardXp: 60, rewardCoins: 20, itemId: "palm-gift", color: "#A78BFA", latitude: 24.711, longitude: 46.681 },
      { id: "riyadh-sand-clock", title: "ساعة الرمال", kind: "لغز زمني", reward: "+100 XP", rewardXp: 100, rewardCoins: 30, itemId: "sand-clock", color: "#FB7185", latitude: 24.721, longitude: 46.671 },
      { id: "riyadh-last-lantern", title: "فانوس الغروب", kind: "هدية نادرة", reward: "+140 XP", rewardXp: 140, rewardCoins: 45, itemId: "sunset-lantern", color: "#F97316", latitude: 24.705, longitude: 46.677 },
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
    story: "تصل رسالة داخل صدفة إلى ممشى البحر، وتدلك على قوس المرجان ورصيف القمر.",
    safetyNote: "ماب لعبة محلي؛ نقاطه رمزية ولا تمثل إرشاداً للوصول أو الملاحة.",
    landmarks: ["بوابة الكورنيش", "منارة البحر", "سوق الحكايات"],
    zones: [
      { id: "corniche", label: "خط الكورنيش", x: 18, y: 28 },
      { id: "old-port", label: "الميناء القديم", x: 52, y: 66 },
      { id: "story-market", label: "سوق الحكايات", x: 80, y: 40 },
    ],
    points: [
      { id: "jeddah-corniche-gate", title: "بوابة الكورنيش", kind: "نقطة استكشاف", reward: "+120 XP", rewardXp: 120, rewardCoins: 35, itemId: "sea-compass", color: "#38BDF8", latitude: 21.571, longitude: 39.112 },
      { id: "jeddah-lighthouse", title: "منارة البحر", kind: "هدية نادرة", reward: "+80 XP", rewardXp: 80, rewardCoins: 25, itemId: "lighthouse-gift", color: "#F5B84B", latitude: 21.555, longitude: 39.130 },
      { id: "jeddah-story-market", title: "سوق الحكايات", kind: "موقع تفاعلي", reward: "+60 XP", rewardXp: 60, rewardCoins: 20, itemId: "story-shell", color: "#A78BFA", latitude: 21.486, longitude: 39.186 },
      { id: "jeddah-coral-arch", title: "قوس المرجان", kind: "لغز بحري", reward: "+100 XP", rewardXp: 100, rewardCoins: 30, itemId: "coral-token", color: "#FB7185", latitude: 21.562, longitude: 39.145 },
      { id: "jeddah-sail-cache", title: "مخبأ الشراع", kind: "عنصر قابل للجمع", reward: "+50 XP", rewardXp: 50, rewardCoins: 18, itemId: "sail-gift", color: "#F97316", latitude: 21.530, longitude: 39.120 },
      { id: "jeddah-moon-pier", title: "رصيف القمر", kind: "هدية نادرة", reward: "+140 XP", rewardXp: 140, rewardCoins: 45, itemId: "moon-shell", color: "#E879F9", latitude: 21.510, longitude: 39.166 },
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
    description: "ماب استكشاف محترم وهادئ يعتمد على المناطق العامة الآمنة فقط، بلا وحوش أو قتال.",
    story: "رحلة هادئة تجمع ستة رموز نور، مع احترام المكان وإمكانية اللعب من عالم اللعبة دون حضور ميداني.",
    safetyNote: "ماب لعبة خيالي؛ لا يحدد أماكن العبادة أو الخدمات ولا يستبدل التوجيه الرسمي.",
    landmarks: ["بوابة النور", "ساحة الرحلة", "ممر الهدية"],
    zones: [
      { id: "light-gate", label: "بوابة النور", x: 24, y: 26 },
      { id: "journey-square", label: "ساحة الرحلة", x: 56, y: 60 },
      { id: "gift-path", label: "ممر الهدية", x: 78, y: 34 },
    ],
    points: [
      { id: "makkah-light-gate", title: "بوابة النور", kind: "نقطة استكشاف", reward: "+120 XP", rewardXp: 120, rewardCoins: 35, itemId: "light-token", color: "#F59E0B", latitude: 21.405, longitude: 39.826 },
      { id: "makkah-journey-square", title: "ساحة الرحلة", kind: "موقع تفاعلي", reward: "+80 XP", rewardXp: 80, rewardCoins: 25, itemId: "journey-badge", color: "#F97316", latitude: 21.416, longitude: 39.879 },
      { id: "makkah-gift-path", title: "ممر الهدية", kind: "عنصر قابل للجمع", reward: "+60 XP", rewardXp: 60, rewardCoins: 20, itemId: "gift-path-token", color: "#FBBF24", latitude: 21.373, longitude: 39.862 },
      { id: "makkah-star-rest", title: "استراحة النجمة", kind: "لغز هادئ", reward: "+100 XP", rewardXp: 100, rewardCoins: 30, itemId: "star-token", color: "#FDE68A", latitude: 21.395, longitude: 39.872 },
      { id: "makkah-sand-letter", title: "رسالة الرمل", kind: "هدية صغيرة", reward: "+50 XP", rewardXp: 50, rewardCoins: 18, itemId: "sand-letter", color: "#FB923C", latitude: 21.382, longitude: 39.844 },
      { id: "makkah-dawn-lantern", title: "فانوس الفجر", kind: "هدية نادرة", reward: "+140 XP", rewardXp: 140, rewardCoins: 45, itemId: "dawn-lantern", color: "#FBBF24", latitude: 21.412, longitude: 39.850 },
    ],
    cityCharacters: [
      { id: "makkah-anime-guide", name: "نور الدليل", emoji: "✨", role: "anime", location: { latitude: 21.397, longitude: 39.842 }, color: "#FBBF24" },
      { id: "makkah-cartoon-artist", name: "حكايات الطريق", emoji: "📚", role: "cartoon", location: { latitude: 21.392, longitude: 39.851 }, color: "#A78BFA" },
      { id: "makkah-athlete", name: "عدّاء الرحلة", emoji: "🏃", role: "athlete", location: { latitude: 21.386, longitude: 39.856 }, color: "#22C55E" },
    ],
  },
];

export const DEFAULT_GAME_MAP: GameMapId = "riyadh";
// يبدأ اللاعب بعالم اللعبة المحلي؛ يمكنه اختيار الواقع الحقيقي لاحقاً من الإعدادات.
export const DEFAULT_REALITY_MODE: RealityMode = "game-world";

export function getGameMap(mapId: GameMapId): GameMapDefinition {
  return GAME_MAPS.find((map) => map.id === mapId) ?? GAME_MAPS[0];
}

export function getMapPoints(mapId: GameMapId): QuestPoint[] {
  return getGameMap(mapId).points;
}

export function getCityCharacters(mapId: GameMapId): CityCharacter[] {
  return getGameMap(mapId).cityCharacters;
}
