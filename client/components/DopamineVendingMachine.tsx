import React, { useState, useCallback } from "react";
import { View, StyleSheet, Pressable, FlatList, TextInput, Modal, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  ZoomIn,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { triggerHaptic } from "@/lib/haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useAppStore } from "@/lib/store";
import type { DopamineItem, DopamineCost } from "@/lib/types";

interface DopamineVendingMachineProps {
  items: DopamineItem[];
  onAddItem: (text: string, cost: DopamineCost) => void;
  onRemoveItem: (id: string) => void;
}

const COST_CONFIG: Record<DopamineCost, { label: string; time: string; color: string; lightColor: string }> = {
  micro: { label: "Micro", time: "2m", color: "#7BB3C9", lightColor: "#E3F0F5" },
  snack: { label: "Snack", time: "15m", color: "#A98BC9", lightColor: "#EDE3F5" },
  meal: { label: "Meal", time: "1hr", color: "#C9A87B", lightColor: "#F5EDE3" },
};

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_GAP = Spacing.sm;
const CARD_MARGIN = Spacing.lg;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_MARGIN * 2 - CARD_GAP) / 2;

function TreatCard({
  item,
  isHighlighted,
  isSpinning,
  isWinner,
  onRemove,
}: {
  item: DopamineItem;
  isHighlighted: boolean;
  isSpinning: boolean;
  isWinner: boolean;
  onRemove: () => void;
}) {
  const { theme } = useTheme();
  const config = COST_CONFIG[item.cost];

  const shouldDim = isSpinning && !isHighlighted;
  const showBorder = isHighlighted || isWinner;

  return (
    <View
      style={[
        styles.treatCard,
        {
          backgroundColor: config.lightColor,
          borderColor: showBorder ? config.color : "transparent",
          borderWidth: showBorder ? 2 : 0,
          width: CARD_WIDTH,
          opacity: shouldDim ? 0.4 : 1,
          transform: [{ scale: isHighlighted && isSpinning ? 1.05 : 1 }],
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.costBadge, { backgroundColor: config.color }]}>
          <Feather name="clock" size={10} color="#FFFFFF" />
          <ThemedText style={styles.costBadgeText}>{config.time}</ThemedText>
        </View>
        <Pressable onPress={onRemove} hitSlop={8}>
          <Feather name="x" size={16} color={theme.textSecondary} />
        </Pressable>
      </View>
      <ThemedText style={[styles.cardText, { color: theme.text }]} numberOfLines={3}>
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
  const costs: DopamineCost[] = ["micro", "snack", "meal"];

  return (
    <View style={styles.costSelectorContainer}>
      {costs.map((cost) => {
        const config = COST_CONFIG[cost];
        const isSelected = selected === cost;
        return (
          <Pressable
            key={cost}
            onPress={() => onSelect(cost)}
            style={[
              styles.costOption,
              {
                backgroundColor: isSelected ? config.color : theme.backgroundSecondary,
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
}: DopamineVendingMachineProps) {
  const { theme } = useTheme();
  const [isSpinning, setIsSpinning] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [winner, setWinner] = useState<DopamineItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newItemText, setNewItemText] = useState("");
  const [selectedCost, setSelectedCost] = useState<DopamineCost>("micro");

  const buttonScale = useSharedValue(1);
  const buttonRotation = useSharedValue(0);

  const handleSpin = useCallback(() => {
    if (items.length === 0) return;

    triggerHaptic("medium");
    setIsSpinning(true);
    setWinner(null);

    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );

    buttonRotation.value = withSequence(
      withTiming(360, { duration: 600 }),
      withTiming(0, { duration: 0 })
    );

    const maxSpins = 12 + Math.floor(Math.random() * 6);
    const finalIndex = Math.floor(Math.random() * items.length);

    const spinStep = (count: number) => {
      if (count >= maxSpins) {
        setHighlightedIndex(finalIndex);
        setIsSpinning(false);
        setWinner(items[finalIndex]);
        setTimeout(() => setShowModal(true), 300);
        triggerHaptic("success");
        return;
      }

      setHighlightedIndex(count % items.length);
      triggerHaptic("light");

      let delay: number;
      const progress = count / maxSpins;
      if (progress < 0.5) {
        delay = 60 + progress * 40;
      } else if (progress < 0.8) {
        delay = 80 + (progress - 0.5) * 200;
      } else {
        delay = 140 + (progress - 0.8) * 600;
      }

      setTimeout(() => spinStep(count + 1), delay);
    };

    spinStep(0);
  }, [items, buttonScale, buttonRotation]);

  const handleAddItem = useCallback(() => {
    if (newItemText.trim()) {
      triggerHaptic("light");
      onAddItem(newItemText.trim(), selectedCost);
      setNewItemText("");
    }
  }, [newItemText, selectedCost, onAddItem]);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setHighlightedIndex(null);
  }, []);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: buttonScale.value },
      { rotate: `${buttonRotation.value}deg` },
    ],
  }));

  const renderItem = ({ item, index }: { item: DopamineItem; index: number }) => (
    <TreatCard
      item={item}
      isHighlighted={highlightedIndex === index}
      isSpinning={isSpinning}
      isWinner={!isSpinning && winner?.id === item.id}
      onRemove={() => {
        triggerHaptic("light");
        onRemoveItem(item.id);
      }}
    />
  );

  return (
    <View style={styles.container}>
      <Animated.View style={buttonStyle}>
        <Pressable
          onPress={handleSpin}
          disabled={isSpinning || items.length === 0}
          style={[
            styles.spinButton,
            {
              backgroundColor: items.length === 0 ? theme.backgroundSecondary : theme.secondary,
            },
          ]}
        >
          <Feather
            name={isSpinning ? "loader" : "gift"}
            size={24}
            color={items.length === 0 ? theme.textSecondary : "#FFFFFF"}
          />
          <ThemedText
            style={[
              styles.spinButtonText,
              { color: items.length === 0 ? theme.textSecondary : "#FFFFFF" },
            ]}
          >
            {isSpinning ? "Dispensing..." : "Spin for Dopamine"}
          </ThemedText>
        </Pressable>
      </Animated.View>

      {items.length > 0 ? (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          scrollEnabled={false}
          contentContainerStyle={styles.grid}
          extraData={{ highlightedIndex, isSpinning, winner }}
        />
      ) : (
        <View style={[styles.emptyState, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="gift" size={32} color={theme.textSecondary} />
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
            Your vending machine is empty
          </ThemedText>
          <ThemedText style={[styles.emptySubtext, { color: theme.textSecondary }]}>
            Add some treats below
          </ThemedText>
        </View>
      )}

      <View style={styles.addSection}>
        <View style={[styles.inputRow, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
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
            style={[
              styles.addButton,
              { backgroundColor: newItemText.trim() ? theme.primary : theme.backgroundSecondary },
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

      <Modal visible={showModal} transparent animationType="fade" onRequestClose={handleCloseModal}>
        <View style={styles.modalOverlay}>
          <Animated.View
            entering={ZoomIn.springify().damping(12)}
            style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}
          >
            {winner ? (
              <>
                <View
                  style={[
                    styles.winnerBadge,
                    { backgroundColor: COST_CONFIG[winner.cost].lightColor },
                  ]}
                >
                  <Feather name="gift" size={40} color={COST_CONFIG[winner.cost].color} />
                </View>
                <ThemedText style={[styles.modalLabel, { color: theme.textSecondary }]}>
                  Your brain picked:
                </ThemedText>
                <ThemedText type="h2" style={[styles.modalTitle, { color: theme.text }]}>
                  {winner.text}
                </ThemedText>
                <View style={[styles.timeBadge, { backgroundColor: COST_CONFIG[winner.cost].color }]}>
                  <Feather name="clock" size={14} color="#FFFFFF" />
                  <ThemedText style={styles.timeBadgeText}>
                    {COST_CONFIG[winner.cost].time}
                  </ThemedText>
                </View>
                <ThemedText style={[styles.permissionText, { color: theme.textSecondary }]}>
                  You're allowed to enjoy this.
                </ThemedText>
                <Pressable
                  onPress={handleCloseModal}
                  style={[styles.doItButton, { backgroundColor: theme.primary }]}
                >
                  <ThemedText style={styles.doItButtonText}>Do it now</ThemedText>
                </Pressable>
              </>
            ) : null}
          </Animated.View>
        </View>
      </Modal>
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
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
  },
  emptySubtext: {
    fontSize: 13,
    fontStyle: "italic",
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  costSelectorContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  costOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
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
