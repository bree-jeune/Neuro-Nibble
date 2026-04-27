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

interface ModeConfig {
  key: QuietRoomMode;
  label: string;
  hint: string;
  icon: keyof typeof Feather.glyphMap;
}

const MODES: ModeConfig[] = [
  { key: "silent", label: "Silent Company", hint: "Just be near others", icon: "moon" },
  { key: "gentle", label: "Gentle Start", hint: "Ease into one bite", icon: "feather" },
  { key: "sprint", label: "Sprint Room", hint: "Short focused push", icon: "zap" },
  { key: "recovery", label: "Recovery Room", hint: "Rest counts as working", icon: "cloud" },
];

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
  const opacity = useRef(new Animated.Value(reduceMotion ? 0.6 : 0.3)).current;

  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(0.6);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.25,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, delay, reduceMotion]);

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

export function BodyDoublingRoomCard() {
  const { theme } = useTheme();
  const quietRoomMode = useAppStore((s) => s.quietRoomMode);
  const setQuietRoomMode = useAppStore((s) => s.setQuietRoomMode);
  const reduceMotion = useAppStore((s) => s.reduceMotion);
  const { total, taking, restarting, sitting } = usePresence();

  return (
    <View
      style={[styles.card, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}
      accessibilityRole="summary"
    >
      <View style={styles.headerRow}>
        <View style={styles.orbRow}>
          <Orb size={14} delay={0} color={theme.primary} reduceMotion={reduceMotion} />
          <Orb size={10} delay={400} color={theme.primary} reduceMotion={reduceMotion} />
          <Orb size={18} delay={800} color={theme.primary} reduceMotion={reduceMotion} />
          <Orb size={12} delay={1200} color={theme.primary} reduceMotion={reduceMotion} />
        </View>
        <ThemedText style={[styles.countLabel, { color: theme.textSecondary }]}>
          {total} here
        </ThemedText>
      </View>

      <ThemedText type="h3" style={styles.headline}>
        You're not the only one trying right now.
      </ThemedText>

      <View style={styles.subCounts}>
        <ThemedText style={[styles.subCount, { color: theme.textSecondary }]}>
          {taking} taking a bite · {restarting} restarting gently · {sitting} just sitting with the app
        </ThemedText>
      </View>

      <View style={styles.modeGrid}>
        {MODES.map((m) => {
          const selected = quietRoomMode === m.key;
          return (
            <Pressable
              key={m.key}
              onPress={() => {
                triggerHaptic("selection");
                setQuietRoomMode(m.key);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${m.label}. ${m.hint}`}
              style={[
                styles.modeCard,
                {
                  backgroundColor: selected ? theme.primary : theme.backgroundSecondary,
                  borderColor: selected ? theme.primary : theme.border,
                },
              ]}
            >
              <Feather
                name={m.icon}
                size={18}
                color={selected ? "#FFFFFF" : theme.text}
              />
              <View style={styles.modeText}>
                <ThemedText
                  style={[
                    styles.modeLabel,
                    { color: selected ? "#FFFFFF" : theme.text },
                  ]}
                >
                  {m.label}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.modeHint,
                    { color: selected ? "#FFFFFF" : theme.textSecondary },
                  ]}
                >
                  {m.hint}
                </ThemedText>
              </View>
              {selected ? (
                <Feather name="check" size={16} color="#FFFFFF" />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  orbRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  countLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  headline: {
    fontSize: 18,
    lineHeight: 24,
  },
  subCounts: {
    paddingBottom: Spacing.xs,
  },
  subCount: {
    fontSize: 13,
    lineHeight: 18,
  },
  modeGrid: {
    gap: Spacing.sm,
  },
  modeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    minHeight: 56,
  },
  modeText: {
    flex: 1,
  },
  modeLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  modeHint: {
    fontSize: 12,
    marginTop: 2,
  },
});
