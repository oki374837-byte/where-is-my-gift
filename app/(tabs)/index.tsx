import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { useAudioPlayer } from "expo-audio";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useWeather } from "@/hooks/use-weather";
import { distanceInMeters } from "@/lib/game-math";
import { loadPreferences } from "@/lib/app-preferences";
import { DEFAULT_LOCATION, INTERACTION_RADIUS_METERS } from "@/lib/worldquest-data";
import type { Coordinates, QuestPoint } from "@/lib/worldquest-types";
import { useGameState } from "@/lib/game-state";
import { GAME_CHARACTERS, GameCharacter } from "@/lib/characters";
import { WorldSetupModal } from "@/components/WorldSetupModal";
import { hasSelectedCharacter, loadSelectedCharacter, saveSelectedCharacter } from "@/lib/character-storage";
import { completeMapCharacterOnboarding, hasCompletedMapCharacterOnboarding, loadRealityMode, loadSelectedMap, saveRealityMode, saveSelectedMap } from "@/lib/map-storage";
import { getCityCharacters, getGameMap, getMapPoints, DEFAULT_REALITY_MODE, DEFAULT_GAME_MAP, type GameMapDefinition, type GameMapId, type RealityMode } from "@/lib/map-worlds";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { GameUpdatesCard } from "@/components/GameUpdatesCard";
import { createRegionSnapshot, loadRegionSnapshot, saveRegionSnapshot, type SavedRegion } from "@/lib/region-storage";

