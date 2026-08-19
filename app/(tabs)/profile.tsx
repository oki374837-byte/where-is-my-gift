import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useEffect, useState } from "react";
import { router } from "expo-router";

import { CharacterSelectModal } from "@/components/CharacterSelectModal";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { useDeviceActivity } from "@/hooks/use-device-activity";
import { disableExplorationReminder, enableExplorationReminder } from "@/lib/notifications";
import { loadSelectedCharacter, saveSelectedCharacter } from "@/lib/character-storage";
import { GAME_CHARACTERS, type GameCharacter } from "@/lib/characters";
import { useGameState } from "@/lib/game-state";
import { startOAuthLogin } from "@/constants/oauth";
import { getCharacterLevel, getLevelProgress, getCharacterStats } from "@/lib/character-progression";
import { DEFAULT_PREFERENCES, loadPreferences, savePreferences, type AppPreferences } from "@/lib/app-preferences";

function directionLabel(heading: number | null) {
  if (heading === null) return "غير متاح";
  if (heading < 22.5 || heading >= 337.5) return "شمال";
  if (heading < 67.5) return "شمال شرقي";
  if (heading < 112.5) return "شرق";
  if (heading < 157.5) return "جنوب شرقي";
  if (heading < 202.5) return "جنوب";
  if (heading < 247.5) return "جنوب غربي";
  if (heading < 292.5) return "غرب";
  return "شمال غربي";
}

