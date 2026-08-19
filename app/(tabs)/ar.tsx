// Field Atlas AR: camera-first exploration with compass-aware markers, honest distance labels, and live friend presence.
import * as Location from "expo-location";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, PanResponder, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import type { DimensionValue } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { WorldMap } from "@/components/world-map";
import { useAuth } from "@/hooks/use-auth";
import { useDeviceActivity } from "@/hooks/use-device-activity";
import { useColors } from "@/hooks/use-colors";
import { bearingBetween, distanceInMeters } from "@/lib/game-math";
import { DEFAULT_LOCATION, INTERACTION_RADIUS_METERS } from "@/lib/worldquest-data";
import { useGameState } from "@/lib/game-state";
import { trpc } from "@/lib/trpc";
import type { Coordinates, QuestPoint } from "@/lib/worldquest-types";
import { ARObjectTools, CustomArObject } from "@/components/ARObjectTools";
import { loadRegionSnapshot, type SavedRegion } from "@/lib/region-storage";
import { GAME_CHARACTERS, type GameCharacter } from "@/lib/characters";
import { loadSelectedCharacter } from "@/lib/character-storage";
import { loadRealityMode, loadSelectedMap, saveRealityMode } from "@/lib/map-storage";
import { getGameMap, getMapPoints, type GameMapId, type RealityMode } from "@/lib/map-worlds";
import { loadPreferences } from "@/lib/app-preferences";

type ArMarker = {
  id: string;
  title: string;
  meta: string;
  distance: number;
  bearing: number;
  color: string;
  kind: "quest" | "friend" | "structure";
  point?: QuestPoint;
};

function relativeBearing(bearing: number, heading: number | null) {
  if (heading === null) return 0;
  return ((bearing - heading + 540) % 360) - 180;
}

