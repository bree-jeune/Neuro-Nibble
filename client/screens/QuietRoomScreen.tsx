import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  ScrollView,
} from "react-native";
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
  {
    key: "silent",
    label: "Silent Company",
    hint: "Just be near others",
    icon: "moon",
  },
  {
    key: "gentle",
    label: "Gentle Start",
    hint: "Ease into one bite",
    icon: "feather",
  },
  {
    key: "sprint",
    label: "Sprint Room",
    hint: "Short focused push",
    icon: "zap",
  },
  {
    key: "recovery",
    label: "Recovery Room",
    hint: "Rest still counts",
    icon: "cloud",
  },
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
          toValue: 0.72,
          duration: 1700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.25,
          duration: 1700,
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

export default function QuietRoomScreen() {
  const { theme } = useTheme();
  const quietRoomMode = useAppStore((s) => s.quietRoomMode);
  const setQuietRoomMode = useAppStore((s) => s.setQuietRoomMode);
  const reduceMotion = useAppStore((s) => s.reduceMotion);
  const { total, taking, restarting, sitting } = usePresence();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.backgroundDefault,
            borderColor: theme.border,
          },
        ]}
      >
        <View style={styles.orbRow}>
          <Orb
            size={14}
            delay={0}
            color={theme.primary}
            reduceMotion={reduceMotion}
          />
          <Orb
            size={10}
            delay={350}
            color={theme.primary}
            reduceMotion={reduceMotion}
          />
          <Orb
            size={18}
            delay={700}
            color={theme.primary}
            reduceMotion={reduceMotion}
          />
          <Orb
            size={12}
            delay={1050}
            color={theme.primary}
            reduceMotion={reduceMotion}
          />
        </View>

        <ThemedText type="h2" style={styles.headline}>
          You’re not the only one trying right now.
        </ThemedText>

        <ThemedText style={[styles.total, { color: theme.textSecondary }]}>
          {total} here with you right now
        </ThemedText>

        <View
          style={[
            styles.subCounts,
            { backgroundColor: theme.backgroundSecondary },
          ]}
        >
          <ThemedText
            style={[styles.subCountText, { color: theme.textSecondary }]}
          >
            {taking} taking a bite · {restarting} restarting gently · {sitting}{" "}
            resting in place
          </ThemedText>
        </View>

        <View style={styles.modeGrid}>
          {MODES.map((mode) => {
            const selected = quietRoomMode === mode.key;
            return (
              <Pressable
                key={mode.key}
                onPress={() => {
                  triggerHaptic("selection");
                  setQuietRoomMode(mode.key);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${mode.label}. ${mode.hint}`}
                style={[
                  styles.modeCard,
                  {
                    backgroundColor: selected
                      ? theme.primary
                      : theme.backgroundSecondary,
                    borderColor: selected ? theme.primary : theme.border,
                  },
                ]}
              >
                <Feather
                  name={mode.icon}
                  size={18}
                  color={selected ? "#FFFFFF" : theme.text}
                />
                <View style={styles.modeTextContainer}>
                  <ThemedText
                    style={[
                      styles.modeLabel,
                      { color: selected ? "#FFFFFF" : theme.text },
                    ]}
                  >
                    {mode.label}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.modeHint,
                      { color: selected ? "#FFFFFF" : theme.textSecondary },
                    ]}
                  >
                    {mode.hint}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    padding: Spacing.lg,
  },
  card: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  orbRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headline: {
    fontSize: 24,
    lineHeight: 30,
  },
  total: {
    fontSize: 14,
  },
  subCounts: {
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
  },
  subCountText: {
    fontSize: 13,
    lineHeight: 18,
  },
  modeGrid: {
    gap: Spacing.sm,
  },
  modeCard: {
    minHeight: 56,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  modeTextContainer: {
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
