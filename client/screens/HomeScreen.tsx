import React, { useState, useCallback, useEffect, useRef, useLayoutEffect } from "react";
import { View, ScrollView, StyleSheet, Pressable, Modal, TextInput, Animated, Easing } from "react-native";
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
import { AudioToggleButton } from "@/components/AudioToggleButton";
import { useAppStore } from "@/lib/store";
import { useSnackbarStore } from "@/lib/snackbarStore";
import { useAudio } from "@/lib/AudioContext";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type { EnergyLevel, Task } from "@/lib/types";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [showEndDayModal, setShowEndDayModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showEnergyCheck, setShowEnergyCheck] = useState(false);
  const [reflectionText, setReflectionText] = useState("");

  const { 
    energyLevel, 
    setEnergyLevel, 
    weeklyRoom, 
    tasks,
    updateTask,
    bookendCompleted,
    setBookendCompleted,
    restoreBookendState,
    lastBookendDate,
    hapticsEnabled,
    dopamineMenu,
    energyCheckInEnabled,
    displayName,
    addDailyReflection,
  } = useAppStore();
  const showSnackbar = useSnackbarStore((s) => s.show);
  const { startAudio } = useAudio();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <AudioToggleButton />,
    });
  }, [navigation]);

  const recentTasks = tasks
    .filter((t) => {
      if (!t.lastWorkedOn) return false;
      if (t.isArchived) return false;
      const allStepsCompleted = t.steps.length > 0 && t.steps.every((s) => s.completed);
      return !allStepsCompleted;
    })
    .sort((a, b) => new Date(b.lastWorkedOn!).getTime() - new Date(a.lastWorkedOn!).getTime())
    .slice(0, 3);

  const getBodyDoublingCount = useCallback(() => {
    const now = new Date();
    const hour = now.getHours();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
    const seed = dayOfYear * 24 + hour;
    const pseudoRandom = ((seed * 9301 + 49297) % 233280) / 233280;
    const baseCount = hour >= 9 && hour <= 21 ? 47 : 12;
    const variance = Math.floor(pseudoRandom * 15) - 7;
    return Math.max(5, baseCount + variance);
  }, []);
  
  const [bodyDoublingCount] = useState(getBodyDoublingCount);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const hasTouchedTasksToday = tasks.some((t) => {
    const today = new Date().toISOString().split("T")[0];
    return t.lastWorkedOn?.startsWith(today);
  });

  const completedToday = tasks.filter((t) => {
    const today = new Date().toISOString().split("T")[0];
    return t.lastWorkedOn?.startsWith(today);
  }).length;

  const handleTaskPress = useCallback((task: Task) => {
    if (hapticsEnabled) {
      Haptics.selectionAsync();
    }
    if (energyCheckInEnabled) {
      setSelectedTask(task);
      setShowEnergyCheck(true);
    } else {
      navigation.navigate("BreakItDown", { taskId: task.id });
    }
  }, [hapticsEnabled, energyCheckInEnabled, navigation]);

  const handleEnergySelect = useCallback((level: EnergyLevel) => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEnergyLevel(level);
    if (level === "low") {
      startAudio();
    }
    if (selectedTask) {
      updateTask(selectedTask.id, { energyLevel: level });
      setShowEnergyCheck(false);
      navigation.navigate("BreakItDown", { taskId: selectedTask.id });
      setSelectedTask(null);
    }
  }, [setEnergyLevel, hapticsEnabled, selectedTask, updateTask, navigation, startAudio]);

  const handleSkipEnergyCheck = useCallback(() => {
    if (selectedTask) {
      setShowEnergyCheck(false);
      navigation.navigate("BreakItDown", { taskId: selectedTask.id });
      setSelectedTask(null);
    }
  }, [selectedTask, navigation]);

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
    
    if (reflectionText.trim()) {
      addDailyReflection(reflectionText.trim());
    }
    
    setBookendCompleted(true);
    setShowEndDayModal(false);
    setReflectionText("");
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
            {displayName ? `Good ${getGreeting()}, ${displayName}` : getDayName()}
          </ThemedText>
        </View>

        <WeeklyRoomBadge room={weeklyRoom} />

        <View style={[styles.bodyDoublingBanner, { backgroundColor: theme.primary + "10" }]}>
          <View style={styles.bodyDoublingLeft}>
            <Animated.View 
              style={[
                styles.pulsingDot, 
                { 
                  backgroundColor: theme.success,
                  opacity: pulseAnim,
                }
              ]} 
            />
            <Feather name="users" size={16} color={theme.primary} />
          </View>
          <ThemedText style={[styles.bodyDoublingText, { color: theme.primary }]}>
            {bodyDoublingCount} people working alongside you right now
          </ThemedText>
        </View>

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
                onPress={() => handleTaskPress(task)}
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

        {bookendCompleted || hasTouchedTasksToday ? (
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
        ) : null}

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

            <View style={styles.reflectionSection}>
              <ThemedText style={[styles.reflectionLabel, { color: theme.textSecondary }]}>
                Anything on your mind? (optional)
              </ThemedText>
              <TextInput
                style={[
                  styles.reflectionInput,
                  {
                    backgroundColor: theme.inputBackground,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="A small win, a thought, anything..."
                placeholderTextColor={theme.textSecondary}
                value={reflectionText}
                onChangeText={setReflectionText}
                multiline
                numberOfLines={3}
              />
            </View>

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

      <Modal
        visible={showEnergyCheck}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEnergyCheck(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowEnergyCheck(false)}
        >
          <View 
            style={[styles.energyCheckContent, { backgroundColor: theme.backgroundRoot }]}
            onStartShouldSetResponder={() => true}
          >
            <ThemedText type="h3" style={styles.energyCheckTitle}>
              How's your energy for this?
            </ThemedText>
            
            {selectedTask ? (
              <View style={[styles.selectedTaskCard, { backgroundColor: theme.backgroundDefault }]}>
                <ThemedText style={styles.selectedTaskName}>{selectedTask.title}</ThemedText>
              </View>
            ) : null}
            
            <ThemedText style={[styles.energyCheckHint, { color: theme.textSecondary }]}>
              This helps show the right first bite for you
            </ThemedText>

            <View style={styles.energyOptions}>
              <Pressable
                onPress={() => handleEnergySelect("low")}
                style={[styles.energyOption, { backgroundColor: theme.roomGentle }]}
              >
                <Feather name="cloud" size={24} color={theme.text} />
                <ThemedText style={styles.energyOptionLabel}>Low</ThemedText>
                <ThemedText style={[styles.energyOptionHint, { color: theme.textSecondary }]}>
                  Smallest bites
                </ThemedText>
              </Pressable>
              
              <Pressable
                onPress={() => handleEnergySelect("medium")}
                style={[styles.energyOption, { backgroundColor: theme.roomBuild }]}
              >
                <Feather name="sun" size={24} color={theme.text} />
                <ThemedText style={styles.energyOptionLabel}>Medium</ThemedText>
                <ThemedText style={[styles.energyOptionHint, { color: theme.textSecondary }]}>
                  Standard pace
                </ThemedText>
              </Pressable>
              
              <Pressable
                onPress={() => handleEnergySelect("high")}
                style={[styles.energyOption, { backgroundColor: theme.roomRepair }]}
              >
                <Feather name="zap" size={24} color={theme.text} />
                <ThemedText style={styles.energyOptionLabel}>High</ThemedText>
                <ThemedText style={[styles.energyOptionHint, { color: theme.textSecondary }]}>
                  Full steam
                </ThemedText>
              </Pressable>
            </View>

            <Pressable
              onPress={handleSkipEnergyCheck}
              style={styles.skipEnergyButton}
            >
              <ThemedText style={{ color: theme.textSecondary }}>
                Not sure, just start
              </ThemedText>
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
  energyCheckContent: {
    width: "100%",
    maxWidth: 360,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    alignItems: "center",
  },
  energyCheckTitle: {
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  selectedTaskCard: {
    width: "100%",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  selectedTaskName: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  energyCheckHint: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: Spacing.lg,
    fontStyle: "italic",
  },
  energyOptions: {
    flexDirection: "row",
    gap: Spacing.sm,
    width: "100%",
    marginBottom: Spacing.lg,
  },
  energyOption: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    gap: Spacing.xs,
  },
  energyOptionLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  energyOptionHint: {
    fontSize: 12,
    textAlign: "center",
  },
  skipEnergyButton: {
    padding: Spacing.sm,
  },
  reflectionSection: {
    width: "100%",
    marginBottom: Spacing.lg,
  },
  reflectionLabel: {
    fontSize: 14,
    marginBottom: Spacing.sm,
    fontStyle: "italic",
  },
  reflectionInput: {
    width: "100%",
    minHeight: 80,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    fontSize: 15,
    textAlignVertical: "top",
  },
  bodyDoublingBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
  },
  bodyDoublingText: {
    fontSize: 13,
    fontWeight: "500",
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  bodyDoublingLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
});
