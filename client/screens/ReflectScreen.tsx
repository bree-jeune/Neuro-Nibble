import React, { useState, useCallback, useEffect, useRef } from "react";
import { View, StyleSheet, TextInput, Pressable, FlatList, Keyboard, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { WeeklyRoomCard } from "@/components/WeeklyRoomCard";
import { DopamineMenuItem } from "@/components/DopamineMenuItem";
import { SwipeableThoughtCard } from "@/components/SwipeableThoughtCard";
import { SpinForDopamine } from "@/components/SpinForDopamine";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useAppStore } from "@/lib/store";
import type { WeeklyRoom, ThoughtItem } from "@/lib/types";

export default function ReflectScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();

  const { 
    weeklyRoom, 
    setWeeklyRoom, 
    thoughtDump,
    addThought,
    removeThought,
    convertThoughtToTask,
    dopamineMenu,
    addDopamineItem,
    removeDopamineItem,
    oneTinyThing,
    setOneTinyThing,
  } = useAppStore();

  const [newDopamineItem, setNewDopamineItem] = useState("");
  const [newThought, setNewThought] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const inputRef = useRef<TextInput>(null);

  const thoughtPlaceholders = [
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
      setPlaceholderIndex((prev) => (prev + 1) % thoughtPlaceholders.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const showToastMessage = useCallback((message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  }, []);

  const handleRoomSelect = useCallback((room: WeeklyRoom) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setWeeklyRoom(room);
  }, [setWeeklyRoom]);

  const handleAddThought = useCallback(() => {
    if (newThought.trim()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      addThought(newThought.trim());
      setNewThought("");
      Keyboard.dismiss();
    }
  }, [newThought, addThought]);

  const handleVentThought = useCallback((id: string) => {
    removeThought(id);
    showToastMessage("Released into the void");
  }, [removeThought, showToastMessage]);

  const handleConvertToTask = useCallback((thought: ThoughtItem) => {
    convertThoughtToTask(thought);
    showToastMessage("Moved to Tasks");
  }, [convertThoughtToTask, showToastMessage]);

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

  const renderThoughtItem = useCallback(({ item }: { item: ThoughtItem }) => (
    <SwipeableThoughtCard
      thought={item}
      onVent={handleVentThought}
      onConvertToTask={handleConvertToTask}
    />
  ), [handleVentThought, handleConvertToTask]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.backgroundRoot }}>
      <KeyboardAwareScrollViewCompat
        style={{ flex: 1 }}
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
            Thought Processor
          </ThemedText>
          <ThemedText style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            Swipe right to make it a task. Swipe left to let it go.
          </ThemedText>
          
          {thoughtDump.length > 0 ? (
            <FlatList
              data={thoughtDump}
              renderItem={renderThoughtItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.thoughtList}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={[styles.emptyState, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="inbox" size={32} color={theme.textSecondary} />
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                No thoughts yet. Add one below.
              </ThemedText>
            </View>
          )}

          <View style={[styles.inputBar, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
            <TextInput
              ref={inputRef}
              style={[styles.thoughtInput, { color: theme.text }]}
              placeholder={thoughtPlaceholders[placeholderIndex]}
              placeholderTextColor={theme.textSecondary}
              value={newThought}
              onChangeText={setNewThought}
              onSubmitEditing={handleAddThought}
              returnKeyType="send"
              blurOnSubmit={false}
            />
            <Pressable
              onPress={handleAddThought}
              style={[
                styles.sendButton,
                { backgroundColor: newThought.trim() ? theme.primary : theme.backgroundSecondary }
              ]}
              disabled={!newThought.trim()}
            >
              <Feather 
                name="send" 
                size={18} 
                color={newThought.trim() ? "#FFFFFF" : theme.textSecondary} 
              />
            </Pressable>
          </View>
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

          <View style={styles.spinContainer}>
            <SpinForDopamine items={dopamineMenu} />
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
      </KeyboardAwareScrollViewCompat>

      {showToast ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={[
            styles.toast,
            { 
              backgroundColor: theme.primary,
              bottom: tabBarHeight + Spacing.lg,
            }
          ]}
        >
          <ThemedText style={styles.toastText}>{toastMessage}</ThemedText>
        </Animated.View>
      ) : null}
    </View>
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
  thoughtList: {
    marginBottom: Spacing.md,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: "italic",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  thoughtInput: {
    flex: 1,
    fontSize: 15,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    minHeight: 40,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
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
  spinContainer: {
    marginTop: Spacing.lg,
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
  toast: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  toastText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
});
