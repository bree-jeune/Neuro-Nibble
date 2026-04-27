import React, { useState, useCallback } from "react";
import { View, FlatList, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { triggerHaptic } from "@/lib/haptics";

import { ThemedText } from "@/components/ThemedText";
import { TaskCard } from "@/components/TaskCard";
import { ContextualBanner } from "@/components/ContextualBanner";
import { AmbientPresenceStrip } from "@/components/AmbientPresenceStrip";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useAppStore } from "@/lib/store";
import { useSnackbarStore } from "@/lib/snackbarStore";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type { EnergyLevel, Task } from "@/lib/types";

type FilterType = "all" | EnergyLevel;

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [filter, setFilter] = useState<FilterType>("all");

  const { tasks, deleteTask, restoreTask, toggleStepComplete, restoreStep, archiveTask, energyLevel, weeklyRoom } = useAppStore();
  const showSnackbar = useSnackbarStore((s) => s.show);

  const visibleTasks = tasks.filter((t) => !t.isArchived);
  const filteredTasks =
    filter === "all"
      ? visibleTasks
      : visibleTasks.filter((t) => t.energyLevel === filter);

  const handleTaskPress = useCallback((taskId: string) => {
    navigation.navigate("BreakItDown", { taskId });
  }, [navigation]);

  const handleArchiveTask = useCallback((taskId: string) => {
    triggerHaptic("success");
    archiveTask(taskId);
    showSnackbar("Archived. Great work.");
  }, [archiveTask, showSnackbar]);

  const handleDeleteTask = useCallback((taskId: string) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (!taskToDelete) return;
    
    const taskSnapshot = JSON.parse(JSON.stringify(taskToDelete));
    const indexSnapshot = taskIndex;
    
    triggerHaptic("success");
    deleteTask(taskId);
    
    showSnackbar("Task deleted", () => {
      restoreTask(taskSnapshot, indexSnapshot);
    });
  }, [deleteTask, restoreTask, tasks, showSnackbar]);

  const activeDays = useAppStore((s) => s.activeDays);

  const handleStepToggle = useCallback((taskId: string, stepId: string) => {
    const task = tasks.find(t => t.id === taskId);
    const step = task?.steps.find(s => s.id === stepId);
    if (!step || !task) return;
    
    const wasCompleted = step.completed;
    const stepSnapshot = JSON.parse(JSON.stringify(step));
    const today = new Date().toISOString().split("T")[0];
    
    triggerHaptic("light");
    toggleStepComplete(taskId, stepId);
    
    if (!wasCompleted) {
      showSnackbar("Bite complete", () => {
        restoreStep(taskId, stepSnapshot, today);
      });
    }
  }, [toggleStepComplete, restoreStep, tasks, activeDays, showSnackbar]);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name="layers" size={40} color={theme.primary} />
      </View>
      <ThemedText type="h3" style={styles.emptyTitle}>
        No bites yet
      </ThemedText>
      <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
        Add one thing that feels impossible right now.
      </ThemedText>
      <ThemedText style={[styles.emptySubtext, { color: theme.textSecondary }]}>
        We'll break it into 2-10 minute pieces.
      </ThemedText>
      <Pressable
        onPress={() => navigation.navigate("BreakItDown")}
        style={[styles.emptyButton, { backgroundColor: theme.primary }]}
      >
        <Feather name="plus" size={18} color="#FFFFFF" />
        <ThemedText style={styles.emptyButtonText}>Break down a task</ThemedText>
      </Pressable>
    </View>
  );

  const FilterButton = ({ type, label }: { type: FilterType; label: string }) => {
    const selectedColor =
      type === "low"
        ? theme.energyLow
        : type === "medium"
          ? theme.energyMedium
          : type === "high"
            ? theme.energyHigh
            : theme.primary;
    const isSelected = filter === type;
    return (
      <Pressable
        onPress={() => {
          triggerHaptic("selection");
          setFilter(type);
        }}
        style={[
          styles.filterButton,
          {
            backgroundColor: isSelected ? selectedColor : theme.backgroundDefault,
          },
        ]}
      >
        <ThemedText
          style={[
            styles.filterText,
            { color: isSelected ? "#FFFFFF" : theme.text },
          ]}
        >
          {label}
        </ThemedText>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.backgroundRoot }}>
      <View 
        style={[
          styles.filterContainer, 
          { 
            paddingTop: headerHeight + Spacing.sm,
            backgroundColor: theme.backgroundRoot,
          }
        ]}
      >
        <FilterButton type="all" label="All" />
        <FilterButton type="low" label="Low" />
        <FilterButton type="medium" label="Medium" />
        <FilterButton type="high" label="High" />
      </View>
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: Spacing.md,
          paddingBottom: tabBarHeight + Spacing.xl + 80,
          paddingHorizontal: Spacing.lg,
          flexGrow: 1,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onPress={() => handleTaskPress(item.id)}
            onDelete={() => handleDeleteTask(item.id)}
            onArchive={() => handleArchiveTask(item.id)}
            onStepToggle={(stepId) => handleStepToggle(item.id, stepId)}
          />
        )}
        ListHeaderComponent={
          tasks.length > 0 ? (
            <ContextualBanner 
              energyLevel={energyLevel} 
              weeklyRoom={weeklyRoom} 
            />
          ) : null
        }
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
      <AmbientPresenceStrip />
    </View>
  );
}

const styles = StyleSheet.create({
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
});
