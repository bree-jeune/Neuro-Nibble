import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, StyleSheet, Modal, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { triggerHaptic } from "@/lib/haptics";
import { useAppStore } from "@/lib/store";
import type { DopamineItem, DopamineCost } from "@/lib/types";

export const REWARD_DURATION_LABEL: Record<DopamineCost, string> = {
  tiny: "1-minute",
  micro: "3-minute",
  snack: "5-minute",
  meal: "10-minute",
  recovery: "recovery",
};

export const REWARD_DURATION_COLOR: Record<
  DopamineCost,
  { fg: string; bg: string }
> = {
  tiny: { fg: "#7BB3C9", bg: "#E3F0F5" },
  micro: { fg: "#7B9EA8", bg: "#E3ECF0" },
  snack: { fg: "#A98BC9", bg: "#EDE3F5" },
  meal: { fg: "#C9A87B", bg: "#F5EDE3" },
  recovery: { fg: "#A8BAA8", bg: "#E8F0E8" },
};

const DURATION_ORDER: DopamineCost[] = [
  "tiny",
  "micro",
  "snack",
  "meal",
  "recovery",
];

interface RewardRevealModalProps {
  visible: boolean;
  items: DopamineItem[];
  onClose: () => void;
  /**
   * Optional — duration tier earned. If not set, all rewards are eligible.
   */
  earnedTier?: DopamineCost;
  /**
   * Lead headline. Defaults to "You earned a [X]-minute reward."
   */
  headline?: string;
  onRestoreDefaults?: () => void;
}

type Stage = "choose" | "spinning" | "revealed" | "saved";

const pickRandom = <T,>(arr: T[]): T | null =>
  arr.length === 0 ? null : arr[Math.floor(Math.random() * arr.length)];