export default function ARScreen() {
  const colors = useColors();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [location, setLocation] = useState<Coordinates>(DEFAULT_LOCATION);
  const [selectedPoint, setSelectedPoint] = useState<QuestPoint | null>(null);
  const [locationReady, setLocationReady] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [notice, setNotice] = useState("");
  const [savedRegion, setSavedRegion] = useState<SavedRegion | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<GameCharacter>(GAME_CHARACTERS[0]);
  const [selectedMap, setSelectedMap] = useState<GameMapId>("riyadh");
  const [realityMode, setRealityMode] = useState<RealityMode>("real-world");
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [arLabelsEnabled, setArLabelsEnabled] = useState(true);
  const { state: gameState, collectQuest } = useGameState();
  const activity = useDeviceActivity();
  const { user, isAuthenticated } = useAuth();
  const friends = trpc.social.friends.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: 6_000 });
  const updatePresence = trpc.social.updatePresence.useMutation();
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const dragState = useRef<Record<string, { x: number; y: number }>>({});

  useEffect(() => {
    void Promise.all([loadSelectedCharacter(user?.id), loadSelectedMap(user?.id), loadRealityMode(user?.id), loadPreferences()]).then(([character, mapId, mode, preferences]) => {
      setSelectedCharacter(character);
      setSelectedMap(mapId);
      setRealityMode(mode);
      setCameraEnabled(preferences.cameraEnabled);
      setArLabelsEnabled(preferences.arLabelsEnabled);
    });
  }, [user?.id]);

  const [customObjects, setCustomObjects] = useState<CustomArObject[]>([
    { id: "custom-1", title: "هدية ترحيبية", emoji: "🎁", offsetX: 0, offsetY: 0 },
  ]);

  const handleAddObject = (obj: { title: string; emoji: string }) => {
    setCustomObjects((prev) => [
      ...prev,
      { id: `custom-${Date.now()}`, title: obj.title, emoji: obj.emoji, offsetX: (Math.random() - 0.5) * 80, offsetY: (Math.random() - 0.5) * 40 },
    ]);
    setNotice(`تمت إضافة ${obj.title} في الواقع المعزز بنجاح!`);
  };

  const handleRemoveObject = (id: string) => {
    setCustomObjects((prev) => prev.filter((item) => item.id !== id));
    setNotice("تمت إزالة العنصر من الواقع المعزز");
  };

  const getObjectPanHandlers = (id: string) => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      dragState.current[id] = { x: 0, y: 0 };
      setNotice("اسحب العنصر إلى الموضع الذي تريده");
    },
    onPanResponderMove: (_, gesture) => {
      const previous = dragState.current[id] ?? { x: 0, y: 0 };
      const deltaX = (gesture.dx - previous.x) * 0.7;
      const deltaY = (gesture.dy - previous.y) * 0.7;
      dragState.current[id] = { x: gesture.dx, y: gesture.dy };
      setCustomObjects((prev) => prev.map((item) => item.id === id
        ? { ...item, offsetX: Math.max(-190, Math.min(190, item.offsetX + deltaX)), offsetY: Math.max(-150, Math.min(150, item.offsetY + deltaY)) }
        : item));
    },
    onPanResponderRelease: () => {
      delete dragState.current[id];
      setNotice("تم تثبيت العنصر في موضعه الجديد");
    },
    onPanResponderTerminate: () => {
      delete dragState.current[id];
    },
  }).panHandlers;

  useEffect(() => {
    let mounted = true;
    void loadRegionSnapshot().then((region) => {
      if (mounted) setSavedRegion(region);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const start = async () => {
      setLocationError("");
      setLocationReady(false);
      if (realityMode === "game-world") {
        setLocation(getGameMap(selectedMap).center);
        setLocationReady(true);
        return;
      }
      const permissionResult = await Location.requestForegroundPermissionsAsync();
      if (permissionResult.status !== "granted") {
        setLocationError("لم يتم السماح بالموقع. يمكنك البقاء في AR، أو الانتقال إلى عالم اللعبة المحلي.");
        setLocationReady(true);
        return;
      }
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (mounted) {
        const next = { latitude: current.coords.latitude, longitude: current.coords.longitude };
        setLocation(next);
        setLocationReady(true);
        if (isAuthenticated) updatePresence.mutate({ ...next, status: "exploring", avatarEmoji: selectedCharacter.emoji });
      }
      locationSubscription.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 8_000, distanceInterval: 8 },
        (next) => {
          if (!mounted) return;
          const nextLocation = { latitude: next.coords.latitude, longitude: next.coords.longitude };
          setLocation(nextLocation);
          setLocationReady(true);
          if (isAuthenticated) updatePresence.mutate({ ...nextLocation, status: "exploring", avatarEmoji: "🧭" });
        },
      );
    };
    start().catch(() => {
      if (mounted) {
        setLocationReady(true);
        setLocationError("تعذر تحديد الموقع حالياً. فعّل GPS وحاول مرة أخرى، أو استخدم عالم اللعبة المحلي.");
      }
    });
    return () => {
      mounted = false;
      locationSubscription.current?.remove();
    };
  }, [isAuthenticated, realityMode, selectedCharacter.emoji, selectedMap, updatePresence]);

  const currentMap = getGameMap(selectedMap);
  const questMarkers = useMemo<ArMarker[]>(() => getMapPoints(selectedMap)
    .filter((point) => !gameState.collectedIds.includes(point.id))
    .map((point) => ({
      id: point.id,
      title: point.title,
      meta: `${Math.round(distanceInMeters(location, point))} م · ${point.reward}`,
      distance: distanceInMeters(location, point),
      bearing: bearingBetween(location, point),
      color: point.color,
      kind: "quest" as const,
      point,
    }))
    .filter((marker) => realityMode === "game-world" || marker.distance <= 500)
    .sort((a, b) => a.distance - b.distance), [gameState.collectedIds, location, selectedMap]);

  const friendMarkers = useMemo<ArMarker[]>(() => (friends.data ?? [])
    .filter((friend) => friend.location && friend.status !== "offline")
    .map((friend) => {
      const friendLocation = friend.location!;
      return {
        id: `friend-${friend.id}`,
        title: friend.name,
        meta: `${Math.round(distanceInMeters(location, friendLocation))} م · ${friend.status === "exploring" ? "يستكشف الآن" : "متصل"}`,
        distance: distanceInMeters(location, friendLocation),
        bearing: bearingBetween(location, friendLocation),
        color: friend.status === "exploring" ? "#22C55E" : "#38BDF8",
        kind: "friend" as const,
      };
    })
    .filter((marker) => marker.distance <= 1_000)
    .sort((a, b) => a.distance - b.distance), [friends.data, location]);

  const livePlayers = useMemo(() => (friends.data ?? []).flatMap((friend) => {
    if (!friend.location || friend.status === "offline") return [];
    return [{
      id: String(friend.id),
      name: friend.name,
      location: friend.location,
      level: 1,
      color: friend.status === "exploring" ? "#22C55E" : "#38BDF8",
      emoji: friend.avatarEmoji,
    }];
  }), [friends.data]);

  const structureMarkers = useMemo<ArMarker[]>(() => (savedRegion?.structures ?? [])
    .map((structure) => ({
      id: structure.id,
      title: `${structure.emoji} ${structure.title}`,
      meta: `مدينة أصلية · المرحلة ${structure.stage}`,
      distance: distanceInMeters(location, structure),
      bearing: bearingBetween(location, structure),
      color: structure.color,
      kind: "structure" as const,
    }))
    .filter((marker) => marker.distance <= 700)
    .sort((a, b) => a.distance - b.distance), [location, savedRegion]);

  const markers = [...questMarkers, ...friendMarkers, ...structureMarkers];

  const travelToSelectedPoint = () => {
    if (!selectedPoint || realityMode !== "game-world") return;
    setLocation({ latitude: selectedPoint.latitude, longitude: selectedPoint.longitude });
    setNotice(`انتقلت إلى ${selectedPoint.title} داخل عالم اللعبة`);
  };

  const collectSelected = async () => {
    if (!selectedPoint) return;
    const distance = distanceInMeters(location, selectedPoint);
    if (distance > INTERACTION_RADIUS_METERS) {
      setNotice(`اقترب أكثر؛ تبقى ${Math.round(distance)} متر`);
      return;
    }
    const collected = await collectQuest(selectedPoint);
    setNotice(collected ? `تم جمع ${selectedPoint.title} وإضافة المكافأة` : "تم جمع هذه النقطة مسبقاً");
    if (collected) setSelectedPoint(null);
  };

  if (Platform.OS === "web") return <WebARFallback colors={colors} onBack={() => router.replace("/")} />;
  if (!cameraEnabled) return <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-background"><View style={styles.permission}><Text style={[styles.eyebrow, { color: colors.primary }]}>AR متوقف</Text><Text style={[styles.title, { color: colors.foreground }]}>الكاميرا متوقفة من الإعدادات</Text><Text style={[styles.body, { color: colors.muted }]}>يمكنك متابعة الاستكشاف من خريطة اللعبة، أو إعادة تشغيل الكاميرا من الإعدادات والخصوصية.</Text><Pressable onPress={() => router.replace("/settings")} style={({ pressed }) => [styles.button, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}><Text style={styles.buttonText}>فتح الإعدادات</Text></Pressable><Pressable onPress={() => router.replace("/")}><Text style={[styles.link, { color: colors.primary }]}>العودة إلى الخريطة</Text></Pressable></View></ScreenContainer>;
  if (!permission) return <ScreenContainer><ActivityIndicator color={colors.primary} /></ScreenContainer>;
  if (!permission.granted) {
    return <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-background"><View style={styles.permission}><Text style={[styles.eyebrow, { color: colors.primary }]}>WORLDQUEST AR</Text><Text style={[styles.title, { color: colors.foreground }]}>افتح بوابة الواقع المعزز</Text><Text style={[styles.body, { color: colors.muted }]}>نحتاج إلى الكاميرا لعرض نقاط الاستكشاف والأصدقاء فوق العالم الحقيقي. لن يتم حفظ الصور أو تسجيل الفيديو.</Text><Pressable onPress={requestPermission} style={({ pressed }) => [styles.button, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}><Text style={styles.buttonText}>السماح بالكاميرا</Text></Pressable><Pressable onPress={() => router.replace("/")}><Text style={[styles.link, { color: colors.primary }]}>العودة إلى الخريطة</Text></Pressable></View></ScreenContainer>;
  }

  return (
    <View style={styles.full}>
      <CameraView style={StyleSheet.absoluteFillObject} facing="back" />
      <View style={styles.scrim} />
      <View style={styles.header}><Pressable onPress={() => router.replace("/")} style={styles.iconButton}><Text style={styles.iconText}>‹</Text></Pressable><View style={styles.headerCopy}><Text style={styles.arLabel}>{currentMap.name} · {realityMode === "real-world" ? "AR حقيقي" : "AR عالم اللعبة"}</Text><Text style={styles.headerTitle}>{selectedCharacter.emoji} {selectedCharacter.name} · ابحث حولك</Text></View><View style={styles.live}><View style={[styles.dot, locationError ? { backgroundColor: "#F59E0B" } : undefined]} /><Text style={styles.liveText}>{locationError ? "GPS غير متاح" : activity.heading === null ? (locationReady ? "GPS" : "جارٍ تحديد الموقع") : `بوصلة ${Math.round(activity.heading)}°`}</Text></View></View>
      {locationError && <View style={styles.locationBanner}><Text style={styles.locationBannerTitle}>الموقع غير متاح</Text><Text style={styles.locationBannerText}>{locationError}</Text><Pressable onPress={() => { setRealityMode("game-world"); void saveRealityMode("game-world", user?.id); setNotice("تم حفظ عالم اللعبة المحلي لاستخدامه دون GPS"); }}><Text style={styles.locationBannerAction}>الانتقال إلى عالم اللعبة</Text></Pressable></View>}
      <View style={styles.arMiniMap}>
        <WorldMap
          playerLocation={location}
          points={getMapPoints(selectedMap).map((point) => ({ ...point, distance: distanceInMeters(location, point) }))}
          selectedPointId={selectedPoint?.id}
          onSelectPoint={setSelectedPoint}
          onRecenter={() => setNotice("تمركزت الخريطة على موقعك")}
          livePlayers={livePlayers}
        />
        <View style={styles.arMiniMapLabel}><Text style={styles.arMiniMapLabelText}>خريطة مصغرة · {currentMap.city}</Text></View>
      </View>
      <View style={styles.reticle}><View style={styles.reticleLineH} /><View style={styles.reticleLineV} /></View>
      <View style={styles.legend}><View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: "#F5B84B" }]} /><Text style={styles.legendText}>مهمة / هدية</Text></View><View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: "#22C55E" }]} /><Text style={styles.legendText}>صديق حي</Text></View><View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: "#A78BFA" }]} /><Text style={styles.legendText}>مدينة أصلية</Text></View></View>
      {arLabelsEnabled && <View style={styles.labels}>
        {markers.map((marker, index) => {
          const relative = relativeBearing(marker.bearing, activity.heading);
          const left: DimensionValue = `${Math.max(4, Math.min(82, 50 + (relative / 90) * 34))}%`;
          const scale = Math.max(0.76, Math.min(1.18, 1.2 - marker.distance / 700));
          const top = marker.kind === "friend" ? 28 + (index % 3) * 15 : marker.kind === "structure" ? 34 + (index % 3) * 14 : 22 + (index % 3) * 16;
          return (
            <Pressable key={marker.id} onPress={() => marker.kind === "quest" ? setSelectedPoint(marker.point ?? null) : setNotice(`${marker.title} على بُعد ${Math.round(marker.distance)} متر منك.`)} style={[styles.label, { left, top: `${top}%`, borderColor: marker.color, transform: [{ scale }] }]}> 
              <View style={[styles.labelDot, { backgroundColor: marker.color }]} /><Text style={styles.labelTitle}>{marker.kind === "friend" ? `👤 ${marker.title}` : marker.title}</Text><Text style={styles.labelMeta}>{marker.meta} · اتجاه {Math.round(marker.bearing)}°</Text>
            </Pressable>
          );
        })}
      </View>}
      {customObjects.map((obj, idx) => (
        <View key={obj.id} {...getObjectPanHandlers(obj.id)} style={[styles.customArItem, { top: `${40 + (idx * 10) + (obj.offsetY / 10)}%`, left: `${45 + (obj.offsetX / 5)}%` }]}>
          <Text style={{ fontSize: 28 }}>{obj.emoji}</Text>
          <Text style={styles.customArText}>{obj.title}</Text>
        </View>
      ))}
      <ARObjectTools
        objects={customObjects}
        onAddObject={handleAddObject}
        onRemoveObject={handleRemoveObject}
        onMoveObject={(id, dx, dy) => {
          setCustomObjects((prev) => prev.map((item) => item.id === id ? { ...item, offsetX: item.offsetX + dx, offsetY: item.offsetY + dy } : item));
        }}
      />

      <View style={styles.bottomHint}><Text style={styles.hintTitle}>{structureMarkers.length ? `${structureMarkers.length} مدينة وبيت ظاهر في الواقع المعزز` : friendMarkers.length ? `${friendMarkers.length} صديق ظاهر في الرحلة` : "حرّك الهاتف ببطء"}</Text><Text style={styles.hintBody}>تتحرك العلامات أفقيًا مع اتجاه البوصلة وتختفي خارج نطاق العرض</Text>{notice ? <Text style={styles.notice}>{notice}</Text> : null}</View>
      {selectedPoint && <View style={styles.sheet}><Text style={[styles.sheetEyebrow, { color: selectedPoint.color }]}>نقطة مكتشفة</Text><Text style={styles.sheetTitle}>{selectedPoint.title}</Text><Text style={styles.sheetBody}>{Math.round(distanceInMeters(location, selectedPoint))} متر · {selectedPoint.kind} · المكافأة {selectedPoint.reward}</Text>{realityMode === "game-world" && distanceInMeters(location, selectedPoint) > INTERACTION_RADIUS_METERS && <Pressable onPress={travelToSelectedPoint} style={[styles.button, { borderColor: selectedPoint.color, borderWidth: 1.5 }]}><Text style={[styles.buttonText, { color: selectedPoint.color }]}>انتقل إلى النقطة داخل AR</Text></Pressable>}<Pressable onPress={collectSelected} style={[styles.button, { backgroundColor: colors.primary }]}><Text style={styles.buttonText}>{distanceInMeters(location, selectedPoint) <= INTERACTION_RADIUS_METERS ? "جمع المكافأة" : "اقترب لجمعها"}</Text></Pressable><Pressable onPress={() => router.replace("/")}><Text style={[styles.link, { color: "#A5F3FC", textAlign: "center" }]}>عرض على الخريطة</Text></Pressable></View>}
    </View>
  );
}

