import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { triggerHaptic } from "@/lib/haptics";
import { useAppStore } from "@/lib/store";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type { WeeklyRoom } from "@/lib/types";

type WeeklyRoomSetupRoute = RouteProp<RootStackParamList, "WeeklyRoomSetup">;

const ROOM_ORDER: WeeklyRoom[] = ["chaos", "gentle", "build", "repair"];

const ROOM_COPY: Record<
  WeeklyRoom,
  {
    label: string;
    title: string;
    mantra: string;
    icon: keyof typeof Feather.glyphMap;
  }
> = {
  chaos: {
    label: "Chaos",
    title: "Everything's on fire",
    mantra: "Less bad is good enough.",
    icon: "wind",
  },
  gentle: {
    label: "Gentle",
    title: "Tired or tender",
    mantra: "One bite counts.",
    icon: "moon",
  },
  build: {
    label: "Build",
    title: "Some capacity",
    mantra: "Move one thing forward.",
    icon: "layers",
  },
  repair: {
    label: "Repair",
    title: "Catching up",
    mantra: "Maintenance isn't failure.",
    icon: "tool",
  },
};

export default function WeeklyRoomSetupScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<WeeklyRoomSetupRoute>();
  const { weeklyRoom, setWeeklyRoom, completeRoomSetup } = useAppStore();
  const [selectedRoom, setSelectedRoom] = useState<WeeklyRoom>(weeklyRoom);
  const isChanging = route.params?.mode === "change";

  const handleSelectRoom = useCallback((room: WeeklyRoom) => {
    triggerHaptic("selection");
    setSelectedRoom(room);
  }, []);

  const handleUseMode = useCallback(() => {
    triggerHaptic("success");
    setWeeklyRoom(selectedRoom);
    completeRoomSetup();

    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace("Main");
    }
  }, [completeRoomSetup, navigation, selectedRoom, setWeeklyRoom]);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText type="h1" style={styles.title}>
            How are you showing up today?
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            {isChanging
              ? "Changing your room changes what NeuroNibble prioritizes."
              : "Pick the mode that matches your capacity. NeuroNibble will adjust what it shows you."}
          </ThemedText>
        </View>

        <View style={styles.roomList}>
          {ROOM_ORDER.map((room) => {
            const copy = ROOM_COPY[room];
            const selected = selectedRoom === room;
            const roomColor = theme[
              `room${room.charAt(0).toUpperCase() + room.slice(1)}` as keyof typeof theme
            ] as string;

            return (
              <Pressable
                key={room}
                onPress={() => handleSelectRoom(room)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${copy.label}: ${copy.title}. ${copy.mantra}`}
                style={[
                  styles.roomCard,
                  {
                    backgroundColor: selected
                      ? roomColor
                      : theme.backgroundDefault,
                    borderColor: selected ? theme.primary : theme.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.roomIcon,
                    { backgroundColor: selected ? "#FFFFFF66" : roomColor },
                  ]}
                >
                  <Feather name={copy.icon} size={22} color={theme.text} />
                </View>
                <View style={styles.roomText}>
                  <ThemedText style={styles.roomLabel}>{copy.label}</ThemedText>
                  <ThemedText style={styles.roomTitle}>{copy.title}</ThemedText>
                  <ThemedText
                    style={[styles.roomMantra, { color: theme.textSecondary }]}
                  >
                    {copy.mantra}
                  </ThemedText>
                </View>
                {selected ? (
                  <Feather name="check-circle" size={22} color={theme.text} />
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={handleUseMode}
          accessibilityRole="button"
          accessibilityLabel="Use this mode"
          style={[styles.cta, { backgroundColor: theme.primary }]}
        >
          <ThemedText style={styles.ctaText}>Use this mode</ThemedText>
        </Pressable>

        {isChanging ? (
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            style={styles.cancelButton}
          >
            <ThemedText style={{ color: theme.textSecondary }}>
              Not now
            </ThemedText>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xl,
  },
  header: {
    gap: Spacing.md,
  },
  title: {
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  roomList: {
    gap: Spacing.sm,
  },
  roomCard: {
    minHeight: 104,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  roomIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  roomText: {
    flex: 1,
    gap: 2,
  },
  roomLabel: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  roomTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  roomMantra: {
    fontSize: 14,
    lineHeight: 20,
  },
  cta: {
    minHeight: 52,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  cancelButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
