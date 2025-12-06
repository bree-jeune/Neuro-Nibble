import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
  cancelAnimation,
} from "react-native-reanimated";

import { triggerHaptic } from "@/lib/haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface TimerButtonProps {
  minutes: number;
  stepText: string;
  isActive?: boolean;
  onStart?: () => void;
  onComplete?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function TimerButton({ minutes, stepText, isActive, onStart, onComplete }: TimerButtonProps) {
  const { theme } = useTheme();
  const [isRunning, setIsRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(minutes * 60);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const scale = useSharedValue(1);
  const pulse = useSharedValue(1);

  useEffect(() => {
    setSecondsLeft(minutes * 60);
  }, [minutes]);

  useEffect(() => {
    if (isRunning) {
      pulse.value = withRepeat(
        withTiming(1.02, { duration: 1000 }),
        -1,
        true
      );
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      cancelAnimation(pulse);
      pulse.value = 1;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const handleComplete = () => {
    setIsRunning(false);
    triggerHaptic("success");
    onComplete?.();
  };

  const handlePress = () => {
    if (isRunning) {
      triggerHaptic("light");
      setIsRunning(false);
    } else {
      triggerHaptic("medium");
      if (secondsLeft === 0) {
        setSecondsLeft(minutes * 60);
      }
      setIsRunning(true);
      onStart?.();
    }
  };

  const handleReset = () => {
    triggerHaptic("light");
    setIsRunning(false);
    setSecondsLeft(minutes * 60);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * pulse.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = 1 - secondsLeft / (minutes * 60);

  return (
    <View style={styles.container}>
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.button,
          {
            backgroundColor: isRunning ? theme.success : theme.primary,
          },
          animatedStyle,
        ]}
      >
        <View style={styles.buttonContent}>
          <Feather
            name={isRunning ? "pause" : "play"}
            size={28}
            color="#FFFFFF"
          />
          <View style={styles.textContainer}>
            <ThemedText style={styles.timerText}>
              {formatTime(secondsLeft)}
            </ThemedText>
            {!isRunning ? (
              <ThemedText style={styles.hintText}>
                Tap to start timer
              </ThemedText>
            ) : null}
          </View>
        </View>
        {isRunning || progress > 0 ? (
          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${progress * 100}%`,
                  backgroundColor: "rgba(255,255,255,0.3)",
                },
              ]}
            />
          </View>
        ) : null}
      </AnimatedPressable>

      {(isRunning || secondsLeft !== minutes * 60) ? (
        <Pressable
          onPress={handleReset}
          style={[styles.resetButton, { backgroundColor: theme.backgroundDefault }]}
        >
          <Feather name="rotate-ccw" size={20} color={theme.text} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  button: {
    flex: 1,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    minHeight: 80,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  timerText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "600",
  },
  hintText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    marginTop: 2,
  },
  progressBackground: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  progressBar: {
    height: "100%",
  },
  resetButton: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
});
