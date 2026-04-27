import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Pressable, Animated, Easing } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { usePresence } from "@/hooks/usePresence";
import { useAppStore } from "@/lib/store";
import { triggerHaptic } from "@/lib/haptics";
import type { QuietRoomMode } from "@/lib/types";

interface QuietRoomPreviewCardProps {
  onPress: () => void;
}

const MODE_LABELS: Record<QuietRoomMode, string> = {
  silent: "Silent Company",
  gentle: "Gentle Start",
  sprint: "Sprint Room",
  recovery: "Recovery Room",
};

function Orb({
  size,
  delay,
  color,
  reduceMotion,
}: {
  size: number;
  delay: number;
  color: string;
  reduceMotion: boolean;
}) {
  const opacity = useRef(
    new Animated.Value(reduceMotion ? 0.65 : 0.35),
  ).current;

  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(0.65);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, {
          toValue: 0.75,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [delay, opacity, reduceMotion]);

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
      }}
    />
  );
}

export function QuietRoomPreviewCard({ onPress }: QuietRoomPreviewCardProps) {
  const { theme } = useTheme();
  const quietRoomMode = useAppStore((s) => s.quietRoomMode);
  const reduceMotion = useAppStore((s) => s.reduceMotion);
  const { total } = usePresence();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
      ]}
    >
      <View style={styles.headerRow}>
        <View>
          <ThemedText type="h3" style={styles.title}>
            Quiet Room
          </ThemedText>
          <ThemedText style={[styles.presence, { color: theme.textSecondary }]}>
            {total} here with you
          </ThemedText>
        </View>

        <View style={styles.orbRow}>
          <Orb
            size={9}
            delay={0}
            color={theme.primary}
            reduceMotion={reduceMotion}
          />
          <Orb
            size={12}
            delay={300}
            color={theme.primary}
            reduceMotion={reduceMotion}
          />
          <Orb
            size={8}
            delay={700}
            color={theme.primary}
            reduceMotion={reduceMotion}
          />
        </View>
      </View>

      <ThemedText style={[styles.modeLabel, { color: theme.textSecondary }]}>
        Mode: {MODE_LABELS[quietRoomMode]}
      </ThemedText>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Enter Quiet Room"
        onPress={() => {
          triggerHaptic("selection");
          onPress();
        }}
        style={[styles.button, { backgroundColor: theme.primary }]}
      >
        <ThemedText style={styles.buttonText}>Enter Room</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
  },
  presence: {
    fontSize: 13,
    marginTop: 2,
  },
  orbRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modeLabel: {
    fontSize: 14,
  },
  button: {
    minHeight: 44,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
