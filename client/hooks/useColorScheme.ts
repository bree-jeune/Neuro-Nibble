import { useColorScheme as useRNColorScheme } from "react-native";
import { useAppStore } from "@/lib/store";

export function useColorScheme(): "light" | "dark" {
  const systemScheme = useRNColorScheme();
  const preference = useAppStore((s) => s.colorScheme);

  if (preference === "system") {
    return systemScheme === "dark" ? "dark" : "light";
  }
  return preference ?? "light";
}
