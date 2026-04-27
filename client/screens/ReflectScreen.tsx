import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  Keyboard,
  Modal,
  ScrollView,
  Animated as RNAnimated,
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
import { SwipeableThoughtCard } from "@/components/SwipeableThoughtCard";
import { DopamineVendingMachine } from "@/components/DopamineVendingMachine";
import { getRoomConfig } from "@/components/WeeklyRoomBadge";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { DynamicFooter } from "@/components/DynamicFooter";
import { useAppStore } from "@/lib/store";
import { parseBrainDumpToBites } from "@/lib/brainDumpParser";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type { ThoughtItem, DopamineCost, EnergyLevel, Step } from "@/lib/types";

const THOUGHT_PLACEHOLDERS = [
  "What's weighing on you?",
  "Let it all out...",
  "No judgment here...",
  "Just get it out of your head",
  "Write anything that's on your mind...",
  "What would feel good to release?",
  "Thoughts, worries, random stuff...",
];

// ── New type for the bites review state ─────────────────────────────────────
type BitesReviewState = {
  thought: ThoughtItem;
  parsedTitle: string;
  steps: Step[];
  energyLevel: EnergyLevel;
};

export default function ReflectScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const {
    weeklyRoom,
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
  const [tinyThingEdited, setTinyThingEdited] = useState(false);
  const tinyThingSavedOpacity = useRef(new RNAnimated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // ── Bites review state ──────────────────────────────────────────────────
  const [bitesReview, setBitesReview] = useState<BitesReviewState | null>(null);
  const [reviewSteps, setReviewSteps] = useState<Step[]>([]);
  const [reviewNewBiteText, setReviewNewBiteText] = useState("");
  const [editingBiteId, setEditingBiteId] = useState<string | null>(null);
  const [editingBiteText, setEditingBiteText] = useState("");

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

  // ── CHANGED: open review modal instead of immediately converting ────────
  const handleBreakIntoBites = useCallback((thought: ThoughtItem) => {
    const parsed = parseBrainDumpToBites(thought.text);
    // Close triage, open review
    setTriageThought(null);
    setBitesReview({
      thought,
      parsedTitle: parsed.title,
      steps: parsed.steps,
      energyLevel: parsed.suggestedEnergy,
    });
    setReviewSteps(parsed.steps);
    setReviewNewBiteText("");
    setEditingBiteId(null);
    setEditingBiteText("");
  }, []);

  // ── NEW: confirm from review modal ──────────────────────────────────────
  const handleConfirmBitesReview = useCallback(() => {
    if (!bitesReview || reviewSteps.length === 0) return;
    triggerHaptic("success");
    const taskId = convertThoughtToBites(
      { ...bitesReview.thought, text: bitesReview.parsedTitle },
      reviewSteps,
      bitesReview.energyLevel,
    );
    setBitesReview(null);
    setCreatedTaskId(taskId);
  }, [bitesReview, reviewSteps, convertThoughtToBites]);

  const handleReviewRemoveBite = useCallback((stepId: string) => {
    triggerHaptic("light");
    setReviewSteps((prev) => prev.filter((s) => s.id !== stepId));
  }, []);

  const handleReviewAddBite = useCallback(() => {
    if (!reviewNewBiteText.trim()) return;
    triggerHaptic("light");
    const newStep: Step = {
      id: `review_${Date.now()}`,
      text: reviewNewBiteText.trim(),
      minutes: 5,
      completed: false,
    };
    setReviewSteps((prev) => [...prev, newStep]);
    setReviewNewBiteText("");
  }, [reviewNewBiteText]);

  const handleReviewStartEdit = useCallback((step: Step) => {
    setEditingBiteId(step.id);
    setEditingBiteText(step.text);
  }, []);

  const handleReviewSaveEdit = useCallback(() => {
    if (!editingBiteId || !editingBiteText.trim()) {
      setEditingBiteId(null);
      return;
    }
    setReviewSteps((prev) =>
      prev.map((s) =>
        s.id === editingBiteId ? { ...s, text: editingBiteText.trim() } : s,
      ),
    );
    setEditingBiteId(null);
    setEditingBiteText("");
  }, [editingBiteId, editingBiteText]);

  const handleGoToCreatedTask = useCallback(() => {
    if (!createdTaskId) return;
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

  const handleTinyThingChange = useCallback(
    (text: string) => {
      setTinyThingEdited(true);
      setOneTinyThing(text);
    },
    [setOneTinyThing],
  );

  const handleTinyThingBlur = useCallback(() => {
    if (!tinyThingEdited) {
      return;
    }

    setTinyThingEdited(false);
    tinyThingSavedOpacity.setValue(0);
    RNAnimated.sequence([
      RNAnimated.timing(tinyThingSavedOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      RNAnimated.delay(1000),
      RNAnimated.timing(tinyThingSavedOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [tinyThingEdited, tinyThingSavedOpacity]);

  const currentRoomConfig = getRoomConfig(weeklyRoom);
  const currentRoomColor = theme[
    `room${weeklyRoom.charAt(0).toUpperCase() + weeklyRoom.slice(1)}` as keyof typeof theme
  ] as string;

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
          <View style={styles.roomRow}>
            <View
              style={[styles.roomIcon, { backgroundColor: currentRoomColor }]}
            >
              <Feather
                name={currentRoomConfig.icon}
                size={18}
                color={theme.text}
              />
            </View>
            <View style={styles.roomCopy}>
              <ThemedText style={styles.roomEyebrow}>Current mode</ThemedText>
              <ThemedText style={styles.roomLabel}>
                {currentRoomConfig.label}
              </ThemedText>
            </View>
            <Pressable
              onPress={() => {
                triggerHaptic("selection");
                navigation.navigate("WeeklyRoomSetup", { mode: "change" });
              }}
              accessibilityRole="button"
              accessibilityLabel="Change mode"
              style={styles.changeModeButton}
            >
              <ThemedText
                style={[styles.changeModeText, { color: theme.primary }]}
              >
                Change mode
              </ThemedText>
            </Pressable>
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

          {activeThoughts.length > 0 ? (
            <ThemedText
              style={[styles.swipeHint, { color: theme.textSecondary }]}
            >
              {"← swipe to vent  ·  swipe to task →"}
            </ThemedText>
          ) : null}

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
            onChangeText={handleTinyThingChange}
            onBlur={handleTinyThingBlur}
          />
          <RNAnimated.View style={{ opacity: tinyThingSavedOpacity }}>
            <ThemedText
              style={[styles.savedConfirmation, { color: theme.primary }]}
            >
              Saved
            </ThemedText>
          </RNAnimated.View>
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

      {/* ── TRIAGE MODAL (unchanged) ─────────────────────────────────────── */}
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

      {/* ── BITES REVIEW MODAL (new) ─────────────────────────────────────── */}
      <Modal
        visible={!!bitesReview}
        transparent
        animationType="slide"
        onRequestClose={() => setBitesReview(null)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.reviewCard,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            {/* Header */}
            <View style={styles.reviewHeader}>
              <ThemedText type="h3" style={styles.triageTitle}>
                Here&apos;s what we broke it into
              </ThemedText>
              <ThemedText
                numberOfLines={2}
                style={[
                  styles.reviewOriginalText,
                  { color: theme.textSecondary },
                ]}
              >
                {bitesReview?.thought.text}
              </ThemedText>
            </View>

            {/* Scrollable bite list */}
            <ScrollView
              style={styles.reviewBiteList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {reviewSteps.map((step, index) => (
                <View
                  key={step.id}
                  style={[
                    styles.reviewBiteItem,
                    { backgroundColor: theme.backgroundSecondary },
                  ]}
                >
                  {editingBiteId === step.id ? (
                    <View style={styles.reviewBiteEditRow}>
                      <TextInput
                        style={[
                          styles.reviewBiteEditInput,
                          {
                            color: theme.text,
                            borderBottomColor: theme.primary,
                          },
                        ]}
                        value={editingBiteText}
                        onChangeText={setEditingBiteText}
                        autoFocus
                        onSubmitEditing={handleReviewSaveEdit}
                        returnKeyType="done"
                      />
                      <Pressable onPress={handleReviewSaveEdit} hitSlop={8}>
                        <Feather name="check" size={18} color={theme.primary} />
                      </Pressable>
                    </View>
                  ) : (
                    <View style={styles.reviewBiteRow}>
                      <View style={styles.reviewBiteNumberBadge}>
                        <ThemedText
                          style={[
                            styles.reviewBiteNumber,
                            { color: theme.primary },
                          ]}
                        >
                          {index + 1}
                        </ThemedText>
                      </View>
                      <Pressable
                        style={styles.reviewBiteTextWrapper}
                        onPress={() => handleReviewStartEdit(step)}
                        accessibilityRole="button"
                        accessibilityLabel={`Edit bite: ${step.text}`}
                      >
                        <ThemedText
                          style={styles.reviewBiteText}
                          numberOfLines={2}
                        >
                          {step.text}
                        </ThemedText>
                        <ThemedText
                          style={[
                            styles.reviewBiteMinutes,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {step.minutes} min · tap to edit
                        </ThemedText>
                      </Pressable>
                      <Pressable
                        onPress={() => handleReviewRemoveBite(step.id)}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove bite: ${step.text}`}
                      >
                        <Feather
                          name="x"
                          size={16}
                          color={theme.textSecondary}
                        />
                      </Pressable>
                    </View>
                  )}
                </View>
              ))}

              {/* Add new bite inline */}
              <View
                style={[styles.reviewAddRow, { borderTopColor: theme.border }]}
              >
                <TextInput
                  style={[styles.reviewAddInput, { color: theme.text }]}
                  placeholder="+ Add a bite..."
                  placeholderTextColor={theme.textSecondary}
                  value={reviewNewBiteText}
                  onChangeText={setReviewNewBiteText}
                  onSubmitEditing={handleReviewAddBite}
                  returnKeyType="done"
                />
                {reviewNewBiteText.trim() ? (
                  <Pressable onPress={handleReviewAddBite} hitSlop={8}>
                    <Feather
                      name="plus-circle"
                      size={18}
                      color={theme.primary}
                    />
                  </Pressable>
                ) : null}
              </View>
            </ScrollView>

            {/* CTAs */}
            <View style={styles.reviewActions}>
              <Pressable
                onPress={handleConfirmBitesReview}
                disabled={reviewSteps.length === 0}
                accessibilityRole="button"
                style={[
                  styles.primaryTriageButton,
                  {
                    backgroundColor:
                      reviewSteps.length === 0
                        ? theme.backgroundSecondary
                        : theme.primary,
                  },
                ]}
              >
                <Feather
                  name="arrow-right"
                  size={18}
                  color={
                    reviewSteps.length === 0 ? theme.textSecondary : "#FFFFFF"
                  }
                />
                <ThemedText
                  style={[
                    styles.primaryTriageButtonText,
                    {
                      color:
                        reviewSteps.length === 0
                          ? theme.textSecondary
                          : "#FFFFFF",
                    },
                  ]}
                >
                  Save these bites
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => setBitesReview(null)}
                style={styles.dismissButton}
              >
                <ThemedText
                  style={{ color: theme.textSecondary, fontSize: 14 }}
                >
                  Start over
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── CREATED TASK CONFIRMATION (unchanged) ────────────────────────── */}
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
  roomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  roomIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  roomCopy: {
    flex: 1,
  },
  roomEyebrow: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  roomLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  changeModeButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: Spacing.sm,
  },
  changeModeText: {
    fontSize: 13,
    fontWeight: "700",
  },
  thoughtList: {
    marginBottom: Spacing.md,
  },
  swipeHint: {
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
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
  savedConfirmation: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: Spacing.xs,
    textAlign: "right",
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
  // ── Triage modal styles (unchanged) ──────────────────────────────────────
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
    minHeight: 48,
    borderRadius: BorderRadius.sm,
    borderWidth: 0,
    paddingHorizontal: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  primaryTriageButtonText: {
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
  // ── Bites review modal styles (new) ──────────────────────────────────────
  reviewCard: {
    width: "100%",
    maxWidth: 400,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    maxHeight: "85%",
    gap: Spacing.md,
  },
  reviewHeader: {
    gap: Spacing.xs,
  },
  reviewOriginalText: {
    fontSize: 13,
    fontStyle: "italic",
    lineHeight: 18,
    textAlign: "center",
  },
  reviewBiteList: {
    flexGrow: 0,
    maxHeight: 320,
  },
  reviewBiteItem: {
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  reviewBiteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  reviewBiteNumberBadge: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewBiteNumber: {
    fontSize: 13,
    fontWeight: "700",
  },
  reviewBiteTextWrapper: {
    flex: 1,
  },
  reviewBiteText: {
    fontSize: 14,
    lineHeight: 20,
  },
  reviewBiteMinutes: {
    fontSize: 11,
    marginTop: 1,
  },
  reviewBiteEditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  reviewBiteEditInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
  },
  reviewAddRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: Spacing.md,
    marginTop: Spacing.xs,
    gap: Spacing.sm,
  },
  reviewAddInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: Spacing.sm,
  },
  reviewActions: {
    gap: Spacing.sm,
  },
});
