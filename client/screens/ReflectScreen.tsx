import React, { useState, useCallback, useEffect, useRef } from "react";
import { View, StyleSheet, TextInput, Pressable, FlatList, Keyboard, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { triggerHaptic } from "@/lib/haptics";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { WeeklyRoomCard } from "@/components/WeeklyRoomCard";
import { SwipeableThoughtCard } from "@/components/SwipeableThoughtCard";
import { DopamineVendingMachine } from "@/components/DopamineVendingMachine";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { DynamicFooter } from "@/components/DynamicFooter";
import { useAppStore } from "@/lib/store";
import type { WeeklyRoom, ThoughtItem, DopamineCost } from "@/lib/types";

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
    triggerHaptic("medium");
    setWeeklyRoom(room);
  }, [setWeeklyRoom]);

  const handleAddThought = useCallback(() => {
    if (newThought.trim()) {
      triggerHaptic("light");
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

  const handleAddDopamineItem = useCallback((text: string, cost: DopamineCost) => {
    addDopamineItem(text, cost);
  }, [addDopamineItem]);

  const handleRemoveDopamineItem = useCallback((id: string) => {
    removeDopamineItem(id);
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
          gap: 24,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText type="h4" style={styles.cardTitle}>
            How are you showing up?
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

        <View style={[styles.card, styles.mainCard, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText type="h3" style={styles.cardTitle}>
            Brain Dump
          </ThemedText>
          <ThemedText style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
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

          <View style={[styles.inputBar, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
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
                { backgroundColor: newThought.trim() ? theme.primary : theme.backgroundTertiary }
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

        <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText type="h3" style={styles.cardTitle}>
            Dopamine Menu
          </ThemedText>
          <ThemedText style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
            Things YOUR brain actually likes (not shoulds).
          </ThemedText>
          <DopamineVendingMachine
            items={dopamineMenu}
            onAddItem={handleAddDopamineItem}
            onRemoveItem={handleRemoveDopamineItem}
          />
        </View>

        <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText type="h4" style={styles.cardTitle}>
            One Tiny Thing
          </ThemedText>
          <ThemedText style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
            What would make tomorrow just a little better?
          </ThemedText>
          <TextInput
            style={[
              styles.tinyThingInput,
              {
                backgroundColor: theme.backgroundSecondary,
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

        <DynamicFooter screen="reflect" />
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
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  mainCard: {
    paddingVertical: Spacing.xl,
  },
  cardTitle: {
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    fontStyle: "italic",
    marginBottom: Spacing.md,
    fontSize: 14,
  },
  roomsGrid: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
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
  tinyThingInput: {
    height: 48,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    fontSize: 16,
    letterSpacing: 0.5,
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
