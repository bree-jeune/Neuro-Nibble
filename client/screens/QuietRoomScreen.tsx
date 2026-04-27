import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

const AMBIENT_SUGGESTIONS: Record<QuietRoomMode, string[]> = {
  silent: [
    "No pressure to do anything.",
    "You can just exist here.",
    "Others are nearby too.",
  ],
  gentle: [
    "Pick one small thing when ready.",
    "There's no rush.",
    "Soft start counts.",
  ],
  sprint: [
    "Set a single intention.",
    "Work alongside others.",
    "You've got this window.",
  ],
  recovery: [
    "Rest is valid work.",
    "You don't have to earn your next break.",
    "Close your eyes if you want.",
  ],
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

function ModeCard({
  mode,
  selected,
  onPress,
}: {
  mode: ModeConfig;
  selected: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!selected) {
      scale.setValue(1);
      return;
    }

    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.03,
        duration: 150,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 150,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [scale, selected]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
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
        {selected ? <Feather name="check" size={16} color="#FFFFFF" /> : null}
      </Pressable>
    </Animated.View>
  );
}

export default function QuietRoomScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const quietRoomMode = useAppStore((s) => s.quietRoomMode);
  const setQuietRoomMode = useAppStore((s) => s.setQuietRoomMode);
  const reduceMotion = useAppStore((s) => s.reduceMotion);
  const { total, taking, restarting, sitting } = usePresence();
  const [displayedTotal, setDisplayedTotal] = useState(total);
  const displayedTotalRef = useRef(total);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    displayedTotalRef.current = total;
    setDisplayedTotal(total);
  }, [total]);

  useEffect(() => {
    const interval = setInterval(() => {
      const direction = Math.random() > 0.5 ? 1 : -1;
      const delta = 1 + Math.floor(Math.random() * 3);
      const next = Math.max(3, displayedTotalRef.current + direction * delta);
      displayedTotalRef.current = next;
      setDisplayedTotal(next);
    }, 90000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const showTimer = setTimeout(() => {
      Animated.sequence([
        Animated.timing(toastOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.delay(3000),
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    }, 800);

    return () => clearTimeout(showTimer);
  }, [toastOpacity]);

  const handleSelectMode = useCallback(
    (mode: QuietRoomMode) => {
      triggerHaptic("selection");
      setQuietRoomMode(mode);
    },
    [setQuietRoomMode],
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={[
        styles.contentContainer,
        {
          paddingTop: headerHeight + Spacing.sm,
          paddingBottom: Math.max(Spacing.lg, insets.bottom + Spacing.md),
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.joinToast,
          {
            opacity: toastOpacity,
            backgroundColor: theme.backgroundDefault,
            borderColor: theme.border,
            top: headerHeight + Spacing.sm,
          },
        ]}
      >
        <ThemedText style={styles.joinToastText}>
          You&apos;re here. That&apos;s enough.
        </ThemedText>
      </Animated.View>

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
          {displayedTotal} here with you right now
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
              <ModeCard
                key={mode.key}
                mode={mode}
                selected={selected}
                onPress={() => handleSelectMode(mode.key)}
              />
            );
          })}
        </View>

        <View
          style={[
            styles.ambientSection,
            { backgroundColor: theme.backgroundSecondary },
          ]}
        >
          <ThemedText style={styles.ambientTitle}>
            While you&apos;re here
          </ThemedText>
          {AMBIENT_SUGGESTIONS[quietRoomMode].map((suggestion) => (
            <View key={suggestion} style={styles.suggestionRow}>
              <View
                style={[
                  styles.suggestionDot,
                  { backgroundColor: theme.primary },
                ]}
              />
              <ThemedText
                style={[styles.suggestionText, { color: theme.textSecondary }]}
              >
                {suggestion}
              </ThemedText>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  joinToast: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 10,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
  },
  joinToastText: {
    fontSize: 14,
    fontWeight: "600",
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
  ambientSection: {
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  ambientTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  suggestionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
