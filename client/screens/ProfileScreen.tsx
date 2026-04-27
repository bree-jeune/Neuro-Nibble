import React, { useState, useCallback, useMemo, useLayoutEffect } from "react";
import { View, StyleSheet, Pressable, Switch, Alert, Modal, Share } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { HeaderButton } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";

import { triggerHaptic } from "@/lib/haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { RoomSwitcher } from "@/components/RoomSwitcher";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useAppStore } from "@/lib/store";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const {
    displayName,
    hapticsEnabled,
    setHapticsEnabled,
    notificationsEnabled,
    setNotificationsEnabled,
    energyCheckInEnabled,
    setEnergyCheckInEnabled,
    colorScheme,
    setColorScheme,
    resetAllData,
    tasks,
    activeDays,
    firstUseDate,
    dopamineMenu,
  } = useAppStore();

  const daysSinceFirstUse = useMemo(() => {
    if (!firstUseDate) return 0;
    const firstDate = new Date(firstUseDate);
    const today = new Date();
    const diffTime = today.getTime() - firstDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }, [firstUseDate]);

  const showStats = daysSinceFirstUse >= 3;

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
      triggerHaptic("light");
    }
    setHapticsEnabled(value);
  }, [setHapticsEnabled]);

  const handleShareApp = useCallback(async () => {
    triggerHaptic("light");
    try {
      await Share.share({
        message:
          "NeuroNibble — momentum in micro-doses. https://neuronibble.app",
      });
    } catch {
      // User dismissed or share unavailable; nothing to do.
    }
  }, []);

  const handleOpenDopamineMenu = useCallback(() => {
    triggerHaptic("selection");
    const parent = navigation.getParent();
    if (parent) {
      (parent as unknown as { navigate: (name: string) => void }).navigate(
        "ReflectTab",
      );
    }
  }, [navigation]);

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
            triggerHaptic("warning");
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
      <View style={styles.headerRow}>
        <View style={styles.headerTextWrap}>
          <ThemedText type="h2">
            {displayName ? `Hey, ${displayName}` : "Your space"}
          </ThemedText>
        </View>
        <RoomSwitcher />
      </View>

      <View style={styles.photoPlaceholder}>
        <ThemedText style={[styles.photoPlaceholderText, { color: theme.textSecondary }]}>
          Profile photo — coming soon
        </ThemedText>
      </View>

      <View style={[styles.streakCard, { backgroundColor: theme.backgroundDefault }]}>
        <View style={styles.streakHeader}>
          <Feather name="sunrise" size={22} color={theme.primary} />
          <ThemedText style={styles.streakLabel}>
            Days you've shown up
          </ThemedText>
        </View>
        <ThemedText type="h1" style={[styles.streakNumber, { color: theme.primary }]}>
          {activeDays.length}
        </ThemedText>
        <ThemedText style={[styles.streakHint, { color: theme.textSecondary }]}>
          Gaps don't erase this.
        </ThemedText>
      </View>

      <Pressable
        onPress={handleOpenDopamineMenu}
        accessibilityRole="button"
        accessibilityLabel="Open dopamine menu"
        style={[styles.linkRow, { backgroundColor: theme.backgroundDefault }]}
      >
        <View style={[styles.linkIcon, { backgroundColor: theme.primary }]}>
          <Feather name="gift" size={18} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.linkTitle}>Your dopamine menu</ThemedText>
          <ThemedText style={[styles.linkSubtitle, { color: theme.textSecondary }]}>
            {dopamineMenu.length} {dopamineMenu.length === 1 ? "reward" : "rewards"} saved
          </ThemedText>
        </View>
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      </Pressable>

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

      <Pressable
        onPress={handleShareApp}
        accessibilityRole="button"
        accessibilityLabel="Share NeuroNibble"
        style={[styles.shareButton, { borderColor: theme.border }]}
      >
        <Feather name="share-2" size={16} color={theme.text} />
        <ThemedText style={styles.shareButtonText}>Share NeuroNibble</ThemedText>
      </Pressable>

      <View style={styles.footerSection}>
        <ThemedText style={[styles.footerText, { color: theme.textSecondary }]}>
          NeuroNibble v1.0
        </ThemedText>
        <ThemedText style={[styles.footerSubtext, { color: theme.textSecondary }]}>
          Made for brains like yours.
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

          <View style={[styles.settingRow, styles.disabledRow, { borderBottomColor: theme.border }]}>
            <View style={styles.settingInfo}>
              <Feather name="bell" size={20} color={theme.textSecondary} />
              <View style={styles.settingTextGroup}>
                <ThemedText style={[styles.settingLabel, { color: theme.textSecondary }]}>
                  Gentle reminders
                </ThemedText>
                <ThemedText style={[styles.settingDesc, { color: theme.textSecondary }]}>
                  Coming soon
                </ThemedText>
              </View>
            </View>
            <Switch value={false} disabled />
          </View>

          <View style={styles.appearanceSection}>
            <View style={styles.appearanceHeader}>
              <Feather name="moon" size={20} color={theme.text} />
              <ThemedText style={styles.settingLabel}>Appearance</ThemedText>
            </View>
            <View style={styles.appearanceOptions}>
              {(["light", "dark", "system"] as const).map((option) => {
                const selected = colorScheme === option;
                const label = option === "light" ? "Light" : option === "dark" ? "Dark" : "System";
                return (
                  <Pressable
                    key={option}
                    onPress={() => {
                      triggerHaptic("selection");
                      setColorScheme(option);
                    }}
                    style={[
                      styles.appearanceOption,
                      {
                        backgroundColor: selected ? theme.primary : theme.backgroundDefault,
                        borderColor: selected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <ThemedText
                      style={{
                        color: selected ? "#FFFFFF" : theme.text,
                        fontWeight: selected ? "600" : "400",
                        fontSize: 14,
                      }}
                    >
                      {label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  headerTextWrap: {
    flex: 1,
  },
  photoPlaceholder: {
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  photoPlaceholderText: {
    fontSize: 14,
    fontStyle: "italic",
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
  appearanceSection: {
    paddingVertical: Spacing.md,
  },
  appearanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  appearanceOptions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  appearanceOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    alignItems: "center",
  },
  streakCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  streakHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  streakLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  streakNumber: {
    fontSize: 40,
    fontWeight: "700",
    lineHeight: 48,
  },
  streakHint: {
    fontSize: 13,
    fontStyle: "italic",
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  linkTitle: {
    fontSize: 15,
    fontWeight: "500",
  },
  linkSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginTop: Spacing.md,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  disabledRow: {
    opacity: 0.6,
  },
});
