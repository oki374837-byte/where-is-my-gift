import { FlatList, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useGameState } from "@/lib/game-state";

const ACHIEVEMENTS = [
  { id: "first", title: "البداية", detail: "اكتشف أول نقطة في العالم", target: 1, icon: "✓" },
  { id: "walker", title: "خطوات واسعة", detail: "اقطع مسافة 5 كيلومترات", target: 5000, icon: "↗" },
  { id: "collector", title: "جامع الأسرار", detail: "اجمع 10 عناصر مختلفة", target: 10, icon: "✦" },
];

export default function AchievementsScreen() {
  const colors = useColors();
  const { state: gameState } = useGameState();
  const collectedItems = Object.values(gameState.inventory).reduce((total, amount) => total + amount, 0);
  const values = { first: gameState.visitedCount, walker: gameState.distanceWalkedMeters, collector: collectedItems };
  const rows = ACHIEVEMENTS.map((item) => { const value = values[item.id as keyof typeof values]; const done = value >= item.target; const progress = item.id === "walker" ? `${(value / 1000).toFixed(1)} / 5 كم` : `${Math.min(value, item.target)} / ${item.target}`; return { ...item, done, progress }; });
  const completion = Math.round((rows.filter((item) => item.done).length / rows.length) * 100);
  return (
    <ScreenContainer className="p-5">
      <Text style={[styles.kicker, { color: colors.primary }]}>PROGRESS LOG</Text><Text style={[styles.title, { color: colors.foreground }]}>إنجازاتك</Text>
      <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.heroLabel, { color: colors.muted }]}>مجموع التقدم</Text><Text style={[styles.heroValue, { color: colors.warning }]}>{completion}%</Text><View style={[styles.track, { backgroundColor: colors.border }]}><View style={[styles.fill, { backgroundColor: colors.warning, width: `${completion}%` }]} /></View><Text style={[styles.heroHint, { color: colors.muted }]}>استمر في استكشاف النقاط المحيطة بك.</Text></View>
      <View style={styles.stats}><View><Text style={[styles.statValue, { color: colors.foreground }]}>{(gameState.distanceWalkedMeters / 1000).toFixed(1)}</Text><Text style={[styles.statLabel, { color: colors.muted }]}>كم مقطوعة</Text></View><View><Text style={[styles.statValue, { color: colors.foreground }]}>{gameState.visitedCount}</Text><Text style={[styles.statLabel, { color: colors.muted }]}>مواقع مكتشفة</Text></View><View><Text style={[styles.statValue, { color: colors.foreground }]}>{collectedItems}</Text><Text style={[styles.statLabel, { color: colors.muted }]}>عنصر مجموع</Text></View></View>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>الشارات</Text>
      <FlatList data={rows} keyExtractor={(item) => item.id} contentContainerStyle={{ gap: 10, paddingTop: 10 }} renderItem={({ item }) => <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={[styles.badge, { backgroundColor: item.done ? `${colors.warning}30` : colors.background }]}><Text style={{ color: item.done ? colors.warning : colors.muted, fontSize: 19 }}>{item.icon}</Text></View><View style={{ flex: 1, marginLeft: 12 }}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{item.title}</Text><Text style={[styles.rowDetail, { color: colors.muted }]}>{item.detail}</Text></View><Text style={[styles.progress, { color: item.done ? colors.success : colors.muted }]}>{item.progress}</Text></View>} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({ kicker: { fontSize: 11, letterSpacing: 2, fontWeight: "800" }, title: { fontSize: 30, fontWeight: "800", marginTop: 3, marginBottom: 18 }, hero: { borderWidth: 1, borderRadius: 20, padding: 16 }, heroLabel: { fontSize: 12 }, heroValue: { fontSize: 32, fontWeight: "800", marginTop: 3 }, track: { height: 6, borderRadius: 4, overflow: "hidden", marginTop: 12 }, fill: { height: 6, borderRadius: 4 }, heroHint: { fontSize: 11, marginTop: 10 }, stats: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 20 }, statValue: { fontSize: 22, fontWeight: "800" }, statLabel: { fontSize: 10, marginTop: 3 }, sectionTitle: { fontSize: 18, fontWeight: "800" }, row: { borderWidth: 1, borderRadius: 18, padding: 12, flexDirection: "row", alignItems: "center" }, badge: { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center" }, rowTitle: { fontSize: 14, fontWeight: "800" }, rowDetail: { fontSize: 10, marginTop: 4 }, progress: { fontSize: 11, fontWeight: "800" }, });
