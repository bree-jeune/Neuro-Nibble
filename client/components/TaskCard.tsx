import React, { useState } from "react";
import { StyleSheet, Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { Task } from "@/lib/types";

interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onStepToggle: (stepId: string) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function TaskCard({ task, onPress, onDelete, onArchive, onStepToggle }: TaskCardProps) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const scale = useSharedValue(1);

  const completedCount = task.steps.filter((s) => s.completed).length;
  const totalCount = task.steps.length;
  const isComplete = totalCount > 0 && completedCount === totalCount;
  const energyColor = theme[`energy${task.energyLevel.charAt(0).toUpperCase() + task.energyLevel.slice(1)}` as keyof typeof theme] as string;
  const borderColor = isComplete ? theme.success : energyColor;

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
      onPress={() => setExpanded(!expanded)}
      onLongPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        {
          backgroundColor: theme.backgroundDefault,
          borderLeftColor: borderColor,
        },
        animatedStyle,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <ThemedText style={styles.title} numberOfLines={expanded ? undefined : 1}>
            {task.title}
          </ThemedText>
          <Feather
            name={expanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={theme.textSecondary}
          />
        </View>
        <View style={styles.metaRow}>
          <View style={styles.progressGroup}>
            <ThemedText style={[styles.progress, { color: theme.textSecondary }]}>
              {completedCount}/{totalCount} bites
            </ThemedText>
            {isComplete ? (
              <ThemedText style={[styles.completeBadge, { color: theme.success }]}>
                ✓ Complete
              </ThemedText>
            ) : null}
          </View>
          <View style={[styles.energyBadge, { backgroundColor: energyColor }]}>
            <ThemedText style={styles.energyText}>
              {task.energyLevel}
            </ThemedText>
          </View>
        </View>
      </View>

      {expanded ? (
        <View style={styles.stepsContainer}>
          {task.steps.map((step, index) => (
            <Pressable
              key={step.id}
              onPress={() => onStepToggle(step.id)}
              style={styles.stepRow}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: step.completed ? theme.primary : "transparent",
                    borderColor: step.completed ? theme.primary : theme.border,
                  },
                ]}
              >
                {step.completed ? (
                  <Feather name="check" size={12} color="#FFFFFF" />
                ) : null}
              </View>
              <ThemedText
                style={[
                  styles.stepText,
                  step.completed && { textDecorationLine: "line-through", color: theme.textSecondary },
                ]}
              >
                {step.text}
              </ThemedText>
              <ThemedText style={[styles.stepMinutes, { color: theme.textSecondary }]}>
                {step.minutes}m
              </ThemedText>
            </Pressable>
          ))}
          <View style={styles.actionRow}>
            <Pressable
              onPress={onPress}
              style={[styles.actionButton, { backgroundColor: theme.primary }]}
            >
              <Feather name="play" size={14} color="#FFFFFF" />
              <ThemedText style={styles.actionText}>Work on this</ThemedText>
            </Pressable>
            {isComplete ? (
              <Pressable
                onPress={onArchive}
                style={[styles.actionButton, { backgroundColor: theme.success }]}
              >
                <Feather name="archive" size={14} color="#FFFFFF" />
                <ThemedText style={styles.actionText}>Archive</ThemedText>
              </Pressable>
            ) : null}
            <Pressable
              onPress={onDelete}
              style={[styles.actionButton, { backgroundColor: theme.backgroundSecondary }]}
            >
              <Feather name="trash-2" size={14} color={theme.error} />
              <ThemedText style={[styles.actionText, { color: theme.error }]}>Delete</ThemedText>
            </Pressable>
          </View>
        </View>
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderLeftWidth: 4,
    marginBottom: Spacing.md,
  },
  header: {},
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  title: {
    flex: 1,
    fontWeight: "500",
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progress: {
    fontSize: 14,
  },
  progressGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  completeBadge: {
    fontSize: 12,
    fontWeight: "600",
  },
  energyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  energyText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  stepsContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
  },
  stepMinutes: {
    fontSize: 12,
    marginLeft: Spacing.sm,
  },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
  },
});
