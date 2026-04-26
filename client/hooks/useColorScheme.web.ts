import { useEffect, useState } from "react";
import { useColorScheme as useRNColorScheme } from "react-native";
import { useAppStore } from "@/lib/store";

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme(): "light" | "dark" {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const systemScheme = useRNColorScheme();
  const preference = useAppStore((s) => s.colorScheme);

  if (!hasHydrated) {
    return "light";
  }

  if (preference === "system") {
    return systemScheme === "dark" ? "dark" : "light";
  }
  return preference ?? "light";
}
