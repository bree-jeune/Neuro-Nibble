import React, { useState } from "react";
import { StyleSheet, View, Pressable, Modal } from "react-native";
import { Feather } from "@expo/vector-icons";

import { triggerHaptic } from "@/lib/haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useAppStore } from "@/lib/store";
import { getRoomConfig } from "@/components/WeeklyRoomBadge";
import type { WeeklyRoom } from "@/lib/types";

interface WeeklyRoomSectionProps {
  room: WeeklyRoom;
  compact?: boolean;
}

const ROOMS: WeeklyRoom[] = ["gentle", "build", "repair", "chaos"];

const ROOM_DESCRIPTIONS: Record<WeeklyRoom, string> = {
  chaos: "Survival mode. One thing at a time.",
  gentle: "Low demands. Rest is productive.",
  build: "You have capacity. Move something forward.",
  repair: "Catching up gently on what slipped.",
};

const ROOM_COMPACT_COPY: Record<WeeklyRoom, string> = {
  gentle: "Gentle mode · You can stop after one bite",
  chaos: "Chaos mode · One thing is enough today",
  build: "Build mode · Start momentum",
  repair: "Repair mode · No shame, just re-enter",
};

export function WeeklyRoomSection({
  room,
  compact = false,
}: WeeklyRoomSectionProps) {
  const { theme } = useTheme();
  const { setWeeklyRoom } = useAppStore();
  const [showSelector, setShowSelector] = useState(false);

  const config = getRoomConfig(room);
  const roomColor = theme[
    `room${room.charAt(0).toUpperCase() + room.slice(1)}` as keyof typeof theme
  ] as string;
  const description = ROOM_DESCRIPTIONS[room];

  const handlePress = () => {
    triggerHaptic("light");
    setShowSelector(true);
  };

  const handleSelectRoom = (selectedRoom: WeeklyRoom) => {
    triggerHaptic("success");
    setWeeklyRoom(selectedRoom);
    setShowSelector(false);
  };

  return (
    <>
      <Pressable onPress={handlePress}>
        <View
          style={[
            compact ? styles.compactCard : styles.card,
            { backgroundColor: roomColor },
          ]}
        >
          <View style={styles.header}>
            <Feather name={config.icon} size={20} color={theme.text} />
            <ThemedText style={compact ? styles.compactLabel : styles.label}>
              {compact ? ROOM_COMPACT_COPY[room] : config.label}
            </ThemedText>
            <View style={styles.changeHint}>
              <Feather name="edit-2" size={13} color={theme.textSecondary} />
              <ThemedText
                style={[styles.changeLabel, { color: theme.textSecondary }]}
              >
                change week
              </ThemedText>
            </View>
          </View>

          {!compact ? (
            <>
              <ThemedText style={[styles.description, { color: theme.text }]}>
                {description}
              </ThemedText>

              <ThemedText
                style={[styles.mantra, { color: theme.textSecondary }]}
              >
                {config.mantra}
              </ThemedText>
            </>
          ) : null}
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
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.backgroundRoot },
            ]}
          >
            <ThemedText type="h3" style={styles.modalTitle}>
              Choose Your Week
            </ThemedText>
            <ThemedText
              style={[styles.modalSubtitle, { color: theme.textSecondary }]}
            >
              Match your capacity to your week
            </ThemedText>

            {ROOMS.map((r) => {
              const rConfig = getRoomConfig(r);
              const rColor = theme[
                `room${r.charAt(0).toUpperCase() + r.slice(1)}` as keyof typeof theme
              ] as string;
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
                    <ThemedText style={styles.roomOptionLabel}>
                      {rConfig.label}
                    </ThemedText>
                    {isSelected ? (
                      <Feather
                        name="check"
                        size={18}
                        color={theme.primary}
                        style={styles.checkIcon}
                      />
                    ) : null}
                  </View>
                  <ThemedText
                    style={[
                      styles.roomOptionDesc,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {ROOM_DESCRIPTIONS[r]}
                  </ThemedText>
                </Pressable>
              );
            })}

            <Pressable
              onPress={() => setShowSelector(false)}
              style={[
                styles.cancelButton,
                { borderColor: theme.textSecondary },
              ]}
            >
              <ThemedText style={{ color: theme.textSecondary }}>
                Cancel
              </ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  compactCard: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  label: {
    fontWeight: "700",
    fontSize: 17,
    flex: 1,
  },
  compactLabel: {
    fontWeight: "600",
    fontSize: 14,
    flex: 1,
  },
  changeHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: "auto",
  },
  changeLabel: {
    fontSize: 11,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  mantra: {
    fontSize: 13,
    fontStyle: "italic",
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
