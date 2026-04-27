import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { triggerHaptic } from "@/lib/haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getRoomConfig } from "@/components/WeeklyRoomBadge";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type { WeeklyRoom } from "@/lib/types";

interface WeeklyRoomSectionProps {
  room: WeeklyRoom;
}

const ROOM_DESCRIPTIONS: Record<WeeklyRoom, string> = {
  chaos: "Survival mode. One thing at a time.",
  gentle: "Low demands. Rest is productive.",
  build: "You have capacity. Move something forward.",
  repair: "Catching up gently on what slipped.",
};

const TODAY_RULES: Record<WeeklyRoom, string> = {
  chaos: "Less bad is good enough.",
  gentle: "You can stop after one bite.",
  build: "Small momentum compounds.",
  repair: "Maintenance isn't failure.",
};

export function WeeklyRoomSection({ room }: WeeklyRoomSectionProps) {
  const { theme } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const config = getRoomConfig(room);
  const roomColor = theme[
    `room${room.charAt(0).toUpperCase() + room.slice(1)}` as keyof typeof theme
  ] as string;

  const handleOpenSelector = () => {
    triggerHaptic("light");
    navigation.navigate("WeeklyRoomSetup", { mode: "change" });
  };

  return (
    <View style={[styles.card, { backgroundColor: roomColor }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Feather name={config.icon} size={20} color={theme.text} />
          <ThemedText style={styles.label}>{config.label}</ThemedText>
        </View>

        <Pressable
          onPress={handleOpenSelector}
          accessibilityRole="button"
          accessibilityLabel="Change weekly room"
          style={styles.changeButton}
        >
          <Feather name="edit-2" size={14} color={theme.textSecondary} />
          <ThemedText
            style={[styles.changeLabel, { color: theme.textSecondary }]}
          >
            change
          </ThemedText>
        </Pressable>
      </View>

      <ThemedText style={[styles.description, { color: theme.text }]}>
        {ROOM_DESCRIPTIONS[room]}
      </ThemedText>

      <View
        style={[
          styles.ruleContainer,
          { backgroundColor: "rgba(255,255,255,0.42)" },
        ]}
      >
        <ThemedText style={[styles.ruleLabel, { color: theme.textSecondary }]}>
          Today&apos;s rule
        </ThemedText>
        <ThemedText style={styles.ruleText}>{TODAY_RULES[room]}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  label: {
    fontWeight: "700",
    fontSize: 18,
    flexShrink: 1,
  },
  changeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 44,
    paddingHorizontal: Spacing.sm,
  },
  changeLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  ruleContainer: {
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    gap: 4,
  },
  ruleLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  ruleText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
