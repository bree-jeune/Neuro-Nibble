import React, { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, TextInput, Pressable, FlatList, Modal, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight, HeaderButton } from "@react-navigation/elements";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { triggerHaptic } from "@/lib/haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { EnergySelector } from "@/components/EnergySelector";
import { StepItem } from "@/components/StepItem";
import { VisualTimer } from "@/components/VisualTimer";
import { AudioToggleButton } from "@/components/AudioToggleButton";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { DynamicFooter } from "@/components/DynamicFooter";
import { useAppStore } from "@/lib/store";
import { useSnackbarStore } from "@/lib/snackbarStore";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type { EnergyLevel, Step } from "@/lib/types";

type ViewMode = "minimal" | "edit" | "work";

type CategoryKey = "work" | "home" | "health" | "money" | "people" | "creative" | "other";

interface CategoryConfig {
  key: CategoryKey;
  label: string;
  icon: keyof typeof Feather.glyphMap;
}

const CATEGORIES: CategoryConfig[] = [
  { key: "work", label: "Work", icon: "briefcase" },
  { key: "home", label: "Home", icon: "home" },
  { key: "health", label: "Health", icon: "heart" },
  { key: "money", label: "Money", icon: "dollar-sign" },
  { key: "people", label: "People", icon: "users" },
  { key: "creative", label: "Creative", icon: "edit-3" },
  { key: "other", label: "Other", icon: "more-horizontal" },
];

const SUGGESTIONS_BY_CATEGORY: Record<Exclude<CategoryKey, "other">, string[]> = {
  work: [
    "Reply to an email",
    "Prepare for a meeting",
    "Finish a report",
    "Make a phone call",
    "Deal with my inbox",
  ],
  home: [
    "Clean a space",
    "Do laundry",
    "Cook something",
    "Run errands",
    "Deal with dishes",
  ],
  health: [
    "Schedule an appointment",
    "Take medication",
    "Go for a walk",
    "Drink water",
    "Rest properly",
  ],
  money: [
    "Pay a bill",
    "Check my bank",
    "Deal with paperwork",
    "Make a budget",
    "Handle an invoice",
  ],
  people: [
    "Reply to a message",
    "Make a call I've been avoiding",
    "Send a thank you",
    "Apologize to someone",
    "Check in on someone",
  ],
  creative: [
    "Work on my project",
    "Write something",
    "Make something",
    "Practice a skill",
    "Capture an idea",
  ],
};

const generateBitesForEnergy = (taskTitle: string, energy: EnergyLevel): Step[] => {
  // Energy → max minutes per bite + count range
  const profile =
    energy === "low"
      ? { maxMin: 2, count: 2 }
      : energy === "medium"
        ? { maxMin: 5, count: 3 }
        : { maxMin: 10, count: 4 };

  const lower = taskTitle.toLowerCase();

  let templated: { text: string; minutes: number }[] | null = null;
  if (/email|inbox|message/.test(lower)) {
    templated = [
      { text: "Open the inbox", minutes: 2 },
      { text: "Read and pick one to reply to", minutes: profile.maxMin },
      { text: "Send the reply", minutes: profile.maxMin },
      { text: "Close it for now", minutes: 2 },
    ];
  } else if (/laundry|wash/.test(lower)) {
    templated = [
      { text: "Gather what needs washing", minutes: 2 },
      { text: "Load the machine", minutes: profile.maxMin },
      { text: "Set a reminder for later", minutes: 2 },
      { text: "Move to dryer when ready", minutes: profile.maxMin },
    ];
  } else if (/clean|tidy|dishes|space|room/.test(lower)) {
    templated = [
      { text: "Pick up 5 items", minutes: 2 },
      { text: "Clear one surface", minutes: profile.maxMin },
      { text: "Put 3 things back where they belong", minutes: profile.maxMin },
      { text: "Step back and notice", minutes: 2 },
    ];
  } else if (/call|phone/.test(lower)) {
    templated = [
      { text: "Write down what you need to say", minutes: 2 },
      { text: "Find the number", minutes: 2 },
      { text: "Make the call", minutes: profile.maxMin },
    ];
  } else if (/bill|pay|invoice|bank|money|budget/.test(lower)) {
    templated = [
      { text: "Find the document or login", minutes: 2 },
      { text: "Open and check the amount", minutes: profile.maxMin },
      { text: "Submit the payment or note", minutes: profile.maxMin },
    ];
  } else if (/walk|exercise|stretch/.test(lower)) {
    templated = [
      { text: "Put on your shoes", minutes: 2 },
      { text: "Step outside", minutes: 2 },
      { text: "Walk for a few minutes", minutes: profile.maxMin },
    ];
  } else if (/write|draft|report|note|idea/.test(lower)) {
    templated = [
      { text: "Open the document", minutes: 2 },
      { text: "Write the first sentence", minutes: profile.maxMin },
      { text: "Add one more sentence", minutes: profile.maxMin },
      { text: "Save and step away", minutes: 2 },
    ];
  } else if (/appointment|schedule|book/.test(lower)) {
    templated = [
      { text: "Find the contact info", minutes: 2 },
      { text: "Check your calendar", minutes: 2 },
      { text: "Book the slot", minutes: profile.maxMin },
    ];
  }

  const generic = [
    { text: `Open or find ${taskTitle.toLowerCase()}`, minutes: 2 },
    { text: "Do the first small part", minutes: profile.maxMin },
    { text: "Check what's needed next", minutes: 2 },
    { text: "Close out for now", minutes: 2 },
  ];

  const source = templated ?? generic;
  const sliced = source
    .slice(0, profile.count)
    .map((s) => ({ ...s, minutes: Math.min(s.minutes, profile.maxMin) }));

  return sliced.map((s, i) => ({
    id: `${Date.now()}_${i}`,
    text: s.text,
    minutes: s.minutes,
    completed: false,
  }));
};

