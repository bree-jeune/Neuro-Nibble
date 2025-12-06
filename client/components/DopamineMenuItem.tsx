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

interface DopamineMenuItemProps {
  item: string;
  onRemove: () => void;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export function DopamineMenuItem({ item, onRemove }: DopamineMenuItemProps) {
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
      <Feather name="star" size={16} color={theme.primary} />
      <ThemedText style={styles.text}>{item}</ThemedText>
      <Pressable
        onPress={onRemove}
        style={styles.removeButton}
        hitSlop={8}
      >
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
    gap: Spacing.sm,
  },
  text: {
    flex: 1,
    fontSize: 16,
  },
  removeButton: {
    padding: Spacing.xs,
  },
});
