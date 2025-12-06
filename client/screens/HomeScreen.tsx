import React, { useState, useCallback } from "react";
import { View, ScrollView, StyleSheet, Pressable, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { EnergyCard } from "@/components/EnergyCard";
import { WeeklyRoomBadge } from "@/components/WeeklyRoomBadge";
import { RecentTaskCard } from "@/components/RecentTaskCard";
import { DailyBookend } from "@/components/DailyBookend";
import { useAppStore } from "@/lib/store";
import { useSnackbarStore } from "@/lib/snackbarStore";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type { EnergyLevel } from "@/lib/types";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [showEndDayModal, setShowEndDayModal] = useState(false);

  const { 
    energyLevel, 
    setEnergyLevel, 
    weeklyRoom, 
    tasks, 
    bookendCompleted,
    setBookendCompleted,
    restoreBookendState,
    lastBookendDate,
    hapticsEnabled,
    dopamineMenu,
  } = useAppStore();
  const showSnackbar = useSnackbarStore((s) => s.show);

  const recentTasks = tasks
    .filter((t) => t.lastWorkedOn)
    .sort((a, b) => new Date(b.lastWorkedOn!).getTime() - new Date(a.lastWorkedOn!).getTime())
    .slice(0, 3);

  const completedToday = tasks.filter((t) => {
    const today = new Date().toISOString().split("T")[0];
    return t.lastWorkedOn?.startsWith(today);
  }).length;

  const handleEnergySelect = useCallback((level: EnergyLevel) => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEnergyLevel(level);
  }, [setEnergyLevel, hapticsEnabled]);

  const handleBookend = useCallback(() => {
    if (hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setBookendCompleted(true);
  }, [setBookendCompleted, hapticsEnabled]);

  const handleEndDay = () => {
    const prevCompleted = bookendCompleted;
    const prevLastDate = lastBookendDate;
    
    if (hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setBookendCompleted(true);
    setShowEndDayModal(false);
    showSnackbar("Day ended. Rest well.", () => {
      restoreBookendState(prevCompleted, prevLastDate);
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    return "evening";
  };

  const getDayName = () => {
    return new Date().toLocaleDateString("en-US", { weekday: "long" });
  };

  const getRandomDopamineItem = () => {
    if (dopamineMenu.length === 0) return null;
    return dopamineMenu[Math.floor(Math.random() * dopamineMenu.length)];
  };

  return (
    <>
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

        {tasks.length === 0 ? (
          <View style={[styles.emptyStateCard, { backgroundColor: theme.backgroundDefault }]}>
            <View style={[styles.emptyStateIcon, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="pause-circle" size={32} color={theme.primary} />
            </View>
            <ThemedText type="h3" style={styles.emptyStateTitle}>
              What's freezing you?
            </ThemedText>
            <ThemedText style={[styles.emptyStateText, { color: theme.textSecondary }]}>
              Add something that feels stuck. We'll break it into tiny bites you can actually start.
            </ThemedText>
            <Pressable
              onPress={() => navigation.navigate("BreakItDown")}
              style={[styles.emptyStateButton, { backgroundColor: theme.primary }]}
            >
              <Feather name="plus" size={18} color="#FFFFFF" />
              <ThemedText style={styles.emptyStateButtonText}>Break down a task</ThemedText>
            </Pressable>
          </View>
        ) : recentTasks.length > 0 ? (
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

        {!bookendCompleted ? (
          <DailyBookend 
            completed={bookendCompleted}
            onComplete={handleBookend}
            timeOfDay={getGreeting()}
          />
        ) : null}

        <Pressable
          onPress={() => setShowEndDayModal(true)}
          style={[styles.endDayButton, { backgroundColor: theme.backgroundDefault }]}
        >
          <View style={[styles.endDayIcon, { backgroundColor: theme.secondary }]}>
            <Feather name="sunset" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.endDayTextContainer}>
            <ThemedText style={styles.endDayTitle}>End Day</ThemedText>
            <ThemedText style={[styles.endDaySubtitle, { color: theme.textSecondary }]}>
              Close out today and start fresh tomorrow
            </ThemedText>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>

        <View style={styles.permissionContainer}>
          <ThemedText style={[styles.permissionText, { color: theme.textSecondary }]}>
            You're allowed to stop whenever you need to.
          </ThemedText>
        </View>
      </ScrollView>

      <Modal
        visible={showEndDayModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEndDayModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowEndDayModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundRoot }]}>
            <Feather name="moon" size={48} color={theme.secondary} style={styles.modalIcon} />
            
            <ThemedText type="h2" style={styles.modalTitle}>
              Ready to close out today?
            </ThemedText>
            
            <ThemedText style={[styles.modalMessage, { color: theme.textSecondary }]}>
              You showed up today. That's what matters.
            </ThemedText>

            {completedToday > 0 ? (
              <View style={[styles.statCard, { backgroundColor: theme.backgroundDefault }]}>
                <ThemedText style={styles.statNumber}>{completedToday}</ThemedText>
                <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                  {completedToday === 1 ? "task touched today" : "tasks touched today"}
                </ThemedText>
              </View>
            ) : null}

            {getRandomDopamineItem() ? (
              <View style={[styles.rewardCard, { backgroundColor: theme.roomGentle }]}>
                <ThemedText style={styles.rewardTitle}>Treat yourself to:</ThemedText>
                <ThemedText style={styles.rewardItem}>{getRandomDopamineItem()}</ThemedText>
              </View>
            ) : null}

            <Pressable
              onPress={handleEndDay}
              style={[styles.confirmButton, { backgroundColor: theme.secondary }]}
            >
              <ThemedText style={styles.confirmButtonText}>End Today</ThemedText>
            </Pressable>

            <Pressable
              onPress={() => setShowEndDayModal(false)}
              style={styles.cancelButton}
            >
              <ThemedText style={{ color: theme.textSecondary }}>Not yet</ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
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
  endDayButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.lg,
  },
  endDayIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  endDayTextContainer: {
    flex: 1,
  },
  endDayTitle: {
    fontWeight: "500",
    fontSize: 16,
    marginBottom: 2,
  },
  endDaySubtitle: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    width: "100%",
    maxWidth: 360,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    alignItems: "center",
  },
  modalIcon: {
    marginBottom: Spacing.md,
  },
  modalTitle: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  modalMessage: {
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: Spacing.lg,
  },
  statCard: {
    width: "100%",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: 14,
  },
  rewardCard: {
    width: "100%",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  rewardTitle: {
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  rewardItem: {
    fontSize: 18,
    fontWeight: "500",
  },
  confirmButton: {
    width: "100%",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  cancelButton: {
    padding: Spacing.sm,
  },
  emptyStateCard: {
    marginTop: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  emptyStateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  emptyStateTitle: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  emptyStateText: {
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  emptyStateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  emptyStateButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
});
