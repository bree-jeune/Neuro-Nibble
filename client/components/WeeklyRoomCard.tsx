import React from "react";
import { StyleSheet, Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { WeeklyRoom } from "@/lib/types";

interface WeeklyRoomCardProps {
  room: WeeklyRoom;
  selected: boolean;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const getRoomConfig = (room: WeeklyRoom) => {
  switch (room) {
    case "chaos":
      return {
        label: "Chaos",
        description: "When everything's on fire",
        mantra: "Less bad is good enough",
        icon: "wind" as const,
      };
    case "gentle":
      return {
        label: "Gentle",
        description: "When you're tired and tender",
        mantra: "You don't have to upgrade. Gentle weeks are valid.",
        icon: "moon" as const,
      };
    case "build":
      return {
        label: "Build",
        description: "When you have extra capacity",
        mantra: "Small momentum compounds",
        icon: "layers" as const,
      };
    case "repair":
      return {
        label: "Repair",
        description: "When you want to fix what got crunchy",
        mantra: "Maintenance isn't failure",
        icon: "tool" as const,
      };
  }
};

export function WeeklyRoomCard({ room, selected, onPress }: WeeklyRoomCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const config = getRoomConfig(room);
  const roomColor = theme[`room${room.charAt(0).toUpperCase() + room.slice(1)}` as keyof typeof theme] as string;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        {
          backgroundColor: selected ? roomColor : theme.backgroundDefault,
          borderColor: selected ? roomColor : "transparent",
        },
        animatedStyle,
      ]}
    >
      <View style={styles.row}>
        <View style={styles.iconContainer}>
          <Feather name={config.icon} size={20} color={theme.text} />
        </View>
        <View style={styles.content}>
          <ThemedText style={styles.label}>{config.label}</ThemedText>
          <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
            {config.description}
          </ThemedText>
        </View>
        {selected ? (
          <Feather name="check-circle" size={20} color={theme.text} />
        ) : null}
      </View>
      {selected ? (
        <ThemedText style={[styles.mantra, { color: theme.textSecondary }]}>
          {config.mantra}
        </ThemedText>
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  content: {
    flex: 1,
  },
  label: {
    fontWeight: "600",
    fontSize: 16,
  },
  description: {
    fontSize: 14,
  },
  mantra: {
    fontStyle: "italic",
    fontSize: 14,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
});
