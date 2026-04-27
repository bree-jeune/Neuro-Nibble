import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { usePresence } from "@/hooks/usePresence";
import { useAppStore } from "@/lib/store";

interface PresenceStripProps {
  variant?: "working" | "with you";
}

export function PresenceStrip({ variant = "working" }: PresenceStripProps) {
  const { theme } = useTheme();
  const reduceMotion = useAppStore((s) => s.reduceMotion);
  const { total } = usePresence();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduceMotion) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reduceMotion]);

  const label =
    variant === "with you"
      ? `${total} here with you, quietly.`
      : `${total} working quietly too.`;

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={label}
      style={[styles.strip, { backgroundColor: theme.primary + "15" }]}
    >
      <Animated.View
        style={[
          styles.dot,
          { backgroundColor: theme.success, opacity: pulse },
        ]}
      />
      <ThemedText style={[styles.text, { color: theme.primary }]}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    fontSize: 13,
    fontWeight: "500",
  },
});
