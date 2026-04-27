import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Pressable, Animated, Easing } from "react-native";
import { Feather } from "@expo/vector-icons";

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
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Enter Quiet Room"
      onPress={() => {
        triggerHaptic("selection");
        onPress();
      }}
      style={[
        styles.card,
        { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
      ]}
    >
      <View style={styles.contentRow}>
        <View style={styles.copyBlock}>
          <ThemedText type="h3" style={styles.title}>
            Quiet Room
          </ThemedText>
          <ThemedText style={[styles.presence, { color: theme.textSecondary }]}>
            {total} here with you · {MODE_LABELS[quietRoomMode]}
          </ThemedText>
        </View>

        <View style={styles.rightSide}>
          <View style={styles.orbRow}>
            <Orb
              size={8}
              delay={0}
              color={theme.primary}
              reduceMotion={reduceMotion}
            />
            <Orb
              size={10}
              delay={300}
              color={theme.primary}
              reduceMotion={reduceMotion}
            />
            <Orb
              size={7}
              delay={700}
              color={theme.primary}
              reduceMotion={reduceMotion}
            />
          </View>
          <Feather name="chevron-right" size={18} color={theme.textSecondary} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: Spacing.lg,
    minHeight: 92,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    justifyContent: "center",
  },
  contentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  copyBlock: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  title: {
    fontSize: 17,
  },
  presence: {
    fontSize: 13,
    marginTop: 2,
  },
  rightSide: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  orbRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});