export default function HomeScreen() {
  const colors = useColors();
  let collectPlayer: any = null;
  let ambientPlayer: any = null;
  try {
    collectPlayer = useAudioPlayer(require("../../assets/audio/collect.wav"));
    ambientPlayer = useAudioPlayer(require("../../assets/audio/ambient.wav"));
  } catch {
    collectPlayer = { play: () => {}, pause: () => {}, loop: false, volume: 1 };
    ambientPlayer = { play: () => {}, pause: () => {}, loop: false, volume: 1 };
  }
  const [playerLocation, setPlayerLocation] = useState<Coordinates>(DEFAULT_LOCATION);
  const [locationState, setLocationState] = useState("جارٍ تحديد موقعك");
  const [selectedPoint, setSelectedPoint] = useState<QuestPoint | null>(null);
  const [refreshingWorld, setRefreshingWorld] = useState(false);
  const [savedRegion, setSavedRegion] = useState<SavedRegion | null>(null);
  const [regionStatus, setRegionStatus] = useState("لم تُحفظ المنطقة بعد");
  const { state: gameState, collectQuest, recordLocation } = useGameState();
  const { isAuthenticated } = useAuth();
  const socialFriends = trpc.social.friends.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 4_000,
    refetchIntervalInBackground: true,
    staleTime: 2_500,
  });
  const updatePresence = trpc.social.updatePresence.useMutation();
  const syncWorldState = trpc.world.syncState.useMutation();

  // اختيار الشخصية والفئة عند إنشاء الحساب أو أول دخول فقط
  const [setupModalVisible, setSetupModalVisible] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<GameCharacter>(GAME_CHARACTERS[0]);
  const [selectedMap, setSelectedMap] = useState<GameMapId>(DEFAULT_GAME_MAP);
  const [realityMode, setRealityMode] = useState<RealityMode>(DEFAULT_REALITY_MODE);
  const { weather, isStale, offline } = useWeather(playerLocation);
  const subscriber = useRef<Location.LocationSubscription | null>(null);
  const characterMotion = useRef(new Animated.Value(0)).current;
  const [worldTick, setWorldTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setWorldTick((tick) => tick + 1), 6_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(characterMotion, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(characterMotion, { toValue: 0, duration: 900, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [characterMotion]);

  useEffect(() => {
    let active = true;
    void Promise.all([loadSelectedCharacter(), hasSelectedCharacter(), loadSelectedMap(), loadRealityMode(), hasCompletedMapCharacterOnboarding()]).then(([character, hasSelection, mapId, mode, setupComplete]) => {
      if (!active) return;
      setSelectedCharacter(character);
      setSelectedMap(mapId);
      setRealityMode(mode);
      setSetupModalVisible(!hasSelection || !setupComplete);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void loadRegionSnapshot().then((region) => {
      if (!active || !region) return;
      setSavedRegion(region);
      setRegionStatus(`منطقة محفوظة · ${region.structures.length} مواقع أصلية`);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void loadPreferences().then((preferences) => {
      if (!active || !ambientPlayer) return;
      try {
        if (ambientPlayer.loop !== undefined) ambientPlayer.loop = true;
        if (ambientPlayer.volume !== undefined) ambientPlayer.volume = preferences.musicEnabled ? 0.18 : 0;
        if (preferences.musicEnabled && typeof ambientPlayer.play === "function") ambientPlayer.play();
      } catch {}
    });
    return () => {
      active = false;
      try {
        if (ambientPlayer && typeof ambientPlayer.pause === "function") ambientPlayer.pause();
      } catch {}
    };
  }, [ambientPlayer]);

  useEffect(() => {
    let mounted = true;
    const startTracking = async () => {
      if (realityMode === "game-world") {
        setPlayerLocation(currentMap.center);
        recordLocation(currentMap.center);
        setLocationState("عالم اللعبة · الموقع الافتراضي للماب");
        return;
      }
      if (!(await Location.hasServicesEnabledAsync())) {
        setLocationState("فعّل خدمات الموقع من إعدادات الهاتف");
        return;
      }
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setLocationState("تم رفض إذن الموقع؛ لن تعمل مهام العالم الحقيقي");
        return;
      }
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (mounted) {
        const nextLocation = { latitude: current.coords.latitude, longitude: current.coords.longitude };
        setPlayerLocation(nextLocation);
        recordLocation(nextLocation);
        setLocationState("الموقع مباشر");
        if (isAuthenticated) updatePresence.mutate({ latitude: nextLocation.latitude, longitude: nextLocation.longitude, status: "exploring", avatarEmoji: selectedCharacter.emoji });
      }
      subscriber.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 10000, distanceInterval: 10 },
        (next) => {
          if (mounted) {
            const nextLocation = { latitude: next.coords.latitude, longitude: next.coords.longitude };
            setPlayerLocation(nextLocation);
            recordLocation(nextLocation);
            setLocationState("الموقع مباشر");
            if (isAuthenticated) updatePresence.mutate({ latitude: nextLocation.latitude, longitude: nextLocation.longitude, status: "exploring", avatarEmoji: selectedCharacter.emoji });
          }
        },
      );
    };
    startTracking().catch(() => setLocationState("تعذر تحديد الموقع؛ تحقّق من الإشارة وحاول مجدداً"));
    return () => { mounted = false; subscriber.current?.remove(); };
  }, [isAuthenticated, realityMode, recordLocation, selectedCharacter.emoji, selectedMap, updatePresence]);

  const syncLabel = socialFriends.isError
    ? "غير متصل · نستخدم آخر بيانات محفوظة"
    : socialFriends.isFetching
      ? "جارٍ تحديث اللاعبين والهدايا…"
      : socialFriends.dataUpdatedAt
        ? `مزامنة حية · ${new Date(socialFriends.dataUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
        : "جارٍ الاتصال بالعالم الحي…";

  const refreshWorld = async () => {
    if (!isAuthenticated) {
      setLocationState("سجّل الدخول لمزامنة الأصدقاء مباشرة");
      return;
    }
    setRefreshingWorld(true);
    try {
      await socialFriends.refetch();
      setLocationState("تم تحديث الخريطة الآن");
    } catch {
      setLocationState("تعذر التحديث؛ نستخدم آخر بيانات محفوظة");
    } finally {
      setRefreshingWorld(false);
    }
  };

  const liveFriends = useMemo(() => {
    const friends = (socialFriends.data ?? [])
      .filter((friend) => friend.location)
      .map((friend) => ({
        id: String(friend.id),
        name: friend.name,
        location: friend.location!,
        level: 1,
        color: friend.status === "exploring" ? "#22C55E" : "#38BDF8",
        emoji: "👤",
      }));
    const cityCharacters = getCityCharacters(selectedMap).map((character, index) => ({
      id: `npc-${character.id}`,
      name: `${character.emoji} ${character.name}`,
      location: {
        latitude: character.location.latitude + Math.sin((worldTick + index) / 2) * 0.00035,
        longitude: character.location.longitude + Math.cos((worldTick + index) / 2) * 0.00035,
      },
      level: 1,
      color: character.color,
      emoji: character.emoji,
    }));
    return [...friends, ...cityCharacters];
  }, [selectedMap, socialFriends.data, worldTick]);

  const currentMap = getGameMap(selectedMap);
  const nearbyPoints = useMemo(() => getMapPoints(selectedMap).map((point) => ({ ...point, distance: distanceInMeters(playerLocation, point) })).sort((a, b) => a.distance - b.distance), [playerLocation, selectedMap]);
  const activeRegion = useMemo(() => {
    if (!savedRegion) return null;
    return distanceInMeters(playerLocation, savedRegion.center) <= savedRegion.radiusMeters * 2 ? savedRegion : null;
  }, [playerLocation, savedRegion]);
  const activePoints = useMemo(() => {
    const source = activeRegion?.points ?? nearbyPoints;
    return source.map((point) => ({ ...point, distance: distanceInMeters(playerLocation, point) })).sort((a, b) => a.distance - b.distance);
  }, [activeRegion, nearbyPoints, playerLocation]);
  const closest = activePoints[0];

  const saveCurrentRegion = async () => {
    setRegionStatus("جارٍ حفظ منطقة اللعب...");
    try {
      const region = createRegionSnapshot(playerLocation, nearbyPoints, "منطقة اللاعب الحالية");
      await saveRegionSnapshot(region);
      setSavedRegion(region);
      setRegionStatus(`تم حفظ المنطقة · ${region.structures.length} مواقع أصلية`);
    } catch {
      setRegionStatus("تعذر حفظ المنطقة؛ حاول مرة أخرى");
    }
  };

  const loadSavedRegion = async () => {
    setRegionStatus("جارٍ تحميل المنطقة المحفوظة...");
    try {
      const region = await loadRegionSnapshot();
      if (!region) {
        setRegionStatus("لا توجد منطقة محفوظة على هذا الجهاز");
        return;
      }
      setSavedRegion(region);
      setRegionStatus(`تم تحميل المنطقة · ${region.structures.length} مواقع أصلية`);
    } catch {
      setRegionStatus("تعذر تحميل المنطقة المحفوظة");
    }
  };

  const collectPoint = async () => {
    if (!selectedPoint || collected.includes(selectedPoint.id)) return;
    if (distanceInMeters(playerLocation, selectedPoint) > INTERACTION_RADIUS_METERS) {
      setLocationState(`اقترب إلى أقل من ${INTERACTION_RADIUS_METERS} متر لفتح المكافأة`);
      return;
    }
    const didCollect = await collectQuest(selectedPoint);
    if (!didCollect) return;
    setSelectedPoint(null);
    const preferences = await loadPreferences();
    if (preferences.soundEnabled) {
      await collectPlayer.seekTo(0);
      collectPlayer.play();
    }
    if (preferences.hapticsEnabled) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const collected = gameState.collectedIds;
  const xp = gameState.xp;
  const coins = gameState.coins;

  return (
    <ScreenContainer edges={["top", "left", "right"]} containerClassName="bg-background">
      <View style={styles.root}>
        <View style={styles.worldStage}>
          <View style={styles.mapTitleRow}>
            <View>
              <Text style={styles.mapEyebrow}>ماب اللعبة · {currentMap.city}</Text>
              <Text style={styles.mapTitle}>{currentMap.name}</Text>
            </View>
            <View style={styles.mapModeBadge}><Text style={styles.mapModeText}>استكشاف بلا وحوش</Text></View>
          </View>
          <GameMapCanvas map={currentMap} points={activePoints} livePlayers={liveFriends} selectedPointId={selectedPoint?.id} onSelectPoint={setSelectedPoint} onSelectPlayer={(player) => setLocationState(`تفاعلت مع ${player.name}`)} />
          <View style={styles.mapActionRow}>
            <Pressable onPress={() => router.push("/ar")} style={[styles.primaryModeButton, { backgroundColor: colors.primary }]}><Text style={styles.primaryModeButtonText}>◉ الواقع المعزز</Text></Pressable>
            <Pressable onPress={() => setSetupModalVisible(true)} style={styles.secondaryModeButton}><Text style={styles.secondaryModeButtonText}>⌖ تغيير الماب</Text></Pressable>
          </View>
          <Text style={styles.explorationHint}>اختر نقطة أو شخصية للتفاعل داخل {currentMap.city}</Text>
        </View>

        <WorldSetupModal
          visible={setupModalVisible}
          required
          initialCharacter={selectedCharacter}
          initialMap={selectedMap}
          initialMode={realityMode}
          onComplete={(char, mapId, mode) => {
            setSelectedCharacter(char);
            setSelectedMap(mapId);
            setRealityMode(mode);
            void Promise.all([saveSelectedCharacter(char), saveSelectedMap(mapId), saveRealityMode(mode), completeMapCharacterOnboarding()]);
            if (isAuthenticated) void syncWorldState.mutateAsync({ mapId, realityMode: mode, city: getGameMap(mapId).city, latitude: playerLocation.latitude, longitude: playerLocation.longitude });
            setSetupModalVisible(false);
            setLocationState(`تم اختيار ${getGameMap(mapId).name}`);
          }}
        />

        {/* الشريط العلوي العائم */}
        <View style={styles.floatingHeader}>
          <View style={[styles.headerGlass, { backgroundColor: "rgba(11, 43, 21, 0.88)", borderColor: "#22C55E" }]}>
            <Pressable onPress={() => setSetupModalVisible(true)} style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: selectedCharacter.color, alignItems: "center", justifyContent: "center", marginRight: 10 }}>
                <Text style={{ fontSize: 20 }}>{selectedCharacter.emoji}</Text>
              </View>
              <View>
                <Text style={[styles.eyebrow, { color: "#4ADE80" }]}>{currentMap.name} · {realityMode === "real-world" ? "واقع حقيقي" : "عالم اللعبة"}</Text>
                <Text style={[styles.title, { color: "#FFF", fontSize: 16 }]}>{selectedCharacter.emoji} {selectedCharacter.name}</Text>
              </View>
            </Pressable>
            <View style={styles.headerActions}>
              <Pressable onPress={refreshWorld} disabled={refreshingWorld} style={({ pressed }) => [styles.refreshButton, pressed && styles.refreshPressed]} accessibilityRole="button" accessibilityLabel="تحديث الخريطة الآن">
                <Text style={styles.refreshIcon}>{refreshingWorld ? "…" : "↻"}</Text>
              </Pressable>
              <View style={[styles.levelBadge, { backgroundColor: "rgba(6, 35, 20, 0.9)", borderColor: "#22C55E" }]}>
                <Text style={[styles.levelLabel, { color: "#86EFAC" }]}>المستوى</Text>
                <Text style={[styles.levelValue, { color: "#FEF08A" }]}>03</Text>
              </View>
            </View>
          </View>
        </View>

        {/* بطاقة الطقس العائمة */}
        {weather && (
          <View style={[styles.floatingWeather, { backgroundColor: "rgba(10, 22, 32, 0.85)", borderColor: colors.border }]}>
            <Text style={[styles.weatherIcon, { color: colors.primary }]}>{weather.isDay ? "☼" : "☾"}</Text>
            <View style={styles.weatherCopy}>
              <Text style={[styles.weatherTitle, { color: colors.foreground }]}>{weather.label} · {weather.temperatureC}°</Text>
              <Text style={[styles.weatherMeta, { color: colors.muted }]}>رياح {weather.windKmh} كم/س · {offline ? "محفوظة" : isStale ? "قديمة" : "مباشر"}</Text>
            </View>
          </View>
        )}

        {/* لوحة التحكم السفلية العائمة */}
        <View style={styles.floatingBottom}>
          <View style={[styles.regionPanel, { backgroundColor: "rgba(10, 22, 32, 0.9)", borderColor: colors.border }]}> 
            <View style={styles.regionCopy}>
              <Text style={[styles.regionTitle, { color: colors.foreground }]}>{currentMap.name} · {currentMap.city}</Text>
              <Text style={[styles.regionStatus, { color: colors.muted }]}>{regionStatus}</Text>
            </View>
            <View style={styles.regionActions}>
              <Pressable onPress={saveCurrentRegion} style={({ pressed }) => [styles.regionButton, { backgroundColor: colors.primary, opacity: pressed ? 0.75 : 1 }]}>
                <Text style={styles.regionButtonText}>حفظ المنطقة</Text>
              </Pressable>
              <Pressable onPress={loadSavedRegion} style={({ pressed }) => [styles.regionButton, styles.regionLoadButton, { opacity: pressed ? 0.75 : 1 }]}>
                <Text style={styles.regionLoadText}>تحميل المحفوظ</Text>
              </Pressable>
            </View>
          </View>
          <GameUpdatesCard />
          <View style={[styles.syncPill, { borderColor: socialFriends.isError ? "#F87171" : "#4ADE80" }]}> 
            <View style={[styles.syncDot, { backgroundColor: socialFriends.isError ? "#F87171" : socialFriends.isFetching ? "#FACC15" : "#4ADE80" }]} />
            <Text style={styles.syncText}>{syncLabel}</Text>
          </View>
          <View style={[styles.statsRow, { backgroundColor: "rgba(10, 22, 32, 0.88)", borderColor: colors.border }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.muted }]}>نقاط الخبرة XP</Text>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{xp}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.muted }]}>العملات المكتسبة</Text>
              <Text style={[styles.statValue, { color: colors.warning }]}>{coins}</Text>
            </View>
          </View>

          {closest && (
            <Pressable onPress={() => setSelectedPoint(closest)} style={({ pressed }) => [styles.questCard, { backgroundColor: "rgba(10, 22, 32, 0.92)", borderColor: colors.border, opacity: pressed ? 0.9 : 1 }]}>
              <View style={[styles.questIcon, { backgroundColor: `${closest.color}33` }]}><Text style={{ color: closest.color, fontSize: 22 }}>✦</Text></View>
              <View style={styles.questCopy}>
                <Text style={[styles.questTitle, { color: colors.foreground }]}>{closest.title}</Text>
                <Text style={[styles.questMeta, { color: colors.muted }]}>أقرب نقطة · {Math.round(closest.distance)} متر · {closest.reward}</Text>
              </View>
              <Text style={[styles.chevron, { color: colors.primary }]}>‹</Text>
            </Pressable>
          )}

          <Text style={[styles.locationNote, { color: colors.muted }]}>{locationState}</Text>
        </View>

        {/* ورقة تفاصيل النقطة المحددة */}
        {selectedPoint && (
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetEyebrow, { color: selectedPoint.color }]}>نقطة استكشاف</Text>
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>{selectedPoint.title}</Text>
            <Text style={[styles.sheetBody, { color: colors.muted }]}>{distanceInMeters(playerLocation, selectedPoint) <= INTERACTION_RADIUS_METERS ? `أنت داخل نطاق التفاعل (${Math.round(distanceInMeters(playerLocation, selectedPoint))} متر). يمكنك فتح العنصر وجمع المكافأة.` : `المسافة الحالية ${Math.round(distanceInMeters(playerLocation, selectedPoint))} متر. اقترب إلى ${INTERACTION_RADIUS_METERS} متر أو أقل.`}</Text>
            <Pressable onPress={collectPoint} style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}>
              <Text style={styles.primaryButtonText}>{collected.includes(selectedPoint.id) ? "تم الجمع" : distanceInMeters(playerLocation, selectedPoint) <= INTERACTION_RADIUS_METERS ? "فتح المكافأة" : "اقترب أولًا"}</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

function GameMapCanvas({
  map,
  points,
  livePlayers,
  selectedPointId,
  onSelectPoint,
  onSelectPlayer,
}: {
  map: GameMapDefinition;
  points: (QuestPoint & { distance?: number })[];
  livePlayers: Array<{ id: string; name: string; location: Coordinates; level: number; color: string; emoji?: string }>;
  selectedPointId?: string;
  onSelectPoint: (point: QuestPoint) => void;
  onSelectPlayer: (player: { name: string }) => void;
}) {
  return (
    <View style={styles.detailMap}>
      <View style={styles.mapGrid} />
      <View style={[styles.mapRoad, styles.mapRoadA]} />
      <View style={[styles.mapRoad, styles.mapRoadB]} />
      <View style={[styles.mapRoad, styles.mapRoadC]} />
      {map.landmarks.map((landmark, index) => (
        <View key={landmark} style={[styles.landmarkNode, { left: `${18 + (index * 31) % 70}%`, top: `${22 + (index % 2) * 48}%` }]}>
          <Text style={styles.landmarkIcon}>{index === 0 ? "⌂" : index === 1 ? "✦" : "◇"}</Text>
          <Text style={styles.landmarkText}>{landmark}</Text>
        </View>
      ))}
      {points.map((point, index) => (
        <Pressable key={point.id} onPress={() => onSelectPoint(point)} style={[styles.mapPoint, { left: `${28 + (index * 24) % 58}%`, top: `${38 + (index % 2) * 25}%` }, selectedPointId === point.id && styles.mapPointSelected]}>
          <Text style={styles.mapPointText}>✦</Text>
        </Pressable>
      ))}
      {livePlayers.slice(0, 6).map((player, index) => (
        <Pressable key={player.id} onPress={() => onSelectPlayer(player)} style={[styles.cityPlayer, { left: `${12 + (index * 17) % 76}%`, top: `${52 + (index % 2) * 19}%`, backgroundColor: player.color }]}>
          <Text style={styles.cityPlayerText}>{player.emoji || player.name[0]}</Text>
        </Pressable>
      ))}
      <View style={styles.mapCompass}><Text style={styles.mapCompassText}>N</Text></View>
      <View style={styles.mapScale}><Text style={styles.mapScaleText}>ماب تفصيلي · {map.city}</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, position: "relative" },
  worldStage: {
    minHeight: 438, flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#122033" },
  playerMarker: { width: 76, height: 76, borderRadius: 38, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(22, 163, 74, 0.28)", borderWidth: 2, borderColor: "#4ADE80", shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  playerMarkerEmoji: { fontSize: 42 },
  explorationHint: { marginTop: 14, color: "#D1FAE5", fontSize: 13, fontWeight: "700", textShadowColor: "#000", textShadowRadius: 6 },
  mapTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  mapEyebrow: { color: "#86EFAC", fontSize: 10, fontWeight: "800" },
  mapTitle: { color: "#FFFFFF", fontSize: 25, fontWeight: "900", marginTop: 3 },
  mapModeBadge: { backgroundColor: "rgba(34,197,94,0.18)", borderColor: "rgba(134,239,172,0.5)", borderWidth: 1, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 7 },
  mapModeText: { color: "#BBF7D0", fontSize: 9, fontWeight: "800" },
  detailMap: { flex: 1, minHeight: 320, borderRadius: 24, overflow: "hidden", backgroundColor: "#132B35", borderWidth: 1, borderColor: "rgba(148, 163, 184, 0.28)", position: "relative" },
  mapGrid: { ...StyleSheet.absoluteFillObject, opacity: 0.35, backgroundColor: "#1B4650" },
  mapRoad: { position: "absolute", backgroundColor: "rgba(226,232,240,0.16)", borderRadius: 8 },
  mapRoadA: { width: "125%", height: 18, top: "45%", left: "-10%", transform: [{ rotate: "-18deg" }] },
  mapRoadB: { width: "120%", height: 14, top: "62%", left: "-10%", transform: [{ rotate: "24deg" }] },
  mapRoadC: { width: 14, height: "115%", top: "-8%", left: "55%", transform: [{ rotate: "12deg" }] },
  landmarkNode: { position: "absolute", alignItems: "center", width: 100, marginLeft: -50 },
  landmarkIcon: { color: "#FDE68A", fontSize: 24, fontWeight: "900" },
  landmarkText: { color: "#E2E8F0", fontSize: 9, fontWeight: "800", textAlign: "center", marginTop: 2 },
  mapPoint: { position: "absolute", width: 34, height: 34, borderRadius: 17, backgroundColor: "#F59E0B", borderWidth: 2, borderColor: "#FFF", alignItems: "center", justifyContent: "center", marginLeft: -17, marginTop: -17 },
  mapPointSelected: { transform: [{ scale: 1.25 }], backgroundColor: "#22C55E" },
  mapPointText: { color: "#1C1917", fontSize: 16, fontWeight: "900" },
  cityPlayer: { position: "absolute", width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: "#FFF", alignItems: "center", justifyContent: "center", marginLeft: -16, marginTop: -16 },
  cityPlayerText: { fontSize: 15 },
  mapCompass: { position: "absolute", top: 12, right: 12, width: 30, height: 30, borderRadius: 15, backgroundColor: "rgba(4,15,20,0.72)", alignItems: "center", justifyContent: "center" },
  mapCompassText: { color: "#FCA5A5", fontSize: 12, fontWeight: "900" },
  mapScale: { position: "absolute", left: 12, bottom: 12, backgroundColor: "rgba(4,15,20,0.72)", paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10 },
  mapScaleText: { color: "#CBD5E1", fontSize: 9, fontWeight: "800" },
  mapActionRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  primaryModeButton: { flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: "center" },
  primaryModeButtonText: { color: "#052E16", fontSize: 12, fontWeight: "900" },
  secondaryModeButton: { flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: "center", backgroundColor: "rgba(148,163,184,0.16)", borderWidth: 1, borderColor: "rgba(226,232,240,0.25)" },
  secondaryModeButtonText: { color: "#E2E8F0", fontSize: 12, fontWeight: "900" },
  minimapWrap: { position: "absolute", top: 12, right: 12, width: 154, height: 184, borderRadius: 18, overflow: "hidden", borderWidth: 2, borderColor: "#4ADE80", backgroundColor: "#07111F", zIndex: 15, elevation: 10 },
  floatingHeader: { position: "absolute", top: 12, left: 12, right: 178, zIndex: 10 },
  headerGlass: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  eyebrow: { fontSize: 10, letterSpacing: 2, fontWeight: "800" },
  title: { fontSize: 20, fontWeight: "800", marginTop: 2 },
  levelBadge: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 11, paddingVertical: 6, alignItems: "center" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  refreshButton: { width: 38, height: 38, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(34, 197, 94, 0.18)", borderWidth: 1, borderColor: "rgba(74, 222, 128, 0.7)" },
  refreshPressed: { opacity: 0.65, transform: [{ scale: 0.94 }] },
  refreshIcon: { color: "#BBF7D0", fontSize: 24, fontWeight: "800", lineHeight: 26 },
  levelLabel: { fontSize: 9 },
  levelValue: { fontSize: 16, fontWeight: "800" },
  floatingWeather: { display: "none", position: "absolute", top: 88, right: 16, borderRadius: 16, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, flexDirection: "row", alignItems: "center", zIndex: 10 },
  weatherIcon: { fontSize: 20, width: 28, textAlign: "center" },
  weatherCopy: { marginLeft: 6 },
  weatherTitle: { fontSize: 11, fontWeight: "800" },
  weatherMeta: { fontSize: 9, marginTop: 2 },
  floatingBottom: { display: "none", position: "absolute", bottom: 20, left: 16, right: 16, zIndex: 10 },
  regionPanel: { borderRadius: 16, borderWidth: 1, padding: 9, marginBottom: 8, flexDirection: "row", alignItems: "center" },
  regionCopy: { flex: 1, marginRight: 8 },
  regionTitle: { fontSize: 11, fontWeight: "800", textAlign: "right" },
  regionStatus: { fontSize: 9, marginTop: 2, textAlign: "right" },
  regionActions: { flexDirection: "row", gap: 6 },
  regionButton: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 8 },
  regionLoadButton: { backgroundColor: "rgba(56, 189, 248, 0.18)", borderWidth: 1, borderColor: "rgba(125, 211, 252, 0.6)" },
  regionButtonText: { color: "#052E16", fontSize: 9, fontWeight: "800" },
  regionLoadText: { color: "#BAE6FD", fontSize: 9, fontWeight: "800" },
  statsRow: { borderRadius: 18, borderWidth: 1, padding: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-around", marginBottom: 10 },
  statItem: { alignItems: "center", flex: 1 },
  statDivider: { width: 1, height: 28 },
  statLabel: { fontSize: 10 },
  statValue: { fontSize: 18, fontWeight: "800", marginTop: 2 },
  questCard: { borderWidth: 1, borderRadius: 18, padding: 12, flexDirection: "row", alignItems: "center" },
  questIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  questCopy: { flex: 1, marginLeft: 10 },
  questTitle: { fontSize: 14, fontWeight: "800" },
  questMeta: { fontSize: 10, marginTop: 3 },
  chevron: { fontSize: 24, transform: [{ rotate: "180deg" }] },
  locationNote: { fontSize: 9, textAlign: "center", marginTop: 8, textShadowColor: "rgba(0,0,0,0.8)", textShadowRadius: 4 },
  syncPill: { alignSelf: "center", flexDirection: "row", alignItems: "center", backgroundColor: "rgba(7, 26, 18, 0.92)", borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 8 },
  syncDot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  syncText: { color: "#E2E8F0", fontSize: 10, fontWeight: "700" },
  sheet: { position: "absolute", left: 14, right: 14, bottom: 14, borderRadius: 22, borderWidth: 1, padding: 18, zIndex: 20, shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 16, elevation: 10 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 12 },
  sheetEyebrow: { fontSize: 10, fontWeight: "800" },
  sheetTitle: { fontSize: 20, fontWeight: "800", marginTop: 4 },
  sheetBody: { fontSize: 11, lineHeight: 18, marginTop: 6 },
  primaryButton: { marginTop: 14, borderRadius: 14, paddingVertical: 12, alignItems: "center" },
  primaryButtonText: { color: "#071421", fontSize: 13, fontWeight: "800" },
});
