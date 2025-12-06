import React from "react";
import { StyleSheet, Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface AvatarPickerProps {
  selectedIndex: number;
  onSelect: (index: number) => void;
}

const AVATARS = [
  { icon: "circle" as const, color: "#7B9EA8" },
  { icon: "hexagon" as const, color: "#D4B5A0" },
  { icon: "square" as const, color: "#A8BAA8" },
  { icon: "octagon" as const, color: "#C9A690" },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function AvatarOption({
  icon,
  color,
  selected,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  color: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 150 });
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
        styles.avatar,
        {
          backgroundColor: color,
          borderColor: selected ? theme.text : "transparent",
        },
        animatedStyle,
      ]}
    >
      <Feather name={icon} size={28} color="#FFFFFF" />
    </AnimatedPressable>
  );
}

export function AvatarPicker({ selectedIndex, onSelect }: AvatarPickerProps) {
  return (
    <View style={styles.container}>
      {AVATARS.map((avatar, index) => (
        <AvatarOption
          key={index}
          icon={avatar.icon}
          color={avatar.color}
          selected={selectedIndex === index}
          onPress={() => onSelect(index)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
  },
});