const getTemplateSteps = (taskTitle: string): Step[] => {
  const templates: Record<string, { text: string; minutes: number }[]> = {
    "Reply to emails": [
      { text: "Open inbox", minutes: 2 },
      { text: "Read and sort by priority", minutes: 5 },
      { text: "Reply to one email", minutes: 5 },
    ],
    "Clean my room": [
      { text: "Pick up 5 items from the floor", minutes: 2 },
      { text: "Make the bed", minutes: 5 },
      { text: "Clear one surface", minutes: 5 },
    ],
    "Do laundry": [
      { text: "Gather dirty clothes", minutes: 5 },
      { text: "Load the washer", minutes: 5 },
      { text: "Set a reminder for when it's done", minutes: 2 },
    ],
    "Make a phone call": [
      { text: "Write down what you need to say", minutes: 2 },
      { text: "Find the number", minutes: 2 },
      { text: "Make the call", minutes: 5 },
    ],
    "Schedule appointment": [
      { text: "Look up the phone number or website", minutes: 2 },
      { text: "Check your calendar for availability", minutes: 2 },
      { text: "Book the appointment", minutes: 5 },
    ],
    "Pay bills": [
      { text: "Gather bills that need paying", minutes: 2 },
      { text: "Log into your bank", minutes: 2 },
      { text: "Pay one bill", minutes: 5 },
    ],
    "Grocery shopping": [
      { text: "Check what you're out of", minutes: 5 },
      { text: "Write a short list", minutes: 5 },
      { text: "Get your bags ready", minutes: 2 },
    ],
    "Start that project": [
      { text: "Open the file or document", minutes: 2 },
      { text: "Write just one sentence or line", minutes: 5 },
      { text: "Save and celebrate", minutes: 2 },
    ],
  };
  
  const stepsData = templates[taskTitle] || [];
  return stepsData.map((s, i) => ({
    id: (Date.now() + i).toString(),
    text: s.text,
    minutes: s.minutes,
    completed: false,
  }));
};

