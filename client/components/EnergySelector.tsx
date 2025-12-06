import React from "react";
import { StyleSheet, Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { EnergyLevel } from "@/lib/types";

interface EnergySelectorProps {
  selected: EnergyLevel;
  onSelect: (level: EnergyLevel) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function EnergyOption({
  level,
  label,
  selected,
  onPress,
}: {
  level: EnergyLevel;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

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
        styles.option,
        {
          backgroundColor: selected ? energyColor : theme.backgroundDefault,
          borderColor: selected ? energyColor : theme.border,
        },
        animatedStyle,
      ]}
    >
      <ThemedText
        style={[
          styles.label,
          { color: selected ? "#FFFFFF" : theme.text },
        ]}
      >
        {label}
      </ThemedText>
    </AnimatedPressable>
  );
}

export function EnergySelector({ selected, onSelect }: EnergySelectorProps) {
  return (
    <View style={styles.container}>
      <EnergyOption
        level="low"
        label="Low"
        selected={selected === "low"}
        onPress={() => onSelect("low")}
      />
      <EnergyOption
        level="medium"
        label="Medium"
        selected={selected === "medium"}
        onPress={() => onSelect("medium")}
      />
      <EnergyOption
        level="high"
        label="High"
        selected={selected === "high"}
        onPress={() => onSelect("high")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  option: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    alignItems: "center",
  },
  label: {
    fontWeight: "500",
    fontSize: 14,
  },
});
