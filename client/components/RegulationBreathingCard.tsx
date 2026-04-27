import React from "react";

import { BreathingPacer } from "@/components/BreathingPacer";
import { SupportToolCard } from "@/components/SupportToolCard";

const keepCardAccessible = () => undefined;

export function RegulationBreathingCard() {
  return (
    <SupportToolCard
      title="Breathe first"
      subtitle="Hold for a haptic breathing cue."
      icon="wind"
      featured
      onPress={keepCardAccessible}
      accessibilityLabel="Breathe first. Hold for a haptic breathing cue."
    >
      <BreathingPacer size={44} showHint={false} />
    </SupportToolCard>
  );
}
