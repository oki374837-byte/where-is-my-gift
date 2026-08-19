import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { CURRENT_GAME_VERSION, GAME_UPDATES } from "@/lib/game-updates";
import { GAME_UPDATE_LINKS } from "@/lib/update-links";

export function GameUpdatesCard() {
  const [visible, setVisible] = useState(false);
  const latest = GAME_UPDATES[0];

  const openUpdateLink = async (url: string, channel: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        throw new Error("unsupported-url");
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert("تعذر فتح رابط التحديث", `لم يتمكن الهاتف من فتح رابط ${channel}. حاول مرة أخرى أو استخدم الخيار الآخر.`);
    }
  };

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="فتح سجل تحديثات اللعبة"
      >
        <View style={styles.iconWrap}>
          <Ionicons name="sparkles" size={18} color="#FEF08A" />
        </View>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>تحديث جديد · {CURRENT_GAME_VERSION}</Text>
          <Text style={styles.title}>{latest?.title ?? "تحديثات اللعبة"}</Text>
          <Text style={styles.summary} numberOfLines={1}>{latest?.summary}</Text>
        </View>
        <Ionicons name="chevron-back" size={18} color="#BBF7D0" />
      </Pressable>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>سجل الرحلة</Text>
                <Text style={styles.modalTitle}>آخر تحديثات اللعبة</Text>
              </View>
              <Pressable onPress={() => setVisible(false)} style={styles.closeButton} accessibilityLabel="إغلاق سجل التحديثات">
                <Ionicons name="close" size={22} color="#E2E8F0" />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
              {GAME_UPDATES.map((update, index) => (
                <View key={update.id} style={[styles.update, index === 0 && styles.latestUpdate]}>
                  <View style={styles.updateTop}>
                    <View style={styles.versionPill}><Text style={styles.versionText}>{update.version}</Text></View>
                    <Text style={styles.date}>{update.date}</Text>
                  </View>
                  <Text style={styles.updateTitle}>{update.title}</Text>
                  <Text style={styles.updateSummary}>{update.summary}</Text>
                  {update.highlights.map((highlight) => (
                    <View key={highlight} style={styles.highlightRow}>
                      <Ionicons name="checkmark-circle" size={15} color="#4ADE80" />
                      <Text style={styles.highlight}>{highlight}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>
            <View style={styles.updateActions}>
              <Pressable
                onPress={() => void openUpdateLink(GAME_UPDATE_LINKS.manualApk, "APK")}
                style={({ pressed }) => [styles.manualUpdateButton, pressed && styles.actionPressed]}
                accessibilityRole="button"
                accessibilityLabel="تنزيل تحديث اللعبة يدويًا بصيغة APK"
              >
                <Ionicons name="download-outline" size={17} color="#052E16" />
                <Text style={styles.manualUpdateText}>تحديث APK يدويًا</Text>
              </Pressable>
              <Pressable
                onPress={() => void openUpdateLink(GAME_UPDATE_LINKS.googlePlay, "Google Play")}
                style={({ pressed }) => [styles.storeUpdateButton, pressed && styles.actionPressed]}
                accessibilityRole="button"
                accessibilityLabel="فتح صفحة اللعبة في Google Play لتحديثها"
              >
                <Ionicons name="logo-google" size={17} color="#E2E8F0" />
                <Text style={styles.storeUpdateText}>Google Play</Text>
              </Pressable>
            </View>
            <Text style={styles.updateHint}>يفتح APK صفحة أحدث بناء Android، ثم يؤكد اللاعب التثبيت من النظام. يعمل خيار Google Play بعد نشر اللعبة هناك.</Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(7, 40, 24, 0.94)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(74, 222, 128, 0.6)",
    paddingHorizontal: 11,
    paddingVertical: 10,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  pressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
  iconWrap: { width: 34, height: 34, borderRadius: 12, backgroundColor: "rgba(250, 204, 21, 0.18)", alignItems: "center", justifyContent: "center" },
  copy: { flex: 1, marginHorizontal: 9 },
  eyebrow: { color: "#86EFAC", fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  title: { color: "#FFF", fontSize: 13, fontWeight: "800", marginTop: 2 },
  summary: { color: "#BBF7D0", fontSize: 10, marginTop: 2 },
  overlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.68)", justifyContent: "flex-end" },
  modalCard: { maxHeight: "82%", backgroundColor: "#071A12", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 28, borderTopWidth: 1, borderColor: "rgba(74, 222, 128, 0.42)" },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  modalEyebrow: { color: "#86EFAC", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  modalTitle: { color: "#FFF", fontSize: 22, fontWeight: "900", marginTop: 3 },
  closeButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255, 255, 255, 0.08)", alignItems: "center", justifyContent: "center" },
  list: { paddingBottom: 10 },
  update: { padding: 15, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", marginBottom: 10 },
  latestUpdate: { backgroundColor: "rgba(22, 101, 52, 0.3)", borderColor: "rgba(74, 222, 128, 0.55)" },
  updateTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  versionPill: { backgroundColor: "#22C55E", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  versionText: { color: "#052E16", fontSize: 10, fontWeight: "900" },
  date: { color: "#94A3B8", fontSize: 10 },
  updateTitle: { color: "#FFF", fontSize: 16, fontWeight: "900", marginTop: 12 },
  updateSummary: { color: "#CBD5E1", fontSize: 12, lineHeight: 19, marginTop: 5, textAlign: "right" },
  highlightRow: { flexDirection: "row", alignItems: "flex-start", marginTop: 8, gap: 6 },
  highlight: { color: "#E2E8F0", flex: 1, fontSize: 11, lineHeight: 17, textAlign: "right" },
  updateActions: { flexDirection: "row", gap: 8, marginTop: 14 },
  manualUpdateButton: { flex: 1, minHeight: 44, borderRadius: 13, backgroundColor: "#4ADE80", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 8 },
  manualUpdateText: { color: "#052E16", fontSize: 11, fontWeight: "900" },
  storeUpdateButton: { flex: 1, minHeight: 44, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.09)", borderWidth: 1, borderColor: "rgba(226,232,240,0.22)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 8 },
  storeUpdateText: { color: "#E2E8F0", fontSize: 11, fontWeight: "900" },
  actionPressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
  updateHint: { color: "#94A3B8", fontSize: 10, lineHeight: 15, textAlign: "center", marginTop: 8 },
});