function WebARFallback({ colors, onBack }: { colors: ReturnType<typeof useColors>; onBack: () => void }) {
  return <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-background"><View style={styles.webFallback}><Text style={[styles.eyebrow, { color: colors.primary }]}>WORLDQUEST AR</Text><Text style={[styles.title, { color: colors.foreground }]}>الواقع المعزز جاهز على الهاتف</Text><Text style={[styles.body, { color: colors.muted }]}>المعاينة الحالية تعمل على الويب. افتح التطبيق على Android أو iOS واسمح بالكاميرا لرؤية المهام والأصدقاء فوق المشهد الحقيقي.</Text><View style={styles.webPreview}><View style={styles.crosshair} /><View style={[styles.fakeLabel, { backgroundColor: "#35C2D4" }]}><Text style={styles.fakeText}>صديق حي</Text><Text style={styles.fakeMeta}>120 م · اتجاه 90°</Text></View><View style={[styles.fakeLabel, { backgroundColor: "#F5B84B", top: 92, left: 48 }]}><Text style={styles.fakeText}>هدية مخفية</Text><Text style={styles.fakeMeta}>نقطة استكشاف</Text></View></View><Pressable onPress={onBack} style={[styles.button, { backgroundColor: colors.primary }]}><Text style={styles.buttonText}>العودة إلى الخريطة</Text></Pressable></View></ScreenContainer>;
}

