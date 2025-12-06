import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useIsFocused } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { Spacing } from "@/constants/theme";
import { FooterScreen, getRandomMessage } from "@/lib/footerMessages";

interface DynamicFooterProps {
  screen: FooterScreen;
}

export function DynamicFooter({ screen }: DynamicFooterProps) {
  const isFocused = useIsFocused();
  const [message, setMessage] = useState(() => getRandomMessage(screen));

  useEffect(() => {
    if (isFocused) {
      setMessage(getRandomMessage(screen));
    }
  }, [isFocused, screen]);

  return (
    <View style={styles.container}>
      <ThemedText style={styles.text}>{message}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  text: {
    fontSize: 12,
    color: "#888888",
    fontStyle: "italic",
    textAlign: "center",
  },
});
