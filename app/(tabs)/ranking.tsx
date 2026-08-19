import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

export default function RankingScreen() {
  const colors = useColors();
  const { isAuthenticated } = useAuth();
  const leaderboard = trpc.game.leaderboard.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
  const entries = leaderboard.data ?? [];

  return (
    <ScreenContainer edges={["top", "left", "right"]} containerClassName="bg-background">
      <View style={styles.root}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>WORLDQUEST / RANKING</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>أثر المستكشفين</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>ترتيب مبني على تقدم حقيقي تمت مزامنته مع الحساب، بلا نتائج تجريبية أو لاعبين وهميين.</Text>

        {!isAuthenticated ? (
          <View style={[styles.notice, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.noticeTitle, { color: colors.foreground }]}>سجّل الدخول لفتح الترتيب</Text>
            <Text style={[styles.noticeBody, { color: colors.muted }]}>يحتاج الترتيب إلى حساب حتى تُنسب النقاط إلى صاحبها وتحفظ خصوصية بياناتك.</Text>
          </View>
        ) : leaderboard.isLoading ? (
          <View style={styles.center}><ActivityIndicator color={colors.primary} /><Text style={[styles.loading, { color: colors.muted }]}>جارٍ تحميل سجل المستكشفين</Text></View>
        ) : leaderboard.isError ? (
          <View style={[styles.notice, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.noticeTitle, { color: colors.foreground }]}>المزامنة غير متاحة حالياً</Text>
            <Text style={[styles.noticeBody, { color: colors.muted }]}>يمكنك متابعة اللعب دون اتصال. سيظهر الترتيب عند توفر الخادم وترحيل جدول التقدم.</Text>
          </View>
        ) : entries.length === 0 ? (
          <View style={[styles.notice, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.noticeTitle, { color: colors.foreground }]}>لا توجد نتائج بعد</Text>
            <Text style={[styles.noticeBody, { color: colors.muted }]}>اجمع أول نقطة استكشاف وسجّل تقدمك ليظهر أثر رحلتك في الترتيب.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {entries.map((entry) => (
              <View key={`${entry.rank}-${entry.name}`} style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.rank, { color: entry.rank <= 3 ? colors.warning : colors.muted }]}>#{entry.rank}</Text>
                <View style={styles.copy}><Text style={[styles.name, { color: colors.foreground }]}>{entry.name}</Text><Text style={[styles.meta, { color: colors.muted }]}>{entry.visitedCount} زيارات · {entry.coins} عملة</Text></View>
                <View style={styles.score}><Text style={[styles.xp, { color: colors.primary }]}>{entry.xp}</Text><Text style={[styles.meta, { color: colors.muted }]}>XP</Text></View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 18, paddingTop: 20 },
  eyebrow: { fontSize: 11, letterSpacing: 2, fontWeight: "800" },
  title: { fontSize: 30, fontWeight: "800", marginTop: 8 },
  subtitle: { fontSize: 13, lineHeight: 21, marginTop: 8 },
  notice: { borderWidth: 1, borderRadius: 20, padding: 18, marginTop: 26 },
  noticeTitle: { fontSize: 16, fontWeight: "800" },
  noticeBody: { fontSize: 12, lineHeight: 19, marginTop: 8 },
  center: { alignItems: "center", justifyContent: "center", paddingVertical: 70 },
  loading: { fontSize: 12, marginTop: 10 },
  list: { gap: 10, marginTop: 24 },
  row: { borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: "row", alignItems: "center" },
  rank: { width: 38, fontSize: 16, fontWeight: "800" },
  copy: { flex: 1 },
  name: { fontSize: 14, fontWeight: "800" },
  meta: { fontSize: 10, marginTop: 4 },
  score: { alignItems: "flex-end" },
  xp: { fontSize: 18, fontWeight: "800" },
});
