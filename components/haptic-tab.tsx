import { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";

import { loadPreferences } from "@/lib/app-preferences";

export function HapticTab(props: BottomTabBarButtonProps) {
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  useEffect(() => {
    void loadPreferences().then((preferences) => setHapticsEnabled(preferences.hapticsEnabled));
  }, []);

  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        if (hapticsEnabled && process.env.EXPO_OS === "ios") {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}
