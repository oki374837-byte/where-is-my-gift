import React, { useState } from "react";
import { Alert, StyleSheet, View, Text, TouchableOpacity, Modal, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface CustomArObject {
  id: string;
  title: string;
  emoji: string;
  offsetX: number; // إزاحة أفقية في المشهد
  offsetY: number; // إزاحة عمودية
}

interface ARObjectToolsProps {
  objects: CustomArObject[];
  onAddObject: (obj: { title: string; emoji: string }) => void;
  onRemoveObject: (id: string) => void;
  onMoveObject: (id: string, deltaX: number, deltaY: number) => void;
}

export function ARObjectTools({ objects, onAddObject, onRemoveObject, onMoveObject }: ARObjectToolsProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("🎁");

  const handleRemoveLast = () => {
    const latest = objects[objects.length - 1];
    if (!latest) return;
    Alert.alert(
      "حذف عنصر الواقع المعزز",
      `هل تريد حذف «${latest.title}»؟`,
      [
        { text: "إلغاء", style: "cancel" },
        { text: "حذف", style: "destructive", onPress: () => onRemoveObject(latest.id) },
      ],
    );
  };

  const handleCreate = () => {
    if (!title.trim()) return;
    onAddObject({ title: title.trim(), emoji });
    setTitle("");
    setModalVisible(false);
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* شريط أدوات التحكم السريع فوق كاميرا الواقع المعزز */}
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle" size={22} color="#22C55E" />
          <Text style={styles.toolText}>إضافة عنصر</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.toolBtn, objects.length === 0 && styles.toolBtnDisabled]} disabled={objects.length === 0} onPress={handleRemoveLast}>
          <Ionicons name="trash" size={20} color="#EF4444" />
          <Text style={styles.toolText}>حذف الأخير</Text>
        </TouchableOpacity>
      </View>

      {/* نافذة إضافة عنصر واقع معزز جديد */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>إضافة هدية أو شخصية في الواقع المعزز</Text>
            <TextInput
              style={styles.input}
              placeholder="اسم العنصر (مثلاً: هدية الأصدقاء)"
              placeholderTextColor="#64748B"
              value={title}
              onChangeText={setTitle}
            />
            <View style={styles.emojiRow}>
              {["🎁", "⭐", "🧭", "🛡️", "🎈", "💎"].map((em) => (
                <TouchableOpacity
                  key={em}
                  style={[styles.emojiOption, emoji === em && styles.emojiSelected]}
                  onPress={() => setEmoji(em)}
                >
                  <Text style={{ fontSize: 24 }}>{em}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnCancelText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnSave]} onPress={handleCreate}>
                <Text style={styles.btnSaveText}>إثبات في AR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 110,
    left: 16,
    right: 16,
    zIndex: 30,
    alignItems: "center",
  },
  toolbar: {
    flexDirection: "row",
    backgroundColor: "rgba(15, 23, 42, 0.88)",
    borderRadius: 18,
    padding: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    gap: 8,
  },
  toolBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  toolBtnDisabled: { opacity: 0.45 },
  toolText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#0F172A",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  modalTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#FFF",
    fontSize: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  emojiRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  emojiOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  emojiSelected: {
    borderColor: "#10B981",
    backgroundColor: "rgba(16, 185, 129, 0.2)",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  btnCancel: {
    backgroundColor: "#1E293B",
  },
  btnCancelText: {
    color: "#94A3B8",
    fontWeight: "700",
  },
  btnSave: {
    backgroundColor: "#10B981",
  },
  btnSaveText: {
    color: "#FFF",
    fontWeight: "800",
  },
});
