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
import type { Step } from "@/lib/types";

interface StepItemProps {
  step: Step;
  index: number;
  onToggle: () => void;
  onRemove: () => void;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export function StepItem({ step, index, onToggle, onRemove }: StepItemProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedView
      style={[
        styles.container,
        { backgroundColor: theme.backgroundDefault },
        animatedStyle,
      ]}
    >
      <Pressable onPress={onToggle} style={styles.checkboxArea}>
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
      </Pressable>

      <View style={styles.content}>
        <ThemedText
          style={[
            styles.text,
            step.completed && {
              textDecorationLine: "line-through",
              color: theme.textSecondary,
            },
          ]}
          numberOfLines={2}
        >
          {step.text}
        </ThemedText>
        <ThemedText style={[styles.minutes, { color: theme.textSecondary }]}>
          {step.minutes} min
        </ThemedText>
      </View>

      <Pressable onPress={onRemove} style={styles.removeButton} hitSlop={8}>
        <Feather name="x" size={16} color={theme.textSecondary} />
      </Pressable>
    </AnimatedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
  },
  checkboxArea: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  text: {
    flex: 1,
    fontSize: 16,
  },
  minutes: {
    fontSize: 14,
    marginLeft: Spacing.sm,
  },
  removeButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
});
