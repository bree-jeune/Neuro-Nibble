import React from "react";

import { SupportToolCard } from "@/components/SupportToolCard";

interface RegulationBreathingCardProps {
  onPress: () => void;
}

export function RegulationBreathingCard({
  onPress,
}: RegulationBreathingCardProps) {
  return (
    <SupportToolCard
      title="Breathe first"
      subtitle="Open a guided 4-4-4-4 breathing reset."
      icon="wind"
      featured
      onPress={onPress}
      accessibilityLabel="Breathe first. Open a guided breathing reset."
    />
  );
}
