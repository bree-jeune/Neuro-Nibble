import React, { useEffect, useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";

import { triggerHaptic } from "@/lib/haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useSnackbarStore } from "@/lib/snackbarStore";

const springConfig = {
  damping: 20,
  mass: 0.5,
  stiffness: 200,
};

export function Snackbar() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { visible, message, undoAction, hide, undo } = useSnackbarStore();
  
  const [shouldRender, setShouldRender] = useState(false);
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      translateY.value = withSpring(0, springConfig);
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withSpring(100, springConfig);
      opacity.value = withTiming(0, { duration: 150 }, (finished) => {
        if (finished) {
          runOnJS(setShouldRender)(false);
        }
      });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const handleUndo = () => {
    triggerHaptic("medium");
    undo();
  };

  const handleDismiss = () => {
    hide();
  };

  if (!shouldRender) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        { bottom: insets.bottom + 16 },
        animatedStyle,
      ]}
      pointerEvents={visible ? "auto" : "none"}
    >
      <View style={[styles.snackbar, { backgroundColor: theme.text }]}>
        <ThemedText style={[styles.message, { color: theme.backgroundRoot }]}>
          {message}
        </ThemedText>
        {undoAction ? (
          <Pressable onPress={handleUndo} style={styles.undoButton}>
            <ThemedText style={[styles.undoText, { color: theme.primary }]}>
              Undo
            </ThemedText>
          </Pressable>
        ) : (
          <Pressable onPress={handleDismiss} style={styles.dismissButton}>
            <ThemedText style={[styles.dismissText, { color: theme.backgroundSecondary }]}>
              OK
            </ThemedText>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 1000,
  },
  snackbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    minHeight: 48,
  },
  message: {
    flex: 1,
    fontSize: 14,
    marginRight: Spacing.md,
  },
  undoButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  undoText: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  dismissButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  dismissText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
