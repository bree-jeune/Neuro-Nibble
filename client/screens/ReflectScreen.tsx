import React, { useState, useCallback, useEffect } from "react";
import { View, ScrollView, StyleSheet, TextInput, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { WeeklyRoomCard } from "@/components/WeeklyRoomCard";
import { DopamineMenuItem } from "@/components/DopamineMenuItem";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useAppStore } from "@/lib/store";
import type { WeeklyRoom } from "@/lib/types";

export default function ReflectScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();

  const { 
    weeklyRoom, 
    setWeeklyRoom, 
    brainDump, 
    setBrainDump,
    dopamineMenu,
    addDopamineItem,
    removeDopamineItem,
    oneTinyThing,
    setOneTinyThing,
  } = useAppStore();

  const [newDopamineItem, setNewDopamineItem] = useState("");

  const brainDumpPlaceholders = [
    "What's weighing on you?",
    "Let it all out...",
    "No judgment here...",
    "Just get it out of your head",
    "Write anything that's on your mind...",
    "What would feel good to release?",
    "Thoughts, worries, random stuff...",
  ];

  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % brainDumpPlaceholders.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleRoomSelect = useCallback((room: WeeklyRoom) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setWeeklyRoom(room);
  }, [setWeeklyRoom]);

  const handleAddDopamineItem = useCallback(() => {
    if (newDopamineItem.trim()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      addDopamineItem(newDopamineItem.trim());
      setNewDopamineItem("");
    }
  }, [newDopamineItem, addDopamineItem]);

  const handleRemoveDopamineItem = useCallback((item: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    removeDopamineItem(item);
  }, [removeDopamineItem]);

  const rooms: WeeklyRoom[] = ["chaos", "gentle", "build", "repair"];

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
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.section}>
        <ThemedText type="h3" style={styles.sectionTitle}>
          What kind of week is this?
        </ThemedText>
        <View style={styles.roomsGrid}>
          {rooms.map((room) => (
            <WeeklyRoomCard
              key={room}
              room={room}
              selected={weeklyRoom === room}
              onPress={() => handleRoomSelect(room)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h3" style={styles.sectionTitle}>
          Dump the heavy stuff
        </ThemedText>
        <ThemedText style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
          No fixing, no judgment. Just get it out.
        </ThemedText>
        <TextInput
          style={[
            styles.brainDumpInput,
            {
              backgroundColor: theme.inputBackground,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
          placeholder={brainDumpPlaceholders[placeholderIndex]}
          placeholderTextColor={theme.textSecondary}
          value={brainDump}
          onChangeText={setBrainDump}
          multiline
          textAlignVertical="top"
        />
      </View>

      <View style={styles.section}>
        <ThemedText type="h3" style={styles.sectionTitle}>
          Your Dopamine Menu
        </ThemedText>
        <ThemedText style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
          Things YOUR brain actually likes (not shoulds).
        </ThemedText>
        <View style={styles.dopamineInputRow}>
          <TextInput
            style={[
              styles.dopamineInput,
              {
                backgroundColor: theme.inputBackground,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            placeholder="Add something you enjoy..."
            placeholderTextColor={theme.textSecondary}
            value={newDopamineItem}
            onChangeText={setNewDopamineItem}
            onSubmitEditing={handleAddDopamineItem}
            returnKeyType="done"
          />
          <Pressable
            onPress={handleAddDopamineItem}
            style={[styles.addButton, { backgroundColor: theme.primary }]}
          >
            <Feather name="plus" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
        <View style={styles.dopamineList}>
          {dopamineMenu.map((item, index) => (
            <DopamineMenuItem
              key={index}
              item={item}
              onRemove={() => handleRemoveDopamineItem(item)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h3" style={styles.sectionTitle}>
          One Tiny Thing
        </ThemedText>
        <ThemedText style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
          What would make tomorrow just a little better?
        </ThemedText>
        <TextInput
          style={[
            styles.tinyThingInput,
            {
              backgroundColor: theme.inputBackground,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
          placeholder="Just one small thing..."
          placeholderTextColor={theme.textSecondary}
          value={oneTinyThing}
          onChangeText={setOneTinyThing}
        />
      </View>

      <View style={styles.permissionContainer}>
        <ThemedText style={[styles.permissionText, { color: theme.textSecondary }]}>
          Gentle weeks are valid.
        </ThemedText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontStyle: "italic",
    marginBottom: Spacing.md,
  },
  roomsGrid: {
    gap: Spacing.sm,
  },
  brainDumpInput: {
    minHeight: 120,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    fontSize: 16,
    letterSpacing: 0.5,
  },
  dopamineInputRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  dopamineInput: {
    flex: 1,
    height: 48,
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    fontSize: 16,
    letterSpacing: 0.5,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  dopamineList: {
    gap: Spacing.sm,
  },
  tinyThingInput: {
    height: 48,
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    fontSize: 16,
    letterSpacing: 0.5,
  },
  permissionContainer: {
    marginTop: Spacing.lg,
    alignItems: "center",
  },
  permissionText: {
    fontStyle: "italic",
    textAlign: "center",
  },
});
