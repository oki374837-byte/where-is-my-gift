import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { GAME_CHARACTERS, type GameCharacter } from "@/lib/characters";
import { GAME_MAPS, type GameMapId, type RealityMode } from "@/lib/map-worlds";

export function WorldSetupModal({
  visible,
  initialCharacter,
  initialMap,
  initialMode,
  required,
  onComplete,
}: {
  visible: boolean;
  initialCharacter: GameCharacter;
  initialMap: GameMapId;
  initialMode: RealityMode;
  required?: boolean;
  onComplete: (character: GameCharacter, mapId: GameMapId, mode: RealityMode) => void;
}) {
  const [step, setStep] = useState<"map" | "character" | "mode">("map");
  const [mapId, setMapId] = useState<GameMapId>(initialMap);
  const [character, setCharacter] = useState<GameCharacter>(initialCharacter);
  const [mode, setMode] = useState<RealityMode>(initialMode);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => !required && onComplete(character, mapId, mode)}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.kicker}>أين هديتي؟ · إعداد الرحلة</Text>
          <Text style={styles.title}>{step === "map" ? "اختر الماب" : step === "character" ? "اختر شخصيتك" : "اختر طريقة عرض العالم"}</Text>
          <Text style={styles.subtitle}>{step === "map" ? "ثلاث مدن فقط في هذه النسخة، وكلها بلا وحوش." : step === "character" ? "الشخصيات أصلية مستوحاة من الأنمي والكرتون والرياضة والسينما." : "يمكنك تبديل الوضع لاحقاً من شاشة الواقع المعزز."}</Text>

          {step === "map" && <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {GAME_MAPS.map((map) => <Pressable key={map.id} onPress={() => setMapId(map.id)} style={[styles.mapCard, map.id === mapId && { borderColor: map.accent, backgroundColor: "rgba(34,197,94,0.16)" }]}>
              <View style={[styles.mapBadge, { backgroundColor: map.accent }]}><Text style={styles.mapBadgeText}>{map.city.slice(0, 1)}</Text></View>
              <View style={styles.copy}><Text style={styles.mapName}>{map.name}</Text><Text style={styles.meta}>{map.subtitle} · {map.landmarks.length} نقاط استكشاف</Text><Text style={styles.description}>{map.description}</Text><Text style={styles.story}>{map.story}</Text><Text style={styles.safety}>{map.safetyNote}</Text></View>
              {map.id === mapId && <Text style={styles.check}>✓</Text>}
            </Pressable>)}
          </ScrollView>}

          {step === "character" && <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {GAME_CHARACTERS.map((item) => <Pressable key={item.id} onPress={() => setCharacter(item)} style={[styles.characterCard, item.id === character.id && { borderColor: item.color, backgroundColor: "rgba(34,197,94,0.16)" }]}>
              <Text style={styles.emoji}>{item.emoji}</Text><View style={styles.copy}><Text style={styles.mapName}>{item.name}</Text><Text style={styles.meta}>{item.category} · {item.roleLabel}</Text><Text style={styles.description}>{item.description}</Text></View>{item.id === character.id && <Text style={styles.check}>✓</Text>}
            </Pressable>)}
          </ScrollView>}

          {step === "mode" && <View style={styles.modeList}>
            <Pressable onPress={() => setMode("real-world")} style={[styles.modeCard, mode === "real-world" && styles.modeActive]}><Text style={styles.modeIcon}>📍</Text><View style={styles.copy}><Text style={styles.mapName}>الواقع المعزز الحقيقي</Text><Text style={styles.description}>يعتمد على موقع GPS والكاميرا واتجاه الهاتف لعرض النقاط حولك.</Text></View></Pressable>
            <Pressable onPress={() => setMode("game-world")} style={[styles.modeCard, mode === "game-world" && styles.modeActive]}><Text style={styles.modeIcon}>🗺️</Text><View style={styles.copy}><Text style={styles.mapName}>عالم اللعبة المعزز</Text><Text style={styles.description}>يعرض عالم اللعبة فوق المشهد مع نقاط وشخصيات افتراضية قابلة للتفاعل.</Text></View></Pressable>
          </View>}

          <View style={styles.actions}>
            {step !== "map" && <Pressable onPress={() => setStep(step === "mode" ? "character" : "map")} style={styles.back}><Text style={styles.backText}>رجوع</Text></Pressable>}
            <Pressable onPress={() => step === "map" ? setStep("character") : step === "character" ? setStep("mode") : onComplete(character, mapId, mode)} style={styles.next}><Text style={styles.nextText}>{step === "mode" ? "ابدأ الرحلة" : "التالي"}</Text></Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({ overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.82)", justifyContent: "center", padding: 16 }, card: { backgroundColor: "#0B2B15", borderRadius: 24, borderWidth: 2, borderColor: "#22C55E", padding: 18, maxHeight: "88%" }, kicker: { color: "#86EFAC", fontSize: 11, fontWeight: "800", textAlign: "center" }, title: { color: "#FEF08A", fontSize: 24, fontWeight: "900", textAlign: "center", marginTop: 8 }, subtitle: { color: "#A7F3D0", fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 6, marginBottom: 14 }, list: { maxHeight: 420 }, listContent: { gap: 10, paddingBottom: 8 }, mapCard: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.18)", borderRadius: 16, padding: 12 }, characterCard: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.18)", borderRadius: 16, padding: 11 }, mapBadge: { width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center" }, mapBadgeText: { color: "#052E16", fontSize: 22, fontWeight: "900" }, emoji: { fontSize: 34, width: 46, textAlign: "center" }, copy: { flex: 1, marginHorizontal: 10 }, mapName: { color: "#FFF", fontSize: 15, fontWeight: "900" }, meta: { color: "#A7F3D0", fontSize: 10, marginTop: 3 }, description: { color: "#CBD5E1", fontSize: 10, lineHeight: 15, marginTop: 5 }, story: { color: "#FEF08A", fontSize: 10, lineHeight: 15, marginTop: 5 }, safety: { color: "#94A3B8", fontSize: 9, lineHeight: 14, marginTop: 3 }, check: { color: "#86EFAC", fontSize: 24, fontWeight: "900" }, modeList: { gap: 10, paddingBottom: 10 }, modeCard: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.18)", borderRadius: 16, padding: 14 }, modeActive: { borderColor: "#22C55E", backgroundColor: "rgba(34,197,94,0.16)" }, modeIcon: { fontSize: 30, width: 42, textAlign: "center" }, actions: { flexDirection: "row", gap: 10, marginTop: 14 }, back: { flex: 1, borderRadius: 14, paddingVertical: 13, alignItems: "center", backgroundColor: "rgba(255,255,255,0.1)" }, backText: { color: "#CBD5E1", fontWeight: "800" }, next: { flex: 2, borderRadius: 14, paddingVertical: 13, alignItems: "center", backgroundColor: "#22C55E" }, nextText: { color: "#052E16", fontWeight: "900", fontSize: 15 } });