export default function ProfileScreen() {
  const colors = useColors();
  const activity = useDeviceActivity();
  const { state: gameState, claimDailyReward } = useGameState();
  const { user, isAuthenticated, logout } = useAuth();
  const [preferences, setPreferences] = useState<AppPreferences>(DEFAULT_PREFERENCES);
  const [remindersEnabled, setRemindersEnabled] = useState(DEFAULT_PREFERENCES.notificationsEnabled);
  const [characterModalVisible, setCharacterModalVisible] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<GameCharacter>(GAME_CHARACTERS[0]);
  const [accountNotice, setAccountNotice] = useState("");
  const [dailyNotice, setDailyNotice] = useState("");
  const level = getCharacterLevel(gameState.xp);
  const progress = getLevelProgress(gameState.xp);
  const levelXp = progress.current;
  const levelProgress = `${progress.percent}%` as `${number}%`;
  const characterStats = getCharacterStats(selectedCharacter, gameState.xp);

  useEffect(() => {
    let active = true;
    void loadSelectedCharacter(user?.id).then((character) => {
      if (active) setSelectedCharacter(character);
    });
    void loadPreferences().then((loaded) => {
      if (active) {
        setPreferences(loaded);
        setRemindersEnabled(loaded.notificationsEnabled);
      }
    });
    return () => {
      active = false;
    };
  }, [user?.id]);

  const handleCharacterChange = async (character: GameCharacter) => {
    setSelectedCharacter(character);
    await saveSelectedCharacter(character, user?.id);
    setCharacterModalVisible(false);
    setAccountNotice(`تم اختيار ${character.name} لشخصيتك في اللعبة.`);
  };

  const handleLogout = () => {
    Alert.alert(
      "تسجيل الخروج",
      "سيتم إنهاء جلسة الحساب فقط. لن يتم حذف تقدم اللعب المحفوظ على هذا الجهاز.",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "تسجيل الخروج",
          style: "destructive",
          onPress: () => {
            void logout().then(() => {
              setAccountNotice("تم تسجيل الخروج بأمان. يمكنك تسجيل الدخول بحساب آخر.");
            });
          },
        },
      ],
    );
  };

  const handleChangeUser = () => {
    Alert.alert(
      "تغيير المستخدم",
      isAuthenticated
        ? "سيتم تسجيل الخروج من الحساب الحالي وفتح صفحة اختيار حساب آخر. سيبقى تقدم اللعب المحلي محفوظًا."
        : "ستفتح صفحة اختيار حساب جديد، بينما يبقى تقدم اللعب المحلي محفوظًا.",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "متابعة",
          onPress: () => {
            void (async () => {
              try {
                if (isAuthenticated) await logout();
                await startOAuthLogin();
              } catch {
                setAccountNotice("تعذر فتح بوابة الحساب الآن. تحقق من الاتصال وحاول مرة أخرى.");
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <ScreenContainer className="p-5">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
        <Text style={[styles.kicker, { color: colors.primary }]}>PLAYER PROFILE</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>ملف المستكشف</Text>

        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: `${selectedCharacter.color}25`, borderColor: selectedCharacter.color }]}>
            <Text style={styles.avatarEmoji}>{selectedCharacter.emoji}</Text>
          </View>
          <Text style={[styles.name, { color: colors.foreground }]}>{user?.name || selectedCharacter.name}</Text>
          <Text style={[styles.handle, { color: colors.muted }]}>
            {user?.email || (isAuthenticated ? "حساب متصل" : "مستكشف محلي على هذا الجهاز")}
          </Text>
          <Text style={[styles.classLabel, { color: selectedCharacter.color }]}>{selectedCharacter.roleLabel} · {selectedCharacter.skill}</Text>
          <Pressable
            onPress={() => setCharacterModalVisible(true)}
            style={({ pressed }) => [styles.characterButton, { borderColor: selectedCharacter.color, opacity: pressed ? 0.75 : 1 }]}
          >
            <Text style={[styles.characterButtonText, { color: selectedCharacter.color }]}>تغيير الشخصية · {selectedCharacter.name}</Text>
          </Pressable>
          <View style={styles.levelLine}>
            <Text style={[styles.levelText, { color: colors.warning }]}>المستوى {String(level).padStart(2, "0")}</Text>
            <Text style={[styles.levelText, { color: colors.muted }]}>{levelXp} / 300 XP</Text>
          </View>
          <View style={[styles.track, { backgroundColor: colors.border }]}><View style={[styles.fill, { backgroundColor: colors.warning, width: levelProgress }]} /></View>
          <View style={styles.statsGrid}>
            {[
              ["القوة", characterStats.power],
              ["الاكتشاف", characterStats.discovery],
              ["الدفاع", characterStats.defense],
              ["السرعة", characterStats.speed],
            ].map(([label, value]) => <View key={String(label)} style={[styles.statBox, { borderColor: `${selectedCharacter.color}55` }]}><Text style={[styles.statValue, { color: selectedCharacter.color }]}>{value}</Text><Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text></View>)}
          </View>
        </View>

        {accountNotice ? <View style={[styles.notice, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}40` }]}><Text style={[styles.noticeText, { color: colors.primary }]}>{accountNotice}</Text></View> : null}

        <View style={[styles.dailyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.dailyCopy}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 0 }]}>مكافأة اليوم</Text>
            <Text style={[styles.settingHint, { color: colors.muted }]}>سلسلة الدخول الحالية: {gameState.dailyStreak} يوم · 25 XP ومكافآت عملات متزايدة</Text>
          </View>
          <Pressable onPress={() => {
            const result = claimDailyReward();
            setDailyNotice(result.claimed ? `تم استلام المكافأة: +${result.coins} عملة و+${result.xp} XP · السلسلة ${result.streak}` : "تم استلام مكافأة اليوم بالفعل.");
          }} style={({ pressed }) => [styles.dailyButton, { backgroundColor: colors.primary, opacity: pressed ? 0.75 : 1 }]}>
            <Text style={styles.oauthButtonText}>استلام المكافأة</Text>
          </Pressable>
          {dailyNotice ? <Text style={[styles.noticeText, { color: colors.primary, marginTop: 10 }]}>{dailyNotice}</Text> : null}
        </View>

        <View style={[styles.oauthCard, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}45` }]}>
          <Text style={[styles.oauthTitle, { color: colors.foreground }]}>{isAuthenticated ? "إدارة الحساب والمنصات" : "إنشاء حساب للعبة"}</Text>
          <Text style={[styles.oauthBody, { color: colors.muted }]}>سجّل أو بدّل الحساب عبر Google أو Apple أو Microsoft أو GitHub أو البريد الإلكتروني. سيعود التطبيق تلقائياً بعد اكتمال تسجيل الدخول.</Text>
          <View style={styles.providerRow}>
            {["Google", "Apple", "Microsoft", "GitHub", "Email"].map((provider) => <View key={provider} style={[styles.providerPill, { borderColor: `${colors.primary}55` }]}><Text style={[styles.providerText, { color: colors.primary }]}>{provider}</Text></View>)}
          </View>
          <Pressable onPress={handleChangeUser} style={({ pressed }) => [styles.oauthButton, { backgroundColor: colors.primary, opacity: pressed ? 0.75 : 1 }]}><Text style={styles.oauthButtonText}>{isAuthenticated ? "تغيير الحساب" : "إنشاء حساب / تسجيل الدخول"}</Text></Pressable>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>الحساب والمستخدم</Text>
        <View style={[styles.accountCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.accountHeader}>
            <View style={[styles.statusDot, { backgroundColor: isAuthenticated ? colors.success : colors.warning }]} />
            <View style={styles.accountCopy}>
              <Text style={[styles.settingTitle, { color: colors.foreground }]}>{isAuthenticated ? "الحساب متصل" : "اللعب المحلي مفعّل"}</Text>
              <Text style={[styles.settingHint, { color: colors.muted }]}>{isAuthenticated ? (user?.email || user?.name || "جلسة نشطة") : "يمكنك اللعب دون حساب وربط حساب آخر متى شئت"}</Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Pressable onPress={handleChangeUser} style={({ pressed }) => [styles.accountAction, { opacity: pressed ? 0.7 : 1 }]}>
            <View><Text style={[styles.settingTitle, { color: colors.primary }]}>{isAuthenticated ? "تغيير المستخدم" : "تسجيل الدخول / تغيير المستخدم"}</Text><Text style={[styles.settingHint, { color: colors.muted }]}>فتح بوابة اختيار الحساب مع الاحتفاظ بالتقدم المحلي</Text></View>
            <Text style={[styles.arrow, { color: colors.primary }]}>‹</Text>
          </Pressable>
          {isAuthenticated ? <>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Pressable onPress={handleLogout} style={({ pressed }) => [styles.accountAction, { opacity: pressed ? 0.7 : 1 }]}>
              <View><Text style={[styles.settingTitle, { color: colors.error }]}>تسجيل الخروج</Text><Text style={[styles.settingHint, { color: colors.muted }]}>إنهاء الجلسة دون حذف تقدم اللعبة من الجهاز</Text></View>
              <Text style={[styles.logoutIcon, { color: colors.error }]}>↪</Text>
            </Pressable>
          </> : null}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>نشاط الرحلة</Text>
        <View style={[styles.activityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.activityRow}><View><Text style={[styles.activityLabel, { color: colors.muted }]}>الاتجاه</Text><Text style={[styles.activityValue, { color: colors.foreground }]}>{activity.heading === null ? "—" : `${Math.round(activity.heading)}° · ${directionLabel(activity.heading)}`}</Text></View><Text style={[styles.compass, { color: colors.primary }]}>⊕</Text></View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.metrics}><View style={styles.metric}><Text style={[styles.metricValue, { color: colors.foreground }]}>{activity.speed.toFixed(1)}</Text><Text style={[styles.metricLabel, { color: colors.muted }]}>م/ث السرعة</Text></View><View style={styles.metric}><Text style={[styles.metricValue, { color: colors.foreground }]}>{Math.round(Math.max(activity.distanceWalked, gameState.distanceWalkedMeters))}</Text><Text style={[styles.metricLabel, { color: colors.muted }]}>م المسافة</Text></View><View style={styles.metric}><Text style={[styles.metricValue, { color: activity.isMoving ? colors.success : colors.muted }]}>{activity.isMoving ? "يتحرك" : "متوقف"}</Text><Text style={[styles.metricLabel, { color: colors.muted }]}>الحالة</Text></View></View>
          <Text style={[styles.sensorNote, { color: colors.muted }]}>الزيارات: {gameState.visitedCount} · زمن اللعب: {Math.round(gameState.playTimeSeconds / 60)} د. {activity.sensorStatus === "web-preview" ? "معاينة الويب لا تقرأ حساسات الهاتف." : activity.sensorStatus === "ready" ? "البوصلة والحركة مفعّلتان عند توفر الحساسات." : "الحساسات غير متاحة على هذا الجهاز."}</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>إعدادات سريعة</Text>
        <View style={[styles.settings, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.settingRow}><View><Text style={[styles.settingTitle, { color: colors.foreground }]}>الاهتزاز</Text><Text style={[styles.settingHint, { color: colors.muted }]}>تغذية لمسية عند جمع المكافآت</Text></View><Switch value={preferences.hapticsEnabled} onValueChange={(enabled) => { setPreferences((current) => ({ ...current, hapticsEnabled: enabled })); void savePreferences({ hapticsEnabled: enabled }); }} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#F4F8FC" /></View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.settingRow}><View><Text style={[styles.settingTitle, { color: colors.foreground }]}>تنبيه الاستكشاف اليومي</Text><Text style={[styles.settingHint, { color: colors.muted }]}>تذكير محلي في السادسة مساءً</Text></View><Switch value={remindersEnabled} onValueChange={async (enabled) => { setRemindersEnabled(enabled); setPreferences((current) => ({ ...current, notificationsEnabled: enabled })); if (enabled) { const granted = await enableExplorationReminder(); if (!granted) { setRemindersEnabled(false); setPreferences((current) => ({ ...current, notificationsEnabled: false })); await savePreferences({ notificationsEnabled: false }); return; } } else await disableExplorationReminder(); await savePreferences({ notificationsEnabled: enabled }); }} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#F4F8FC" /></View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Pressable onPress={() => router.push("/settings")} style={styles.settingRow}><View><Text style={[styles.settingTitle, { color: colors.foreground }]}>الإعدادات والخصوصية</Text><Text style={[styles.settingHint, { color: colors.muted }]}>تحكم في أذونات التتبع</Text></View><Text style={[styles.arrow, { color: colors.primary }]}>‹</Text></Pressable>
        </View>

        <View style={[styles.note, { backgroundColor: `${colors.primary}14` }]}><Text style={[styles.noteTitle, { color: colors.primary }]}>الواقع المعزز متاح</Text><Text style={[styles.noteBody, { color: colors.muted }]}>افتح تبويب الواقع المعزز من شريط التنقل لاستخدام الكاميرا وعرض نقاط الاستكشاف حولك.</Text></View>
      </ScrollView>
      <CharacterSelectModal visible={characterModalVisible} onSelectCharacter={handleCharacterChange} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  kicker: { fontSize: 11, letterSpacing: 2, fontWeight: "800" },
  title: { fontSize: 30, fontWeight: "800", marginTop: 3, marginBottom: 18 },
  profileCard: { borderWidth: 1, borderRadius: 22, padding: 20, alignItems: "center" },
  dailyCard: { borderWidth: 1, borderRadius: 18, padding: 16, marginTop: 16 },
  dailyCopy: { gap: 4 },
  dailyButton: { borderRadius: 12, paddingVertical: 12, alignItems: "center", marginTop: 14 },
  avatar: { width: 76, height: 76, borderRadius: 38, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  avatarEmoji: { fontSize: 34 },
  name: { fontSize: 20, fontWeight: "800", marginTop: 10 },
  handle: { fontSize: 12, marginTop: 3 },
  classLabel: { fontSize: 11, fontWeight: "800", textAlign: "center", marginTop: 8, lineHeight: 17 },
  characterButton: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginTop: 12 },
  characterButtonText: { fontSize: 11, fontWeight: "800" },
  levelLine: { width: "100%", flexDirection: "row", justifyContent: "space-between", marginTop: 18 },
  levelText: { fontSize: 11, fontWeight: "700" },
  track: { width: "100%", height: 6, borderRadius: 4, overflow: "hidden", marginTop: 8 },
  fill: { height: 6, borderRadius: 4 },
  statsGrid: { width: "100%", flexDirection: "row", gap: 7, marginTop: 14 },
  statBox: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 7, alignItems: "center" },
  statValue: { fontSize: 15, fontWeight: "900" },
  statLabel: { fontSize: 9, marginTop: 2 },
  notice: { borderWidth: 1, borderRadius: 14, padding: 11, marginTop: 12 },
  noticeText: { fontSize: 11, lineHeight: 17, textAlign: "center", fontWeight: "700" },
  sectionTitle: { fontSize: 18, fontWeight: "800", marginTop: 24, marginBottom: 10 },
  accountCard: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 15 },
  accountHeader: { minHeight: 72, flexDirection: "row", alignItems: "center" },
  statusDot: { width: 11, height: 11, borderRadius: 6, marginRight: 11 },
  accountCopy: { flex: 1 },
  accountAction: { minHeight: 68, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  activityCard: { borderWidth: 1, borderRadius: 20, padding: 15 },
  activityRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  activityLabel: { fontSize: 11 },
  activityValue: { fontSize: 17, fontWeight: "800", marginTop: 4 },
  compass: { fontSize: 34, fontWeight: "700" },
  divider: { height: 1, marginVertical: 13 },
  metrics: { flexDirection: "row", justifyContent: "space-between" },
  metric: { alignItems: "center", flex: 1 },
  metricValue: { fontSize: 15, fontWeight: "800" },
  metricLabel: { fontSize: 10, marginTop: 3, textAlign: "center" },
  sensorNote: { fontSize: 10, lineHeight: 15, textAlign: "center", marginTop: 12 },
  settings: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 15 },
  settingRow: { minHeight: 65, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  settingTitle: { fontSize: 14, fontWeight: "800" },
  settingHint: { fontSize: 10, marginTop: 4, maxWidth: 270 },
  arrow: { fontSize: 27, transform: [{ rotate: "180deg" }] },
  logoutIcon: { fontSize: 22, fontWeight: "900" },
  oauthCard: { borderWidth: 1, borderRadius: 18, padding: 15, marginTop: 16 },
  oauthTitle: { fontSize: 15, fontWeight: "900", textAlign: "right" },
  oauthBody: { fontSize: 11, lineHeight: 18, textAlign: "right", marginTop: 6 },
  providerRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10, justifyContent: "flex-end" },
  providerPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  providerText: { fontSize: 9, fontWeight: "800" },
  oauthButton: { borderRadius: 12, paddingVertical: 11, alignItems: "center", marginTop: 12 },
  oauthButtonText: { color: "#052E16", fontSize: 12, fontWeight: "900" },
  note: { borderRadius: 16, padding: 14, marginTop: 18 },
  noteTitle: { fontSize: 13, fontWeight: "800" },
  noteBody: { fontSize: 11, lineHeight: 17, marginTop: 4 },
});
