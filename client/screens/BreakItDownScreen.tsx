import React, { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, TextInput, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight, HeaderButton } from "@react-navigation/elements";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import { scheduleOnRN } from "react-native-worklets";

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

export default function BreakItDownScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "BreakItDown">>();

  const { tasks, addTask, updateTask, toggleStepComplete } = useAppStore();
  
  const existingTask = route.params?.taskId 
    ? tasks.find(t => t.id === route.params?.taskId)
    : undefined;

  const [title, setTitle] = useState(existingTask?.title || "");
  const [steps, setSteps] = useState<Step[]>(existingTask?.steps || []);
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>(existingTask?.energyLevel || "medium");
  const [newStepText, setNewStepText] = useState("");
  const [newStepMinutes, setNewStepMinutes] = useState(5);

  const canSave = title.trim().length > 0;

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <HeaderButton onPress={() => navigation.goBack()}>
          <ThemedText style={{ color: theme.primary }}>Cancel</ThemedText>
        </HeaderButton>
      ),
      headerRight: () => (
        <HeaderButton 
          onPress={handleSave}
          disabled={!canSave}
        >
          <ThemedText style={{ color: canSave ? theme.primary : theme.textSecondary }}>
            Save
          </ThemedText>
        </HeaderButton>
      ),
    });
  }, [navigation, theme, canSave, title, steps, energyLevel]);

  const handleSave = useCallback(() => {
    if (!canSave) return;
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
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
    
    navigation.goBack();
  }, [canSave, existingTask, title, steps, energyLevel, addTask, updateTask, navigation]);

  const handleAddStep = useCallback(() => {
    if (newStepText.trim()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newStep: Step = {
        id: Date.now().toString(),
        text: newStepText.trim(),
        minutes: newStepMinutes,
        completed: false,
      };
      setSteps([...steps, newStep]);
      setNewStepText("");
      setNewStepMinutes(5);
    }
  }, [newStepText, newStepMinutes, steps]);

  const handleRemoveStep = useCallback((stepId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSteps(steps.filter(s => s.id !== stepId));
  }, [steps]);

  const handleToggleStep = useCallback((stepId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (existingTask) {
      toggleStepComplete(existingTask.id, stepId);
      setSteps(prev => prev.map(s => 
        s.id === stepId ? { ...s, completed: !s.completed } : s
      ));
    } else {
      setSteps(prev => prev.map(s => 
        s.id === stepId ? { ...s, completed: !s.completed } : s
      ));
    }
  }, [existingTask, toggleStepComplete]);

  const totalMinutes = steps.reduce((acc, s) => acc + s.minutes, 0);
  const completedSteps = steps.filter(s => s.completed).length;

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.lg,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <View style={styles.section}>
        <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
          What's freezing you?
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
          placeholder="The task that feels impossible..."
          placeholderTextColor={theme.textSecondary}
          value={title}
          onChangeText={setTitle}
          autoFocus={!existingTask}
        />
      </View>

      <View style={styles.section}>
        <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
          Break it into tiny steps
        </ThemedText>
        <View style={styles.stepInputContainer}>
          <TextInput
            style={[
              styles.stepInput,
              {
                backgroundColor: theme.inputBackground,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            placeholder="Add a micro-step..."
            placeholderTextColor={theme.textSecondary}
            value={newStepText}
            onChangeText={setNewStepText}
            onSubmitEditing={handleAddStep}
            returnKeyType="done"
          />
          <View style={styles.minuteSelector}>
            <Pressable
              onPress={() => setNewStepMinutes(Math.max(2, newStepMinutes - 1))}
              style={[styles.minuteButton, { backgroundColor: theme.backgroundDefault }]}
            >
              <Feather name="minus" size={16} color={theme.text} />
            </Pressable>
            <ThemedText style={styles.minuteText}>{newStepMinutes}m</ThemedText>
            <Pressable
              onPress={() => setNewStepMinutes(Math.min(10, newStepMinutes + 1))}
              style={[styles.minuteButton, { backgroundColor: theme.backgroundDefault }]}
            >
              <Feather name="plus" size={16} color={theme.text} />
            </Pressable>
          </View>
          <Pressable
            onPress={handleAddStep}
            style={[styles.addStepButton, { backgroundColor: theme.primary }]}
          >
            <Feather name="plus" size={20} color="#FFFFFF" />
          </Pressable>
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

        {steps.length > 0 ? (
          <View style={styles.summaryRow}>
            <ThemedText style={[styles.summaryText, { color: theme.textSecondary }]}>
              {completedSteps}/{steps.length} steps
            </ThemedText>
            <ThemedText style={[styles.summaryText, { color: theme.textSecondary }]}>
              ~{totalMinutes} minutes total
            </ThemedText>
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
          Energy level for this task
        </ThemedText>
        <EnergySelector
          selected={energyLevel}
          onSelect={(level) => {
            Haptics.selectionAsync();
            setEnergyLevel(level);
          }}
        />
      </View>

      {steps.length > 0 && !steps[0].completed ? (
        <View style={styles.section}>
          <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
            Ready to start?
          </ThemedText>
          <TimerButton minutes={steps[0].minutes} stepText={steps[0].text} />
        </View>
      ) : null}

      <View style={styles.permissionContainer}>
        <ThemedText style={[styles.permissionText, { color: theme.textSecondary }]}>
          You can stop after the first step. That still counts.
        </ThemedText>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.xl,
  },
  label: {
    marginBottom: Spacing.sm,
  },
  titleInput: {
    height: 48,
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    fontSize: 16,
    letterSpacing: 0.5,
  },
  stepInputContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  stepInput: {
    flex: 1,
    height: 48,
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    fontSize: 16,
    letterSpacing: 0.5,
  },
  minuteSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  minuteButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  minuteText: {
    width: 32,
    textAlign: "center",
    fontWeight: "500",
  },
  addStepButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  stepsList: {
    gap: Spacing.sm,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.md,
  },
  summaryText: {
    fontSize: 14,
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
