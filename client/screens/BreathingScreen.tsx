import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Svg, { Circle as SvgCircle } from "react-native-svg";

import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius } from "@/constants/theme";
import { triggerHaptic } from "@/lib/haptics";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

const PHASE_DURATION = 4000;
const CYCLE_DURATION = PHASE_DURATION * 4;
const BRAND_PRIMARY = "#7B9EA8";

const PHASES = [
  { label: "Inhale", scale: 1.55 },
  { label: "Hold", scale: 1.55 },
  { label: "Exhale", scale: 1 },
  { label: "Hold", scale: 1 },
] as const;

const CIRCLE_SIZE = 184;
const RING_SIZE = 200;
const RING_RADIUS = 96;
const RING_STROKE = 3;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const AnimatedSvgCircle = Animated.createAnimatedComponent(SvgCircle);

export default function BreathingScreen() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const scale = useRef(new Animated.Value(1)).current;
  const ringProgress = useRef(new Animated.Value(0)).current;
  const cycleCountRef = useRef(0);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false);
  const phase = PHASES[phaseIndex];

  // Phase tick: advance scale + label every 4s; freeze when prompt is showing.
  useEffect(() => {
    if (showPrompt) return;

    triggerHaptic("light");

    Animated.timing(scale, {
      toValue: phase.scale,
      duration: PHASE_DURATION,
      useNativeDriver: true,
    }).start();

    const timeout = setTimeout(() => {
      if (phaseIndex === PHASES.length - 1) {
        cycleCountRef.current += 1;
        setShowPrompt(true);
      } else {
        setPhaseIndex((current) => current + 1);
      }
    }, PHASE_DURATION);

    return () => clearTimeout(timeout);
  }, [phase.scale, phaseIndex, scale, showPrompt]);

  // Ring tick: one full sweep per cycle, reset at start.
  useEffect(() => {
    if (showPrompt) {
      ringProgress.stopAnimation();
      return;
    }
    if (phaseIndex !== 0) return;
    ringProgress.setValue(0);
    Animated.timing(ringProgress, {
      toValue: 1,
      duration: CYCLE_DURATION,
      useNativeDriver: false,
    }).start();
  }, [phaseIndex, ringProgress, showPrompt]);

  const handleOneMore = () => {
    triggerHaptic("light");
    setShowPrompt(false);
    setPhaseIndex(0);
    scale.setValue(1);
    ringProgress.setValue(0);
  };

  const handleDone = () => {
    triggerHaptic("light");
    navigation.goBack();
  };

  const strokeDashoffset = ringProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [RING_CIRCUMFERENCE, 0],
  });

  return (
    <View
      style={[styles.container, { paddingBottom: insets.bottom + Spacing.xl }]}
    >
      <View style={styles.centerStage}>
        <View style={styles.ringWrap}>
          <Svg
            width={RING_SIZE}
            height={RING_SIZE}
            style={StyleSheet.absoluteFill}
          >
            <SvgCircle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              stroke={BRAND_PRIMARY + "33"}
              strokeWidth={RING_STROKE}
              fill="none"
            />
            <AnimatedSvgCircle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              stroke={BRAND_PRIMARY}
              strokeWidth={RING_STROKE}
              fill="none"
              strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
              strokeDashoffset={strokeDashoffset as unknown as number}
              strokeLinecap="round"
              transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
            />
          </Svg>
          <Animated.View
            style={[
              styles.circle,
              {
                transform: [{ scale }],
              },
            ]}
          >
            {!showPrompt ? (
              <ThemedText style={styles.phaseText}>{phase.label}</ThemedText>
            ) : null}
          </Animated.View>
        </View>

        {showPrompt ? (
          <View style={styles.prompt}>
            <ThemedText style={styles.promptTitle}>
              Cycle {cycleCountRef.current} complete.
            </ThemedText>
            <View style={styles.promptButtonRow}>
              <Pressable
                onPress={handleOneMore}
                accessibilityRole="button"
                accessibilityLabel="One more cycle"
                style={[styles.promptButton, styles.promptPrimary]}
              >
                <ThemedText style={styles.promptPrimaryText}>
                  One more
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={handleDone}
                accessibilityRole="button"
                accessibilityLabel="I'm done"
                style={[styles.promptButton, styles.promptSecondary]}
              >
                <ThemedText style={styles.promptSecondaryText}>
                  I'm done
                </ThemedText>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>

      <Pressable
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel="Stop breathing exercise"
        style={styles.stopButton}
      >
        <ThemedText style={styles.stopButtonText}>Stop</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F4F1",
    paddingHorizontal: Spacing.lg,
  },
  centerStage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xl,
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: BRAND_PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  phaseText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "700",
  },
  prompt: {
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  promptTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
    textAlign: "center",
  },
  promptButtonRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  promptButton: {
    minHeight: 48,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  promptPrimary: {
    backgroundColor: BRAND_PRIMARY,
  },
  promptPrimaryText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  promptSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#1A1A1A33",
  },
  promptSecondaryText: {
    color: "#1A1A1A",
    fontSize: 15,
    fontWeight: "600",
  },
  stopButton: {
    minHeight: 52,
    borderRadius: BorderRadius.sm,
    backgroundColor: "#3E3E3E",
    alignItems: "center",
    justifyContent: "center",
  },
  stopButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
});
