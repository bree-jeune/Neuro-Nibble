import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
  cancelAnimation,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface TimerButtonProps {
  minutes: number;
  stepText: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function TimerButton({ minutes, stepText }: TimerButtonProps) {
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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handlePress = () => {
    if (isRunning) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setIsRunning(false);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (secondsLeft === 0) {
        setSecondsLeft(minutes * 60);
      }
      setIsRunning(true);
    }
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
            size={24}
            color="#FFFFFF"
          />
          <View style={styles.textContainer}>
            <ThemedText style={styles.timerText}>
              {formatTime(secondsLeft)}
            </ThemedText>
            <ThemedText style={styles.stepTextPreview} numberOfLines={1}>
              {stepText}
            </ThemedText>
          </View>
        </View>
        {isRunning ? (
          <View
            style={[
              styles.progressBar,
              {
                width: `${progress * 100}%`,
                backgroundColor: "rgba(255,255,255,0.3)",
              },
            ]}
          />
        ) : null}
      </AnimatedPressable>

      {(isRunning || secondsLeft !== minutes * 60) ? (
        <Pressable
          onPress={handleReset}
          style={[styles.resetButton, { backgroundColor: theme.backgroundDefault }]}
        >
          <Feather name="rotate-ccw" size={18} color={theme.text} />
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
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  timerText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "600",
  },
  stepTextPreview: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  progressBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    height: 4,
  },
  resetButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
});
