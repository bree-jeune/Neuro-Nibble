import React, { useEffect, useRef } from "react";
import { StyleSheet } from "react-native";
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
import { BorderRadius } from "@/constants/theme";
import { useAppStore } from "@/lib/store";

const SHAPE_SIZE = 56;
const BREATHE_DURATION = 4000;

export function BreathingPacer() {
  const { theme } = useTheme();
  const hapticsEnabled = useAppStore((s) => s.hapticsEnabled);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);
  const isBreathing = useRef(false);
  const hapticInterval = useRef<NodeJS.Timeout | null>(null);

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
    }, BREATHE_DURATION);
  };

  const stopHapticLoop = () => {
    if (hapticInterval.current) {
      clearInterval(hapticInterval.current);
      hapticInterval.current = null;
    }
  };

  const startBreathing = () => {
    isBreathing.current = true;
    startHapticLoop();
    
    scale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: BREATHE_DURATION, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: BREATHE_DURATION, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: BREATHE_DURATION, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.6, { duration: BREATHE_DURATION, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  };

  const stopBreathing = () => {
    isBreathing.current = false;
    stopHapticLoop();
    cancelAnimation(scale);
    cancelAnimation(opacity);
    scale.value = withTiming(1, { duration: 300 });
    opacity.value = withTiming(0.6, { duration: 300 });
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
  );
}

const styles = StyleSheet.create({
  shape: {
    width: SHAPE_SIZE,
    height: SHAPE_SIZE,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
});
