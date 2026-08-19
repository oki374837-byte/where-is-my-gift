// Field Atlas social layer: preserve the Arabic-first expedition UI with compact cards, clear states, and safe, explicit actions.
import { router } from "expo-router";
import * as Linking from "expo-linking";
import { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, Share, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { startOAuthLogin } from "@/constants/oauth";
import { trpc } from "@/lib/trpc";
import AsyncStorage from "@react-native-async-storage/async-storage";

function statusLabel(status: string) {
  if (status === "exploring") return "يستكشف الآن";
  if (status === "online") return "متصل";
  return "غير متصل";
}

export default function SocialScreen() {
  const colors = useColors();
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [friendCode, setFriendCode] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedFriend, setSelectedFriend] = useState<{ id: number; name: string; avatarEmoji: string } | null>(null);
  const [draft, setDraft] = useState("");
  const [guestCode, setGuestCode] = useState("");

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem("where-is-my-gift.guest-code").then((saved) => {
      if (saved) { if (active) setGuestCode(saved); return; }
      const created = `GUEST-${Math.floor(100000 + Math.random() * 900000)}`;
      void AsyncStorage.setItem("where-is-my-gift.guest-code", created);
      if (active) setGuestCode(created);
    });
    return () => { active = false; };
  }, []);

  const profile = trpc.social.profile.useQuery(undefined, { enabled: isAuthenticated, staleTime: 60_000 });
  const friends = trpc.social.friends.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: 6_000 });
  const requests = trpc.social.requests.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: 8_000 });
  const messages = trpc.social.messages.useQuery(
    { friendId: selectedFriend?.id ?? 0 },
    { enabled: isAuthenticated && Boolean(selectedFriend), refetchInterval: 4_000 },
  );

  const requestFriend = trpc.social.requestFriend.useMutation({
    onSuccess: (result) => {
      const messagesByReason: Record<string, string> = {
        invalid_code: "اكتب كودًا بصيغة WQ-000001.",
        invalid_target: "لا يمكن إضافة هذا الكود.",
        database_unavailable: "الخادم غير متاح الآن. جرّب مرة أخرى عند اتصال الإنترنت.",
        not_found: "لم نعثر على مستكشف بهذا الكود.",
        already_friends: "هذا المستكشف موجود في قائمة أصدقائك.",
        pending: "تم إرسال طلب سابقًا وما زال قيد الانتظار.",
      };
      setNotice(result.success ? "أُرسل طلب الصداقة. سيظهر الصديق بعد الموافقة." : messagesByReason[result.reason] || "تعذر إرسال الطلب.");
      if (result.success) setFriendCode("");
      void utils.social.friends.invalidate();
      void utils.social.requests.invalidate();
    },
    onError: () => setNotice("تعذر الاتصال بالخادم لإرسال طلب الصداقة."),
  });

  const acceptRequest = trpc.social.acceptRequest.useMutation({
    onSuccess: (accepted) => {
      setNotice(accepted ? "تم قبول طلب الصداقة." : "تعذر قبول الطلب.");
      void utils.social.friends.invalidate();
      void utils.social.requests.invalidate();
    },
    onError: () => setNotice("تعذر تحديث طلب الصداقة."),
  });

  const sendMessage = trpc.social.sendMessage.useMutation({
    onSuccess: () => {
      setDraft("");
      void messages.refetch();
    },
    onError: () => setNotice("تعذر إرسال الرسالة. تأكد أن الصداقة مقبولة والاتصال متاح."),
  });

  const handleGuestLogin = async () => {
    try {
      await startOAuthLogin();
    } catch {
      setNotice("تعذر فتح بوابة الحساب الآن. سيبقى وضع الضيف المحلي متاحاً ويمكنك المحاولة عند توفر الاتصال.");
    }
  };

  const inviteCode = profile.data?.friendCode ?? guestCode;
  const inviteUrl = useMemo(() => inviteCode ? Linking.createURL("invite", { queryParams: { code: inviteCode } }) : "", [inviteCode]);
  const friendRows = friends.data ?? [];
  const messageRows = messages.data ?? [];

  const shareInvite = async () => {
    if (!inviteCode) {
      setNotice("جارٍ إنشاء كود الضيف المحلي…");
      return;
    }
    await Share.share({
      title: "دعوة إلى أين هديتي؟",
      message: `${isAuthenticated ? "انضم إليّ في لعبة أين هديتي؟ أضفني كصديق بهذا الكود" : "هذه دعوة إلى جلسة ضيف محلية في لعبة أين هديتي؟؛ الصداقة بين الأجهزة تحتاج تسجيل الدخول. الكود"}: ${inviteCode}${inviteUrl ? `\n${inviteUrl}` : ""}`,
      url: inviteUrl,
    });
  };

  const handleRequestFriend = () => {
    if (!friendCode.trim()) {
      setNotice("أدخل كود صديقك أولًا، مثل WQ-000001.");
      return;
    }
    requestFriend.mutate({ friendCode });
  };

  const handleSend = () => {
    if (!selectedFriend || !draft.trim()) return;
    sendMessage.mutate({ friendId: selectedFriend.id, text: draft.trim() });
  };

  const header = (
    <View>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>WHERE IS MY GIFT / SOCIAL</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>الأصدقاء والرحلة الجماعية</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>أضف مستكشفين تعرفهم، تحدّث معهم، وشاهد الأصدقاء المتصلين على الخريطة عند مشاركة الموقع.</Text>

      {!isAuthenticated ? (
        <View style={[styles.notice, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.noticeTitle, { color: colors.foreground }]}>وضع الضيف المحلي جاهز</Text>
          <Text style={[styles.noticeBody, { color: colors.muted }]}>يمكنك متابعة اللعب ومشاركة كود جلسة محفوظ على هذا الجهاز. لإضافة أصدقاء ودردشة بين الأجهزة، سجّل الدخول عند توفر الاتصال.</Text>
          <View style={styles.guestActions}>
            <Pressable onPress={shareInvite} style={({ pressed }) => [styles.shareButton, { borderColor: colors.primary, opacity: pressed ? 0.7 : 1 }]}><Text style={[styles.shareText, { color: colors.primary }]}>مشاركة كود الضيف</Text></Pressable>
            <Pressable onPress={() => { void handleGuestLogin(); }} style={({ pressed }) => [styles.primaryButton, styles.guestLoginButton, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}><Text style={styles.primaryButtonText}>تسجيل الدخول</Text></Pressable>
          </View>
        </View>
      ) : (
        <>
          <View style={[styles.codeCard, { backgroundColor: `${colors.primary}16`, borderColor: `${colors.primary}66` }]}>
            <View style={styles.codeCopy}>
              <Text style={[styles.cardLabel, { color: colors.primary }]}>كود المستكشف الخاص بك</Text>
              <Text style={[styles.code, { color: colors.foreground }]}>{inviteCode || "جارٍ التحميل"}</Text>
              <Text style={[styles.hint, { color: colors.muted }]}>شاركه مع صديق لإرسال طلب صداقة.</Text>
            </View>
            <Pressable onPress={shareInvite} style={({ pressed }) => [styles.shareButton, { borderColor: colors.primary, opacity: pressed ? 0.7 : 1 }]}>
              <Text style={[styles.shareText, { color: colors.primary }]}>مشاركة الدعوة</Text>
            </Pressable>
          </View>

          <View style={[styles.addCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>إضافة صديق</Text>
            <Text style={[styles.hint, { color: colors.muted }]}>أدخل كود الصديق كما استلمته منه.</Text>
            <View style={styles.addRow}>
              <TextInput
                value={friendCode}
                onChangeText={setFriendCode}
                placeholder="WQ-000001"
                placeholderTextColor={colors.muted}
                autoCapitalize="characters"
                autoCorrect={false}
                style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
              />
              <Pressable onPress={handleRequestFriend} style={({ pressed }) => [styles.addButton, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}>
                <Text style={styles.addButtonText}>إرسال</Text>
              </Pressable>
            </View>
          </View>

          {requests.data && requests.data.length > 0 ? (
            <View style={[styles.requestCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>طلبات الصداقة</Text>
              {requests.data.map((request) => (
                <View key={request.id} style={[styles.requestRow, { borderTopColor: colors.border }]}>
                  <View style={styles.friendCopy}><Text style={[styles.friendName, { color: colors.foreground }]}>{request.name || "مستكشف"}</Text><Text style={[styles.hint, { color: colors.muted }]}>يريد الانضمام إلى رحلتك</Text></View>
                  <Pressable onPress={() => acceptRequest.mutate({ friendshipId: request.id })} style={({ pressed }) => [styles.smallButton, { backgroundColor: colors.success, opacity: pressed ? 0.75 : 1 }]}><Text style={styles.smallButtonText}>قبول</Text></Pressable>
                </View>
              ))}
            </View>
          ) : null}

          {notice ? <View style={[styles.notice, { backgroundColor: `${colors.primary}14`, borderColor: `${colors.primary}44` }]}><Text style={[styles.noticeBody, { color: colors.primary }]}>{notice}</Text></View> : null}

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>أصدقائي في الرحلة</Text>
        </>
      )}
    </View>
  );

  return (
    <ScreenContainer edges={["top", "left", "right"]} containerClassName="bg-background">
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <FlatList
          data={isAuthenticated ? friendRows : []}
          keyExtractor={(item) => String(item.id)}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={header}
          ListEmptyComponent={isAuthenticated ? <View style={[styles.empty, { borderColor: colors.border }]}><Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا يوجد أصدقاء بعد</Text><Text style={[styles.hint, { color: colors.muted }]}>أرسل كود دعوتك أو أضف كود مستكشف تعرفه لتبدأ الرحلة الجماعية.</Text></View> : null}
          renderItem={({ item }) => (
            <Pressable onPress={() => setSelectedFriend({ id: item.id, name: item.name, avatarEmoji: item.avatarEmoji })} style={({ pressed }) => [styles.friendRow, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.78 : 1 }]}>
              <View style={[styles.avatar, { backgroundColor: `${colors.primary}22`, borderColor: colors.primary }]}><Text style={styles.avatarText}>{item.avatarEmoji}</Text></View>
              <View style={styles.friendCopy}><Text style={[styles.friendName, { color: colors.foreground }]}>{item.name}</Text><Text style={[styles.hint, { color: item.status === "offline" ? colors.muted : colors.success }]}>{statusLabel(item.status)} · {item.location ? "ظاهر على الخريطة" : "لم يشارك موقعه"}</Text></View>
              <Text style={[styles.chatIcon, { color: colors.primary }]}>›</Text>
            </Pressable>
          )}
          ListFooterComponent={selectedFriend ? (
            <View style={[styles.chatCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.chatHeader}><View><Text style={[styles.cardLabel, { color: colors.primary }]}>محادثة فردية</Text><Text style={[styles.chatTitle, { color: colors.foreground }]}>{selectedFriend.avatarEmoji} {selectedFriend.name}</Text></View><Pressable onPress={() => setSelectedFriend(null)}><Text style={[styles.close, { color: colors.muted }]}>إغلاق</Text></Pressable></View>
              <View style={styles.messageList}>
                {messageRows.length === 0 ? <Text style={[styles.emptyMessage, { color: colors.muted }]}>ابدأ أول رسالة بينكما.</Text> : messageRows.map((message) => <View key={message.id} style={[styles.bubble, { alignSelf: message.senderId === profile.data?.id ? "flex-start" : "flex-end", backgroundColor: message.senderId === profile.data?.id ? `${colors.primary}22` : colors.background }]}><Text style={[styles.bubbleText, { color: colors.foreground }]}>{message.text}</Text></View>)}
              </View>
              <View style={styles.chatInputRow}><TextInput value={draft} onChangeText={setDraft} placeholder="اكتب رسالة..." placeholderTextColor={colors.muted} style={[styles.chatInput, { color: colors.foreground, borderColor: colors.border }]} multiline maxLength={500} /><Pressable onPress={handleSend} style={({ pressed }) => [styles.sendButton, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}><Text style={styles.addButtonText}>إرسال</Text></Pressable></View>
            </View>
          ) : null}
        />
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  listContent: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 28 },
  eyebrow: { fontSize: 11, letterSpacing: 2, fontWeight: "800" },
  title: { fontSize: 29, fontWeight: "800", marginTop: 8 },
  subtitle: { fontSize: 13, lineHeight: 21, marginTop: 8, marginBottom: 18 },
  notice: { borderWidth: 1, borderRadius: 18, padding: 15, marginBottom: 14 },
  noticeTitle: { fontSize: 16, fontWeight: "800" },
  noticeBody: { fontSize: 12, lineHeight: 19, marginTop: 7 },
  primaryButton: { borderRadius: 13, paddingVertical: 12, alignItems: "center", marginTop: 14 },
  primaryButtonText: { color: "#06150F", fontSize: 13, fontWeight: "900" },
  codeCard: { borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: "row", alignItems: "center", marginBottom: 12 },
  codeCopy: { flex: 1 },
  cardLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  code: { fontSize: 24, fontWeight: "900", letterSpacing: 2, marginTop: 3 },
  hint: { fontSize: 10, lineHeight: 16, marginTop: 4 },
  shareButton: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 11, paddingVertical: 9 },
  shareText: { fontSize: 10, fontWeight: "900" },
  addCard: { borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: "900" },
  addRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  input: { flex: 1, minHeight: 44, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, textAlign: "left", fontSize: 13 },
  addButton: { minWidth: 74, minHeight: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  addButtonText: { color: "#06150F", fontSize: 12, fontWeight: "900" },
  guestActions: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14 },
  guestLoginButton: { flex: 1, marginTop: 0 },
  requestCard: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, marginBottom: 12 },
  requestRow: { borderTopWidth: 1, minHeight: 66, flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  smallButton: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  smallButtonText: { color: "#06150F", fontSize: 11, fontWeight: "900" },
  sectionTitle: { fontSize: 18, fontWeight: "900", marginTop: 4, marginBottom: 10 },
  friendRow: { borderWidth: 1, borderRadius: 17, padding: 12, flexDirection: "row", alignItems: "center", marginBottom: 9 },
  avatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 21 },
  friendCopy: { flex: 1, marginLeft: 10 },
  friendName: { fontSize: 14, fontWeight: "900" },
  chatIcon: { fontSize: 28, transform: [{ rotate: "180deg" }] },
  empty: { borderWidth: 1, borderRadius: 17, padding: 16, marginTop: 2 },
  emptyTitle: { fontSize: 15, fontWeight: "900" },
  chatCard: { borderWidth: 1, borderRadius: 19, padding: 14, marginTop: 8 },
  chatHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 10 },
  chatTitle: { fontSize: 17, fontWeight: "900", marginTop: 3 },
  close: { fontSize: 11, fontWeight: "800" },
  messageList: { minHeight: 100, maxHeight: 240, paddingVertical: 8 },
  emptyMessage: { textAlign: "center", paddingVertical: 32, fontSize: 12 },
  bubble: { borderRadius: 14, paddingHorizontal: 11, paddingVertical: 8, maxWidth: "82%", marginVertical: 3 },
  bubbleText: { fontSize: 12, lineHeight: 18 },
  chatInputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginTop: 6 },
  chatInput: { flex: 1, minHeight: 42, maxHeight: 90, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 9, textAlign: "right", fontSize: 12 },
  sendButton: { minWidth: 62, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
});
