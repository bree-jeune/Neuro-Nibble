import React, { useState } from "react";
import { StyleSheet, Pressable, View, TextInput } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { Step } from "@/lib/types";

interface StepItemProps {
  step: Step;
  index: number;
  onToggle: () => void;
  onRemove?: () => void;
  onEdit?: (text: string, minutes: number) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  compact?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  editable?: boolean;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export function StepItem({ 
  step, 
  index, 
  onToggle, 
  onRemove, 
  onEdit,
  onMoveUp,
  onMoveDown,
  compact,
  isFirst,
  isLast,
  editable,
}: StepItemProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(step.text);
  const [editMinutes, setEditMinutes] = useState(step.minutes);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleSaveEdit = () => {
    if (editText.trim() && onEdit) {
      onEdit(editText.trim(), editMinutes);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditText(step.text);
    setEditMinutes(step.minutes);
    setIsEditing(false);
  };

  if (isEditing && editable) {
    return (
      <View style={[styles.container, styles.editContainer, { backgroundColor: theme.backgroundDefault }]}>
        <TextInput
          style={[
            styles.editInput,
            {
              backgroundColor: theme.inputBackground,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
          value={editText}
          onChangeText={setEditText}
          autoFocus
          placeholder="What's this bite?"
          placeholderTextColor={theme.textSecondary}
        />
        <View style={styles.editControls}>
          <View style={styles.timePresets}>
            {[2, 5, 10].map((mins) => (
              <Pressable
                key={mins}
                onPress={() => setEditMinutes(mins)}
                style={[
                  styles.timePresetChip,
                  {
                    backgroundColor: editMinutes === mins ? theme.primary : theme.backgroundSecondary,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.timePresetText,
                    { color: editMinutes === mins ? "#FFFFFF" : theme.text },
                  ]}
                >
                  {mins}m
                </ThemedText>
              </Pressable>
            ))}
          </View>
          <View style={styles.editActions}>
            <Pressable onPress={handleCancelEdit} style={styles.editAction} hitSlop={8}>
              <Feather name="x" size={18} color={theme.textSecondary} />
            </Pressable>
            <Pressable onPress={handleSaveEdit} style={styles.editAction} hitSlop={8}>
              <Feather name="check" size={18} color={theme.primary} />
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <AnimatedView
      style={[
        styles.container,
        { backgroundColor: theme.backgroundDefault },
        compact && styles.containerCompact,
        animatedStyle,
      ]}
    >
      {editable && (onMoveUp || onMoveDown) ? (
        <View style={styles.reorderControls}>
          <Pressable 
            onPress={onMoveUp} 
            style={[styles.reorderButton, isFirst && styles.reorderButtonDisabled]} 
            hitSlop={4}
            disabled={isFirst}
          >
            <Feather name="chevron-up" size={16} color={isFirst ? theme.border : theme.textSecondary} />
          </Pressable>
          <Pressable 
            onPress={onMoveDown} 
            style={[styles.reorderButton, isLast && styles.reorderButtonDisabled]} 
            hitSlop={4}
            disabled={isLast}
          >
            <Feather name="chevron-down" size={16} color={isLast ? theme.border : theme.textSecondary} />
          </Pressable>
        </View>
      ) : null}

      <Pressable onPress={onToggle} style={styles.checkboxArea}>
        <View
          style={[
            styles.checkbox,
            compact && styles.checkboxCompact,
            {
              backgroundColor: step.completed ? theme.primary : "transparent",
              borderColor: step.completed ? theme.primary : theme.border,
            },
          ]}
        >
          {step.completed ? (
            <Feather name="check" size={compact ? 10 : 12} color="#FFFFFF" />
          ) : null}
        </View>
      </Pressable>

      <Pressable 
        style={styles.content} 
        onPress={editable && onEdit ? () => setIsEditing(true) : undefined}
      >
        <ThemedText
          style={[
            styles.text,
            compact && styles.textCompact,
            step.completed && {
              textDecorationLine: "line-through",
              color: theme.textSecondary,
            },
          ]}
          numberOfLines={2}
        >
          {step.text}
        </ThemedText>
        <ThemedText style={[styles.minutes, { color: theme.textSecondary }]}>
          {step.minutes} min
        </ThemedText>
      </Pressable>

      {editable && onEdit ? (
        <Pressable onPress={() => setIsEditing(true)} style={styles.editButton} hitSlop={8}>
          <Feather name="edit-2" size={14} color={theme.textSecondary} />
        </Pressable>
      ) : null}

      {onRemove ? (
        <Pressable onPress={onRemove} style={styles.removeButton} hitSlop={8}>
          <Feather name="x" size={16} color={theme.textSecondary} />
        </Pressable>
      ) : null}
    </AnimatedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
  },
  containerCompact: {
    padding: Spacing.sm,
  },
  editContainer: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: Spacing.sm,
  },
  checkboxArea: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxCompact: {
    width: 20,
    height: 20,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  text: {
    flex: 1,
    fontSize: 16,
  },
  textCompact: {
    fontSize: 14,
  },
  minutes: {
    fontSize: 14,
    marginLeft: Spacing.sm,
  },
  removeButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  editButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  reorderControls: {
    flexDirection: "column",
    marginRight: Spacing.xs,
  },
  reorderButton: {
    padding: 2,
  },
  reorderButtonDisabled: {
    opacity: 0.3,
  },
  editInput: {
    height: 44,
    padding: Spacing.sm,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    fontSize: 15,
  },
  editControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timePresets: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  timePresetChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    minWidth: 40,
    alignItems: "center",
  },
  timePresetText: {
    fontSize: 13,
    fontWeight: "500",
  },
  editActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  editAction: {
    padding: Spacing.xs,
  },
});
