import React from "react";
import { StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { WeeklyRoom } from "@/lib/types";

interface WeeklyRoomBadgeProps {
  room: WeeklyRoom;
}

const getRoomConfig = (room: WeeklyRoom) => {
  switch (room) {
    case "chaos":
      return {
        label: "Chaos Week",
        mantra: "Less bad is good enough",
        icon: "wind" as const,
      };
    case "gentle":
      return {
        label: "Gentle Week",
        mantra: "You don't have to upgrade",
        icon: "moon" as const,
      };
    case "build":
      return {
        label: "Build Week",
        mantra: "Small momentum compounds",
        icon: "layers" as const,
      };
    case "repair":
      return {
        label: "Repair Week",
        mantra: "Maintenance isn't failure",
        icon: "tool" as const,
      };
  }
};

export function WeeklyRoomBadge({ room }: WeeklyRoomBadgeProps) {
  const { theme } = useTheme();
  const config = getRoomConfig(room);
  const roomColor = theme[`room${room.charAt(0).toUpperCase() + room.slice(1)}` as keyof typeof theme] as string;

  return (
    <View style={[styles.badge, { backgroundColor: roomColor }]}>
      <View style={styles.header}>
        <Feather name={config.icon} size={18} color={theme.text} />
        <ThemedText style={styles.label}>{config.label}</ThemedText>
      </View>
      <ThemedText style={[styles.mantra, { color: theme.textSecondary }]}>
        {config.mantra}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  label: {
    fontWeight: "600",
    fontSize: 16,
  },
  mantra: {
    fontStyle: "italic",
    fontSize: 14,
  },
});
