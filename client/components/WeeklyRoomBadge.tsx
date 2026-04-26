import React, { useState } from "react";
import { StyleSheet, View, Pressable, Modal } from "react-native";
import { Feather } from "@expo/vector-icons";

import { triggerHaptic } from "@/lib/haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useAppStore } from "@/lib/store";
import type { WeeklyRoom } from "@/lib/types";

interface WeeklyRoomBadgeProps {
  room: WeeklyRoom;
  interactive?: boolean;
}

const ROOMS: WeeklyRoom[] = ["gentle", "build", "repair", "chaos"];

export const getRoomConfig = (room: WeeklyRoom) => {
  switch (room) {
    case "chaos":
      return {
        label: "Chaos Week",
        mantra: "Less bad is good enough",
        icon: "wind" as const,
        description: "When life is overwhelming and you need grace",
      };
    case "gentle":
      return {
        label: "Gentle Week",
        mantra: "You don't have to upgrade",
        icon: "moon" as const,
        description: "Rest and maintenance mode - bare minimum counts",
      };
    case "build":
      return {
        label: "Build Week",
        mantra: "Small momentum compounds",
        icon: "layers" as const,
        description: "Ready for growth - one small bite at a time",
      };
    case "repair":
      return {
        label: "Repair Week",
        mantra: "Maintenance isn't failure",
        icon: "tool" as const,
        description: "Catching up on what fell through the cracks",
      };
  }
};

export function WeeklyRoomBadge({ room, interactive = true }: WeeklyRoomBadgeProps) {
  const { theme } = useTheme();
  const { setWeeklyRoom } = useAppStore();
  const [showSelector, setShowSelector] = useState(false);
  const config = getRoomConfig(room);
  const roomColor = theme[`room${room.charAt(0).toUpperCase() + room.slice(1)}` as keyof typeof theme] as string;

  const handlePress = () => {
    if (interactive) {
      triggerHaptic("light");
      setShowSelector(true);
    }
  };

  const handleSelectRoom = (selectedRoom: WeeklyRoom) => {
    triggerHaptic("success");
    setWeeklyRoom(selectedRoom);
    setShowSelector(false);
  };

  return (
    <>
      <Pressable onPress={handlePress}>
        <View style={[styles.badge, { backgroundColor: roomColor }]}>
          <View style={styles.header}>
            <Feather name={config.icon} size={18} color={theme.text} />
            <ThemedText style={styles.label}>{config.label}</ThemedText>
            {interactive ? (
              <Feather name="chevron-down" size={16} color={theme.textSecondary} style={styles.chevron} />
            ) : null}
          </View>
          <ThemedText style={[styles.mantra, { color: theme.textSecondary }]}>
            {config.mantra}
          </ThemedText>
        </View>
      </Pressable>

      <Modal
        visible={showSelector}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSelector(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setShowSelector(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundRoot }]}>
            <ThemedText type="h3" style={styles.modalTitle}>
              Choose Your Week
            </ThemedText>
            <ThemedText style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Match your capacity to your week
            </ThemedText>

            {ROOMS.map((r) => {
              const rConfig = getRoomConfig(r);
              const rColor = theme[`room${r.charAt(0).toUpperCase() + r.slice(1)}` as keyof typeof theme] as string;
              const isSelected = r === room;

              return (
                <Pressable
                  key={r}
                  onPress={() => handleSelectRoom(r)}
                  style={[
                    styles.roomOption,
                    { backgroundColor: rColor },
                    isSelected && styles.roomOptionSelected,
                  ]}
                >
                  <View style={styles.roomOptionHeader}>
                    <Feather name={rConfig.icon} size={20} color={theme.text} />
                    <ThemedText style={styles.roomOptionLabel}>{rConfig.label}</ThemedText>
                    {isSelected ? (
                      <Feather name="check" size={18} color={theme.primary} style={styles.checkIcon} />
                    ) : null}
                  </View>
                  <ThemedText style={[styles.roomOptionDesc, { color: theme.textSecondary }]}>
                    {rConfig.description}
                  </ThemedText>
                </Pressable>
              );
            })}

            <Pressable
              onPress={() => setShowSelector(false)}
              style={[styles.cancelButton, { borderColor: theme.textSecondary }]}
            >
              <ThemedText style={{ color: theme.textSecondary }}>Cancel</ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
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
    flex: 1,
  },
  chevron: {
    marginLeft: "auto",
  },
  mantra: {
    fontStyle: "italic",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  modalTitle: {
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  modalSubtitle: {
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: Spacing.lg,
  },
  roomOption: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  roomOptionSelected: {
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.1)",
  },
  roomOptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  roomOptionLabel: {
    fontWeight: "600",
    fontSize: 16,
    flex: 1,
  },
  checkIcon: {
    marginLeft: "auto",
  },
  roomOptionDesc: {
    fontSize: 13,
  },
  cancelButton: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
  },
});
