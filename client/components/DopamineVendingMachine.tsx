import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, Pressable, FlatList, TextInput, Modal, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  ZoomIn,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { triggerHaptic } from "@/lib/haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { DopamineItem, DopamineCost } from "@/lib/types";

interface DopamineVendingMachineProps {
  items: DopamineItem[];
  onAddItem: (text: string, cost: DopamineCost) => void;
  onRemoveItem: (id: string) => void;
}

const COST_CONFIG: Record<DopamineCost, { label: string; time: string; color: string; lightColor: string; icon: keyof typeof Feather.glyphMap }> = {
  micro: { label: "Micro", time: "2m", color: "#7BB3C9", lightColor: "#E3F0F5", icon: "zap" },
  snack: { label: "Snack", time: "15m", color: "#A98BC9", lightColor: "#EDE3F5", icon: "coffee" },
  meal: { label: "Meal", time: "1hr", color: "#C9A87B", lightColor: "#F5EDE3", icon: "sun" },
};

const PRESET_SUGGESTIONS: Array<{ text: string; cost: DopamineCost }> = [
  { text: "Watch a funny video", cost: "micro" },
  { text: "Step outside for fresh air", cost: "micro" },
  { text: "Text a friend", cost: "micro" },
  { text: "Make a nice beverage", cost: "snack" },
  { text: "Listen to a favorite song", cost: "micro" },
  { text: "Do a quick stretch", cost: "micro" },
  { text: "Read a chapter of a book", cost: "snack" },
  { text: "Take a relaxing shower", cost: "snack" },
  { text: "Watch an episode of a show", cost: "meal" },
  { text: "Go for a walk", cost: "snack" },
  { text: "Play a game", cost: "meal" },
  { text: "Call someone you like", cost: "snack" },
];

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_GAP = Spacing.sm;
const CARD_MARGIN = Spacing.lg;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_MARGIN * 2 - CARD_GAP) / 2;

type FilterType = "all" | DopamineCost;

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
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
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
          <Feather name={config.icon} size={10} color="#FFFFFF" />
          <ThemedText style={styles.costBadgeText}>{config.time}</ThemedText>
        </View>
        <Pressable onPress={onRemove} hitSlop={8}>
          <Feather name="x" size={16} color={theme.textSecondary} />
        </Pressable>
      </View>
      <ThemedText style={[styles.cardText, { color: theme.text }]} numberOfLines={3}>
        {item.text}
      </ThemedText>
    </Animated.View>
  );
}

