import React, { useState, useCallback, useMemo, useLayoutEffect } from "react";
import { View, StyleSheet, TextInput, Pressable, Switch, Alert, Modal } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { HeaderButton } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { AvatarPicker } from "@/components/AvatarPicker";
import { BreathingPacer } from "@/components/BreathingPacer";
import { RoomSwitcher } from "@/components/RoomSwitcher";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useAppStore } from "@/lib/store";
import { useSnackbarStore } from "@/lib/snackbarStore";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const {
    displayName,
    setDisplayName,
    avatarIndex,
    setAvatarIndex,
    hapticsEnabled,
    setHapticsEnabled,
    notificationsEnabled,
    setNotificationsEnabled,
    energyCheckInEnabled,
    setEnergyCheckInEnabled,
    resetAllData,
    tasks,
    activeDays,
    firstUseDate,
  } = useAppStore();
  const showSnackbar = useSnackbarStore((s) => s.show);

  const [localName, setLocalName] = useState(displayName);
  const hasNameChanged = localName !== displayName;

  const daysSinceFirstUse = useMemo(() => {
    if (!firstUseDate) return 0;
    const firstDate = new Date(firstUseDate);
    const today = new Date();
    const diffTime = today.getTime() - firstDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }, [firstUseDate]);

  const showStats = daysSinceFirstUse >= 3;

  const handleSaveName = useCallback(() => {
    if (hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setDisplayName(localName);
    showSnackbar("Name saved");
  }, [localName, setDisplayName, hapticsEnabled, showSnackbar]);

  const completedSteps = tasks.reduce((acc, task) => {
    return acc + task.steps.filter(s => s.completed).length;
  }, 0);

  const totalSteps = tasks.reduce((acc, task) => acc + task.steps.length, 0);
  const totalBites = tasks.length;
  const completionRate = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const weeklyActivity = useMemo(() => {
    const today = new Date();
    const weekDays: { day: string; active: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" }).charAt(0);
      weekDays.push({ day: dayName, active: activeDays.includes(dateStr) });
    }
    return weekDays;
  }, [activeDays]);

  const daysActiveThisWeek = weeklyActivity.filter((d) => d.active).length;

  const recentHistory = useMemo(() => {
    const historyMap = new Map<string, { taskTitle: string; biteText: string; minutes: number }[]>();
    
    tasks.forEach((task) => {
      task.steps.forEach((step) => {
        if (step.completed && step.completedAt) {
          const dateStr = step.completedAt.split("T")[0];
          const entry = {
            taskTitle: task.title,
            biteText: step.text,
            minutes: step.minutes,
          };
          if (historyMap.has(dateStr)) {
            historyMap.get(dateStr)!.push(entry);
          } else {
            historyMap.set(dateStr, [entry]);
          }
        }
      });
    });
    
    const sortedDates = Array.from(historyMap.keys()).sort((a, b) => b.localeCompare(a));
    const last7Days = sortedDates.slice(0, 7);
    
    return last7Days.map((date) => ({
      date,
      displayDate: new Date(date + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      bites: historyMap.get(date)!,
      totalMinutes: historyMap.get(date)!.reduce((sum, b) => sum + b.minutes, 0),
    }));
  }, [tasks]);

  const handleHapticsToggle = useCallback((value: boolean) => {
    if (value) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setHapticsEnabled(value);
  }, [setHapticsEnabled]);

  const handleResetData = useCallback(() => {
    Alert.alert(
      "Reset all data?",
      "This will clear all your tasks, notes, and settings. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            resetAllData();
            setShowSettingsModal(false);
          },
        },
      ]
    );
  }, [resetAllData]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderButton
          onPress={() => setShowSettingsModal(true)}
          pressColor={theme.primary + "20"}
        >
          <Feather name="settings" size={22} color={theme.text} />
        </HeaderButton>
      ),
    });
  }, [navigation, theme]);

  return (
    <>
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.lg,
        paddingBottom: tabBarHeight + Spacing.xl + 80,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <View style={styles.shapesRow}>
        <BreathingPacer />
        <RoomSwitcher />
      </View>

      <View style={styles.avatarSection}>
        <AvatarPicker
          selectedIndex={avatarIndex}
          onSelect={(index) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setAvatarIndex(index);
          }}
        />
      </View>

      <View style={styles.nameSection}>
        <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
          Display name (optional)
        </ThemedText>
        <View style={styles.nameInputRow}>
          <TextInput
            style={[
              styles.nameInput,
              {
                backgroundColor: theme.inputBackground,
                color: theme.text,
                borderColor: theme.border,
                flex: 1,
              },
            ]}
            placeholder="What should we call you?"
            placeholderTextColor={theme.textSecondary}
            value={localName}
            onChangeText={setLocalName}
          />
          {hasNameChanged ? (
            <Pressable
              onPress={handleSaveName}
              style={[styles.saveButton, { backgroundColor: theme.primary }]}
            >
              <Feather name="check" size={18} color="#FFFFFF" />
              <ThemedText style={styles.saveButtonText}>Save</ThemedText>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.analyticsSection}>
        <ThemedText type="h3" style={styles.sectionTitle}>
          Your Progress
        </ThemedText>
        
        {showStats ? (
          <>
            <ThemedText style={[styles.effortMessage, { color: theme.textSecondary }]}>
              {daysActiveThisWeek > 0
                ? `You showed up ${daysActiveThisWeek} day${daysActiveThisWeek !== 1 ? "s" : ""} this week`
                : "Every small bite counts"}
            </ThemedText>

            <View style={styles.weeklyChart}>
              {weeklyActivity.map((d, i) => (
                <View key={i} style={styles.dayColumn}>
                  <View
                    style={[
                      styles.dayDot,
                      {
                        backgroundColor: d.active ? theme.primary : theme.backgroundSecondary,
                      },
                    ]}
                  />
                  <ThemedText style={[styles.dayLabel, { color: theme.textSecondary }]}>
                    {d.day}
                  </ThemedText>
                </View>
              ))}
            </View>

            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: theme.backgroundDefault }]}>
                <ThemedText type="h2" style={{ color: theme.primary }}>
                  {totalBites}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                  Total bites
                </ThemedText>
              </View>
              <View style={[styles.statCard, { backgroundColor: theme.backgroundDefault }]}>
                <ThemedText type="h2" style={{ color: theme.primary }}>
                  {completedSteps}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                  Bites done
                </ThemedText>
              </View>
              <View style={[styles.statCard, { backgroundColor: theme.backgroundDefault }]}>
                <ThemedText type="h2" style={{ color: theme.primary }}>
                  {completionRate}%
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                  Completion
                </ThemedText>
              </View>
            </View>
          </>
        ) : (
          <View style={[styles.earlyDaysCard, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="sunrise" size={32} color={theme.primary} />
            <ThemedText type="h3" style={styles.earlyDaysTitle}>
              Day 1: The Hardest Step
            </ThemedText>
            <ThemedText style={[styles.earlyDaysText, { color: theme.textSecondary }]}>
              Your progress stats will appear after a few days of use. For now, focus on small wins.
            </ThemedText>
          </View>
        )}
      </View>

      <View style={styles.historySection}>
        <ThemedText type="h3" style={styles.sectionTitle}>
          Recent Activity
        </ThemedText>
        {recentHistory.length === 0 ? (
          <View style={[styles.emptyHistory, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="clock" size={24} color={theme.textSecondary} />
            <ThemedText style={[styles.emptyHistoryText, { color: theme.textSecondary }]}>
              Your completed bites will appear here
            </ThemedText>
          </View>
        ) : (
          recentHistory.map((day) => (
            <View key={day.date} style={styles.historyDay}>
              <View style={styles.historyDayHeader}>
                <ThemedText type="small" style={{ color: theme.primary, fontWeight: "600" }}>
                  {day.displayDate}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {day.totalMinutes} min
                </ThemedText>
              </View>
              {day.bites.map((bite, idx) => (
                <View
                  key={`${day.date}-${idx}`}
                  style={[styles.historyBite, { backgroundColor: theme.backgroundDefault }]}
                >
                  <View style={styles.historyBiteContent}>
                    <Feather name="check-circle" size={14} color={theme.success} />
                    <View style={styles.historyBiteText}>
                      <ThemedText numberOfLines={1} style={{ fontSize: 14 }}>
                        {bite.biteText}
                      </ThemedText>
                      <ThemedText type="small" style={{ color: theme.textSecondary }}>
                        {bite.taskTitle}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    {bite.minutes}m
                  </ThemedText>
                </View>
              ))}
            </View>
          ))
        )}
      </View>

      <View style={styles.footerSection}>
        <ThemedText style={[styles.footerText, { color: theme.textSecondary }]}>
          NeuroNibble v1.0
        </ThemedText>
        <ThemedText style={[styles.footerSubtext, { color: theme.textSecondary }]}>
          Momentum in micro-doses
        </ThemedText>
      </View>
    </KeyboardAwareScrollViewCompat>

    <Modal
      visible={showSettingsModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowSettingsModal(false)}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={() => setShowSettingsModal(false)}
      >
        <Pressable
          style={[styles.modalContent, { backgroundColor: theme.backgroundRoot }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <ThemedText type="h3">Settings</ThemedText>
            <Pressable onPress={() => setShowSettingsModal(false)}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
            <View style={styles.settingInfo}>
              <Feather name="smartphone" size={20} color={theme.text} />
              <ThemedText style={styles.settingLabel}>Haptic feedback</ThemedText>
            </View>
            <Switch
              value={hapticsEnabled}
              onValueChange={handleHapticsToggle}
              trackColor={{ false: theme.backgroundSecondary, true: theme.primary }}
            />
          </View>

          <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
            <View style={styles.settingInfo}>
              <Feather name="bell" size={20} color={theme.text} />
              <ThemedText style={styles.settingLabel}>Timer notifications</ThemedText>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: theme.backgroundSecondary, true: theme.primary }}
            />
          </View>

          <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
            <View style={styles.settingInfo}>
              <Feather name="zap" size={20} color={theme.text} />
              <View style={styles.settingTextGroup}>
                <ThemedText style={styles.settingLabel}>Energy check-in</ThemedText>
                <ThemedText style={[styles.settingDesc, { color: theme.textSecondary }]}>
                  Ask about energy level when starting tasks
                </ThemedText>
              </View>
            </View>
            <Switch
              value={energyCheckInEnabled}
              onValueChange={setEnergyCheckInEnabled}
              trackColor={{ false: theme.backgroundSecondary, true: theme.primary }}
            />
          </View>

          <View style={styles.modalDangerSection}>
            <Pressable
              onPress={handleResetData}
              style={[styles.resetButton, { backgroundColor: theme.backgroundDefault }]}
            >
              <Feather name="trash-2" size={18} color={theme.error} />
              <ThemedText style={[styles.resetText, { color: theme.error }]}>
                Reset all data
              </ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  shapesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  nameSection: {
    marginBottom: Spacing.xl,
  },
  label: {
    marginBottom: Spacing.sm,
  },
  nameInput: {
    height: 48,
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    fontSize: 16,
    letterSpacing: 0.5,
  },
  analyticsSection: {
    marginBottom: Spacing.xl,
  },
  effortMessage: {
    fontSize: 14,
    fontStyle: "italic",
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  weeklyChart: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: Spacing.lg,
  },
  dayColumn: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  dayDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  dayLabel: {
    fontSize: 11,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  statLabel: {
    marginTop: Spacing.xs,
    fontSize: 11,
    textAlign: "center",
  },
  historySection: {
    marginBottom: Spacing.xl,
  },
  emptyHistory: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    gap: Spacing.sm,
  },
  emptyHistoryText: {
    fontSize: 14,
    textAlign: "center",
  },
  historyDay: {
    marginBottom: Spacing.md,
  },
  historyDayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  historyBite: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.sm,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.xs,
  },
  historyBiteContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  historyBiteText: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
    marginRight: Spacing.sm,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingTextGroup: {
    flex: 1,
  },
  settingDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  resetText: {
    fontWeight: "500",
  },
  footerSection: {
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  footerText: {
    fontSize: 14,
  },
  footerSubtext: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: Spacing.xs,
  },
  nameInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
    height: 48,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  earlyDaysCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    gap: Spacing.sm,
  },
  earlyDaysTitle: {
    textAlign: "center",
  },
  earlyDaysText: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
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
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  modalDangerSection: {
    marginTop: Spacing.lg,
  },
});
