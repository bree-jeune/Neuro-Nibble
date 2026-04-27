import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  Keyboard,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
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
import { parseBrainDumpToBites } from "@/lib/brainDumpParser";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type { WeeklyRoom, ThoughtItem, DopamineCost } from "@/lib/types";

const THOUGHT_PLACEHOLDERS = [
  "What's weighing on you?",
  "Let it all out...",
  "No judgment here...",
  "Just get it out of your head",
  "Write anything that's on your mind...",
  "What would feel good to release?",
  "Thoughts, worries, random stuff...",
];

export default function ReflectScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const {
    weeklyRoom,
    setWeeklyRoom,
    thoughtDump,
    addThought,
    removeThought,
    archiveThought,
    convertThoughtToTask,
    convertThoughtToBites,
    dopamineMenu,
    addDopamineItem,
    removeDopamineItem,
    restoreDefaultDopamineRewards,
    oneTinyThing,
    setOneTinyThing,
  } = useAppStore();

  const [newThought, setNewThought] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [triageThought, setTriageThought] = useState<ThoughtItem | null>(null);
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % THOUGHT_PLACEHOLDERS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const showToastMessage = useCallback((message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  }, []);

  const activeThoughts = thoughtDump.filter(
    (thought) => (thought.status ?? "active") === "active",
  );

  const handleRoomSelect = useCallback(
    (room: WeeklyRoom) => {
      triggerHaptic("medium");
      setWeeklyRoom(room);
    },
    [setWeeklyRoom],
  );

  const handleAddThought = useCallback(() => {
    if (newThought.trim()) {
      triggerHaptic("light");
      const thought = addThought(newThought.trim());
      setTriageThought(thought);
      setNewThought("");
      Keyboard.dismiss();
    }
  }, [newThought, addThought]);

  const handleVentThought = useCallback(
    (id: string) => {
      removeThought(id);
      setTriageThought(null);
      showToastMessage("Let go");
    },
    [removeThought, showToastMessage],
  );

  const handleConvertToTask = useCallback(
    (thought: ThoughtItem) => {
      convertThoughtToTask(thought);
      setTriageThought(null);
      showToastMessage("Moved to Tasks");
    },
    [convertThoughtToTask, showToastMessage],
  );

  const handleArchiveThought = useCallback(
    (thought: ThoughtItem) => {
      triggerHaptic("light");
      archiveThought(thought.id);
      setTriageThought(null);
      showToastMessage("Saved for later");
    },
    [archiveThought, showToastMessage],
  );

  const handleBreakIntoBites = useCallback(
    (thought: ThoughtItem) => {
      const parsed = parseBrainDumpToBites(thought.text);
      const taskId = convertThoughtToBites(
        { ...thought, text: parsed.title },
        parsed.steps,
        parsed.suggestedEnergy,
      );
      setTriageThought(null);
      setCreatedTaskId(taskId);
    },
    [convertThoughtToBites],
  );

  const handleGoToCreatedTask = useCallback(() => {
    if (!createdTaskId) {
      return;
    }
    triggerHaptic("selection");
    const taskId = createdTaskId;
    setCreatedTaskId(null);
    navigation.navigate("BreakItDown", { taskId });
  }, [createdTaskId, navigation]);

  const handleAddDopamineItem = useCallback(
    (text: string, cost: DopamineCost) => {
      addDopamineItem(text, cost);
    },
    [addDopamineItem],
  );

  const handleRemoveDopamineItem = useCallback(
    (id: string) => {
      removeDopamineItem(id);
    },
    [removeDopamineItem],
  );

  const rooms: WeeklyRoom[] = ["chaos", "gentle", "build", "repair"];

  const renderThoughtItem = useCallback(
    ({ item }: { item: ThoughtItem }) => (
      <SwipeableThoughtCard
        thought={item}
        onVent={handleVentThought}
        onConvertToTask={handleConvertToTask}
        onBreakIntoBites={handleBreakIntoBites}
      />
    ),
    [handleVentThought, handleConvertToTask, handleBreakIntoBites],
  );

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
        <View
          style={[styles.card, { backgroundColor: theme.backgroundDefault }]}
        >
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

        <View
          style={[
            styles.card,
            styles.mainCard,
            { backgroundColor: theme.backgroundDefault },
          ]}
        >
          <ThemedText type="h3" style={styles.cardTitle}>
            Brain Dump
          </ThemedText>
          <ThemedText
            style={[styles.cardSubtitle, { color: theme.textSecondary }]}
          >
            Get it out first. Decide what to do with it after.
          </ThemedText>

          {activeThoughts.length > 0 ? (
            <FlatList
              data={activeThoughts}
              renderItem={renderThoughtItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.thoughtList}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View
              style={[
                styles.emptyState,
                { backgroundColor: theme.backgroundSecondary },
              ]}
            >
              <Feather name="inbox" size={32} color={theme.textSecondary} />
              <ThemedText
                style={[styles.emptyText, { color: theme.textSecondary }]}
              >
                No thoughts here. That can be peace or a blank page.
              </ThemedText>
            </View>
          )}

          <View
            style={[
              styles.inputBar,
              {
                backgroundColor: theme.backgroundSecondary,
                borderColor: theme.border,
              },
            ]}
          >
            <TextInput
              ref={inputRef}
              style={[styles.thoughtInput, { color: theme.text }]}
              placeholder={THOUGHT_PLACEHOLDERS[placeholderIndex]}
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
                {
                  backgroundColor: newThought.trim()
                    ? theme.primary
                    : theme.backgroundTertiary,
                },
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

        <View
          style={[styles.card, { backgroundColor: theme.backgroundDefault }]}
        >
          <ThemedText type="h3" style={styles.cardTitle}>
            Dopamine Menu
          </ThemedText>
          <ThemedText
            style={[styles.cardSubtitle, { color: theme.textSecondary }]}
          >
            Things YOUR brain actually likes (not shoulds).
          </ThemedText>
          <DopamineVendingMachine
            items={dopamineMenu}
            onAddItem={handleAddDopamineItem}
            onRemoveItem={handleRemoveDopamineItem}
            onRestoreDefaults={restoreDefaultDopamineRewards}
          />
        </View>

        <View
          style={[styles.card, { backgroundColor: theme.backgroundDefault }]}
        >
          <ThemedText type="h4" style={styles.cardTitle}>
            One Tiny Thing
          </ThemedText>
          <ThemedText
            style={[styles.cardSubtitle, { color: theme.textSecondary }]}
          >
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
            },
          ]}
        >
          <ThemedText style={styles.toastText}>{toastMessage}</ThemedText>
        </Animated.View>
      ) : null}

      <Modal
        visible={!!triageThought}
        transparent
        animationType="fade"
        onRequestClose={() => setTriageThought(null)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.triageCard,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <ThemedText type="h3" style={styles.triageTitle}>
              Now that it&apos;s out, what do you want to do with it?
            </ThemedText>
            {triageThought ? (
              <ThemedText
                numberOfLines={3}
                style={[styles.triageThought, { color: theme.textSecondary }]}
              >
                {triageThought.text}
              </ThemedText>
            ) : null}

            <View style={styles.triageActions}>
              {triageThought ? (
                <>
                  <Pressable
                    onPress={() => handleVentThought(triageThought.id)}
                    accessibilityRole="button"
                    accessibilityLabel="Let this thought go"
                    style={[styles.triageButton, { borderColor: theme.border }]}
                  >
                    <Feather name="trash-2" size={18} color={theme.text} />
                    <ThemedText style={styles.triageButtonText}>
                      Let it go
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={() => handleArchiveThought(triageThought)}
                    accessibilityRole="button"
                    accessibilityLabel="Save this thought"
                    style={[styles.triageButton, { borderColor: theme.border }]}
                  >
                    <Feather name="archive" size={18} color={theme.text} />
                    <ThemedText style={styles.triageButtonText}>
                      Save it
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={() => handleConvertToTask(triageThought)}
                    accessibilityRole="button"
                    accessibilityLabel="Make this thought a task"
                    style={[styles.triageButton, { borderColor: theme.border }]}
                  >
                    <Feather name="check-circle" size={18} color={theme.text} />
                    <ThemedText style={styles.triageButtonText}>
                      Make it a task
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={() => handleBreakIntoBites(triageThought)}
                    accessibilityRole="button"
                    accessibilityLabel="Break this thought into bites"
                    style={[
                      styles.triageButton,
                      styles.primaryTriageButton,
                      { backgroundColor: theme.primary },
                    ]}
                  >
                    <Feather name="list" size={18} color="#FFFFFF" />
                    <ThemedText style={styles.primaryTriageButtonText}>
                      Break it into bites
                    </ThemedText>
                  </Pressable>
                </>
              ) : null}
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!createdTaskId}
        transparent
        animationType="fade"
        onRequestClose={() => setCreatedTaskId(null)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.triageCard,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <View
              style={[styles.confirmIcon, { backgroundColor: theme.primary }]}
            >
              <Feather name="check" size={28} color="#FFFFFF" />
            </View>
            <ThemedText type="h3" style={styles.triageTitle}>
              Turned into bites.
            </ThemedText>
            <ThemedText
              style={[styles.confirmText, { color: theme.textSecondary }]}
            >
              You can change them anytime.
            </ThemedText>
            <Pressable
              onPress={handleGoToCreatedTask}
              accessibilityRole="button"
              accessibilityLabel="Go to task"
              style={[styles.confirmButton, { backgroundColor: theme.primary }]}
            >
              <ThemedText style={styles.confirmButtonText}>
                Go to task
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setCreatedTaskId(null)}
              accessibilityRole="button"
              style={styles.dismissButton}
            >
              <ThemedText style={{ color: theme.textSecondary }}>
                Stay here
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  triageCard: {
    width: "100%",
    maxWidth: 380,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  triageTitle: {
    textAlign: "center",
  },
  triageThought: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    fontStyle: "italic",
  },
  triageActions: {
    gap: Spacing.sm,
  },
  triageButton: {
    minHeight: 48,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  triageButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  primaryTriageButton: {
    borderWidth: 0,
  },
  primaryTriageButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  confirmIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  confirmText: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },
  confirmButton: {
    minHeight: 48,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  dismissButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
