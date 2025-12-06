import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, StyleSheet, Pressable, Modal } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useAppStore } from "@/lib/store";

interface VisualTimerProps {
  minutes: number;
  stepText: string;
  isActive?: boolean;
  onStart?: () => void;
  onComplete?: () => void;
  onRequestMoreTime?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function VisualTimer({ 
  minutes, 
  stepText, 
  isActive, 
  onStart, 
  onComplete,
  onRequestMoreTime,
}: VisualTimerProps) {
  const { theme } = useTheme();
  const { hapticsEnabled } = useAppStore();
  const [isRunning, setIsRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(minutes * 60);
  const [totalSeconds, setTotalSeconds] = useState(minutes * 60);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTickMinuteRef = useRef<number>(minutes);
  const scale = useSharedValue(1);

  const size = 200;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    setSecondsLeft(minutes * 60);
    setTotalSeconds(minutes * 60);
    lastTickMinuteRef.current = minutes;
  }, [minutes]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            handleTimerEnd();
            return 0;
          }
          
          const newSeconds = prev - 1;
          
          if (newSeconds > 0 && newSeconds % 60 === 0 && hapticsEnabled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          
          return newSeconds;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, hapticsEnabled]);

  const handleTimerEnd = useCallback(() => {
    setIsRunning(false);
    if (hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setShowCheckInModal(true);
  }, [hapticsEnabled]);

  const handleFinished = useCallback(() => {
    setShowCheckInModal(false);
    setSecondsLeft(totalSeconds);
    onComplete?.();
  }, [onComplete, totalSeconds]);

  const handleNeedMoreTime = useCallback(() => {
    setShowCheckInModal(false);
    const extraSeconds = 5 * 60;
    setSecondsLeft(extraSeconds);
    setTotalSeconds(extraSeconds);
    setIsRunning(true);
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onRequestMoreTime?.();
  }, [hapticsEnabled, onRequestMoreTime]);

  const handlePress = useCallback(() => {
    if (isRunning) {
      if (hapticsEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setIsRunning(false);
    } else {
      if (hapticsEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      if (secondsLeft === 0) {
        setSecondsLeft(totalSeconds);
      }
      setIsRunning(true);
      onStart?.();
    }
  }, [isRunning, hapticsEnabled, secondsLeft, totalSeconds, onStart]);

  const handleReset = useCallback(() => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsRunning(false);
    setSecondsLeft(totalSeconds);
  }, [hapticsEnabled, totalSeconds]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = secondsLeft / totalSeconds;
  const strokeDashoffset = circumference * (1 - progress);

  const ringColor = isRunning ? theme.success : theme.primary;

  return (
    <>
      <View style={styles.container}>
        <AnimatedPressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[styles.timerContainer, animatedStyle]}
        >
          <Svg width={size} height={size} style={styles.svg}>
            <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={theme.backgroundSecondary}
                strokeWidth={strokeWidth}
                fill="none"
              />
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={ringColor}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </G>
          </Svg>
          <View style={styles.centerContent}>
            <Feather
              name={isRunning ? "pause" : "play"}
              size={24}
              color={ringColor}
              style={styles.playIcon}
            />
            <ThemedText style={[styles.timeText, { color: theme.text }]}>
              {formatTime(secondsLeft)}
            </ThemedText>
            <ThemedText style={[styles.hintText, { color: theme.textSecondary }]}>
              {isRunning ? "Tap to pause" : "Tap to start"}
            </ThemedText>
          </View>
        </AnimatedPressable>

        <ThemedText style={[styles.stepText, { color: theme.text }]} numberOfLines={2}>
          {stepText}
        </ThemedText>

        {(isRunning || secondsLeft !== totalSeconds) ? (
          <Pressable
            onPress={handleReset}
            style={[styles.resetButton, { backgroundColor: theme.backgroundDefault }]}
          >
            <Feather name="rotate-ccw" size={18} color={theme.textSecondary} />
            <ThemedText style={[styles.resetText, { color: theme.textSecondary }]}>
              Reset
            </ThemedText>
          </Pressable>
        ) : null}
      </View>

      <Modal
        visible={showCheckInModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCheckInModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundRoot }]}>
            <View style={[styles.chimeIcon, { backgroundColor: theme.success + "20" }]}>
              <Feather name="bell" size={32} color={theme.success} />
            </View>
            
            <ThemedText type="h2" style={styles.modalTitle}>
              Time's up!
            </ThemedText>
            
            <ThemedText style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              How did it go?
            </ThemedText>

            <Pressable
              onPress={handleFinished}
              style={[styles.primaryButton, { backgroundColor: theme.success }]}
            >
              <Feather name="check-circle" size={20} color="#FFFFFF" />
              <ThemedText style={styles.primaryButtonText}>I finished!</ThemedText>
            </Pressable>

            <Pressable
              onPress={handleNeedMoreTime}
              style={[styles.secondaryButton, { backgroundColor: theme.backgroundDefault }]}
            >
              <Feather name="plus-circle" size={20} color={theme.primary} />
              <ThemedText style={[styles.secondaryButtonText, { color: theme.primary }]}>
                I need 5 more minutes
              </ThemedText>
            </Pressable>

            <ThemedText style={[styles.mercyText, { color: theme.textSecondary }]}>
              No pressure. Take the time you need.
            </ThemedText>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: Spacing.md,
  },
  timerContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  svg: {
    position: "absolute",
  },
  centerContent: {
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  playIcon: {
    marginBottom: Spacing.xs,
  },
  timeText: {
    fontSize: 36,
    fontWeight: "600",
    letterSpacing: 2,
  },
  hintText: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  stepText: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    paddingHorizontal: Spacing.lg,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  resetText: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    width: "100%",
    maxWidth: 340,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: "center",
  },
  chimeIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  modalTitle: {
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  modalSubtitle: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  primaryButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  mercyText: {
    fontSize: 13,
    fontStyle: "italic",
    textAlign: "center",
  },
});
