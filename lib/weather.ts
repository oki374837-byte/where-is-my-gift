import AsyncStorage from "@react-native-async-storage/async-storage";

import type { Coordinates } from "./worldquest-types";

export type WeatherSnapshot = {
  temperatureC: number;
  windKmh: number;
  isDay: boolean;
  label: string;
};

export type CachedWeather = {
  snapshot: WeatherSnapshot;
  coordinates: Coordinates;
  savedAt: number;
};

const WEATHER_CACHE_KEY = "worldquest.weather.last";
const WEATHER_LABELS: Record<number, string> = {
  0: "سماء صافية",
  1: "غائم جزئياً",
  2: "غائم جزئياً",
  3: "غائم",
  45: "ضباب",
  48: "ضباب متجمد",
  51: "رذاذ خفيف",
  53: "رذاذ",
  55: "رذاذ كثيف",
  61: "مطر خفيف",
  63: "مطر",
  65: "مطر غزير",
  71: "ثلج خفيف",
  73: "ثلج",
  75: "ثلج غزير",
  80: "زخات مطر",
  81: "زخات متفرقة",
  82: "زخات غزيرة",
  95: "عاصفة رعدية",
  96: "عاصفة وبَرَد",
  99: "عاصفة قوية",
};

export async function fetchWeather(coordinates: Coordinates, signal?: AbortSignal): Promise<WeatherSnapshot> {
  const params = new URLSearchParams({
    latitude: coordinates.latitude.toFixed(5),
    longitude: coordinates.longitude.toFixed(5),
    current: "temperature_2m,wind_speed_10m,is_day,weather_code",
    timezone: "auto",
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, { signal });
  if (!response.ok) throw new Error(`Weather request failed: ${response.status}`);
  const payload = await response.json() as { current?: { temperature_2m?: number; wind_speed_10m?: number; is_day?: number; weather_code?: number } };
  const current = payload.current;
  if (!current || typeof current.temperature_2m !== "number") throw new Error("Weather response incomplete");
  return {
    temperatureC: Math.round(current.temperature_2m),
    windKmh: Math.round(current.wind_speed_10m ?? 0),
    isDay: current.is_day === 1,
    label: WEATHER_LABELS[current.weather_code ?? -1] ?? "حالة جوية متغيرة",
  };
}

export async function loadCachedWeather(): Promise<CachedWeather | null> {
  try {
    const raw = await AsyncStorage.getItem(WEATHER_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedWeather;
    if (!cached?.snapshot || !cached?.coordinates || typeof cached.savedAt !== "number") return null;
    return cached;
  } catch {
    return null;
  }
}

export async function saveCachedWeather(snapshot: WeatherSnapshot, coordinates: Coordinates): Promise<void> {
  try {
    await AsyncStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({ snapshot, coordinates, savedAt: Date.now() } satisfies CachedWeather));
  } catch {
    // Weather remains usable even if local cache storage is unavailable.
  }
}
