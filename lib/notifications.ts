import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

let configured = false;

export async function enableExplorationReminder(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  if (!configured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
    });
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("exploration", { name: "تنبيهات الاستكشاف", importance: Notifications.AndroidImportance.DEFAULT, vibrationPattern: [0, 150, 100, 150] });
    }
    configured = true;
  }
  const current = await Notifications.getPermissionsAsync();
  const permission = current.granted ? current : await Notifications.requestPermissionsAsync();
  if (!permission.granted) return false;
  await Notifications.cancelScheduledNotificationAsync("worldquest-exploration-reminder").catch(() => undefined);
  await Notifications.scheduleNotificationAsync({
    identifier: "worldquest-exploration-reminder",
    content: { title: "جولة جديدة بانتظارك", body: "افتح WorldQuest AR لاكتشاف نقطة قريبة وجمع مكافأتك.", sound: false, data: { route: "/(tabs)" } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 18, minute: 0 },
  });
  return true;
}

export async function disableExplorationReminder() {
  if (Platform.OS !== "web") await Notifications.cancelScheduledNotificationAsync("worldquest-exploration-reminder").catch(() => undefined);
}
