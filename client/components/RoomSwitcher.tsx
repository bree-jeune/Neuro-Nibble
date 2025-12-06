import React from "react";
import { StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { BorderRadius } from "@/constants/theme";
import { useAppStore } from "@/lib/store";
import type { WeeklyRoom } from "@/lib/types";

const SHAPE_SIZE = 56;

const ROOM_ORDER: WeeklyRoom[] = ["chaos", "gentle", "build", "repair"];

const ROOM_ICONS: Record<WeeklyRoom, keyof typeof Feather.glyphMap> = {
  chaos: "zap",
  gentle: "feather",
  build: "tool",
  repair: "heart",
};

export function RoomSwitcher() {
  const { theme } = useTheme();
  const weeklyRoom = useAppStore((s) => s.weeklyRoom);
  const setWeeklyRoom = useAppStore((s) => s.setWeeklyRoom);
  const hapticsEnabled = useAppStore((s) => s.hapticsEnabled);
  
  const scale = useSharedValue(1);

  const handlePress = () => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    scale.value = withSpring(0.9, { damping: 15, stiffness: 400 }, () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    });
    
    const currentIndex = ROOM_ORDER.indexOf(weeklyRoom);
    const nextIndex = (currentIndex + 1) % ROOM_ORDER.length;
    setWeeklyRoom(ROOM_ORDER[nextIndex]);
  };

  const getRoomColor = (room: WeeklyRoom): string => {
    switch (room) {
      case "chaos":
        return theme.roomChaos;
      case "gentle":
        return theme.roomGentle;
      case "build":
        return theme.roomBuild;
      case "repair":
        return theme.roomRepair;
      default:
        return theme.primary;
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const roomColor = getRoomColor(weeklyRoom);
  const iconName = ROOM_ICONS[weeklyRoom];

  return (
    <Pressable onPress={handlePress}>
      <Animated.View
        style={[
          styles.shape,
          { backgroundColor: roomColor },
          animatedStyle,
        ]}
      >
        <Feather name={iconName} size={24} color="#FFFFFF" />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shape: {
    width: SHAPE_SIZE,
    height: SHAPE_SIZE,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
});
