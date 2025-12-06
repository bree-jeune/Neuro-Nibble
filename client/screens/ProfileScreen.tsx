import React, { useState, useCallback } from "react";
import { View, StyleSheet, TextInput, Pressable, Switch, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { AvatarPicker } from "@/components/AvatarPicker";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useAppStore } from "@/lib/store";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();

  const {
    displayName,
    setDisplayName,
    avatarIndex,
    setAvatarIndex,
    hapticsEnabled,
    setHapticsEnabled,
    notificationsEnabled,
    setNotificationsEnabled,
    resetAllData,
    tasks,
  } = useAppStore();

  const completedSteps = tasks.reduce((acc, task) => {
    return acc + task.steps.filter(s => s.completed).length;
  }, 0);

  const totalBites = tasks.length;

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
          },
        },
      ]
    );
  }, [resetAllData]);

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.lg,
        paddingBottom: tabBarHeight + Spacing.xl + 80,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
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
        <TextInput
          style={[
            styles.nameInput,
            {
              backgroundColor: theme.inputBackground,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
          placeholder="What should we call you?"
          placeholderTextColor={theme.textSecondary}
          value={displayName}
          onChangeText={setDisplayName}
        />
      </View>

      <View style={styles.statsSection}>
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
            Steps done
          </ThemedText>
        </View>
      </View>

      <View style={styles.settingsSection}>
        <ThemedText type="h3" style={styles.sectionTitle}>
          Settings
        </ThemedText>

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
      </View>

      <View style={styles.dangerSection}>
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

      <View style={styles.footerSection}>
        <ThemedText style={[styles.footerText, { color: theme.textSecondary }]}>
          NeuroNibble v1.0
        </ThemedText>
        <ThemedText style={[styles.footerSubtext, { color: theme.textSecondary }]}>
          Momentum in micro-doses
        </ThemedText>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
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
  statsSection: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  statLabel: {
    marginTop: Spacing.xs,
    fontSize: 12,
  },
  settingsSection: {
    marginBottom: Spacing.xl,
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
  },
  settingLabel: {
    fontSize: 16,
  },
  dangerSection: {
    marginBottom: Spacing.xl,
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
});
