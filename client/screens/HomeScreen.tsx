import React, { useState, useCallback } from "react";
import { View, ScrollView, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { EnergyCard } from "@/components/EnergyCard";
import { WeeklyRoomBadge } from "@/components/WeeklyRoomBadge";
import { RecentTaskCard } from "@/components/RecentTaskCard";
import { DailyBookend } from "@/components/DailyBookend";
import { useAppStore } from "@/lib/store";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type { EnergyLevel, WeeklyRoom } from "@/lib/types";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { 
    energyLevel, 
    setEnergyLevel, 
    weeklyRoom, 
    tasks, 
    bookendCompleted,
    setBookendCompleted 
  } = useAppStore();

  const recentTasks = tasks
    .filter((t) => t.lastWorkedOn)
    .sort((a, b) => new Date(b.lastWorkedOn!).getTime() - new Date(a.lastWorkedOn!).getTime())
    .slice(0, 3);

  const handleEnergySelect = useCallback((level: EnergyLevel) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEnergyLevel(level);
  }, [setEnergyLevel]);

  const handleBookend = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setBookendCompleted(true);
  }, [setBookendCompleted]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    return "evening";
  };

  const getDayName = () => {
    return new Date().toLocaleDateString("en-US", { weekday: "long" });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.lg,
        paddingBottom: tabBarHeight + Spacing.xl + 80,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.greetingContainer}>
        <ThemedText type="h2" style={styles.greeting}>
          {getDayName()}
        </ThemedText>
        <ThemedText style={[styles.subGreeting, { color: theme.textSecondary }]}>
          How's your energy today?
        </ThemedText>
      </View>

      <View style={styles.energyContainer}>
        <EnergyCard
          level="low"
          selected={energyLevel === "low"}
          onPress={() => handleEnergySelect("low")}
        />
        <EnergyCard
          level="medium"
          selected={energyLevel === "medium"}
          onPress={() => handleEnergySelect("medium")}
        />
        <EnergyCard
          level="high"
          selected={energyLevel === "high"}
          onPress={() => handleEnergySelect("high")}
        />
      </View>

      <WeeklyRoomBadge room={weeklyRoom} />

      {recentTasks.length > 0 ? (
        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            Pick up where you left off
          </ThemedText>
          {recentTasks.map((task) => (
            <RecentTaskCard
              key={task.id}
              task={task}
              onPress={() => navigation.navigate("BreakItDown", { taskId: task.id })}
            />
          ))}
        </View>
      ) : null}

      <DailyBookend 
        completed={bookendCompleted}
        onComplete={handleBookend}
        timeOfDay={getGreeting()}
      />

      <View style={styles.permissionContainer}>
        <ThemedText style={[styles.permissionText, { color: theme.textSecondary }]}>
          You're allowed to stop whenever you need to.
        </ThemedText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  greetingContainer: {
    marginBottom: Spacing.lg,
  },
  greeting: {
    marginBottom: Spacing.xs,
  },
  subGreeting: {
    fontStyle: "italic",
  },
  energyContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  permissionContainer: {
    marginTop: Spacing.xl,
    alignItems: "center",
  },
  permissionText: {
    fontStyle: "italic",
    textAlign: "center",
  },
});
