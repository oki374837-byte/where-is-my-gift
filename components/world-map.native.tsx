import React, { useRef, useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Constants from "expo-constants";
import MapView, { Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import type { Coordinates, QuestPoint } from "@/lib/worldquest-types";
import type { RegionStructure } from "@/lib/region-storage";
import { distanceInMeters } from "@/lib/game-math";

export interface LivePlayer {
  id: string;
  name: string;
  location: Coordinates;
  level: number;
  color: string;
  emoji?: string;
}

export type MapStyleMode = "standard" | "satellite" | "terrain" | "hybrid";

export interface WorldMapProps {
  playerLocation: Coordinates;
  points: (QuestPoint & { distance?: number })[];
  selectedPointId?: string;
  onSelectPoint: (point: QuestPoint) => void;
  onRecenter: () => void;
  livePlayers?: LivePlayer[];
  onSelectLivePlayer?: (player: LivePlayer) => void;
  structures?: RegionStructure[];
}

export function WorldMap({
  playerLocation,
  points,
  selectedPointId,
  onSelectPoint,
  onRecenter,
  livePlayers = [],
  onSelectLivePlayer,
  structures = [],
}: WorldMapProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const [mapType, setMapType] = useState<"standard" | "satellite" | "terrain" | "hybrid">("standard");
  const hasGoogleMapsKey = Boolean(
    Constants.expoConfig?.android?.config?.googleMaps?.apiKey,
  );
  const canRenderNativeMap = Platform.OS !== "android" || hasGoogleMapsKey;
  const isValidCoordinate = (coordinate: Coordinates | undefined) => Boolean(
    coordinate
      && Number.isFinite(coordinate.latitude)
      && Number.isFinite(coordinate.longitude)
      && coordinate.latitude >= -90
      && coordinate.latitude <= 90
      && coordinate.longitude >= -180
      && coordinate.longitude <= 180,
  );
  const safePlayerLocation = isValidCoordinate(playerLocation)
    ? playerLocation
    : { latitude: 24.7136, longitude: 46.6753 };
  const safePoints = points.filter((point) => isValidCoordinate(point));
  const safeStructures = structures.filter((structure) => isValidCoordinate(structure));
  const safeLivePlayers = livePlayers.filter((player) => isValidCoordinate(player.location));

  const handleRecenter = () => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: safePlayerLocation.latitude,
        longitude: safePlayerLocation.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 800);
    }
    onRecenter();
  };

  if (!canRenderNativeMap) {
    return (
            <View style={[styles.container, styles.safeMapFallback, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.fallbackNotice}>
          <Ionicons name="compass-outline" size={15} color="#FBBF24" />
          <Text style={styles.fallbackNoticeText}>خريطة اللعب المحلية · نقاطك جاهزة للاستكشاف</Text>
        </View>

        <View style={styles.fallbackCanvas}>
          <View style={styles.playerPulse} />
          <View style={styles.playerDot} />
          {safePoints.slice(0, 8).map((point, index) => (
            <TouchableOpacity
              key={point.id}
              style={[styles.fallbackPoint, { left: `${18 + (index * 29) % 68}%`, top: `${24 + (index * 37) % 55}%` }]}
              onPress={() => onSelectPoint(point)}
              accessibilityLabel={`فتح ${point.title}`}
            >
              <Ionicons name={point.id.includes("gift") ? "gift" : "compass-outline"} size={18} color="#FFFFFF" />
            </TouchableOpacity>
          ))}
          {safeStructures.slice(0, 6).map((structure, index) => (
            <View
              key={structure.id}
              style={[styles.fallbackStructure, { left: `${12 + (index * 31) % 76}%`, top: `${12 + (index * 23) % 68}%`, borderColor: structure.color }]}
            >
              <Text style={styles.structureEmoji}>{structure.emoji}</Text>
            </View>
          ))}
          {safeLivePlayers.slice(0, 6).map((player, index) => (
            <TouchableOpacity
              key={`fallback-player-${player.id}`}
              style={[styles.fallbackPlayer, { left: `${20 + (index * 27) % 64}%`, top: `${18 + (index * 29) % 58}%`, backgroundColor: player.color || "#38BDF8" }]}
              onPress={() => onSelectLivePlayer?.(player)}
              accessibilityLabel={`التفاعل مع ${player.name}`}
            >
              <Text style={styles.otherPlayerText}>{player.emoji || player.name.charAt(0)}</Text>
            </TouchableOpacity>
          ))}
          <Text style={styles.fallbackCoordinates}>
            موقعك: {safePlayerLocation.latitude.toFixed(4)}, {safePlayerLocation.longitude.toFixed(4)}
          </Text>
        </View>
        <TouchableOpacity style={styles.recenterButton} onPress={handleRecenter}>
          <Ionicons name="locate" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={{
          latitude: playerLocation.latitude,
          longitude: playerLocation.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        mapType={mapType}
      >
        {/* دبابيس نقاط الاستكشاف والمهام وصندوق الهدية */}
        {safePoints.map((pt) => {
          const isGift = pt.id.includes("gift");
          const isSelected = pt.id === selectedPointId;
          return (
            <Marker
              key={pt.id}
              coordinate={{ latitude: pt.latitude, longitude: pt.longitude }}
              title={pt.title}
              description={pt.reward || "نقطة استكشاف"}
              onPress={() => onSelectPoint(pt)}
            >
              <View style={[styles.markerBadge, isSelected && styles.markerSelected, isGift && styles.giftMarker]}>
                <Ionicons
                  name={isGift ? "gift" : "compass"}
                  size={isGift ? 22 : 18}
                  color={isGift ? "#FFF" : pt.color || "#35C2D4"}
                />
              </View>
            </Marker>
          );
        })}

        {/* مدن وبيوت أصلية مولّدة حول المنطقة الفعلية */}
        {safeStructures.map((structure) => (
          <Marker
            key={`structure-${structure.id}`}
            coordinate={{ latitude: structure.latitude, longitude: structure.longitude }}
            title={`${structure.emoji} ${structure.title}`}
            description={`مدينة أصلية · المرحلة ${structure.stage}`}
          >
            <View style={[styles.structureMarker, { borderColor: structure.color }]}>
              <Text style={styles.structureEmoji}>{structure.emoji}</Text>
            </View>
          </Marker>
        ))}

        {/* دبابيس اللاعبين الحيين الآخرين */}
        {safeLivePlayers.map((player) => (
          <Marker
            key={`player-${player.id}`}
            coordinate={{ latitude: player.location.latitude, longitude: player.location.longitude }}
            title={`${player.name} (Lv.${player.level})`}
            description="شخصية متواجدة في المدينة · اضغط للتفاعل"
            onPress={() => onSelectLivePlayer?.(player)}
          >
            <View style={[styles.otherPlayerMarker, { backgroundColor: player.color || "#38BDF8" }]}>
              <Text style={styles.otherPlayerText}>{player.emoji || player.name[0]}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* شريط تبديل أنماط خرائط Google الحقيقية */}
      <View style={styles.styleToolbar}>
        <TouchableOpacity
          style={[styles.styleButton, mapType === "standard" && styles.styleButtonActive]}
          onPress={() => setMapType("standard")}
        >
          <Text style={[styles.styleButtonText, mapType === "standard" && styles.styleButtonTextActive]}>عادية</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.styleButton, mapType === "terrain" && styles.styleButtonActive]}
          onPress={() => setMapType("terrain")}
        >
          <Text style={[styles.styleButtonText, mapType === "terrain" && styles.styleButtonTextActive]}>طبيعة</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.styleButton, mapType === "satellite" && styles.styleButtonActive]}
          onPress={() => setMapType("satellite")}
        >
          <Text style={[styles.styleButtonText, mapType === "satellite" && styles.styleButtonTextActive]}>قمر صناعي</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.styleButton, mapType === "hybrid" && styles.styleButtonActive]}
          onPress={() => setMapType("hybrid")}
        >
          <Text style={[styles.styleButtonText, mapType === "hybrid" && styles.styleButtonTextActive]}>هجين 3D</Text>
        </TouchableOpacity>
      </View>

      {/* زر التمركز السريع على موقع GPS الحقيقي */}
      <TouchableOpacity style={styles.recenterButton} onPress={handleRecenter}>
        <Ionicons name="locate" size={24} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#35C2D4",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  markerSelected: {
    transform: [{ scale: 1.25 }],
    borderColor: "#F59E0B",
    backgroundColor: "rgba(245, 158, 11, 0.2)",
  },
  giftMarker: {
    backgroundColor: "#DC2626",
    borderColor: "#FBBF24",
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  otherPlayerMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  otherPlayerText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "800",
  },
  styleToolbar: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  styleButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  styleButtonActive: {
    backgroundColor: "#10B981",
  },
  styleButtonText: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "700",
  },
  styleButtonTextActive: {
    color: "#FFF",
  },
  safeMapFallback: {
    backgroundColor: "#07111F",
    paddingHorizontal: 16,
  },
  fallbackNotice: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(15, 23, 42, 0.78)",
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.45)",
    zIndex: 3,
  },
  fallbackNoticeText: { color: "#FDE68A", fontSize: 10, fontWeight: "800" },
  fallbackCopy: {
    flex: 1,
  },
  fallbackTitle: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "800",
    textAlign: "right",
  },
  fallbackText: {
    color: "#B7C9D9",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "right",
    marginTop: 5,
  },
  fallbackCanvas: {
    flex: 1,
    marginTop: 14,
    borderRadius: 24,
    backgroundColor: "#0B2434",
    borderWidth: 1,
    borderColor: "#1C5366",
    overflow: "hidden",
    position: "relative",
  },
  playerPulse: {
    position: "absolute",
    width: 74,
    height: 74,
    borderRadius: 37,
    top: "45%",
    left: "50%",
    marginLeft: -37,
    marginTop: -37,
    backgroundColor: "rgba(16,185,129,0.16)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.45)",
  },
  playerDot: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    top: "50%",
    left: "50%",
    marginLeft: -9,
    marginTop: -9,
    backgroundColor: "#34D399",
    borderWidth: 3,
    borderColor: "#ECFDF5",
  },
  fallbackStructure: {
    position: "absolute",
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    borderWidth: 2,
  },
  fallbackPlayer: {
    position: "absolute",
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#E0F2FE",
  },
  structureMarker: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.94)",
    borderWidth: 2,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  structureEmoji: {
    fontSize: 21,
  },
  fallbackPoint: {
    position: "absolute",
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DC2626",
    borderWidth: 2,
    borderColor: "#FBBF24",
  },
  fallbackCoordinates: {
    position: "absolute",
    bottom: 14,
    left: 14,
    right: 14,
    color: "#A7F3D0",
    fontSize: 11,
    textAlign: "center",
  },
  recenterButton: {
    position: "absolute",
    bottom: 90,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