export default function BreakItDownScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "BreakItDown">>();

  const { tasks, addTask, updateTask, toggleStepComplete, restoreStep, archiveTask } = useAppStore();
  const showSnackbar = useSnackbarStore((s) => s.show);
  
  const initialTaskId = route.params?.taskId ?? null;
  const initialTask = initialTaskId
    ? tasks.find(t => t.id === initialTaskId)
    : undefined;

  const [activeTaskId, setActiveTaskId] = useState<string | null>(initialTaskId);
  const existingTask = activeTaskId
    ? tasks.find(t => t.id === activeTaskId)
    : undefined;

  const [viewMode, setViewMode] = useState<ViewMode>(initialTask ? "work" : "minimal");
  const [title, setTitle] = useState(initialTask?.title || "");
  const [steps, setSteps] = useState<Step[]>(initialTask?.steps || []);
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>(initialTask?.energyLevel || "medium");
  const [firstStepText, setFirstStepText] = useState("");
  const [newStepText, setNewStepText] = useState("");
  const [newStepMinutes, setNewStepMinutes] = useState(5);
  const [activeTimer, setActiveTimer] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [pendingArchivePrompt, setPendingArchivePrompt] = useState(false);
  const [showBiteInspiration, setShowBiteInspiration] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [wizardCategory, setWizardCategory] = useState<CategoryKey | null>(null);
  const [wizardTaskText, setWizardTaskText] = useState("");
  const [useMinimalFallback, setUseMinimalFallback] = useState(false);

  const quickChips = [
    "Email",
    "Laundry", 
    "Dishes",
    "Shower",
    "Cleaning",
    "Errands",
    "Cooking",
    "Work task",
  ];

  const canSave = title.trim().length > 0;
  const canStartMinimal = title.trim().length > 0 && firstStepText.trim().length > 0;
  const totalMinutes = steps.reduce((acc, s) => acc + s.minutes, 0);
  const completedSteps = steps.filter(s => s.completed).length;
  const nextIncompleteStep = steps.find(s => !s.completed);

  useEffect(() => {
    const headerTitle = viewMode === "minimal" 
      ? "Break It Down" 
      : viewMode === "edit" 
        ? "Edit Bites" 
        : title || "Your Bites";
    
    navigation.setOptions({
      headerTitle,
      headerLeft: () => (
        <HeaderButton onPress={() => navigation.goBack()}>
          <ThemedText style={{ color: theme.primary }}>
            {viewMode === "work" ? "Done" : "Cancel"}
          </ThemedText>
        </HeaderButton>
      ),
      headerRight: viewMode === "edit" ? () => (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <AudioToggleButton />
          <HeaderButton 
            onPress={handleSave}
            disabled={!canSave}
          >
            <ThemedText style={{ color: canSave ? theme.primary : theme.textSecondary }}>
              Save
            </ThemedText>
          </HeaderButton>
        </View>
      ) : viewMode === "work" ? () => (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <AudioToggleButton />
          <HeaderButton onPress={() => setViewMode("edit")}>
            <Feather name="edit-2" size={20} color={theme.primary} />
          </HeaderButton>
        </View>
      ) : () => (
        <AudioToggleButton />
      ),
    });
  }, [navigation, theme, canSave, title, steps, energyLevel, viewMode]);

  const handleStartMinimal = useCallback(() => {
    if (!canStartMinimal) return;
    
    triggerHaptic("success");

    const newStep: Step = {
      id: Date.now().toString(),
      text: firstStepText.trim(),
      minutes: 5,
      completed: false,
    };

    const newSteps = [newStep];
    setSteps(newSteps);

    const newTaskId = `task_${Date.now()}`;
    addTask({
      id: newTaskId,
      title: title.trim(),
      steps: newSteps,
      energyLevel: "medium",
    });
    setActiveTaskId(newTaskId);

    setViewMode("work");
  }, [canStartMinimal, title, firstStepText, addTask]);

  const handleWizardCategorySelect = useCallback((key: CategoryKey) => {
    triggerHaptic("selection");
    setWizardCategory(key);
    setTimeout(() => {
      setWizardStep(2);
    }, 300);
  }, []);

  const handleWizardTaskNext = useCallback(() => {
    if (wizardTaskText.trim().length < 2) return;
    triggerHaptic("light");
    setTitle(wizardTaskText.trim());
    setWizardStep(3);
  }, [wizardTaskText]);

  const handleWizardEnergySelect = useCallback((level: EnergyLevel) => {
    const taskTitle = wizardTaskText.trim();
    if (!taskTitle) return;
    triggerHaptic("success");

    const newSteps = generateBitesForEnergy(taskTitle, level);
    setSteps(newSteps);
    setEnergyLevel(level);
    setTitle(taskTitle);

    const newTaskId = `task_${Date.now()}`;
    addTask({
      id: newTaskId,
      title: taskTitle,
      steps: newSteps,
      energyLevel: level,
    });
    setActiveTaskId(newTaskId);

    setViewMode("work");
  }, [wizardTaskText, addTask]);

  const handleSave = useCallback(() => {
    if (!canSave) return;
    
    triggerHaptic("success");
    
    if (existingTask) {
      updateTask(existingTask.id, {
        title: title.trim(),
        steps,
        energyLevel,
        lastWorkedOn: new Date().toISOString(),
      });
    } else {
      const newTaskId = `task_${Date.now()}`;
      addTask({
        id: newTaskId,
        title: title.trim(),
        steps,
        energyLevel,
      });
      setActiveTaskId(newTaskId);
    }

    setViewMode("work");
  }, [canSave, existingTask, title, steps, energyLevel, addTask, updateTask]);

  const handleAddStep = useCallback(() => {
    if (newStepText.trim()) {
      triggerHaptic("light");
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
  }, [newStepText, newStepMinutes]);

  const handleRemoveStep = useCallback((stepId: string) => {
    triggerHaptic("light");
    const removedStep = steps.find(s => s.id === stepId);
    const removedIndex = steps.findIndex(s => s.id === stepId);
    
    if (!removedStep) return;
    
    const stepSnapshot: Step = { ...removedStep };
    const indexSnapshot = removedIndex;
    
    setSteps(prev => prev.filter(s => s.id !== stepId));
    
    showSnackbar("Bite removed", () => {
      setSteps(prev => {
        const newSteps = [...prev];
        newSteps.splice(indexSnapshot, 0, stepSnapshot);
        return newSteps;
      });
    });
  }, [steps, showSnackbar]);

  const handleEditStep = useCallback((stepId: string, text: string, minutes: number) => {
    triggerHaptic("light");
    setSteps(prev => prev.map(s => 
      s.id === stepId ? { ...s, text, minutes } : s
    ));
  }, []);

  const handleMoveStep = useCallback((stepId: string, direction: "up" | "down") => {
    triggerHaptic("light");
    setSteps(prev => {
      const index = prev.findIndex(s => s.id === stepId);
      if (index === -1) return prev;
      if (direction === "up" && index === 0) return prev;
      if (direction === "down" && index === prev.length - 1) return prev;
      
      const newSteps = [...prev];
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      [newSteps[index], newSteps[swapIndex]] = [newSteps[swapIndex], newSteps[index]];
      return newSteps;
    });
  }, []);

  const activeDays = useAppStore((s) => s.activeDays);

  const handleToggleStep = useCallback((stepId: string, skipCelebration = false) => {
    triggerHaptic("success");
    const step = steps.find(s => s.id === stepId);
    if (!step) return;
    
    const wasCompleted = step.completed;
    const stepSnapshot: Step = JSON.parse(JSON.stringify(step));
    const today = new Date().toISOString().split("T")[0];
    
    if (existingTask) {
      toggleStepComplete(existingTask.id, stepId);
    }
    
    const newSteps = steps.map(s => 
      s.id === stepId ? { 
        ...s, 
        completed: !s.completed,
        completedAt: !s.completed ? new Date().toISOString() : undefined,
      } : s
    );
    setSteps(newSteps);
    setActiveTimer(null);
    
    const isCompletingStep = !wasCompleted;
    const allNowComplete = isCompletingStep && newSteps.every(s => s.completed);
    
    if (allNowComplete && existingTask && !existingTask.isArchived) {
      setPendingArchivePrompt(true);
      setShowCelebration(true);
      return;
    }

    if (!wasCompleted && !skipCelebration) {
      setShowCelebration(true);
    }
  }, [existingTask, toggleStepComplete, steps]);

  const handleCelebrationChoice = useCallback((keepGoing: boolean) => {
    setShowCelebration(false);
    if (pendingArchivePrompt) {
      setPendingArchivePrompt(false);
      setShowCompletionModal(true);
      return;
    }
    if (!keepGoing) {
      navigation.goBack();
    }
  }, [navigation, pendingArchivePrompt]);

  if (viewMode === "work") {
    const incompleteSteps = steps.filter(s => !s.completed);
    
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <View style={[styles.workHeader, { paddingTop: headerHeight + Spacing.md }]}>
          <View style={[styles.permissionBanner, { backgroundColor: theme.primary + "15" }]}>
            <Feather name="heart" size={16} color={theme.primary} />
            <ThemedText style={[styles.permissionBannerText, { color: theme.primary }]}>
              You can stop after any bite. Progress is valid.
            </ThemedText>
          </View>
          
          {completedSteps > 0 ? (
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: theme.backgroundDefault }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      backgroundColor: theme.primary,
                      width: `${(completedSteps / steps.length) * 100}%`,
                    }
                  ]} 
                />
              </View>
              <ThemedText style={[styles.progressText, { color: theme.textSecondary }]}>
                {completedSteps} {completedSteps === 1 ? "bite" : "bites"} done today
              </ThemedText>
            </View>
          ) : null}
        </View>

        {nextIncompleteStep ? (
          <View style={styles.currentStepContainer}>
            <ThemedText style={[styles.currentStepLabel, { color: theme.textSecondary }]}>
              Current bite ({completedSteps + 1} of {steps.length})
            </ThemedText>
            <View style={[styles.currentStepCard, { backgroundColor: theme.backgroundDefault }]}>
              <View style={styles.visualTimerContainer}>
                <VisualTimer 
                  minutes={nextIncompleteStep.minutes} 
                  stepText={nextIncompleteStep.text}
                  isActive={activeTimer === nextIncompleteStep.id}
                  onStart={() => setActiveTimer(nextIncompleteStep.id)}
                  onComplete={() => handleToggleStep(nextIncompleteStep.id)}
                />
              </View>
              <Pressable
                onPress={() => handleToggleStep(nextIncompleteStep.id)}
                style={[styles.markDoneButton, { backgroundColor: theme.primary }]}
              >
                <Feather name="check" size={20} color="#FFFFFF" />
                <ThemedText style={{ color: "#FFFFFF", fontWeight: "600" }}>
                  Mark Done (skip timer)
                </ThemedText>
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
            {existingTask && !existingTask.isArchived ? (
              <Pressable
                onPress={() => setShowCompletionModal(true)}
                style={[styles.archivePromptButton, { backgroundColor: theme.primary }]}
              >
                <Feather name="archive" size={18} color="#FFFFFF" />
                <ThemedText style={{ color: "#FFFFFF", fontWeight: "600" }}>
                  Archive This Task
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
        )}

        {incompleteSteps.length > 1 && nextIncompleteStep ? (
          <View style={styles.upcomingContainer}>
            <Pressable 
              onPress={() => setShowMoreOptions(!showMoreOptions)}
              style={styles.upcomingHeader}
            >
              <ThemedText style={[styles.upcomingLabel, { color: theme.textSecondary }]}>
                {incompleteSteps.length - 1} more {incompleteSteps.length - 1 === 1 ? "bite" : "bites"} after this
              </ThemedText>
              <Feather 
                name={showMoreOptions ? "chevron-up" : "chevron-down"} 
                size={18} 
                color={theme.textSecondary} 
              />
            </Pressable>
            {showMoreOptions ? (
              <FlatList
                data={incompleteSteps.slice(1)}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                  <StepItem
                    step={item}
                    index={index + 1}
                    onToggle={() => handleToggleStep(item.id, true)}
                    compact
                  />
                )}
                contentContainerStyle={{ gap: Spacing.sm, paddingTop: Spacing.sm }}
                showsVerticalScrollIndicator={false}
              />
            ) : null}
          </View>
        ) : null}
        
        {completedSteps > 0 && completedSteps < steps.length ? (
          <View style={[styles.stopOption, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <Pressable 
              onPress={() => navigation.goBack()}
              style={[styles.stopButton, { borderColor: theme.border }]}
            >
              <ThemedText style={{ color: theme.textSecondary }}>
                Stop here for now
              </ThemedText>
            </Pressable>
            <ThemedText style={[styles.stopHint, { color: theme.textSecondary }]}>
              This still counts as progress
            </ThemedText>
          </View>
        ) : null}

        <Modal
          visible={showCompletionModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCompletionModal(false)}
        >
          <View style={styles.celebrationOverlay}>
            <View style={[styles.celebrationCard, { backgroundColor: theme.backgroundDefault }]}>
              <View style={[styles.celebrationIcon, { backgroundColor: theme.success + "20" }]}>
                <Feather name="archive" size={32} color={theme.success} />
              </View>
              <ThemedText type="h2" style={styles.celebrationTitle}>
                Task Complete
              </ThemedText>
              <ThemedText style={[styles.celebrationSubtitle, { color: theme.textSecondary }]}>
                Would you like to archive this task? It will be hidden from your active list.
              </ThemedText>
              <View style={styles.celebrationActions}>
                <Pressable 
                  onPress={() => {
                    if (existingTask) {
                      triggerHaptic("success");
                      archiveTask(existingTask.id);
                      setShowCompletionModal(false);
                      navigation.goBack();
                    }
                  }}
                  style={[styles.keepGoingButton, { backgroundColor: theme.primary }]}
                >
                  <ThemedText style={{ color: "#FFFFFF", fontWeight: "600" }}>
                    Yes, Archive It
                  </ThemedText>
                </Pressable>
                <Pressable 
                  onPress={() => setShowCompletionModal(false)}
                  style={[styles.stopHereButton, { borderColor: theme.border }]}
                >
                  <ThemedText style={{ color: theme.text }}>
                    Keep It Active
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showCelebration}
          transparent
          animationType="fade"
          onRequestClose={() => handleCelebrationChoice(true)}
        >
          <View style={styles.celebrationOverlay}>
            <View style={[styles.celebrationCard, { backgroundColor: theme.backgroundDefault }]}>
              <View style={[styles.celebrationIcon, { backgroundColor: theme.success + "20" }]}>
                <Feather name="star" size={32} color={theme.success} />
              </View>
              <ThemedText type="h2" style={styles.celebrationTitle}>
                You did a thing!
              </ThemedText>
              <ThemedText style={[styles.celebrationSubtitle, { color: theme.textSecondary }]}>
                That counts. You're allowed to stop now.
              </ThemedText>
              <View style={styles.celebrationActions}>
                <Pressable 
                  onPress={() => handleCelebrationChoice(true)}
                  style={[styles.keepGoingButton, { backgroundColor: theme.primary }]}
                >
                  <ThemedText style={{ color: "#FFFFFF", fontWeight: "600" }}>
                    Keep Going
                  </ThemedText>
                </Pressable>
                <Pressable 
                  onPress={() => handleCelebrationChoice(false)}
                  style={[styles.stopHereButton, { borderColor: theme.border }]}
                >
                  <ThemedText style={{ color: theme.text }}>
                    Bank this Win
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  if (viewMode === "minimal" && useMinimalFallback) {
    return (
      <KeyboardAwareScrollViewCompat
        style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
          flexGrow: 1,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <View style={styles.minimalContent}>
          <View style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              What's freezing you?
            </ThemedText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickChipsContainer}
              style={styles.quickChipsScroll}
            >
              {quickChips.map((chip) => (
                <Pressable
                  key={chip}
                  onPress={() => {
                    triggerHaptic("selection");
                    setTitle(chip);
                  }}
                  style={[
                    styles.quickChip,
                    {
                      backgroundColor: title === chip ? theme.primary : theme.backgroundDefault,
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.quickChipText,
                      { color: title === chip ? "#FFFFFF" : theme.text },
                    ]}
                  >
                    {chip}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>
            <TextInput
              style={[
                styles.titleInput,
                {
                  backgroundColor: theme.inputBackground,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="e.g., grocery shopping"
              placeholderTextColor={theme.textSecondary}
              value={title}
              onChangeText={setTitle}
              autoFocus
            />
          </View>

          <View style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              What's the tiniest first bite?
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
              placeholder="e.g., make a list"
              placeholderTextColor={theme.textSecondary}
              value={firstStepText}
              onChangeText={setFirstStepText}
            />
          </View>

          <View style={styles.minimalFooter}>
            <Pressable
              onPress={handleStartMinimal}
              disabled={!canStartMinimal}
              style={[
                styles.startButton,
                {
                  backgroundColor: canStartMinimal ? theme.primary : theme.backgroundDefault,
                },
              ]}
            >
              <ThemedText
                style={{
                  color: canStartMinimal ? "#FFFFFF" : theme.textSecondary,
                  fontWeight: "600",
                  fontSize: 16,
                }}
              >
                Start This Bite
              </ThemedText>
            </Pressable>

            <ThemedText style={[styles.minimalHint, { color: theme.textSecondary }]}>
              You can add more bites after. Just start with one.
            </ThemedText>

            <Pressable
              onPress={() => setViewMode("edit")}
              style={styles.advancedLink}
            >
              <ThemedText style={{ color: theme.primary, fontSize: 14 }}>
                I want to plan more bites first
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={() => {
                triggerHaptic("selection");
                setUseMinimalFallback(false);
                setWizardStep(1);
              }}
              style={styles.advancedLink}
            >
              <ThemedText style={{ color: theme.textSecondary, fontSize: 13 }}>
                Back to guided flow
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </KeyboardAwareScrollViewCompat>
    );
  }

  if (viewMode === "minimal") {
    const suggestions =
      wizardCategory && wizardCategory !== "other"
        ? SUGGESTIONS_BY_CATEGORY[wizardCategory]
        : [];
    const canAdvanceFromTask = wizardTaskText.trim().length >= 2;

    return (
      <KeyboardAwareScrollViewCompat
        style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
          flexGrow: 1,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <View style={styles.wizardProgress}>
          {[1, 2, 3].map((n) => (
            <View
              key={n}
              style={[
                styles.wizardDot,
                {
                  backgroundColor:
                    n === wizardStep ? theme.primary : theme.backgroundSecondary,
                  width: n === wizardStep ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        {wizardStep === 1 ? (
          <View style={styles.wizardSection}>
            <ThemedText type="h2" style={styles.wizardQuestion}>
              What area of life is this about?
            </ThemedText>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const selected = wizardCategory === cat.key;
                return (
                  <Pressable
                    key={cat.key}
                    onPress={() => handleWizardCategorySelect(cat.key)}
                    style={[
                      styles.categoryCard,
                      {
                        backgroundColor: selected ? theme.primary : theme.backgroundDefault,
                        borderColor: selected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Feather
                      name={cat.icon}
                      size={28}
                      color={selected ? "#FFFFFF" : theme.primary}
                    />
                    <ThemedText
                      style={[
                        styles.categoryLabel,
                        { color: selected ? "#FFFFFF" : theme.text },
                      ]}
                    >
                      {cat.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {wizardStep === 2 ? (
          <View style={styles.wizardSection}>
            <ThemedText type="h2" style={styles.wizardQuestion}>
              What specifically is frozen?
            </ThemedText>

            {suggestions.length > 0 ? (
              <View style={styles.suggestionList}>
                {suggestions.map((suggestion) => {
                  const selected = wizardTaskText === suggestion;
                  return (
                    <Pressable
                      key={suggestion}
                      onPress={() => {
                        triggerHaptic("selection");
                        setWizardTaskText(suggestion);
                      }}
                      style={[
                        styles.suggestionChip,
                        {
                          backgroundColor: selected
                            ? theme.primary
                            : theme.backgroundDefault,
                          borderColor: selected ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <ThemedText
                        style={{
                          color: selected ? "#FFFFFF" : theme.text,
                          fontSize: 15,
                          fontWeight: selected ? "600" : "400",
                        }}
                      >
                        {suggestion}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            <TextInput
              style={[
                styles.titleInput,
                {
                  backgroundColor: theme.inputBackground,
                  color: theme.text,
                  borderColor: theme.border,
                  marginTop: suggestions.length > 0 ? Spacing.md : 0,
                },
              ]}
              placeholder={
                wizardCategory === "other"
                  ? "Describe what's frozen..."
                  : "Or describe it yourself..."
              }
              placeholderTextColor={theme.textSecondary}
              value={wizardTaskText}
              onChangeText={setWizardTaskText}
              autoFocus={wizardCategory === "other"}
            />

            {canAdvanceFromTask ? (
              <Pressable
                onPress={handleWizardTaskNext}
                style={[styles.wizardNextButton, { backgroundColor: theme.primary }]}
              >
                <ThemedText
                  style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 16 }}
                >
                  Next →
                </ThemedText>
              </Pressable>
            ) : null}

            <Pressable
              onPress={() => {
                triggerHaptic("selection");
                setUseMinimalFallback(true);
                if (wizardTaskText.trim()) setTitle(wizardTaskText.trim());
              }}
              style={styles.escapeHatch}
            >
              <ThemedText style={{ color: theme.textSecondary, fontSize: 13 }}>
                I'll fill this in myself
              </ThemedText>
            </Pressable>
          </View>
        ) : null}

        {wizardStep === 3 ? (
          <View style={styles.wizardSection}>
            <ThemedText type="h2" style={styles.wizardQuestion}>
              How's your energy right now?
            </ThemedText>
            <View style={styles.energyCardRow}>
              {(
                [
                  {
                    level: "low" as EnergyLevel,
                    label: "Low",
                    hint: "Running on empty",
                    icon: "feather" as const,
                  },
                  {
                    level: "medium" as EnergyLevel,
                    label: "Medium",
                    hint: "Some capacity",
                    icon: "sun" as const,
                  },
                  {
                    level: "high" as EnergyLevel,
                    label: "High",
                    hint: "Ready to go",
                    icon: "zap" as const,
                  },
                ]
              ).map((opt) => (
                <Pressable
                  key={opt.level}
                  onPress={() => handleWizardEnergySelect(opt.level)}
                  style={[
                    styles.energyWizardCard,
                    {
                      backgroundColor: theme.backgroundDefault,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Feather name={opt.icon} size={28} color={theme.primary} />
                  <ThemedText style={styles.energyWizardLabel}>{opt.label}</ThemedText>
                  <ThemedText
                    style={[styles.energyWizardHint, { color: theme.textSecondary }]}
                  >
                    {opt.hint}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={() => {
                triggerHaptic("selection");
                setUseMinimalFallback(true);
                if (wizardTaskText.trim()) setTitle(wizardTaskText.trim());
              }}
              style={styles.escapeHatch}
            >
              <ThemedText style={{ color: theme.textSecondary, fontSize: 13 }}>
                I'll fill this in myself
              </ThemedText>
            </Pressable>
          </View>
        ) : null}
      </KeyboardAwareScrollViewCompat>
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
              Common tasks to break down:
            </ThemedText>
            <View style={styles.exampleChips}>
              {[
                "Reply to emails",
                "Clean my room",
                "Do laundry", 
                "Make a phone call",
                "Schedule appointment",
                "Pay bills",
                "Grocery shopping",
                "Start that project",
              ].map((example) => (
                <Pressable
                  key={example}
                  onPress={() => {
                    triggerHaptic("selection");
                    setTitle(example);
                    setSteps(getTemplateSteps(example));
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
          Each bite should take 2-10 minutes
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
            placeholder="What's the tiniest first bite?"
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
                    triggerHaptic("selection");
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
              <Pressable 
                onPress={() => setShowBiteInspiration(!showBiteInspiration)}
                style={styles.inspirationToggle}
              >
                <Feather 
                  name={showBiteInspiration ? "chevron-down" : "chevron-right"} 
                  size={16} 
                  color={theme.primary} 
                />
                <ThemedText style={[styles.inspirationToggleText, { color: theme.primary }]}>
                  Need inspiration?
                </ThemedText>
              </Pressable>
              {showBiteInspiration ? (
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
                        triggerHaptic("light");
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
              ) : null}
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
                  onEdit={(text, minutes) => handleEditStep(step.id, text, minutes)}
                  onMoveUp={() => handleMoveStep(step.id, "up")}
                  onMoveDown={() => handleMoveStep(step.id, "down")}
                  isFirst={index === 0}
                  isLast={index === steps.length - 1}
                  editable
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
              triggerHaptic("selection");
              setEnergyLevel(level);
            }}
          />
        </View>
      </View>

      <DynamicFooter screen="tasks" />
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
  visualTimerContainer: {
    marginBottom: Spacing.lg,
    alignItems: "center",
    width: "100%",
  },
  markDoneButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.sm,
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
  archivePromptButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xl,
  },
  upcomingContainer: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  upcomingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  upcomingLabel: {
    fontSize: 14,
  },
  workFooter: {
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
  },
  minimalContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  minimalFooter: {
    alignItems: "center",
    gap: Spacing.md,
    marginTop: "auto",
    paddingTop: Spacing.xl,
  },
  startButton: {
    width: "100%",
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.sm,
  },
  minimalHint: {
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
  },
  advancedLink: {
    paddingVertical: Spacing.md,
  },
  permissionBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
  },
  permissionBannerText: {
    fontSize: 14,
    fontWeight: "500",
  },
  stopOption: {
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  stopButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  stopHint: {
    fontSize: 13,
    fontStyle: "italic",
  },
  celebrationOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  celebrationCard: {
    width: "100%",
    maxWidth: 320,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: "center",
  },
  celebrationIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  celebrationTitle: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  celebrationSubtitle: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  celebrationActions: {
    width: "100%",
    gap: Spacing.md,
  },
  keepGoingButton: {
    width: "100%",
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.sm,
  },
  stopHereButton: {
    width: "100%",
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  quickChipsScroll: {
    marginBottom: Spacing.md,
  },
  quickChipsContainer: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  quickChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  quickChipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  inspirationToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  inspirationToggleText: {
    fontSize: 14,
    fontWeight: "500",
  },
  wizardProgress: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginBottom: Spacing.xl,
  },
  wizardDot: {
    height: 8,
    borderRadius: 4,
  },
  wizardSection: {
    flex: 1,
  },
  wizardQuestion: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  categoryCard: {
    width: "48%",
    aspectRatio: 1.4,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  suggestionList: {
    gap: Spacing.sm,
  },
  suggestionChip: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  wizardNextButton: {
    marginTop: Spacing.lg,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.sm,
  },
  escapeHatch: {
    marginTop: Spacing.xl,
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  energyCardRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  energyWizardCard: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  energyWizardLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  energyWizardHint: {
    fontSize: 12,
    textAlign: "center",
  },
});
