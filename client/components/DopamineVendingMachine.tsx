import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  FlatList,
  TextInput,
  Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { triggerHaptic } from "@/lib/haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RewardRevealModal } from "@/components/RewardRevealModal";
import type { DopamineItem, DopamineCost } from "@/lib/types";

interface DopamineVendingMachineProps {
  items: DopamineItem[];
  onAddItem: (text: string, cost: DopamineCost) => void;
  onRemoveItem: (id: string) => void;
  onRestoreDefaults: () => void;
}

const COST_CONFIG: Record<
  DopamineCost,
  { label: string; time: string; color: string; lightColor: string }
> = {
  tiny: { label: "Tiny", time: "1m", color: "#7BB3C9", lightColor: "#E3F0F5" },
  micro: {
    label: "Micro",
    time: "3m",
    color: "#7B9EA8",
    lightColor: "#E3ECF0",
  },
  snack: {
    label: "Snack",
    time: "5m",
    color: "#A98BC9",
    lightColor: "#EDE3F5",
  },
  meal: { label: "Meal", time: "10m", color: "#C9A87B", lightColor: "#F5EDE3" },
  recovery: {
    label: "Recovery",
    time: "rest",
    color: "#A8BAA8",
    lightColor: "#E8F0E8",
  },
};

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_GAP = Spacing.sm;
const CARD_MARGIN = Spacing.lg;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_MARGIN * 2 - CARD_GAP) / 2;

