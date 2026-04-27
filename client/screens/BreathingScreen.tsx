import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius } from "@/constants/theme";
import { triggerHaptic } from "@/lib/haptics";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

const PHASE_DURATION = 4000;
const BRAND_PRIMARY = "#7B9EA8";

const PHASES = [
  { label: "Inhale", scale: 1.55 },
  { label: "Hold", scale: 1.55 },
  { label: "Exhale", scale: 1 },
  { label: "Hold", scale: 1 },
] as const;

export default function BreathingScreen() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const scale = useRef(new Animated.Value(1)).current;
  const [phaseIndex, setPhaseIndex] = useState(0);
  const phase = PHASES[phaseIndex];

  useEffect(() => {
    triggerHaptic("light");

    Animated.timing(scale, {
      toValue: phase.scale,
      duration: PHASE_DURATION,
      useNativeDriver: true,
    }).start();

    const timeout = setTimeout(() => {
      setPhaseIndex((current) => (current + 1) % PHASES.length);
    }, PHASE_DURATION);

    return () => clearTimeout(timeout);
  }, [phase.scale, phaseIndex, scale]);

  return (
    <View
      style={[styles.container, { paddingBottom: insets.bottom + Spacing.xl }]}
    >
      <View style={styles.centerStage}>
        <Animated.View
          style={[
            styles.circle,
            {
              transform: [{ scale }],
            },
          ]}
        >
          <ThemedText style={styles.phaseText}>{phase.label}</ThemedText>
        </Animated.View>
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
  },
  circle: {
    width: 184,
    height: 184,
    borderRadius: 92,
    backgroundColor: BRAND_PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  phaseText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "700",
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
