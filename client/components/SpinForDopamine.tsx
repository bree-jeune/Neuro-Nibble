import React, { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { triggerHaptic } from "@/lib/haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface SpinForDopamineProps {
  items: string[];
}

export function SpinForDopamine({ items }: SpinForDopamineProps) {
  const { theme } = useTheme();
  const [isSpinning, setIsSpinning] = useState(false);
  const [displayedItem, setDisplayedItem] = useState<string | null>(null);
  const [spinIndex, setSpinIndex] = useState(0);
  
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const resultOpacity = useSharedValue(0);

  const spinThroughItems = useCallback(() => {
    if (items.length === 0) return;
    
    const maxSpins = 12 + Math.floor(Math.random() * 6);
    const finalIndex = Math.floor(Math.random() * items.length);
    
    const spinStep = (count: number) => {
      if (count >= maxSpins) {
        setDisplayedItem(items[finalIndex]);
        setIsSpinning(false);
        resultOpacity.value = withTiming(1, { duration: 300 });
        triggerHaptic("success");
        return;
      }
      
      setSpinIndex((prev) => (prev + 1) % items.length);
      triggerHaptic("light");
      
      let delay: number;
      const progress = count / maxSpins;
      if (progress < 0.5) {
        delay = 60 + progress * 40;
      } else if (progress < 0.8) {
        delay = 80 + (progress - 0.5) * 200;
      } else {
        delay = 140 + (progress - 0.8) * 600;
      }
      
      setTimeout(() => spinStep(count + 1), delay);
    };
    
    spinStep(0);
  }, [items, resultOpacity]);

  const handleSpin = useCallback(() => {
    if (items.length === 0) return;
    
    triggerHaptic("medium");
    setIsSpinning(true);
    setDisplayedItem(null);
    resultOpacity.value = 0;
    
    scale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    
    rotation.value = withSequence(
      withTiming(360, { duration: 600, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 0 })
    );
    
    spinThroughItems();
  }, [items, scale, rotation, spinThroughItems, resultOpacity]);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const resultStyle = useAnimatedStyle(() => ({
    opacity: resultOpacity.value,
  }));

  if (items.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.backgroundSecondary }]}>
        <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
          Add items to your dopamine menu first
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={buttonStyle}>
        <Pressable
          onPress={handleSpin}
          disabled={isSpinning}
          style={[
            styles.spinButton,
            { backgroundColor: theme.secondary }
          ]}
        >
          <Feather 
            name={isSpinning ? "loader" : "shuffle"} 
            size={24} 
            color="#FFFFFF" 
          />
          <ThemedText style={styles.buttonText}>
            {isSpinning ? "Spinning..." : "Spin for Dopamine"}
          </ThemedText>
        </Pressable>
      </Animated.View>

      {isSpinning ? (
        <Animated.View 
          entering={FadeIn.duration(150)}
          style={[styles.resultCard, { backgroundColor: theme.backgroundDefault }]}
        >
          <ThemedText style={[styles.spinningText, { color: theme.primary }]}>
            {items[spinIndex]}
          </ThemedText>
        </Animated.View>
      ) : null}

      {displayedItem && !isSpinning ? (
        <Animated.View 
          style={[
            styles.resultCard, 
            { backgroundColor: theme.backgroundDefault },
            resultStyle
          ]}
        >
          <ThemedText style={[styles.resultLabel, { color: theme.textSecondary }]}>
            Your brain says:
          </ThemedText>
          <ThemedText type="h3" style={[styles.resultText, { color: theme.primary }]}>
            {displayedItem}
          </ThemedText>
          <ThemedText style={[styles.permissionText, { color: theme.textSecondary }]}>
            You're allowed to enjoy this.
          </ThemedText>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  emptyContainer: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  emptyText: {
    fontStyle: "italic",
    fontSize: 14,
    textAlign: "center",
  },
  spinButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  resultCard: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    gap: Spacing.xs,
  },
  spinningText: {
    fontSize: 18,
    fontWeight: "500",
    textAlign: "center",
  },
  resultLabel: {
    fontSize: 12,
    fontStyle: "italic",
  },
  resultText: {
    textAlign: "center",
  },
  permissionText: {
    fontSize: 13,
    fontStyle: "italic",
    marginTop: Spacing.xs,
  },
});
