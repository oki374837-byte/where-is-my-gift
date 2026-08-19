import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarButton: HapticTab,
        tabBarStyle: { paddingTop: 8, paddingBottom: bottomPadding, height: 56 + bottomPadding, backgroundColor: colors.background, borderTopColor: colors.border, borderTopWidth: 0.5 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "الخريطة", tabBarIcon: ({ color }) => <IconSymbol size={25} name="map.fill" color={color} /> }} />
      <Tabs.Screen name="ar" options={{ title: "الواقع المعزز", tabBarIcon: ({ color }) => <IconSymbol size={25} name="camera.fill" color={color} /> }} />
      <Tabs.Screen name="inventory" options={{ title: "المخزون", tabBarIcon: ({ color }) => <IconSymbol size={25} name="bag.fill" color={color} /> }} />
      <Tabs.Screen name="store" options={{ title: "المتجر", tabBarIcon: ({ color }) => <IconSymbol size={25} name="storefront.fill" color={color} /> }} />
      <Tabs.Screen name="achievements" options={{ title: "الإنجازات", tabBarIcon: ({ color }) => <IconSymbol size={25} name="trophy.fill" color={color} /> }} />
      <Tabs.Screen name="ranking" options={{ title: "الترتيب", tabBarIcon: ({ color }) => <IconSymbol size={25} name="chart.bar.fill" color={color} /> }} />
      <Tabs.Screen name="social" options={{ title: "الأصدقاء", tabBarIcon: ({ color }) => <IconSymbol size={25} name="person.2.fill" color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: "الملف", tabBarIcon: ({ color }) => <IconSymbol size={25} name="person.fill" color={color} /> }} />
    </Tabs>
  );
}