const styles = StyleSheet.create({
  full: { flex: 1, backgroundColor: "#101820" },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(3,12,20,0.18)" },
  header: { position: "absolute", top: 52, left: 18, right: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  arMiniMap: { position: "absolute", top: 132, right: 14, width: 156, height: 158, borderRadius: 18, overflow: "hidden", borderWidth: 2, borderColor: "#67E8F9", backgroundColor: "#07111F", zIndex: 12, elevation: 12 },
  arMiniMapLabel: { position: "absolute", left: 6, right: 6, bottom: 6, backgroundColor: "rgba(3,12,20,0.76)", borderRadius: 8, paddingVertical: 4, alignItems: "center" },
  arMiniMapLabelText: { color: "#CFFAFE", fontSize: 8, fontWeight: "800" },
  iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  iconText: { color: "#FFF", fontSize: 31, lineHeight: 34 },
  headerCopy: { flex: 1, marginLeft: 12 },
  arLabel: { color: "#A5F3FC", fontSize: 10, letterSpacing: 2, fontWeight: "800" },
  headerTitle: { color: "#FFF", fontSize: 22, fontWeight: "800", marginTop: 2 },
  live: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 8 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#49D17D", marginRight: 6 },
  liveText: { color: "#FFF", fontSize: 10, fontWeight: "700" },
  locationBanner: { position: "absolute", top: 92, left: 16, right: 16, zIndex: 15, padding: 12, borderRadius: 14, backgroundColor: "rgba(88, 50, 12, 0.94)", borderWidth: 1, borderColor: "#F59E0B" },
  locationBannerTitle: { color: "#FEF3C7", textAlign: "right", fontWeight: "900", fontSize: 13 },
  locationBannerText: { color: "#FDE68A", textAlign: "right", fontSize: 11, lineHeight: 16, marginTop: 3 },
  locationBannerAction: { color: "#FFFFFF", textAlign: "right", fontWeight: "900", fontSize: 12, marginTop: 6 },
  legend: { position: "absolute", top: 112, left: 18, flexDirection: "row", gap: 10, backgroundColor: "rgba(0,0,0,0.42)", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 7 },
  legendItem: { flexDirection: "row", alignItems: "center" },
  legendDot: { width: 7, height: 7, borderRadius: 4, marginRight: 4 },
  legendText: { color: "#FFF", fontSize: 9, fontWeight: "700" },
  reticle: { position: "absolute", left: "50%", top: "47%", width: 36, height: 36, marginLeft: -18, marginTop: -18 },
  reticleLineH: { position: "absolute", left: 0, right: 0, top: 17, height: 2, backgroundColor: "rgba(255,255,255,0.75)" },
  reticleLineV: { position: "absolute", top: 0, bottom: 0, left: 17, width: 2, backgroundColor: "rgba(255,255,255,0.75)" },
  labels: { ...StyleSheet.absoluteFillObject },
  label: { position: "absolute", minWidth: 138, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 14, backgroundColor: "rgba(5,17,27,0.84)", borderWidth: 1 },
  labelDot: { position: "absolute", width: 9, height: 9, borderRadius: 5, right: 10, top: 11 },
  labelTitle: { color: "#FFF", fontSize: 12, fontWeight: "800", paddingRight: 12 },
  labelMeta: { color: "#C4D4DE", fontSize: 10, marginTop: 3 },
  bottomHint: { position: "absolute", left: 20, right: 20, bottom: 38, alignItems: "center", backgroundColor: "rgba(0,0,0,0.48)", borderRadius: 18, paddingVertical: 12 },
  hintTitle: { color: "#FFF", fontSize: 14, fontWeight: "800" },
  hintBody: { color: "#C4D4DE", fontSize: 11, marginTop: 3, textAlign: "center" },
  notice: { color: "#A5F3FC", fontSize: 11, fontWeight: "700", marginTop: 6, textAlign: "center" },
  sheet: { position: "absolute", left: 14, right: 14, bottom: 24, backgroundColor: "#10212C", borderRadius: 22, padding: 18 },
  sheetEyebrow: { fontSize: 11, fontWeight: "800" },
  sheetTitle: { color: "#FFF", fontSize: 22, fontWeight: "800", marginTop: 4 },
  sheetBody: { color: "#C4D4DE", fontSize: 12, marginTop: 5 },
  permission: { flex: 1, justifyContent: "center", alignItems: "center", padding: 28 },
  webFallback: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  eyebrow: { fontSize: 11, letterSpacing: 2.2, fontWeight: "800" },
  title: { fontSize: 26, fontWeight: "800", textAlign: "center", marginTop: 7 },
  body: { fontSize: 13, lineHeight: 21, textAlign: "center", marginTop: 12, maxWidth: 420 },
  button: { borderRadius: 14, paddingVertical: 13, paddingHorizontal: 22, alignItems: "center", marginTop: 20, minWidth: 190 },
  buttonText: { color: "#071421", fontSize: 14, fontWeight: "800" },
  link: { marginTop: 16, fontSize: 13, fontWeight: "700" },
  webPreview: { width: "100%", maxWidth: 420, height: 270, borderRadius: 24, marginTop: 22, backgroundColor: "#AEB7C1", overflow: "hidden", position: "relative" },
  crosshair: { position: "absolute", left: "50%", top: "50%", width: 38, height: 38, marginLeft: -19, marginTop: -19, borderWidth: 2, borderColor: "rgba(255,255,255,0.75)", borderRadius: 20 },
  fakeLabel: { position: "absolute", top: 45, left: 76, borderRadius: 13, paddingHorizontal: 10, paddingVertical: 8 },
  fakeText: { color: "#071421", fontWeight: "800", fontSize: 12 },
  fakeMeta: { color: "#163246", fontSize: 10, marginTop: 2 },
  customArItem: {
    position: "absolute",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#34D399",
  },
  customArText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 2,
  },
});

// Merged into base styles
