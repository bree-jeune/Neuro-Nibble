import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
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
import * as Haptics from "expo-haptics";

import { useTheme } from "@/hooks/useTheme";
import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useAppStore } from "@/lib/store";

const SHAPE_SIZE = 56;
const BREATHE_DURATION = 4000;

export function BreathingPacer() {
  const { theme } = useTheme();
  const hapticsEnabled = useAppStore((s) => s.hapticsEnabled);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.7);
  const isBreathing = useRef(false);
  const hapticInterval = useRef<NodeJS.Timeout | null>(null);
  const [isActive, setIsActive] = useState(false);

  const triggerHaptic = () => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const startHapticLoop = () => {
    if (hapticInterval.current) {
      clearInterval(hapticInterval.current);
    }
    triggerHaptic();
    hapticInterval.current = setInterval(() => {
      if (isBreathing.current) {
        triggerHaptic();
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
    
    scale.value = withRepeat(
      withSequence(
        withTiming(1.5, { duration: BREATHE_DURATION, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: BREATHE_DURATION, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: BREATHE_DURATION, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.7, { duration: BREATHE_DURATION, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
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
    <View style={styles.container}>
      <GestureDetector gesture={longPressGesture}>
        <Animated.View
          style={[
            styles.shape,
            { backgroundColor: theme.primary },
            animatedStyle,
          ]}
        >
          <Feather name="wind" size={24} color="#FFFFFF" />
        </Animated.View>
      </GestureDetector>
      <ThemedText
        type="small"
        style={[styles.hint, { color: theme.textSecondary }]}
      >
        {isActive ? "Breathe..." : "Hold to breathe"}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  shape: {
    width: SHAPE_SIZE,
    height: SHAPE_SIZE,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    marginTop: Spacing.xs,
    fontSize: 10,
  },
});
