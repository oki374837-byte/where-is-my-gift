import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useGameState } from "@/lib/game-state";

type StoreItem = { id: string; name: string; description: string; price: number; color: string; icon: string; type: string };
const STORE_ITEMS: StoreItem[] = [
  { id: "crystal", name: "بلورة الفجر", description: "عنصر نادر يعزز مكافآت الاستكشاف.", price: 30, color: "#F5B84B", icon: "✦", type: "عنصر نادر" },
  { id: "map", name: "شظية خريطة", description: "تكشف نقطة استكشاف قريبة.", price: 20, color: "#35C2D4", icon: "◇", type: "أداة استكشاف" },
  { id: "seed", name: "بذرة الغابة", description: "مكوّن يستخدم في الوصفات القادمة.", price: 15, color: "#49D17D", icon: "❋", type: "مكوّن" },
];

export default function StoreScreen() {
  const colors = useColors();
  const { state: gameState, addItem, spendCoins } = useGameState();
  const [notice, setNotice] = useState("");
  const coins = gameState.coins;
  const owned = gameState.inventory;
  const buy = (item: StoreItem) => {
    if (!spendCoins(item.price)) {
      setNotice("رصيد العملات غير كافٍ");
      return;
    }
    addItem(item.id);
    setNotice(`تم شراء ${item.name}`);
  };
  return <ScreenContainer className="p-5"><ScrollView contentContainerStyle={{ paddingBottom: 28 }}><View style={styles.header}><View><Text style={[styles.kicker, { color: colors.primary }]}>EXPLORER MARKET</Text><Text style={[styles.title, { color: colors.foreground }]}>المتجر</Text></View><View style={[styles.balance, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.balanceLabel, { color: colors.muted }]}>الرصيد</Text><Text style={[styles.balanceValue, { color: colors.warning }]}>{coins} ◈</Text></View></View>{notice ? <View style={[styles.notice, { backgroundColor: `${colors.primary}18` }]}><Text style={{ color: colors.primary, fontSize: 12, fontWeight: "800", textAlign: "center" }}>{notice}</Text></View> : null}<Text style={[styles.intro, { color: colors.muted }]}>استخدم العملات التي تجمعها من نقاط الاستكشاف لتجهيز رحلتك.</Text>{STORE_ITEMS.map((item) => <View key={item.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={[styles.icon, { backgroundColor: `${item.color}22` }]}><Text style={{ color: item.color, fontSize: 28 }}>{item.icon}</Text></View><View style={styles.copy}><Text style={[styles.itemName, { color: colors.foreground }]}>{item.name}</Text><Text style={[styles.type, { color: item.color }]}>{item.type}</Text><Text style={[styles.description, { color: colors.muted }]}>{item.description}</Text><Text style={[styles.owned, { color: colors.muted }]}>في المخزون: {owned[item.id] ?? 0}</Text></View><Pressable onPress={() => buy(item)} style={({ pressed }) => [styles.buy, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}><Text style={styles.buyText}>{item.price} ◈</Text><Text style={styles.buyLabel}>شراء</Text></Pressable></View>)}</ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({ header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 18 }, kicker: { fontSize: 11, letterSpacing: 2, fontWeight: "800" }, title: { fontSize: 30, fontWeight: "800", marginTop: 3 }, balance: { borderWidth: 1, borderRadius: 15, paddingHorizontal: 12, paddingVertical: 8, alignItems: "center" }, balanceLabel: { fontSize: 10 }, balanceValue: { fontSize: 15, fontWeight: "900", marginTop: 2 }, intro: { fontSize: 12, lineHeight: 19, marginBottom: 16 }, notice: { borderRadius: 12, padding: 10, marginBottom: 12 }, card: { borderWidth: 1, borderRadius: 20, padding: 13, flexDirection: "row", alignItems: "center", marginBottom: 10 }, icon: { width: 58, height: 58, borderRadius: 17, alignItems: "center", justifyContent: "center" }, copy: { flex: 1, marginHorizontal: 11 }, itemName: { fontSize: 15, fontWeight: "800" }, type: { fontSize: 10, fontWeight: "800", marginTop: 3 }, description: { fontSize: 10, lineHeight: 15, marginTop: 5 }, owned: { fontSize: 10, marginTop: 4 }, buy: { borderRadius: 12, minWidth: 60, paddingVertical: 9, alignItems: "center" }, buyText: { color: "#071421", fontSize: 11, fontWeight: "900" }, buyLabel: { color: "#071421", fontSize: 10, fontWeight: "800", marginTop: 2 } });
