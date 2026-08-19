import React, { useState } from "react";
import { Modal, View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { GAME_CHARACTERS, GameCharacter } from "@/lib/characters";

interface CharacterSelectModalProps {
  visible: boolean;
  onSelectCharacter: (char: GameCharacter) => void;
}

export function CharacterSelectModal({ visible, onSelectCharacter }: CharacterSelectModalProps) {
  const [selected, setSelected] = useState<GameCharacter>(GAME_CHARACTERS[0]);
  const [filter, setFilter] = useState<"all" | GameCharacter["category"]>("all");
  const [roleFilter, setRoleFilter] = useState<"all" | GameCharacter["role"]>("all");

  const filtered = GAME_CHARACTERS.filter((character) =>
    (filter === "all" || character.category === filter) &&
    (roleFilter === "all" || character.role === roleFilter),
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>اختر شخصيتك المفضلة للمغامرة! 🌟</Text>
          <Text style={styles.subtitle}>اختر بطلك وفئته مثل ألعاب MMORPG لتبدأ رحلتك في العالم الحقيقي:</Text>

          {/* فلاتر التصنيف */}
          <View style={styles.filterRow}>
            {[
              { id: "all", label: "الكل" },
              { id: "anime", label: "⚡ أنمي" },
              { id: "cartoon", label: "✨ كرتون" },
              { id: "actors", label: "🎬 ممثلون" },
              { id: "football", label: "⚽ كرة قدم" },
              { id: "games", label: "🎮 ألعاب" },
              { id: "celebrities", label: "✨ مشاهير" },
            ].map(f => (
              <Pressable
                key={f.id}
                onPress={() => setFilter(f.id as "all" | GameCharacter["category"])}
                style={[styles.filterBtn, filter === f.id && styles.filterBtnActive]}
              >
                <Text style={[styles.filterText, filter === f.id && { color: "#FFF" }]}>{f.label}</Text>
              </Pressable>
            ))}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roleRow}>
            {[
              { id: "all", label: "كل الفئات" },
              { id: "warrior", label: "⚔️ محارب" },
              { id: "archer", label: "🏹 رامي" },
              { id: "mage", label: "🔮 ساحر" },
              { id: "knight", label: "🛡️ فارس" },
              { id: "assassin", label: "🗡️ قاتل" },
            ].map((role) => (
              <Pressable key={role.id} onPress={() => setRoleFilter(role.id as "all" | GameCharacter["role"])} style={[styles.roleBtn, roleFilter === role.id && styles.roleBtnActive]}>
                <Text style={[styles.filterText, roleFilter === role.id && { color: "#FFF" }]}>{role.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* قائمة الشخصيات */}
          <ScrollView style={styles.listContainer} contentContainerStyle={{ gap: 10, paddingBottom: 20 }}>
            {filtered.map(char => {
              const isSelected = selected.id === char.id;
              return (
                <Pressable
                  key={char.id}
                  onPress={() => setSelected(char)}
                  style={[
                    styles.charCard,
                    isSelected && { borderColor: char.color, backgroundColor: "rgba(20, 61, 33, 0.95)" }
                  ]}
                >
                  <Text style={styles.charEmoji}>{char.emoji}</Text>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={styles.nameRow}>
                      <Text style={styles.charName}>{char.name}</Text>
                      <Text style={[styles.rolePill, { color: char.color, borderColor: char.color }]}>{char.roleLabel}</Text>
                    </View>
                    <Text style={styles.charDesc} numberOfLines={2}>{char.description}</Text>
                    <Text style={[styles.charBonus, { color: char.color }]}>{char.bonus}</Text>
                    <Text style={styles.charSkill}>{char.skill}</Text>
                  </View>
                  {isSelected && <Text style={{ fontSize: 18 }}>✅</Text>}
                </Pressable>
              );
            })}
          </ScrollView>

          {/* زر التأكيد */}
          <Pressable
            onPress={() => onSelectCharacter(selected)}
            style={styles.confirmBtn}
          >
            <Text style={styles.confirmText}>ابدأ المغامرة بـ {selected.name} 🚀</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: "#0B2B15",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#22C55E",
    padding: 20,
    maxHeight: "85%",
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FEF08A",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: "#A7F3D0",
    textAlign: "center",
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 14,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  filterBtnActive: {
    backgroundColor: "#16A34A",
  },
  filterText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#D1D5DB",
  },
  roleRow: { gap: 8, paddingBottom: 12 },
  roleBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.1)" },
  roleBtnActive: { backgroundColor: "#7C3AED" },
  listContainer: {
    maxHeight: 340,
  },
  charCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(11, 43, 21, 0.6)",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.15)",
  },
  charEmoji: {
    fontSize: 34,
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 2 },
  charName: { fontSize: 16, fontWeight: "800", color: "#FFF" },
  rolePill: { fontSize: 9, fontWeight: "800", borderWidth: 1, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 2 },
  charDesc: {
    fontSize: 11,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  charBonus: { fontSize: 11, fontWeight: "700" },
  charSkill: { fontSize: 10, color: "#C4B5FD", marginTop: 3 },
  confirmBtn: {
    marginTop: 16,
    backgroundColor: "#22C55E",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#22C55E",
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFF",
  },
});
