import React, { useCallback } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { triggerHaptic } from "@/lib/haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { ThoughtItem } from "@/lib/types";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

interface SwipeableThoughtCardProps {
  thought: ThoughtItem;
  onVent: (id: string) => void;
  onConvertToTask: (thought: ThoughtItem) => void;
}

export function SwipeableThoughtCard({
  thought,
  onVent,
  onConvertToTask,
}: SwipeableThoughtCardProps) {
  const { theme } = useTheme();
  const translateX = useSharedValue(0);
  const cardOpacity = useSharedValue(1);
  const cardHeight = useSharedValue(72);

  const handleVent = useCallback(() => {
    triggerHaptic("heavy");
    onVent(thought.id);
  }, [onVent, thought.id]);

  const handleConvert = useCallback(() => {
    triggerHaptic("success");
    onConvertToTask(thought);
  }, [onConvertToTask, thought]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (event.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-SCREEN_WIDTH, { duration: 200 });
        cardOpacity.value = withTiming(0, { duration: 200 });
        cardHeight.value = withTiming(0, { duration: 200 }, () => {
          runOnJS(handleVent)();
        });
      } else if (event.translationX > SWIPE_THRESHOLD) {
        translateX.value = withTiming(SCREEN_WIDTH, { duration: 200 });
        cardOpacity.value = withTiming(0, { duration: 200 });
        cardHeight.value = withTiming(0, { duration: 200 }, () => {
          runOnJS(handleConvert)();
        });
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: cardOpacity.value,
    height: cardHeight.value,
    marginBottom: interpolate(
      cardHeight.value,
      [0, 72],
      [0, Spacing.sm],
      Extrapolation.CLAMP
    ),
  }));

  const leftBackgroundStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const rightBackgroundStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const leftIconStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD * 0.5, SWIPE_THRESHOLD],
      [0.5, 0.8, 1],
      Extrapolation.CLAMP
    );
    return { transform: [{ scale }] };
  });

  const rightIconStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD * 0.5, 0],
      [1, 0.8, 0.5],
      Extrapolation.CLAMP
    );
    return { transform: [{ scale }] };
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.backgroundAction,
          styles.leftAction,
          { backgroundColor: theme.primary },
          leftBackgroundStyle,
        ]}
      >
        <Animated.View style={leftIconStyle}>
          <Feather name="check-circle" size={24} color="#FFFFFF" />
        </Animated.View>
        <ThemedText style={styles.actionText}>Task</ThemedText>
      </Animated.View>

      <Animated.View
        style={[
          styles.backgroundAction,
          styles.rightAction,
          { backgroundColor: theme.error },
          rightBackgroundStyle,
        ]}
      >
        <ThemedText style={styles.actionText}>Vent</ThemedText>
        <Animated.View style={rightIconStyle}>
          <Feather name="trash-2" size={24} color="#FFFFFF" />
        </Animated.View>
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: theme.backgroundDefault },
            cardStyle,
          ]}
        >
          <ThemedText numberOfLines={2} style={styles.thoughtText}>
            {thought.text}
          </ThemedText>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
  },
  backgroundAction: {
    position: "absolute",
    top: 0,
    bottom: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  leftAction: {
    left: 0,
    right: 0,
    justifyContent: "flex-start",
  },
  rightAction: {
    left: 0,
    right: 0,
    justifyContent: "flex-end",
  },
  actionText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  card: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    minHeight: 56,
  },
  thoughtText: {
    fontSize: 15,
    lineHeight: 22,
  },
});
