import React from "react";
import { StyleSheet, Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface DailyBookendProps {
  completed: boolean;
  onComplete: () => void;
  timeOfDay: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function DailyBookend({ completed, onComplete, timeOfDay }: DailyBookendProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const isEvening = timeOfDay === "evening";

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!completed) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  if (completed) {
    return (
      <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
        <View style={styles.completedRow}>
          <Feather name="check-circle" size={24} color={theme.success} />
          <ThemedText style={[styles.completedText, { color: theme.textSecondary }]}>
            {isEvening ? "You showed up today. That counts." : "Day started. You're here."}
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <AnimatedPressable
      onPress={onComplete}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        { backgroundColor: theme.backgroundDefault },
        animatedStyle,
      ]}
    >
      <View style={styles.row}>
        <View style={[styles.iconContainer, { backgroundColor: theme.primary }]}>
          <Feather
            name={isEvening ? "moon" : "sun"}
            size={20}
            color="#FFFFFF"
          />
        </View>
        <View style={styles.textContainer}>
          <ThemedText style={styles.title}>
            {isEvening ? "End your day" : "Start your day"}
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            {isEvening
              ? "Mark that you showed up today"
              : "Tap to check in for the day"}
          </ThemedText>
        </View>
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontWeight: "500",
    fontSize: 16,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
  },
  completedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  completedText: {
    fontSize: 14,
    fontStyle: "italic",
    flex: 1,
  },
});
