import { useEffect, useState, useCallback } from "react";

export interface PresenceCounts {
  total: number;
  taking: number;
  restarting: number;
  sitting: number;
}

const computePresence = (): PresenceCounts => {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const isBusinessHours = utcHour >= 8 && utcHour <= 22;
  const baseCount = isBusinessHours ? 60 : 20;
  const minCount = isBusinessHours ? 40 : 10;
  const maxCount = isBusinessHours ? 80 : 30;
  const variance = Math.floor(Math.random() * 7) - 3;
  const total = Math.min(maxCount, Math.max(minCount, baseCount + variance));

  const taking = Math.round(total * (0.45 + Math.random() * 0.1));
  const restarting = Math.round(total * (0.15 + Math.random() * 0.05));
  const sitting = Math.max(0, total - taking - restarting);

  return { total, taking, restarting, sitting };
};

export function usePresence(intervalMs: number = 60000): PresenceCounts {
  const [counts, setCounts] = useState<PresenceCounts>(() => computePresence());

  const refresh = useCallback(() => setCounts(computePresence()), []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, refresh]);

  return counts;
}
