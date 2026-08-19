import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/use-colors";
import type { Coordinates, QuestPoint } from "@/lib/worldquest-types";

export function WorldMap({
  points,
  selectedPointId,
  onSelectPoint,
  onRecenter,
}: {
  playerLocation: Coordinates;
  points: QuestPoint[];
  selectedPointId?: string;
  onSelectPoint: (point: QuestPoint) => void;
  onRecenter: () => void;
}) {
  const colors = useColors();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.water, { backgroundColor: colors.surface }]} /><View style={[styles.roadOne, { backgroundColor: colors.border }]} /><View style={[styles.roadTwo, { backgroundColor: colors.muted }]} />
      <View style={styles.topOverlay}><View style={[styles.livePill, { backgroundColor: `${colors.foreground}D9` }]}><View style={styles.liveDot} /><Text style={[styles.liveText, { color: colors.background }]}>خريطة تفاعلية · وضع الويب</Text></View><Text style={[styles.gpsText, { color: colors.background, backgroundColor: `${colors.foreground}B8` }]}>GPS</Text></View>
      {points.map((point, index) => <Pressable key={point.id} onPress={() => onSelectPoint(point)} style={[styles.pin, { left: `${20 + index * 26}%`, top: `${34 + (index % 2) * 26}%` }]}><View style={[styles.pinCore, { backgroundColor: point.color }, selectedPointId === point.id && styles.selectedPin]}><Text style={styles.pinText}>✦</Text></View></Pressable>)}
      <View style={styles.playerMarker}><View style={styles.playerHalo} /><View style={styles.playerCore} /></View>
      <Pressable onPress={onRecenter} style={({ pressed }) => [styles.recenterButton, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.7 }]}><Text style={[styles.recenterIcon, { color: colors.primary }]}>◎</Text><Text style={[styles.recenterText, { color: colors.foreground }]}>موقعي</Text></Pressable>
      <Text style={[styles.footer, { color: colors.muted }]}>على الهاتف ستظهر خريطة النظام الحقيقية بعلامات GPS</Text>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, minHeight: 280, borderRadius: 26, overflow: "hidden" }, water: { ...StyleSheet.absoluteFillObject }, roadOne: { position: "absolute", width: "150%", height: 16, transform: [{ rotate: "-24deg" }], left: "-20%", top: "55%" }, roadTwo: { position: "absolute", width: "120%", height: 10, transform: [{ rotate: "38deg" }], left: "-10%", top: "37%" }, topOverlay: { position: "absolute", top: 14, left: 14, right: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, livePill: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(7,25,39,0.86)", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 7 }, liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#49D17D", marginRight: 6 }, liveText: { color: "#F4F8FC", fontSize: 11, fontWeight: "800" }, gpsText: { color: "#F4F8FC", fontSize: 11, fontWeight: "800", backgroundColor: "rgba(7,25,39,0.72)", paddingHorizontal: 9, paddingVertical: 7, borderRadius: 10 }, pin: { position: "absolute", width: 34, height: 34, alignItems: "center", justifyContent: "center" }, pinCore: { width: 28, height: 28, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#FFFFFF" }, selectedPin: { transform: [{ scale: 1.2 }] }, pinText: { color: "#071421", fontSize: 14, fontWeight: "900" }, playerMarker: { position: "absolute", left: "48%", top: "49%", width: 28, height: 28, alignItems: "center", justifyContent: "center" }, playerHalo: { position: "absolute", width: 27, height: 27, borderRadius: 15, backgroundColor: "rgba(53,194,212,0.28)" }, playerCore: { width: 13, height: 13, borderRadius: 8, backgroundColor: "#35C2D4", borderWidth: 3, borderColor: "#E6FBFF" }, recenterButton: { position: "absolute", right: 14, bottom: 14, flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 8 }, recenterIcon: { fontSize: 18, marginRight: 5 }, recenterText: { fontSize: 11, fontWeight: "800" }, footer: { position: "absolute", left: 14, bottom: 14, color: "#304B60", fontSize: 10 }, });
