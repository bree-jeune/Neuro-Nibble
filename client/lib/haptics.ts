import * as Haptics from "expo-haptics";
import { useAppStore } from "@/lib/store";

type HapticType = "light" | "medium" | "heavy" | "selection" | "success" | "warning" | "error";

export function triggerHaptic(type: HapticType = "light"): void {
  const hapticsEnabled = useAppStore.getState().hapticsEnabled;
  
  if (!hapticsEnabled) {
    return;
  }

  switch (type) {
    case "light":
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      break;
    case "medium":
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      break;
    case "heavy":
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      break;
    case "selection":
      Haptics.selectionAsync();
      break;
    case "success":
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
    case "warning":
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      break;
    case "error":
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      break;
  }
}
