import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";

import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";

type FeatherIconName = ComponentProps<typeof Feather>["name"];

interface SupportToolCardProps {
  title: string;
  subtitle: string;
  icon: FeatherIconName;
  onPress?: () => void;
  featured?: boolean;
  children?: ReactNode;
  accessibilityLabel: string;
}

export function SupportToolCard({
  title,
  subtitle,
  icon,
  onPress,
  featured = false,
  children,
  accessibilityLabel,
}: SupportToolCardProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.card,
        {
          backgroundColor: featured
            ? theme.inputBackground
            : theme.backgroundDefault,
          borderColor: featured ? theme.primary : theme.border,
        },
      ]}
    >
      <View
        style={[
          styles.iconBox,
          {
            backgroundColor: featured
              ? theme.primary
              : theme.backgroundSecondary,
          },
        ]}
      >
        <Feather
          name={icon}
          size={18}
          color={featured ? "#FFFFFF" : theme.text}
        />
      </View>

      <View style={styles.copy}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          {subtitle}
        </ThemedText>
      </View>

      {children ? (
        <View style={styles.inlineChild}>{children}</View>
      ) : (
        <Feather name="chevron-right" size={18} color={theme.textSecondary} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 64,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  inlineChild: {
    minWidth: 56,
    alignItems: "center",
  },
});
