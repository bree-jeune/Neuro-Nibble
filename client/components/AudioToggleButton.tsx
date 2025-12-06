import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { triggerHaptic } from "@/lib/haptics";
import { useTheme } from "@/hooks/useTheme";
import { useAudio } from "@/lib/AudioContext";

interface AudioToggleButtonProps {
  size?: number;
}

export function AudioToggleButton({ size = 22 }: AudioToggleButtonProps) {
  const { theme } = useTheme();
  const { isPlaying, isLoaded, toggleAudio } = useAudio();

  const handlePress = async () => {
    triggerHaptic("light");
    await toggleAudio();
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <Pressable onPress={handlePress} style={styles.button}>
      <Feather
        name="volume-2"
        size={size}
        color={isPlaying ? theme.primary : theme.textSecondary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 4,
  },
});
