import * as Location from "expo-location";
import { Accelerometer, Magnetometer } from "expo-sensors";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

import { distanceInMeters } from "@/lib/game-math";
import type { Coordinates } from "@/lib/worldquest-types";

type DeviceActivity = {
  heading: number | null;
  speed: number;
  distanceWalked: number;
  isMoving: boolean;
  sensorStatus: "ready" | "web-preview" | "unavailable";
};

const initial: DeviceActivity = { heading: null, speed: 0, distanceWalked: 0, isMoving: false, sensorStatus: Platform.OS === "web" ? "web-preview" : "ready" };

export function useDeviceActivity(): DeviceActivity {
  const [activity, setActivity] = useState<DeviceActivity>(initial);
  const previousLocation = useRef<Coordinates | null>(null);
  const totalDistance = useRef(0);

  useEffect(() => {
    if (Platform.OS === "web") return;
    let mounted = true;
    let locationSubscription: Location.LocationSubscription | null = null;
    let magnetometerSubscription: ReturnType<typeof Magnetometer.addListener> | null = null;
    let accelerometerSubscription: ReturnType<typeof Accelerometer.addListener> | null = null;

    const start = async () => {
      const [magnetometerAvailable, accelerometerAvailable, locationPermission] = await Promise.all([
        Magnetometer.isAvailableAsync(),
        Accelerometer.isAvailableAsync(),
        Location.requestForegroundPermissionsAsync(),
      ]);
      if (!mounted) return;
      if (magnetometerAvailable) {
        Magnetometer.setUpdateInterval(500);
        magnetometerSubscription = Magnetometer.addListener(({ x, y }) => {
          const angle = (Math.atan2(y, x) * 180) / Math.PI;
          setActivity((current) => ({ ...current, heading: Math.round((angle + 360) % 360) }));
        });
      }
      if (accelerometerAvailable) {
        Accelerometer.setUpdateInterval(500);
        accelerometerSubscription = Accelerometer.addListener(({ x, y, z }) => {
          const movement = Math.sqrt(x * x + y * y + z * z);
          setActivity((current) => ({ ...current, isMoving: Math.abs(movement - 1) > 0.08 }));
        });
      }
      if (locationPermission.status === "granted") {
        locationSubscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 5 },
          (position) => {
            if (!mounted) return;
            const next = { latitude: position.coords.latitude, longitude: position.coords.longitude };
            if (previousLocation.current) totalDistance.current += distanceInMeters(previousLocation.current, next);
            previousLocation.current = next;
            setActivity((current) => ({ ...current, speed: Math.max(0, position.coords.speed ?? 0), distanceWalked: totalDistance.current }));
          },
        );
      }
      setActivity((current) => ({ ...current, sensorStatus: magnetometerAvailable || accelerometerAvailable ? "ready" : "unavailable" }));
    };
    start().catch(() => setActivity((current) => ({ ...current, sensorStatus: "unavailable" })));
    return () => { mounted = false; locationSubscription?.remove(); magnetometerSubscription?.remove(); accelerometerSubscription?.remove(); };
  }, []);

  return activity;
}
