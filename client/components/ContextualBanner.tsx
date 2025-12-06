import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { EnergyLevel, WeeklyRoom } from "@/lib/types";

interface ContextualBannerProps {
  energyLevel: EnergyLevel;
  weeklyRoom: WeeklyRoom;
}

const getWeekName = (room: WeeklyRoom): string => {
  switch (room) {
    case "gentle":
      return "Gentle Week";
    case "build":
      return "Build Week";
    case "repair":
      return "Repair Week";
    case "chaos":
      return "Chaos Week";
  }
};

const getWeekIcon = (room: WeeklyRoom): keyof typeof Feather.glyphMap => {
  switch (room) {
    case "gentle":
      return "feather";
    case "build":
      return "tool";
    case "repair":
      return "refresh-cw";
    case "chaos":
      return "wind";
  }
};

const getTip = (energy: EnergyLevel, room: WeeklyRoom): string => {
  const tips: Record<WeeklyRoom, Record<EnergyLevel, string>> = {
    gentle: {
      low: "Be extra kind today. Pick the smallest bite and count it as enough.",
      medium: "You have some capacity. Focus on what feels manageable, not urgent.",
      high: "Good energy in a gentle week. Use it for something that usually drains you.",
    },
    build: {
      low: "Building can wait. Preserve your energy for when you're ready.",
      medium: "Steady progress counts. Pick one thing to move forward today.",
      high: "Great time to tackle something meaningful. What's been waiting?",
    },
    repair: {
      low: "Repairs need rest too. Take it slow and focus on one small fix.",
      medium: "Pace yourself. What small repair would lift the most weight?",
      high: "Use this energy to address what's been nagging at you.",
    },
    chaos: {
      low: "Even in chaos, you can pause. Pick the easiest win available.",
      medium: "Handle one thing at a time. Small actions reduce overwhelm.",
      high: "Ride the wave. Channel energy into clearing the backlog.",
    },
  };

  return tips[room][energy];
};

const getEnergyLabel = (energy: EnergyLevel): string => {
  switch (energy) {
    case "low":
      return "Low energy";
    case "medium":
      return "Medium energy";
    case "high":
      return "High energy";
  }
};

const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export function ContextualBanner({ energyLevel, weeklyRoom }: ContextualBannerProps) {
  const { theme } = useTheme();

  const getRoomColor = () => {
    switch (weeklyRoom) {
      case "gentle":
        return theme.roomGentle;
      case "build":
        return theme.roomBuild;
      case "repair":
        return theme.roomRepair;
      case "chaos":
        return theme.roomChaos;
    }
  };

  const tip = getTip(energyLevel, weeklyRoom);
  const weekName = getWeekName(weeklyRoom);
  const weekIcon = getWeekIcon(weeklyRoom);
  const energyLabel = getEnergyLabel(energyLevel);
  const roomColor = getRoomColor();

  return (
    <View style={[styles.container, { backgroundColor: hexToRgba(roomColor, 0.12) }]}>
      <View style={styles.headerRow}>
        <View style={[styles.badge, { backgroundColor: getRoomColor() }]}>
          <Feather name={weekIcon} size={12} color="#FFFFFF" />
          <ThemedText style={styles.badgeText}>{weekName}</ThemedText>
        </View>
        <ThemedText style={[styles.energyLabel, { color: theme.textSecondary }]}>
          {energyLabel}
        </ThemedText>
      </View>
      <ThemedText style={[styles.tip, { color: theme.text }]}>
        {tip}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
  energyLabel: {
    fontSize: 12,
    fontStyle: "italic",
  },
  tip: {
    fontSize: 15,
    lineHeight: 22,
  },
});
