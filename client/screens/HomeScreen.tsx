import React, { useState, useCallback, useEffect, useRef, useLayoutEffect, useMemo } from "react";
import { View, ScrollView, StyleSheet, Pressable, Modal, TextInput, Animated, Easing } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { triggerHaptic } from "@/lib/haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { DynamicFooter } from "@/components/DynamicFooter";
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
  const [endDayDopamineItem, setEndDayDopamineItem] = useState<string | null>(null);
  const [bodyDoublingCount, setBodyDoublingCount] = useState(0);

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

  const getLiveUserCount = useCallback(() => {
    const now = new Date();
    const utcHour = now.getUTCHours();
    const isBusinessHours = utcHour >= 8 && utcHour <= 22;
    const baseCount = isBusinessHours ? 60 : 20;
    const minCount = isBusinessHours ? 40 : 10;
    const maxCount = isBusinessHours ? 80 : 30;
    const variance = Math.floor(Math.random() * 7) - 3;
    return Math.min(maxCount, Math.max(minCount, baseCount + variance));
  }, []);
  
  useEffect(() => {
    setBodyDoublingCount(getLiveUserCount());
    const interval = setInterval(() => {
      setBodyDoublingCount(getLiveUserCount());
    }, 60000);
    return () => clearInterval(interval);
  }, [getLiveUserCount]);

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

  const completedToday = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return tasks.reduce((count, t) => {
      return count + t.steps.filter((s) => s.completed && s.completedAt?.startsWith(today)).length;
    }, 0);
  }, [tasks]);

  const handleTaskPress = useCallback((task: Task) => {
    triggerHaptic("selection");
    if (energyCheckInEnabled) {
      setSelectedTask(task);
      setShowEnergyCheck(true);
    } else {
      navigation.navigate("BreakItDown", { taskId: task.id });
    }
  }, [energyCheckInEnabled, navigation]);

  const handleEnergySelect = useCallback((level: EnergyLevel) => {
    triggerHaptic("light");
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
  }, [setEnergyLevel, selectedTask, updateTask, navigation, startAudio]);

  const handleSkipEnergyCheck = useCallback(() => {
    if (selectedTask) {
      setShowEnergyCheck(false);
      navigation.navigate("BreakItDown", { taskId: selectedTask.id });
      setSelectedTask(null);
    }
  }, [selectedTask, navigation]);

  const handleBookend = useCallback(() => {
    triggerHaptic("success");
    setBookendCompleted(true);
  }, [setBookendCompleted]);

  const handleEndDay = () => {
    const prevCompleted = bookendCompleted;
    const prevLastDate = lastBookendDate;
    
    triggerHaptic("success");
    
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

  const openEndDayModal = useCallback(() => {
    if (dopamineMenu.length > 0) {
      const pick = dopamineMenu[Math.floor(Math.random() * dopamineMenu.length)];
      setEndDayDopamineItem(pick.text);
    } else {
      setEndDayDopamineItem(null);
    }
    setShowEndDayModal(true);
  }, [dopamineMenu]);

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
            {displayName ? `Good ${getGreeting()}, ${displayName}` : `Good ${getGreeting()}`}
          </ThemedText>
        </View>

        <View style={styles.weeklyRoomWrapper}>
          <WeeklyRoomBadge room={weeklyRoom} />
        </View>

        <View style={[styles.bodyDoublingPill, { backgroundColor: theme.primary + "15" }]}>
          <Animated.View
            style={[
              styles.pulsingDot,
              {
                backgroundColor: theme.success,
                opacity: pulseAnim,
              },
            ]}
          />
          <ThemedText style={[styles.bodyDoublingText, { color: theme.primary }]}>
            {bodyDoublingCount} working now
          </ThemedText>
        </View>

        {tasks.length === 0 ? (
          <View style={[styles.emptyStateCard, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h3" style={styles.emptyStateTitle}>
              Ready when you are.
            </ThemedText>
            <ThemedText style={[styles.emptyStateText, { color: theme.textSecondary }]}>
              When something feels stuck, we'll break it into tiny bites together.
            </ThemedText>
            <Pressable
              onPress={() => navigation.navigate("BreakItDown")}
              style={[styles.emptyStateButton, { backgroundColor: theme.primary }]}
            >
              <Feather name="plus" size={18} color="#FFFFFF" />
              <ThemedText style={styles.emptyStateButtonText}>Start with one thing</ThemedText>
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

        {hasTouchedTasksToday && !bookendCompleted ? (
          <Pressable
            onPress={openEndDayModal}
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

        {bookendCompleted ? (
          <View style={[styles.dayEndedCard, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="check-circle" size={20} color={theme.success} />
            <ThemedText style={styles.dayEndedText}>
              Day ended. Rest well.
            </ThemedText>
          </View>
        ) : null}

        <DynamicFooter screen="home" />
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
                  {completedToday === 1 ? "bite done today" : "bites done today"}
                </ThemedText>
              </View>
            ) : null}

            {endDayDopamineItem ? (
              <View style={[styles.rewardCard, { backgroundColor: theme.roomGentle }]}>
                <ThemedText style={styles.rewardTitle}>Treat yourself to:</ThemedText>
                <ThemedText style={styles.rewardItem}>{endDayDopamineItem}</ThemedText>
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
                  Gentle
                </ThemedText>
              </Pressable>
              
              <Pressable
                onPress={() => handleEnergySelect("medium")}
                style={[styles.energyOption, { backgroundColor: theme.roomBuild }]}
              >
                <Feather name="sun" size={24} color={theme.text} />
                <ThemedText style={styles.energyOptionLabel}>Medium</ThemedText>
                <ThemedText style={[styles.energyOptionHint, { color: theme.textSecondary }]}>
                  Steady
                </ThemedText>
              </Pressable>
              
              <Pressable
                onPress={() => handleEnergySelect("high")}
                style={[styles.energyOption, { backgroundColor: theme.roomRepair }]}
              >
                <Feather name="zap" size={24} color={theme.text} />
                <ThemedText style={styles.energyOptionLabel}>High</ThemedText>
                <ThemedText style={[styles.energyOptionHint, { color: theme.textSecondary }]}>
                  Full
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
    marginBottom: 0,
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
  endDayButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.lg,
    marginRight: 72,
  },
  weeklyRoomWrapper: {
    marginTop: Spacing.lg,
  },
  dayEndedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.lg,
  },
  dayEndedText: {
    fontSize: 15,
    fontStyle: "italic",
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
    minWidth: 90,
    maxWidth: 110,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
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
  bodyDoublingPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: Spacing.sm,
  },
  bodyDoublingText: {
    fontSize: 12,
    fontWeight: "500",
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
