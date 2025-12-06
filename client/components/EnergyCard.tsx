import React from "react";
import { StyleSheet, Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { EnergyLevel } from "@/lib/types";

interface EnergyCardProps {
  level: EnergyLevel;
  selected: boolean;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const getEnergyConfig = (level: EnergyLevel) => {
  switch (level) {
    case "low":
      return {
        label: "Low",
        description: "Rest mode",
        waves: 1,
      };
    case "medium":
      return {
        label: "Medium",
        description: "Gentle momentum",
        waves: 2,
      };
    case "high":
      return {
        label: "High",
        description: "Build mode",
        waves: 3,
      };
  }
};

export function EnergyCard({ level, selected, onPress }: EnergyCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const config = getEnergyConfig(level);
  const energyColor = theme[`energy${level.charAt(0).toUpperCase() + level.slice(1)}` as keyof typeof theme] as string;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        {
          backgroundColor: selected ? energyColor : theme.backgroundDefault,
          borderColor: selected ? energyColor : "transparent",
        },
        animatedStyle,
      ]}
    >
      <View style={styles.wavesContainer}>
        {Array.from({ length: 3 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.wave,
              {
                backgroundColor: i < config.waves
                  ? (selected ? "#FFFFFF" : energyColor)
                  : (selected ? "rgba(255,255,255,0.3)" : theme.backgroundSecondary),
              },
            ]}
          />
        ))}
      </View>
      <ThemedText
        style={[
          styles.label,
          { color: selected ? "#FFFFFF" : theme.text },
        ]}
      >
        {config.label}
      </ThemedText>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    borderWidth: 2,
  },
  wavesContainer: {
    flexDirection: "row",
    gap: 4,
    marginBottom: Spacing.sm,
  },
  wave: {
    width: 8,
    height: 20,
    borderRadius: 4,
  },
  label: {
    fontWeight: "500",
    fontSize: 14,
  },
});