function TreatCard({
  item,
  onRemove,
}: {
  item: DopamineItem;
  onRemove: () => void;
}) {
  const { theme } = useTheme();
  const config = COST_CONFIG[item.cost];

  return (
    <View
      style={[
        styles.treatCard,
        {
          backgroundColor: config.lightColor,
          width: CARD_WIDTH,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.costBadge, { backgroundColor: config.color }]}>
          <Feather name="clock" size={10} color="#FFFFFF" />
          <ThemedText style={styles.costBadgeText}>{config.time}</ThemedText>
        </View>
        <Pressable
          onPress={onRemove}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${item.text}`}
          style={styles.removeBtn}
        >
          <Feather name="x" size={16} color={theme.textSecondary} />
        </Pressable>
      </View>
      <ThemedText
        style={[styles.cardText, { color: theme.text }]}
        numberOfLines={3}
      >
        {item.text}
      </ThemedText>
    </View>
  );
}

function CostSelector({
  selected,
  onSelect,
}: {
  selected: DopamineCost;
  onSelect: (cost: DopamineCost) => void;
}) {
  const { theme } = useTheme();
  const costs: DopamineCost[] = ["tiny", "micro", "snack", "meal", "recovery"];

  return (
    <View style={styles.costSelectorContainer}>
      {costs.map((cost) => {
        const config = COST_CONFIG[cost];
        const isSelected = selected === cost;
        return (
          <Pressable
            key={cost}
            onPress={() => onSelect(cost)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${config.label}, ${config.time}`}
            style={[
              styles.costOption,
              {
                backgroundColor: isSelected
                  ? config.color
                  : theme.backgroundSecondary,
                borderColor: isSelected ? config.color : theme.border,
              },
            ]}
          >
            <ThemedText
              style={[
                styles.costOptionText,
                { color: isSelected ? "#FFFFFF" : theme.textSecondary },
              ]}
            >
              {config.time}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

export function DopamineVendingMachine({
  items,
  onAddItem,
  onRemoveItem,
  onRestoreDefaults,
}: DopamineVendingMachineProps) {
  const { theme } = useTheme();
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [newItemText, setNewItemText] = useState("");
  const [selectedCost, setSelectedCost] = useState<DopamineCost>("snack");

  const handleOpenReward = useCallback(() => {
    if (items.length === 0) return;
    triggerHaptic("medium");
    setShowRewardModal(true);
  }, [items.length]);

  const handleAddItem = useCallback(() => {
    if (newItemText.trim()) {
      triggerHaptic("light");
      onAddItem(newItemText.trim(), selectedCost);
      setNewItemText("");
    }
  }, [newItemText, selectedCost, onAddItem]);

  const renderItem = ({ item }: { item: DopamineItem }) => (
    <TreatCard
      item={item}
      onRemove={() => {
        triggerHaptic("light");
        onRemoveItem(item.id);
      }}
    />
  );

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handleOpenReward}
        disabled={items.length === 0}
        accessibilityRole="button"
        accessibilityLabel="Pick a reward"
        style={[
          styles.spinButton,
          {
            backgroundColor:
              items.length === 0 ? theme.backgroundSecondary : theme.secondary,
          },
        ]}
      >
        <Feather
          name="gift"
          size={22}
          color={items.length === 0 ? theme.textSecondary : "#FFFFFF"}
        />
        <ThemedText
          style={[
            styles.spinButtonText,
            { color: items.length === 0 ? theme.textSecondary : "#FFFFFF" },
          ]}
        >
          Pick a reward
        </ThemedText>
      </Pressable>

      {items.length > 0 ? (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          scrollEnabled={false}
          contentContainerStyle={styles.grid}
        />
      ) : (
        <View
          style={[
            styles.emptyState,
            { backgroundColor: theme.backgroundSecondary },
          ]}
        >
          <Feather name="gift" size={32} color={theme.textSecondary} />
          <ThemedText
            style={[styles.emptyText, { color: theme.textSecondary }]}
          >
            Need ideas?
          </ThemedText>
          <ThemedText
            style={[styles.emptySubtext, { color: theme.textSecondary }]}
          >
            Add starter rewards or make your own.
          </ThemedText>
          <Pressable
            onPress={() => {
              triggerHaptic("success");
              onRestoreDefaults();
            }}
            accessibilityRole="button"
            accessibilityLabel="Add starter rewards"
            style={[styles.restoreButton, { backgroundColor: theme.primary }]}
          >
            <Feather name="plus-circle" size={18} color="#FFFFFF" />
            <ThemedText style={styles.restoreButtonText}>
              Add starter rewards
            </ThemedText>
          </Pressable>
        </View>
      )}

      <View style={styles.addSection}>
        <View
          style={[
            styles.inputRow,
            {
              backgroundColor: theme.inputBackground,
              borderColor: theme.border,
            },
          ]}
        >
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="Add a dopamine treat..."
            placeholderTextColor={theme.textSecondary}
            value={newItemText}
            onChangeText={setNewItemText}
            onSubmitEditing={handleAddItem}
            returnKeyType="done"
          />
          <Pressable
            onPress={handleAddItem}
            disabled={!newItemText.trim()}
            accessibilityRole="button"
            accessibilityLabel="Add treat"
            style={[
              styles.addButton,
              {
                backgroundColor: newItemText.trim()
                  ? theme.primary
                  : theme.backgroundSecondary,
              },
            ]}
          >
            <Feather
              name="plus"
              size={20}
              color={newItemText.trim() ? "#FFFFFF" : theme.textSecondary}
            />
          </Pressable>
        </View>
        <CostSelector selected={selectedCost} onSelect={setSelectedCost} />
      </View>

      <RewardRevealModal
        visible={showRewardModal}
        items={items}
        onRestoreDefaults={onRestoreDefaults}
        onClose={() => setShowRewardModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.lg,
  },
  spinButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  spinButtonText: {
    fontWeight: "600",
    fontSize: 18,
  },
  grid: {
    gap: CARD_GAP,
  },
  row: {
    gap: CARD_GAP,
  },
  treatCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    minHeight: 100,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  costBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  costBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
  },
  emptySubtext: {
    fontSize: 13,
    fontStyle: "italic",
    textAlign: "center",
  },
  restoreButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
  restoreButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  addSection: {
    gap: Spacing.sm,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    minHeight: 40,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  removeBtn: {
    minWidth: 32,
    minHeight: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  costSelectorContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  costOption: {
    flex: 1,
    minHeight: 44,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  costOptionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    width: "100%",
    maxWidth: 320,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: "center",
    gap: Spacing.md,
  },
  winnerBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  modalLabel: {
    fontSize: 13,
    fontStyle: "italic",
  },
  modalTitle: {
    textAlign: "center",
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  timeBadgeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  permissionText: {
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
  },
  doItButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.sm,
  },
  doItButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
});
