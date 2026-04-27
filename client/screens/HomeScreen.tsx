import React, { useState, useCallback, useLayoutEffect, useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
} from "react-native";
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
import { WeeklyRoomSection } from "@/components/WeeklyRoomSection";
import { QuietRoomPreviewCard } from "@/components/QuietRoomPreviewCard";
import { RecentTaskCard } from "@/components/RecentTaskCard";
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
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [showEndDayModal, setShowEndDayModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showEnergyCheck, setShowEnergyCheck] = useState(false);
  const [reflectionText, setReflectionText] = useState("");

  const {
    setEnergyLevel,
    weeklyRoom,
    tasks,
    updateTask,
    bookendCompleted,
    setBookendCompleted,
    restoreBookendState,
    lastBookendDate,
    energyCheckInEnabled,
    displayName,
    addDailyReflection,
  } = useAppStore();
  const showSnackbar = useSnackbarStore((s) => s.show);
  const { startAudio } = useAudio();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => null,
    });
  }, [navigation]);

  const recentTasks = useMemo(
    () =>
      tasks
        .filter((t) => {
          if (!t.lastWorkedOn || t.isArchived) return false;
          const allStepsCompleted =
            t.steps.length > 0 && t.steps.every((s) => s.completed);
          return !allStepsCompleted;
        })
        .sort(
          (a, b) =>
            new Date(b.lastWorkedOn!).getTime() -
            new Date(a.lastWorkedOn!).getTime(),
        )
        .slice(0, 3),
    [tasks],
  );

  const completedToday = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return tasks.reduce((count, task) => {
      return (
        count +
        task.steps.filter(
          (step) => step.completed && step.completedAt?.startsWith(today),
        ).length
      );
    }, 0);
  }, [tasks]);

  const incompleteCount = useMemo(
    () =>
      tasks.filter(
        (task) =>
          !task.isArchived &&
          task.steps.length > 0 &&
          !task.steps.every((step) => step.completed),
      ).length,
    [tasks],
  );

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const hasStartedToday = useMemo(
    () =>
      tasks.some(
        (task) =>
          task.createdAt?.startsWith(today) ||
          task.lastWorkedOn?.startsWith(today),
      ) || completedToday > 0,
    [completedToday, tasks, today],
  );

  const handleTaskPress = useCallback(
    (task: Task) => {
      triggerHaptic("selection");
      if (energyCheckInEnabled) {
        setSelectedTask(task);
        setShowEnergyCheck(true);
        return;
      }
      navigation.navigate("BreakItDown", { taskId: task.id });
    },
    [energyCheckInEnabled, navigation],
  );

  const handleEnergySelect = useCallback(
    (level: EnergyLevel) => {
      triggerHaptic("light");
      setEnergyLevel(level);
      if (level === "low") {
        startAudio();
      }
      if (!selectedTask) {
        return;
      }
      updateTask(selectedTask.id, { energyLevel: level });
      setShowEnergyCheck(false);
      navigation.navigate("BreakItDown", { taskId: selectedTask.id });
      setSelectedTask(null);
    },
    [navigation, selectedTask, setEnergyLevel, startAudio, updateTask],
  );

  const handleSkipEnergyCheck = useCallback(() => {
    if (!selectedTask) {
      return;
    }
    setShowEnergyCheck(false);
    navigation.navigate("BreakItDown", { taskId: selectedTask.id });
    setSelectedTask(null);
  }, [navigation, selectedTask]);

  const handleEndDay = useCallback(() => {
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
  }, [
    addDailyReflection,
    bookendCompleted,
    lastBookendDate,
    reflectionText,
    restoreBookendState,
    setBookendCompleted,
    showSnackbar,
  ]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    return "evening";
  };

  const navigateToTab = useCallback(
    (tabName: "ReflectTab" | "TasksTab") => {
      triggerHaptic("selection");
      const parent = navigation.getParent();
      if (parent) {
        (parent as unknown as { navigate: (name: string) => void }).navigate(
          tabName,
        );
      }
    },
    [navigation],
  );

  const renderMainAction = () => {
    const isBuildEmpty =
      weeklyRoom === "build" && incompleteCount === 0 && completedToday === 0;

    if (weeklyRoom === "chaos") {
      return (
        <View
          style={[
            styles.mainCard,
            { backgroundColor: theme.backgroundDefault },
          ]}
        >
          <ThemedText type="h3" style={styles.mainTitle}>
            Start with one thing
          </ThemedText>
          <ThemedText
            style={[styles.mainSubtitle, { color: theme.textSecondary }]}
          >
            We’ll make it smaller.
          </ThemedText>
          <Pressable
            onPress={() => navigation.navigate("BreakItDown")}
            accessibilityRole="button"
            accessibilityLabel="Start with one thing"
            style={[styles.mainButton, { backgroundColor: theme.primary }]}
          >
            <ThemedText style={styles.mainButtonText}>Start</ThemedText>
          </Pressable>
          <Pressable
            onPress={() => navigateToTab("ReflectTab")}
            style={styles.secondaryLink}
          >
            <ThemedText
              style={[styles.secondaryLinkText, { color: theme.textSecondary }]}
            >
              Dump thoughts first →
            </ThemedText>
          </Pressable>
        </View>
      );
    }

    if (weeklyRoom === "gentle") {
      return (
        <View
          style={[
            styles.mainCard,
            { backgroundColor: theme.backgroundDefault },
          ]}
        >
          <ThemedText type="h3" style={styles.mainTitle}>
            Choose one gentle bite
          </ThemedText>
          <ThemedText
            style={[styles.mainSubtitle, { color: theme.textSecondary }]}
          >
            You can stop after that.
          </ThemedText>
          <Pressable
            onPress={() =>
              recentTasks[0]
                ? handleTaskPress(recentTasks[0])
                : navigation.navigate("BreakItDown")
            }
            accessibilityRole="button"
            accessibilityLabel="Start one gentle bite"
            style={[styles.mainButton, { backgroundColor: theme.primary }]}
          >
            <ThemedText style={styles.mainButtonText}>Start</ThemedText>
          </Pressable>
        </View>
      );
    }

    if (weeklyRoom === "build") {
      return (
        <View
          style={[
            styles.mainCard,
            { backgroundColor: theme.backgroundDefault },
          ]}
        >
          <ThemedText type="h3" style={styles.mainTitle}>
            {isBuildEmpty ? "Start momentum" : "Build from momentum"}
          </ThemedText>
          {isBuildEmpty ? (
            <ThemedText
              style={[styles.mainSubtitle, { color: theme.textSecondary }]}
            >
              One small move creates the trail.
            </ThemedText>
          ) : (
            <View style={styles.statRow}>
              <View style={styles.statBlock}>
                <ThemedText type="h2" style={{ color: theme.primary }}>
                  {incompleteCount}
                </ThemedText>
                <ThemedText
                  style={[styles.statLabel, { color: theme.textSecondary }]}
                >
                  active tasks
                </ThemedText>
              </View>
              <View
                style={[styles.statDivider, { backgroundColor: theme.border }]}
              />
              <View style={styles.statBlock}>
                <ThemedText type="h2" style={{ color: theme.primary }}>
                  {completedToday}
                </ThemedText>
                <ThemedText
                  style={[styles.statLabel, { color: theme.textSecondary }]}
                >
                  bites done today
                </ThemedText>
              </View>
            </View>
          )}
          <Pressable
            onPress={() =>
              recentTasks[0]
                ? handleTaskPress(recentTasks[0])
                : navigation.navigate("BreakItDown")
            }
            accessibilityRole="button"
            accessibilityLabel={isBuildEmpty ? "Start momentum" : "Keep going"}
            style={[styles.mainButton, { backgroundColor: theme.primary }]}
          >
            <ThemedText style={styles.mainButtonText}>
              {isBuildEmpty ? "Start" : "Keep going"}
            </ThemedText>
          </Pressable>
        </View>
      );
    }

    return (
      <View
        style={[styles.mainCard, { backgroundColor: theme.backgroundDefault }]}
      >
        <ThemedText type="h3" style={styles.mainTitle}>
          Pick one thing back up
        </ThemedText>
        <ThemedText
          style={[styles.mainSubtitle, { color: theme.textSecondary }]}
        >
          No shame. Just re-enter.
        </ThemedText>
        <Pressable
          onPress={() =>
            recentTasks[0]
              ? handleTaskPress(recentTasks[0])
              : navigateToTab("TasksTab")
          }
          accessibilityRole="button"
          accessibilityLabel="Pick one thing to re-enter"
          style={[styles.mainButton, { backgroundColor: theme.primary }]}
        >
          <ThemedText style={styles.mainButtonText}>Pick one</ThemedText>
        </Pressable>
      </View>
    );
  };

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.sm,
          paddingBottom: tabBarHeight + Spacing.xl + 24,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <ThemedText type="h2">
            {displayName
              ? `Good ${getGreeting()}, ${displayName}`
              : `Good ${getGreeting()}`}
          </ThemedText>
        </View>

        <View style={styles.weeklyRoomWrapper}>
          <WeeklyRoomSection room={weeklyRoom} compact />
        </View>

        <View style={styles.choiceHeader}>
          <ThemedText type="h3">What do you need?</ThemedText>
        </View>

        {renderMainAction()}

        <View style={styles.quickActionsGrid}>
          <Pressable
            onPress={() => navigation.navigate("BreakItDown")}
            accessibilityRole="button"
            accessibilityLabel="Start one thing"
            style={[
              styles.quickActionCard,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <ThemedText style={styles.quickActionTitle}>
              Start one thing
            </ThemedText>
            <ThemedText
              style={[
                styles.quickActionSubtitle,
                { color: theme.textSecondary },
              ]}
            >
              Begin with the first tiny bite.
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => navigateToTab("ReflectTab")}
            accessibilityRole="button"
            accessibilityLabel="Dump thoughts"
            style={[
              styles.quickActionCard,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <ThemedText style={styles.quickActionTitle}>
              Dump thoughts
            </ThemedText>
            <ThemedText
              style={[
                styles.quickActionSubtitle,
                { color: theme.textSecondary },
              ]}
            >
              Offload mental noise first.
            </ThemedText>
          </Pressable>

          <QuietRoomPreviewCard
            onPress={() => navigation.navigate("QuietRoom")}
          />
        </View>

        {recentTasks.length > 0 ? (
          <View style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Recent tasks
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

        {hasStartedToday && !bookendCompleted ? (
          <Pressable
            onPress={() => setShowEndDayModal(true)}
            accessibilityRole="button"
            accessibilityLabel="End today"
            style={[
              styles.endDayButton,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <View
              style={[styles.endDayIcon, { backgroundColor: theme.secondary }]}
            >
              <Feather name="sunset" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.endDayTextContainer}>
              <ThemedText style={styles.endDayTitle}>End today</ThemedText>
              <ThemedText
                style={[styles.endDaySubtitle, { color: theme.textSecondary }]}
              >
                Close out without judging the day
              </ThemedText>
            </View>
            <Feather
              name="chevron-right"
              size={20}
              color={theme.textSecondary}
            />
          </Pressable>
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
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.backgroundRoot },
            ]}
          >
            <Feather
              name="moon"
              size={48}
              color={theme.secondary}
              style={styles.modalIcon}
            />

            <ThemedText type="h2" style={styles.modalTitle}>
              End today?
            </ThemedText>

            <ThemedText
              style={[styles.modalMessage, { color: theme.textSecondary }]}
            >
              Close out gently. No judgment, no scorecard.
            </ThemedText>

            {completedToday > 0 ? (
              <View
                style={[
                  styles.statCard,
                  { backgroundColor: theme.backgroundDefault },
                ]}
              >
                <ThemedText style={styles.statNumber}>
                  {completedToday}
                </ThemedText>
                <ThemedText
                  style={[styles.statLabel, { color: theme.textSecondary }]}
                >
                  {completedToday === 1
                    ? "bite done today"
                    : "bites done today"}
                </ThemedText>
              </View>
            ) : null}

            <View style={styles.reflectionSection}>
              <ThemedText
                style={[styles.reflectionLabel, { color: theme.textSecondary }]}
              >
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
              style={[
                styles.confirmButton,
                { backgroundColor: theme.secondary },
              ]}
            >
              <ThemedText style={styles.confirmButtonText}>
                End Today
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={() => setShowEndDayModal(false)}
              style={styles.cancelButton}
            >
              <ThemedText style={{ color: theme.textSecondary }}>
                Not yet
              </ThemedText>
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
            style={[
              styles.energyCheckContent,
              { backgroundColor: theme.backgroundRoot },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <ThemedText type="h3" style={styles.energyCheckTitle}>
              How’s your energy for this?
            </ThemedText>

            {selectedTask ? (
              <View
                style={[
                  styles.selectedTaskCard,
                  { backgroundColor: theme.backgroundDefault },
                ]}
              >
                <ThemedText style={styles.selectedTaskName}>
                  {selectedTask.title}
                </ThemedText>
              </View>
            ) : null}

            <ThemedText
              style={[styles.energyCheckHint, { color: theme.textSecondary }]}
            >
              This helps show the right first bite for you
            </ThemedText>

            <View style={styles.energyOptions}>
              <Pressable
                onPress={() => handleEnergySelect("low")}
                style={[
                  styles.energyOption,
                  { backgroundColor: theme.roomGentle },
                ]}
              >
                <Feather name="cloud" size={24} color={theme.text} />
                <ThemedText style={styles.energyOptionLabel}>Low</ThemedText>
                <ThemedText
                  style={[
                    styles.energyOptionHint,
                    { color: theme.textSecondary },
                  ]}
                >
                  Gentle
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={() => handleEnergySelect("medium")}
                style={[
                  styles.energyOption,
                  { backgroundColor: theme.roomBuild },
                ]}
              >
                <Feather name="sun" size={24} color={theme.text} />
                <ThemedText style={styles.energyOptionLabel}>Medium</ThemedText>
                <ThemedText
                  style={[
                    styles.energyOptionHint,
                    { color: theme.textSecondary },
                  ]}
                >
                  Steady
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={() => handleEnergySelect("high")}
                style={[
                  styles.energyOption,
                  { backgroundColor: theme.roomRepair },
                ]}
              >
                <Feather name="zap" size={24} color={theme.text} />
                <ThemedText style={styles.energyOptionLabel}>High</ThemedText>
                <ThemedText
                  style={[
                    styles.energyOptionHint,
                    { color: theme.textSecondary },
                  ]}
                >
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
  weeklyRoomWrapper: {
    marginTop: Spacing.md,
  },
  choiceHeader: {
    marginTop: Spacing.lg,
  },
  mainCard: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.sm,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  mainTitle: {
    lineHeight: 24,
  },
  mainSubtitle: {
    fontSize: 14,
  },
  mainButton: {
    minHeight: 44,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm,
  },
  mainButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  secondaryLink: {
    paddingVertical: Spacing.sm,
  },
  secondaryLinkText: {
    fontSize: 14,
    fontStyle: "italic",
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  quickActionsGrid: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  quickActionCard: {
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  quickActionSubtitle: {
    fontSize: 13,
  },
  endDayButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xl,
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
  statRow: {
    flexDirection: "row",
    paddingVertical: Spacing.sm,
    alignItems: "center",
  },
  statBlock: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    alignSelf: "stretch",
    marginHorizontal: Spacing.md,
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
  confirmButton: {
    width: "100%",
    minHeight: 44,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
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
});
