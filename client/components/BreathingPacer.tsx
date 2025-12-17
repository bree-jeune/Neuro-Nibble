import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  cancelAnimation,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { triggerHaptic } from "@/lib/haptics";
import { useTheme } from "@/hooks/useTheme";
import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, Spacing } from "@/constants/theme";

const SHAPE_SIZE = 72;
const INHALE_DURATION = 4000;
const HOLD_DURATION = 2000;
const EXHALE_DURATION = 4000;
const TOTAL_CYCLE = INHALE_DURATION + HOLD_DURATION + EXHALE_DURATION;

type BreathPhase = "idle" | "inhale" | "hold" | "exhale" | "completing";

interface BreathingPacerProps {
  size?: "small" | "large";
  showLabel?: boolean;
}

export function BreathingPacer({ size = "small", showLabel = true }: BreathingPacerProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);
  const [phase, setPhase] = useState<BreathPhase>("idle");
  const [isActive, setIsActive] = useState(false);
  const cycleRef = useRef<NodeJS.Timeout | null>(null);
  const shouldStopRef = useRef(false);
  const currentPhaseRef = useRef<BreathPhase>("idle");

  const shapeSize = size === "large" ? 120 : SHAPE_SIZE;
  const iconSize = size === "large" ? 36 : 24;

  const updatePhase = useCallback((newPhase: BreathPhase) => {
    currentPhaseRef.current = newPhase;
    setPhase(newPhase);
  }, []);

  const runBreathCycle = useCallback(() => {
    // Inhale
    updatePhase("inhale");
    triggerHaptic("light");

    scale.value = withTiming(1.5, {
      duration: INHALE_DURATION,
      easing: Easing.inOut(Easing.ease)
    });
    opacity.value = withTiming(1, {
      duration: INHALE_DURATION,
      easing: Easing.inOut(Easing.ease)
    });

    // Schedule hold phase
    cycleRef.current = setTimeout(() => {
      updatePhase("hold");
      triggerHaptic("medium");

      // Schedule exhale phase
      cycleRef.current = setTimeout(() => {
        updatePhase("exhale");
        triggerHaptic("light");

        scale.value = withTiming(1, {
          duration: EXHALE_DURATION,
          easing: Easing.inOut(Easing.ease)
        });
        opacity.value = withTiming(0.6, {
          duration: EXHALE_DURATION,
          easing: Easing.inOut(Easing.ease)
        });

        // Schedule next cycle or completion
        cycleRef.current = setTimeout(() => {
          if (shouldStopRef.current) {
            // Completing - gracefully end
            updatePhase("idle");
            setIsActive(false);
            shouldStopRef.current = false;
            triggerHaptic("success");
          } else {
            // Continue to next cycle
            runBreathCycle();
          }
        }, EXHALE_DURATION);
      }, HOLD_DURATION);
    }, INHALE_DURATION);
  }, [scale, opacity, updatePhase]);

  const startBreathing = useCallback(() => {
    if (isActive) return;

    shouldStopRef.current = false;
    setIsActive(true);
    triggerHaptic("medium");
    runBreathCycle();
  }, [isActive, runBreathCycle]);

  const requestStop = useCallback(() => {
    if (!isActive) return;

    // Signal that we want to stop, but let the current cycle complete
    shouldStopRef.current = true;
    updatePhase("completing");
  }, [isActive, updatePhase]);

  const forceStop = useCallback(() => {
    // Emergency stop - clear everything
    if (cycleRef.current) {
      clearTimeout(cycleRef.current);
      cycleRef.current = null;
    }
    shouldStopRef.current = false;
    cancelAnimation(scale);
    cancelAnimation(opacity);
    scale.value = withTiming(1, { duration: 300 });
    opacity.value = withTiming(0.6, { duration: 300 });
    updatePhase("idle");
    setIsActive(false);
  }, [scale, opacity, updatePhase]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cycleRef.current) {
        clearTimeout(cycleRef.current);
      }
    };
  }, []);

  const handlePress = useCallback(() => {
    if (isActive) {
      requestStop();
    } else {
      startBreathing();
    }
  }, [isActive, startBreathing, requestStop]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const getPhaseText = () => {
    switch (phase) {
      case "inhale":
        return "Breathe in...";
      case "hold":
        return "Hold...";
      case "exhale":
        return "Breathe out...";
      case "completing":
        return "Finishing breath...";
      default:
        return "Tap to breathe";
    }
  };

  const getPhaseIcon = (): keyof typeof Feather.glyphMap => {
    switch (phase) {
      case "inhale":
        return "arrow-up";
      case "hold":
        return "pause";
      case "exhale":
        return "arrow-down";
      default:
        return "wind";
    }
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={handlePress} onLongPress={forceStop}>
        <Animated.View
          style={[
            styles.shape,
            {
              backgroundColor: theme.primary,
              width: shapeSize,
              height: shapeSize,
              borderRadius: shapeSize / 2,
            },
            animatedStyle,
          ]}
        >
          <Feather name={getPhaseIcon()} size={iconSize} color="#FFFFFF" />
        </Animated.View>
      </Pressable>
      {showLabel && (
        <ThemedText
          type="small"
          style={[styles.hint, { color: theme.textSecondary }]}
        >
          {getPhaseText()}
        </ThemedText>
      )}
      {isActive && phase !== "completing" && (
        <ThemedText
          type="micro"
          style={[styles.stopHint, { color: theme.textSecondary }]}
        >
          Tap to stop after this breath
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  shape: {
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  stopHint: {
    fontStyle: "italic",
    opacity: 0.7,
    textAlign: "center",
  },
});
