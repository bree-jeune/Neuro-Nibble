import React, { useState, useCallback, useRef } from "react";
import { View, StyleSheet, Pressable, Dimensions, FlatList, ViewToken } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useAppStore } from "@/lib/store";

const { width } = Dimensions.get("window");

interface OnboardingSlide {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  description: string;
}

const slides: OnboardingSlide[] = [
  {
    id: "1",
    icon: "pause-circle",
    title: "When you freeze...",
    subtitle: "That's normal",
    description:
      "Some tasks feel impossible. Your brain isn't broken. It just needs smaller pieces.",
  },
  {
    id: "2",
    icon: "scissors",
    title: "Break it into bites",
    subtitle: "2-10 minutes each",
    description:
      "Turn any frozen task into tiny bites. Each one is small enough to start, even on hard days.",
  },
  {
    id: "3",
    icon: "zap",
    title: "Match your energy",
    subtitle: "Low, Medium, or High",
    description:
      "Some days you have more capacity. We'll help you pick bites that fit how you feel right now.",
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { completeOnboarding, hapticsEnabled } = useAppStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = useCallback(() => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      completeOnboarding();
    }
  }, [currentIndex, completeOnboarding, hapticsEnabled]);

  const handleSkip = useCallback(() => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    completeOnboarding();
  }, [completeOnboarding, hapticsEnabled]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = { viewAreaCoveragePercentThreshold: 50 };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={[styles.slide, { width }]}>
      <View
        style={[styles.iconContainer, { backgroundColor: theme.backgroundSecondary }]}
      >
        <Feather name={item.icon} size={64} color={theme.primary} />
      </View>
      <ThemedText type="h1" style={styles.title}>
        {item.title}
      </ThemedText>
      <ThemedText
        type="h3"
        style={[styles.subtitle, { color: theme.primary }]}
      >
        {item.subtitle}
      </ThemedText>
      <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
        {item.description}
      </ThemedText>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <ThemedText style={[styles.skipText, { color: theme.textSecondary }]}>
            Skip
          </ThemedText>
        </Pressable>
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === currentIndex ? theme.primary : theme.backgroundSecondary,
                },
              ]}
            />
          ))}
        </View>

        <Pressable
          onPress={handleNext}
          style={[styles.nextButton, { backgroundColor: theme.primary }]}
        >
          <ThemedText style={[styles.nextText, { color: theme.buttonText }]}>
            {currentIndex === slides.length - 1 ? "Get Started" : "Next"}
          </ThemedText>
          <Feather
            name={currentIndex === slides.length - 1 ? "check" : "arrow-right"}
            size={20}
            color={theme.buttonText}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: Spacing.lg,
  },
  skipButton: {
    padding: Spacing.sm,
  },
  skipText: {
    fontSize: 16,
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  description: {
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 300,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    height: 56,
    borderRadius: BorderRadius.md,
  },
  nextText: {
    fontSize: 18,
    fontWeight: "600",
  },
});
