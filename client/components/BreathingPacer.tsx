import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, type ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { triggerHaptic } from "@/lib/haptics";
import { useTheme } from "@/hooks/useTheme";
import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useAppStore } from "@/lib/store";

const SHAPE_SIZE = 56;
const BREATHE_DURATION = 4000;

interface BreathingPacerProps {
  size?: number;
  showHint?: boolean;
  style?: ViewStyle;
}

export function BreathingPacer({
  size = SHAPE_SIZE,
  showHint = true,
  style,
}: BreathingPacerProps) {
  const { theme } = useTheme();
  const reduceMotion = useAppStore((s) => s.reduceMotion);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.7);
  const isBreathing = useRef(false);
  const hapticInterval = useRef<NodeJS.Timeout | null>(null);
  const [isActive, setIsActive] = useState(false);

  const startHapticLoop = () => {
    if (hapticInterval.current) {
      clearInterval(hapticInterval.current);
    }
    triggerHaptic("light");
    hapticInterval.current = setInterval(() => {
      if (isBreathing.current) {
        triggerHaptic("light");
      }
    }, BREATHE_DURATION * 2);
  };

  const stopHapticLoop = () => {
    if (hapticInterval.current) {
      clearInterval(hapticInterval.current);
      hapticInterval.current = null;
    }
  };

  const startBreathing = () => {
    isBreathing.current = true;
    setIsActive(true);
    startHapticLoop();

    if (reduceMotion) {
      scale.value = withTiming(1.08, { duration: 250 });
      opacity.value = withTiming(1, { duration: 250 });
      return;
    }

    scale.value = withRepeat(
      withSequence(
        withTiming(1.5, {
          duration: BREATHE_DURATION,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(1, {
          duration: BREATHE_DURATION,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      false,
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: BREATHE_DURATION,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0.7, {
          duration: BREATHE_DURATION,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      false,
    );
  };

  const stopBreathing = () => {
    isBreathing.current = false;
    setIsActive(false);
    stopHapticLoop();
    cancelAnimation(scale);
    cancelAnimation(opacity);
    scale.value = withTiming(1, { duration: 300 });
    opacity.value = withTiming(0.7, { duration: 300 });
  };

  useEffect(() => {
    return () => {
      stopHapticLoop();
    };
  }, []);

  const longPressGesture = Gesture.LongPress()
    .minDuration(200)
    .onStart(() => {
      runOnJS(startBreathing)();
    })
    .onEnd(() => {
      runOnJS(stopBreathing)();
    })
    .onFinalize(() => {
      runOnJS(stopBreathing)();
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={[styles.container, style]}>
      <GestureDetector gesture={longPressGesture}>
        <Animated.View
          style={[
            styles.shape,
            {
              backgroundColor: theme.primary,
              width: size,
              height: size,
              borderRadius: Math.min(size / 2, BorderRadius.lg),
            },
            animatedStyle,
          ]}
        >
          <Feather
            name="wind"
            size={Math.max(18, size * 0.42)}
            color="#FFFFFF"
          />
        </Animated.View>
      </GestureDetector>
      {showHint ? (
        <ThemedText
          type="small"
          style={[styles.hint, { color: theme.textSecondary }]}
        >
          {isActive ? "Breathe..." : "Hold to breathe"}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  shape: {
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    marginTop: Spacing.xs,
    fontSize: 10,
  },
});
