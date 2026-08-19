import { useEffect, useState } from "react";

import { fetchWeather, loadCachedWeather, saveCachedWeather, type WeatherSnapshot } from "@/lib/weather";
import type { Coordinates } from "@/lib/worldquest-types";

export function useWeather(coordinates: Coordinates) {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setOffline(false);

    loadCachedWeather().then((cached) => {
      if (!active || !cached) return;
      setWeather(cached.snapshot);
      setIsStale(Date.now() - cached.savedAt > 30 * 60 * 1000);
    });

    fetchWeather(coordinates, controller.signal)
      .then(async (nextWeather) => {
        if (!active) return;
        setWeather(nextWeather);
        setIsStale(false);
        setOffline(false);
        await saveCachedWeather(nextWeather, coordinates);
      })
      .catch(() => {
        if (!active || controller.signal.aborted) return;
        setOffline(true);
        setIsStale(true);
      })
      .finally(() => {
        if (active && !controller.signal.aborted) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [coordinates.latitude, coordinates.longitude]);

  return { weather, loading, isStale, offline };
}