export function RewardRevealModal({
  visible,
  items,
  onClose,
  earnedTier,
  headline,
  onRestoreDefaults,
}: RewardRevealModalProps) {
  const { theme } = useTheme();
  const reduceMotion = useAppStore((s) => s.reduceMotion);

  const eligible = useMemo(() => {
    if (!earnedTier) return items;
    const filtered = items.filter((i) => i.cost === earnedTier);
    return filtered.length > 0 ? filtered : items;
  }, [items, earnedTier]);

  const [stage, setStage] = useState<Stage>("choose");
  const [winner, setWinner] = useState<DopamineItem | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setStage("choose");
      setWinner(null);
      setHighlightId(null);
    }
  }, [visible]);

  const finishWith = useCallback((item: DopamineItem | null) => {
    setWinner(item);
    setHighlightId(null);
    setStage("revealed");
    triggerHaptic("success");
  }, []);

  const handleSpin = useCallback(() => {
    if (eligible.length === 0) return;
    triggerHaptic("medium");

    if (reduceMotion) {
      finishWith(pickRandom(eligible));
      return;
    }

    setStage("spinning");
    const final = pickRandom(eligible);
    const maxSteps = 8 + Math.floor(Math.random() * 4);
    let count = 0;

    const tick = () => {
      if (count >= maxSteps) {
        finishWith(final);
        return;
      }
      const next = eligible[count % eligible.length];
      setHighlightId(next.id);
      triggerHaptic("light");
      const progress = count / maxSteps;
      const delay = progress < 0.6 ? 90 : progress < 0.85 ? 160 : 260;
      count += 1;
      setTimeout(tick, delay);
    };

    tick();
  }, [eligible, reduceMotion, finishWith]);

  const handlePick = useCallback(() => {
    if (eligible.length === 0) return;
    triggerHaptic("selection");
    finishWith(pickRandom(eligible));
  }, [eligible, finishWith]);

  const handleSave = useCallback(() => {
    triggerHaptic("light");
    setStage("saved");
  }, []);

  const handleRestoreDefaults = useCallback(() => {
    triggerHaptic("success");
    onRestoreDefaults?.();
  }, [onRestoreDefaults]);

  const handleSwap = useCallback(() => {
    if (eligible.length <= 1) return;
    triggerHaptic("selection");
    const others = eligible.filter((i) => i.id !== winner?.id);
    finishWith(pickRandom(others.length > 0 ? others : eligible));
  }, [eligible, winner, finishWith]);

  const headlineText =
    headline ??
    (earnedTier
      ? `You earned a ${REWARD_DURATION_LABEL[earnedTier]} reward.`
      : "You earned a reward.");

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[styles.card, { backgroundColor: theme.backgroundDefault }]}
        >
          {stage === "choose" ? (
            <>
              <View
                style={[
                  styles.iconBubble,
                  { backgroundColor: theme.primary + "20" },
                ]}
              >
                <Feather name="gift" size={32} color={theme.primary} />
              </View>
              <ThemedText type="h2" style={styles.headline}>
                {headlineText}
              </ThemedText>
              <ThemedText style={[styles.body, { color: theme.textSecondary }]}>
                You earned this by taking a bite. No need to earn the whole day.
              </ThemedText>

              {eligible.length === 0 ? (
                <>
                  <ThemedText
                    style={[styles.empty, { color: theme.textSecondary }]}
                  >
                    Need ideas? Restore starter rewards and claim one now.
                  </ThemedText>
                  {onRestoreDefaults ? (
                    <Pressable
                      onPress={handleRestoreDefaults}
                      accessibilityRole="button"
                      accessibilityLabel="Add starter rewards"
                      style={[
                        styles.secondaryAction,
                        { borderColor: theme.border },
                      ]}
                    >
                      <Feather
                        name="plus-circle"
                        size={16}
                        color={theme.text}
                      />
                      <ThemedText
                        style={[
                          styles.secondaryActionText,
                          { color: theme.text },
                        ]}
                      >
                        Add starter rewards
                      </ThemedText>
                    </Pressable>
                  ) : null}
                </>
              ) : null}

              <View style={styles.actions}>
                <Pressable
                  onPress={handleSpin}
                  disabled={eligible.length === 0}
                  accessibilityRole="button"
                  accessibilityLabel={
                    reduceMotion ? "Reveal reward" : "Spin for reward"
                  }
                  style={[
                    styles.primaryAction,
                    {
                      backgroundColor:
                        eligible.length === 0
                          ? theme.backgroundSecondary
                          : theme.primary,
                    },
                  ]}
                >
                  <Feather
                    name={reduceMotion ? "eye" : "refresh-cw"}
                    size={18}
                    color={
                      eligible.length === 0 ? theme.textSecondary : "#FFFFFF"
                    }
                  />
                  <ThemedText
                    style={[
                      styles.primaryActionText,
                      {
                        color:
                          eligible.length === 0
                            ? theme.textSecondary
                            : "#FFFFFF",
                      },
                    ]}
                  >
                    {reduceMotion ? "Reveal reward" : "Spin"}
                  </ThemedText>
                </Pressable>

                <Pressable
                  onPress={handlePick}
                  disabled={eligible.length === 0}
                  accessibilityRole="button"
                  accessibilityLabel="Pick a reward instead of spinning"
                  style={[
                    styles.secondaryAction,
                    { borderColor: theme.border },
                  ]}
                >
                  <Feather name="shuffle" size={16} color={theme.text} />
                  <ThemedText
                    style={[styles.secondaryActionText, { color: theme.text }]}
                  >
                    Pick instead
                  </ThemedText>
                </Pressable>

                <Pressable
                  onPress={handleSave}
                  accessibilityRole="button"
                  accessibilityLabel="Save reward for later"
                  style={[
                    styles.secondaryAction,
                    { borderColor: theme.border },
                  ]}
                >
                  <Feather name="bookmark" size={16} color={theme.text} />
                  <ThemedText
                    style={[styles.secondaryActionText, { color: theme.text }]}
                  >
                    Save for later
                  </ThemedText>
                </Pressable>
              </View>

              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                style={styles.dismiss}
              >
                <ThemedText
                  style={[styles.dismissText, { color: theme.textSecondary }]}
                >
                  Skip this one
                </ThemedText>
              </Pressable>
            </>
          ) : null}

          {stage === "spinning" ? (
            <>
              <View
                style={[
                  styles.iconBubble,
                  { backgroundColor: theme.primary + "20" },
                ]}
              >
                <Feather name="refresh-cw" size={32} color={theme.primary} />
              </View>
              <ThemedText type="h3" style={styles.headline}>
                Picking something gentle…
              </ThemedText>
              <View style={styles.spinList}>
                {eligible.map((item) => {
                  const lit = highlightId === item.id;
                  const colors = REWARD_DURATION_COLOR[item.cost];
                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.spinItem,
                        {
                          backgroundColor: lit
                            ? colors.bg
                            : theme.backgroundSecondary,
                          borderColor: lit ? colors.fg : "transparent",
                          opacity: lit ? 1 : 0.5,
                        },
                      ]}
                    >
                      <ThemedText style={styles.spinItemText} numberOfLines={1}>
                        {item.text}
                      </ThemedText>
                    </View>
                  );
                })}
              </View>
            </>
          ) : null}

          {stage === "revealed" && winner ? (
            <>
              <View
                style={[
                  styles.iconBubble,
                  { backgroundColor: REWARD_DURATION_COLOR[winner.cost].bg },
                ]}
              >
                <Feather
                  name="gift"
                  size={32}
                  color={REWARD_DURATION_COLOR[winner.cost].fg}
                />
              </View>
              <ThemedText
                style={[styles.kicker, { color: theme.textSecondary }]}
              >
                Your reward
              </ThemedText>
              <ThemedText type="h2" style={styles.winnerTitle}>
                {winner.text}
              </ThemedText>
              <View
                style={[
                  styles.tierBadge,
                  { backgroundColor: REWARD_DURATION_COLOR[winner.cost].fg },
                ]}
              >
                <Feather name="clock" size={12} color="#FFFFFF" />
                <ThemedText style={styles.tierBadgeText}>
                  {REWARD_DURATION_LABEL[winner.cost]}
                </ThemedText>
              </View>
              <ThemedText style={[styles.body, { color: theme.textSecondary }]}>
                You&apos;re allowed to enjoy this.
              </ThemedText>

              <View style={styles.actions}>
                <Pressable
                  onPress={onClose}
                  accessibilityRole="button"
                  style={[
                    styles.primaryAction,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <Feather name="check" size={18} color="#FFFFFF" />
                  <ThemedText style={styles.primaryActionText}>
                    Take it now
                  </ThemedText>
                </Pressable>

                {eligible.length > 1 ? (
                  <Pressable
                    onPress={handleSwap}
                    accessibilityRole="button"
                    style={[
                      styles.secondaryAction,
                      { borderColor: theme.border },
                    ]}
                  >
                    <Feather name="repeat" size={16} color={theme.text} />
                    <ThemedText
                      style={[
                        styles.secondaryActionText,
                        { color: theme.text },
                      ]}
                    >
                      Swap reward
                    </ThemedText>
                  </Pressable>
                ) : null}

                <Pressable
                  onPress={handleSave}
                  accessibilityRole="button"
                  style={[
                    styles.secondaryAction,
                    { borderColor: theme.border },
                  ]}
                >
                  <Feather name="bookmark" size={16} color={theme.text} />
                  <ThemedText
                    style={[styles.secondaryActionText, { color: theme.text }]}
                  >
                    Save for later
                  </ThemedText>
                </Pressable>
              </View>
            </>
          ) : null}

          {stage === "saved" ? (
            <>
              <View
                style={[
                  styles.iconBubble,
                  { backgroundColor: theme.success + "20" },
                ]}
              >
                <Feather name="bookmark" size={32} color={theme.success} />
              </View>
              <ThemedText type="h2" style={styles.headline}>
                Saved for later.
              </ThemedText>
              <ThemedText style={[styles.body, { color: theme.textSecondary }]}>
                Your reward is waiting whenever you want it.
              </ThemedText>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                style={[
                  styles.primaryAction,
                  { backgroundColor: theme.primary },
                ]}
              >
                <ThemedText style={styles.primaryActionText}>Close</ThemedText>
              </Pressable>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    gap: Spacing.md,
  },
  iconBubble: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  headline: {
    textAlign: "center",
  },
  kicker: {
    fontSize: 13,
    fontStyle: "italic",
  },
  winnerTitle: {
    textAlign: "center",
  },
  tierBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  tierBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  body: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  empty: {
    fontSize: 13,
    fontStyle: "italic",
    textAlign: "center",
  },
  actions: {
    width: "100%",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  primaryAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    minHeight: 48,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    minHeight: 44,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  secondaryActionText: {
    fontSize: 15,
    fontWeight: "500",
  },
  dismiss: {
    paddingVertical: Spacing.sm,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  dismissText: {
    fontSize: 13,
    fontStyle: "italic",
  },
  spinList: {
    width: "100%",
    gap: Spacing.xs,
  },
  spinItem: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  spinItemText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
});

export function durationFromMinutes(min: number): DopamineCost {
  if (min <= 1) return "tiny";
  if (min <= 3) return "micro";
  if (min <= 5) return "snack";
  return "meal";
}

export { DURATION_ORDER };
