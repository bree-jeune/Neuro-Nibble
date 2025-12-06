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
import type { Task } from "@/lib/types";

interface RecentTaskCardProps {
  task: Task;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function RecentTaskCard({ task, onPress }: RecentTaskCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const completedCount = task.steps.filter((s) => s.completed).length;
  const totalCount = task.steps.length;
  const energyColor = theme[`energy${task.energyLevel.charAt(0).toUpperCase() + task.energyLevel.slice(1)}` as keyof typeof theme] as string;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        {
          backgroundColor: theme.backgroundDefault,
          borderLeftColor: energyColor,
        },
        animatedStyle,
      ]}
    >
      <View style={styles.content}>
        <ThemedText style={styles.title} numberOfLines={1}>
          {task.title}
        </ThemedText>
        <ThemedText style={[styles.progress, { color: theme.textSecondary }]}>
          {completedCount}/{totalCount} bites
        </ThemedText>
      </View>
      <View style={[styles.resumeButton, { backgroundColor: theme.primary }]}>
        <ThemedText style={styles.resumeText}>Resume</ThemedText>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderLeftWidth: 4,
    marginBottom: Spacing.sm,
  },
  content: {
    flex: 1,
  },
  title: {
    fontWeight: "500",
    fontSize: 16,
    marginBottom: Spacing.xs,
  },
  progress: {
    fontSize: 14,
  },
  resumeButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
  resumeText: {
    color: "#FFFFFF",
    fontWeight: "500",
    fontSize: 14,
  },
});
