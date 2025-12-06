import React, { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, TextInput, Pressable, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight, HeaderButton } from "@react-navigation/elements";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { EnergySelector } from "@/components/EnergySelector";
import { StepItem } from "@/components/StepItem";
import { TimerButton } from "@/components/TimerButton";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useAppStore } from "@/lib/store";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type { EnergyLevel, Step } from "@/lib/types";

type ViewMode = "edit" | "work";

export default function BreakItDownScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "BreakItDown">>();

  const { tasks, addTask, updateTask, toggleStepComplete, hapticsEnabled } = useAppStore();
  
  const existingTask = route.params?.taskId 
    ? tasks.find(t => t.id === route.params?.taskId)
    : undefined;

  const [viewMode, setViewMode] = useState<ViewMode>(existingTask ? "work" : "edit");
  const [title, setTitle] = useState(existingTask?.title || "");
  const [steps, setSteps] = useState<Step[]>(existingTask?.steps || []);
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>(existingTask?.energyLevel || "medium");
  const [newStepText, setNewStepText] = useState("");
  const [newStepMinutes, setNewStepMinutes] = useState(5);
  const [activeTimer, setActiveTimer] = useState<string | null>(null);

  const canSave = title.trim().length > 0;
  const totalMinutes = steps.reduce((acc, s) => acc + s.minutes, 0);
  const completedSteps = steps.filter(s => s.completed).length;
  const nextIncompleteStep = steps.find(s => !s.completed);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: viewMode === "edit" ? "Break It Down" : title || "Your Bites",
      headerLeft: () => (
        <HeaderButton onPress={() => navigation.goBack()}>
          <ThemedText style={{ color: theme.primary }}>
            {viewMode === "work" ? "Done" : "Cancel"}
          </ThemedText>
        </HeaderButton>
      ),
      headerRight: viewMode === "edit" ? () => (
        <HeaderButton 
          onPress={handleSave}
          disabled={!canSave}
        >
          <ThemedText style={{ color: canSave ? theme.primary : theme.textSecondary }}>
            {steps.length > 0 ? "Start" : "Save"}
          </ThemedText>
        </HeaderButton>
      ) : () => (
        <HeaderButton onPress={() => setViewMode("edit")}>
          <Feather name="edit-2" size={20} color={theme.primary} />
        </HeaderButton>
      ),
    });
  }, [navigation, theme, canSave, title, steps, energyLevel, viewMode]);

  const handleSave = useCallback(() => {
    if (!canSave) return;
    
    if (hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    if (existingTask) {
      updateTask(existingTask.id, {
        title: title.trim(),
        steps,
        energyLevel,
        lastWorkedOn: new Date().toISOString(),
      });
    } else {
      addTask({
        title: title.trim(),
        steps,
        energyLevel,
      });
    }
    
    if (steps.length > 0) {
      setViewMode("work");
    } else {
      navigation.goBack();
    }
  }, [canSave, existingTask, title, steps, energyLevel, addTask, updateTask, navigation, hapticsEnabled]);

  const handleAddStep = useCallback(() => {
    if (newStepText.trim()) {
      if (hapticsEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      const newStep: Step = {
        id: Date.now().toString(),
        text: newStepText.trim(),
        minutes: newStepMinutes,
        completed: false,
      };
      setSteps(prev => [...prev, newStep]);
      setNewStepText("");
      setNewStepMinutes(5);
    }
  }, [newStepText, newStepMinutes, hapticsEnabled]);

  const handleRemoveStep = useCallback((stepId: string) => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSteps(prev => prev.filter(s => s.id !== stepId));
  }, [hapticsEnabled]);

  const handleToggleStep = useCallback((stepId: string) => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (existingTask) {
      toggleStepComplete(existingTask.id, stepId);
    }
    setSteps(prev => prev.map(s => 
      s.id === stepId ? { ...s, completed: !s.completed } : s
    ));
    setActiveTimer(null);
  }, [existingTask, toggleStepComplete, hapticsEnabled]);

  if (viewMode === "work") {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <View style={[styles.workHeader, { paddingTop: headerHeight + Spacing.xl }]}>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: theme.backgroundDefault }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    backgroundColor: theme.primary,
                    width: steps.length > 0 ? `${(completedSteps / steps.length) * 100}%` : "0%",
                  }
                ]} 
              />
            </View>
            <ThemedText style={[styles.progressText, { color: theme.textSecondary }]}>
              {completedSteps} of {steps.length} bites complete
            </ThemedText>
          </View>
        </View>

        {nextIncompleteStep ? (
          <View style={styles.currentStepContainer}>
            <ThemedText style={[styles.currentStepLabel, { color: theme.textSecondary }]}>
              Current bite
            </ThemedText>
            <View style={[styles.currentStepCard, { backgroundColor: theme.backgroundDefault }]}>
              <ThemedText type="h3" style={styles.currentStepText}>
                {nextIncompleteStep.text}
              </ThemedText>
              <View style={styles.timerContainer}>
                <TimerButton 
                  minutes={nextIncompleteStep.minutes} 
                  stepText={nextIncompleteStep.text}
                  isActive={activeTimer === nextIncompleteStep.id}
                  onStart={() => setActiveTimer(nextIncompleteStep.id)}
                  onComplete={() => handleToggleStep(nextIncompleteStep.id)}
                />
              </View>
              <Pressable
                onPress={() => handleToggleStep(nextIncompleteStep.id)}
                style={[styles.markDoneButton, { borderColor: theme.primary }]}
              >
                <Feather name="check" size={20} color={theme.primary} />
                <ThemedText style={{ color: theme.primary }}>Mark done</ThemedText>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.allDoneContainer}>
            <Feather name="check-circle" size={64} color={theme.success} />
            <ThemedText type="h2" style={styles.allDoneTitle}>
              All bites complete
            </ThemedText>
            <ThemedText style={[styles.allDoneMessage, { color: theme.textSecondary }]}>
              You did it. That was enough.
            </ThemedText>
          </View>
        )}

        <View style={styles.upcomingContainer}>
          <ThemedText style={[styles.upcomingLabel, { color: theme.textSecondary }]}>
            {completedSteps > 0 ? "Remaining bites" : "All your bites"}
          </ThemedText>
          <FlatList
            data={steps}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <StepItem
                step={item}
                index={index}
                onToggle={() => handleToggleStep(item.id)}
                compact
              />
            )}
            contentContainerStyle={{ gap: Spacing.sm, paddingBottom: insets.bottom + Spacing.xl }}
            showsVerticalScrollIndicator={false}
          />
        </View>

        <View style={[styles.workFooter, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <ThemedText style={[styles.permissionText, { color: theme.textSecondary }]}>
            You can stop after this step. That still counts.
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <View style={styles.section}>
        <ThemedText type="h3" style={styles.sectionTitle}>
          What's freezing you?
        </ThemedText>
        <ThemedText style={[styles.sectionHint, { color: theme.textSecondary }]}>
          Name the task that feels impossible right now
        </ThemedText>
        <TextInput
          style={[
            styles.titleInput,
            {
              backgroundColor: theme.inputBackground,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
          placeholder="e.g., Clean my room"
          placeholderTextColor={theme.textSecondary}
          value={title}
          onChangeText={setTitle}
          autoFocus={!existingTask}
        />
        {!title.trim() ? (
          <View style={styles.examplesContainer}>
            <ThemedText style={[styles.examplesLabel, { color: theme.textSecondary }]}>
              Or try one of these:
            </ThemedText>
            <View style={styles.exampleChips}>
              {["Reply to emails", "Do laundry", "Start that project", "Make a phone call"].map((example) => (
                <Pressable
                  key={example}
                  onPress={() => {
                    if (hapticsEnabled) {
                      Haptics.selectionAsync();
                    }
                    setTitle(example);
                  }}
                  style={[styles.exampleChip, { backgroundColor: theme.backgroundDefault }]}
                >
                  <ThemedText style={[styles.exampleChipText, { color: theme.text }]}>
                    {example}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <View style={styles.section}>
        <ThemedText type="h3" style={styles.sectionTitle}>
          Break it into bites
        </ThemedText>
        <ThemedText style={[styles.sectionHint, { color: theme.textSecondary }]}>
          Each step should take 2-10 minutes
        </ThemedText>
        
        <View style={styles.addStepCard}>
          <TextInput
            style={[
              styles.stepInput,
              {
                backgroundColor: theme.inputBackground,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            placeholder="What's the tiniest first step?"
            placeholderTextColor={theme.textSecondary}
            value={newStepText}
            onChangeText={setNewStepText}
            onSubmitEditing={handleAddStep}
            returnKeyType="done"
          />
          
          <View style={styles.stepControls}>
            <View style={styles.timePresets}>
              {[2, 5, 10].map((mins) => (
                <Pressable
                  key={mins}
                  onPress={() => {
                    if (hapticsEnabled) {
                      Haptics.selectionAsync();
                    }
                    setNewStepMinutes(mins);
                  }}
                  style={[
                    styles.timePresetChip,
                    {
                      backgroundColor: newStepMinutes === mins ? theme.primary : theme.backgroundDefault,
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.timePresetText,
                      { color: newStepMinutes === mins ? "#FFFFFF" : theme.text },
                    ]}
                  >
                    {mins} min
                  </ThemedText>
                </Pressable>
              ))}
            </View>
            
            <Pressable
              onPress={handleAddStep}
              style={[
                styles.addButton, 
                { backgroundColor: newStepText.trim() ? theme.primary : theme.backgroundDefault }
              ]}
            >
              <Feather name="plus" size={20} color={newStepText.trim() ? "#FFFFFF" : theme.textSecondary} />
              <ThemedText style={{ color: newStepText.trim() ? "#FFFFFF" : theme.textSecondary }}>
                Add
              </ThemedText>
            </Pressable>
          </View>

          {steps.length === 0 ? (
            <View style={styles.biteExamplesContainer}>
              <ThemedText style={[styles.biteExamplesLabel, { color: theme.textSecondary }]}>
                Example bites for inspiration:
              </ThemedText>
              <View style={styles.biteExamples}>
                {[
                  { text: "Open the app or document", mins: 2 },
                  { text: "Set a 5-minute timer", mins: 5 },
                  { text: "Put away just 5 items", mins: 5 },
                  { text: "Write just the first sentence", mins: 2 },
                ].map((bite, index) => (
                  <Pressable
                    key={index}
                    onPress={() => {
                      if (hapticsEnabled) {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      const newStep: Step = {
                        id: Date.now().toString() + index,
                        text: bite.text,
                        minutes: bite.mins,
                        completed: false,
                      };
                      setSteps(prev => [...prev, newStep]);
                    }}
                    style={[styles.biteExample, { backgroundColor: theme.backgroundDefault }]}
                  >
                    <View style={styles.biteExampleContent}>
                      <ThemedText style={styles.biteExampleText}>{bite.text}</ThemedText>
                      <ThemedText style={[styles.biteExampleTime, { color: theme.textSecondary }]}>
                        {bite.mins} min
                      </ThemedText>
                    </View>
                    <Feather name="plus-circle" size={18} color={theme.primary} />
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
        </View>

        {steps.length > 0 ? (
          <View style={styles.stepsSection}>
            <View style={styles.stepsHeader}>
              <ThemedText style={styles.stepsTitle}>Your bites ({steps.length})</ThemedText>
              <ThemedText style={[styles.stepsTime, { color: theme.textSecondary }]}>
                ~{totalMinutes} min total
              </ThemedText>
            </View>
            <View style={styles.stepsList}>
              {steps.map((step, index) => (
                <StepItem
                  key={step.id}
                  step={step}
                  index={index}
                  onToggle={() => handleToggleStep(step.id)}
                  onRemove={() => handleRemoveStep(step.id)}
                />
              ))}
            </View>
          </View>
        ) : null}
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <View style={styles.section}>
        <ThemedText type="h3" style={styles.sectionTitle}>
          Energy needed
        </ThemedText>
        <ThemedText style={[styles.sectionHint, { color: theme.textSecondary }]}>
          Match this task to your capacity
        </ThemedText>
        <View style={styles.energyContainer}>
          <EnergySelector
            selected={energyLevel}
            onSelect={(level) => {
              if (hapticsEnabled) {
                Haptics.selectionAsync();
              }
              setEnergyLevel(level);
            }}
          />
        </View>
      </View>

      <View style={styles.permissionContainer}>
        <ThemedText style={[styles.permissionText, { color: theme.textSecondary }]}>
          You can stop after the first step. That still counts.
        </ThemedText>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  sectionHint: {
    fontSize: 14,
    fontStyle: "italic",
    marginBottom: Spacing.lg,
  },
  titleInput: {
    height: 56,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    fontSize: 18,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.lg,
  },
  addStepCard: {
    gap: Spacing.md,
  },
  stepInput: {
    height: 56,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    fontSize: 16,
    letterSpacing: 0.5,
  },
  stepControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  examplesContainer: {
    marginTop: Spacing.md,
  },
  examplesLabel: {
    fontSize: 13,
    marginBottom: Spacing.sm,
  },
  exampleChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  exampleChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  exampleChipText: {
    fontSize: 13,
  },
  timePresets: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  timePresetChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    minWidth: 56,
    alignItems: "center",
  },
  timePresetText: {
    fontSize: 14,
    fontWeight: "500",
  },
  biteExamplesContainer: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
  },
  biteExamplesLabel: {
    fontSize: 13,
    marginBottom: Spacing.md,
  },
  biteExamples: {
    gap: Spacing.sm,
  },
  biteExample: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  biteExampleContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  biteExampleText: {
    fontSize: 14,
  },
  biteExampleTime: {
    fontSize: 12,
    marginTop: 2,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderRadius: BorderRadius.sm,
  },
  stepsSection: {
    marginTop: Spacing.xl,
  },
  stepsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  stepsTitle: {
    fontWeight: "600",
  },
  stepsTime: {
    fontSize: 14,
  },
  stepsList: {
    gap: Spacing.sm,
  },
  energyContainer: {
    marginTop: Spacing.sm,
  },
  permissionContainer: {
    marginTop: Spacing.lg,
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  permissionText: {
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 22,
  },
  workHeader: {
    paddingHorizontal: Spacing.lg,
  },
  progressContainer: {
    marginBottom: Spacing.lg,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    textAlign: "center",
  },
  currentStepContainer: {
    paddingHorizontal: Spacing.lg,
    flex: 1,
  },
  currentStepLabel: {
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  currentStepCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  currentStepText: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  timerContainer: {
    marginBottom: Spacing.lg,
  },
  markDoneButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  allDoneContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
  },
  allDoneTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  allDoneMessage: {
    fontStyle: "italic",
    textAlign: "center",
  },
  upcomingContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  upcomingLabel: {
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  workFooter: {
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
  },
});