function FilterTabs({
  selected,
  onSelect,
  itemCounts,
}: {
  selected: FilterType;
  onSelect: (filter: FilterType) => void;
  itemCounts: Record<FilterType, number>;
}) {
  const { theme } = useTheme();
  const filters: FilterType[] = ["all", "micro", "snack", "meal"];

  return (
    <View style={styles.filterContainer}>
      {filters.map((filter) => {
        const isSelected = selected === filter;
        const count = itemCounts[filter];
        const config = filter === "all" ? null : COST_CONFIG[filter];

        return (
          <Pressable
            key={filter}
            onPress={() => {
              triggerHaptic("light");
              onSelect(filter);
            }}
            style={[
              styles.filterTab,
              {
                backgroundColor: isSelected
                  ? (config?.color || theme.primary)
                  : theme.backgroundSecondary,
                borderColor: isSelected
                  ? (config?.color || theme.primary)
                  : theme.border,
              },
            ]}
          >
            {config ? (
              <Feather
                name={config.icon}
                size={12}
                color={isSelected ? "#FFFFFF" : theme.textSecondary}
              />
            ) : null}
            <ThemedText
              style={[
                styles.filterTabText,
                { color: isSelected ? "#FFFFFF" : theme.textSecondary },
              ]}
            >
              {filter === "all" ? "All" : config?.time}
            </ThemedText>
            <View style={[
              styles.countBadge,
              { backgroundColor: isSelected ? "rgba(255,255,255,0.3)" : theme.backgroundTertiary }
            ]}>
              <ThemedText style={[
                styles.countText,
                { color: isSelected ? "#FFFFFF" : theme.textSecondary }
              ]}>
                {count}
              </ThemedText>
            </View>
          </Pressable>
        );
      })}
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
            onPress={() => {
              triggerHaptic("light");
              onSelect(cost);
            }}
            style={[
              styles.costOption,
              {
                backgroundColor: isSelected ? config.color : theme.backgroundSecondary,
                borderColor: isSelected ? config.color : theme.border,
              },
            ]}
          >
            <Feather
              name={config.icon}
              size={14}
              color={isSelected ? "#FFFFFF" : theme.textSecondary}
            />
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

function PresetSuggestions({
  onAdd,
}: {
  onAdd: (text: string, cost: DopamineCost) => void;
}) {
  const { theme } = useTheme();
  const shuffled = useMemo(() =>
    [...PRESET_SUGGESTIONS].sort(() => Math.random() - 0.5).slice(0, 6),
    []
  );

  return (
    <View style={styles.presetsContainer}>
      <ThemedText style={[styles.presetsTitle, { color: theme.textSecondary }]}>
        Quick adds to get started:
      </ThemedText>
      <View style={styles.presetsList}>
        {shuffled.map((preset, index) => {
          const config = COST_CONFIG[preset.cost];
          return (
            <Pressable
              key={index}
              onPress={() => {
                triggerHaptic("light");
                onAdd(preset.text, preset.cost);
              }}
              style={[
                styles.presetChip,
                { backgroundColor: config.lightColor, borderColor: config.color },
              ]}
            >
              <Feather name={config.icon} size={12} color={config.color} />
              <ThemedText style={[styles.presetText, { color: theme.text }]} numberOfLines={1}>
                {preset.text}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
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
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const buttonScale = useSharedValue(1);
  const buttonRotation = useSharedValue(0);
  const celebrationScale = useSharedValue(1);

  const filteredItems = useMemo(() => {
    if (activeFilter === "all") return items;
    return items.filter(item => item.cost === activeFilter);
  }, [items, activeFilter]);

  const itemCounts = useMemo(() => ({
    all: items.length,
    micro: items.filter(i => i.cost === "micro").length,
    snack: items.filter(i => i.cost === "snack").length,
    meal: items.filter(i => i.cost === "meal").length,
  }), [items]);

  const handleSpin = useCallback(() => {
    const spinItems = filteredItems.length > 0 ? filteredItems : items;
    if (spinItems.length === 0) return;

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
    const finalIndex = Math.floor(Math.random() * spinItems.length);

    const spinStep = (count: number) => {
      if (count >= maxSpins) {
        // Find the actual index in the displayed list
        const winnerItem = spinItems[finalIndex];
        const displayIndex = filteredItems.findIndex(i => i.id === winnerItem.id);
        setHighlightedIndex(displayIndex >= 0 ? displayIndex : finalIndex);
        setIsSpinning(false);
        setWinner(winnerItem);

        // Celebration animation
        celebrationScale.value = withSequence(
          withTiming(1.2, { duration: 150 }),
          withTiming(1, { duration: 150 })
        );

        setTimeout(() => setShowModal(true), 300);
        triggerHaptic("success");
        return;
      }

      setHighlightedIndex(count % spinItems.length);
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
  }, [filteredItems, items, buttonScale, buttonRotation, celebrationScale]);

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

  const canSpin = filteredItems.length > 0 || items.length > 0;

  return (
    <View style={styles.container}>
      {/* Vending Machine Header */}
      <View style={[styles.machineHeader, { backgroundColor: theme.backgroundSecondary }]}>
        <View style={styles.machineDisplay}>
          <Feather name="gift" size={20} color={theme.primary} />
          <ThemedText style={[styles.machineTitle, { color: theme.text }]}>
            {isSpinning ? "Dispensing..." : items.length === 0 ? "Stock me up!" : "Ready to dispense"}
          </ThemedText>
        </View>
        <Animated.View style={buttonStyle}>
          <Pressable
            onPress={handleSpin}
            disabled={isSpinning || !canSpin}
            style={[
              styles.spinButton,
              {
                backgroundColor: !canSpin ? theme.backgroundTertiary : theme.secondary,
              },
            ]}
          >
            <Feather
              name={isSpinning ? "loader" : "play"}
              size={20}
              color={!canSpin ? theme.textSecondary : "#FFFFFF"}
            />
            <ThemedText
              style={[
                styles.spinButtonText,
                { color: !canSpin ? theme.textSecondary : "#FFFFFF" },
              ]}
            >
              Spin
            </ThemedText>
          </Pressable>
        </Animated.View>
      </View>

      {/* Filter Tabs */}
      {items.length > 0 && (
        <FilterTabs
          selected={activeFilter}
          onSelect={setActiveFilter}
          itemCounts={itemCounts}
        />
      )}

      {/* Items Grid or Empty State */}
      {items.length > 0 ? (
        filteredItems.length > 0 ? (
          <FlatList
            data={filteredItems}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            scrollEnabled={false}
            contentContainerStyle={styles.grid}
            extraData={{ highlightedIndex, isSpinning, winner }}
          />
        ) : (
          <View style={[styles.emptyFilterState, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="filter" size={24} color={theme.textSecondary} />
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              No {activeFilter} treats yet
            </ThemedText>
            <Pressable
              onPress={() => setActiveFilter("all")}
              style={[styles.showAllButton, { borderColor: theme.border }]}
            >
              <ThemedText style={{ color: theme.primary }}>Show all</ThemedText>
            </Pressable>
          </View>
        )
      ) : (
        <View style={[styles.emptyState, { backgroundColor: theme.backgroundSecondary }]}>
          <View style={[styles.machineIcon, { backgroundColor: theme.backgroundTertiary }]}>
            <Feather name="package" size={32} color={theme.textSecondary} />
          </View>
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
            Your vending machine is empty
          </ThemedText>
          <ThemedText style={[styles.emptySubtext, { color: theme.textSecondary }]}>
            Add some treats that your brain actually enjoys
          </ThemedText>
          <PresetSuggestions onAdd={onAddItem} />
        </View>
      )}

      {/* Add New Item */}
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

      {/* Winner Modal */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={handleCloseModal}>
        <View style={styles.modalOverlay}>
          <Animated.View
            entering={ZoomIn.springify().damping(12)}
            style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}
          >
            {winner ? (
              <>
                <View style={styles.celebrationHeader}>
                  <Feather name="star" size={16} color={COST_CONFIG[winner.cost].color} />
                  <ThemedText style={[styles.celebrationText, { color: COST_CONFIG[winner.cost].color }]}>
                    DISPENSED!
                  </ThemedText>
                  <Feather name="star" size={16} color={COST_CONFIG[winner.cost].color} />
                </View>
                <View
                  style={[
                    styles.winnerBadge,
                    { backgroundColor: COST_CONFIG[winner.cost].lightColor },
                  ]}
                >
                  <Feather name={COST_CONFIG[winner.cost].icon} size={40} color={COST_CONFIG[winner.cost].color} />
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
                  <Feather name="check" size={18} color="#FFFFFF" style={{ marginRight: Spacing.xs }} />
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
    gap: Spacing.md,
  },
  machineHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  machineDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  machineTitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  machineIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  spinButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  spinButtonText: {
    fontWeight: "600",
    fontSize: 14,
  },
  filterContainer: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  filterTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: 4,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: "500",
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
    minWidth: 18,
    alignItems: "center",
  },
  countText: {
    fontSize: 10,
    fontWeight: "600",
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
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  emptyFilterState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  showAllButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
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
  presetsContainer: {
    marginTop: Spacing.md,
    width: "100%",
  },
  presetsTitle: {
    fontSize: 12,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  presetsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    justifyContent: "center",
  },
  presetChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 4,
    maxWidth: "48%",
  },
  presetText: {
    fontSize: 12,
    flexShrink: 1,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.xs,
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
  celebrationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  celebrationText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 2,
  },
  winnerBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
