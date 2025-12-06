import { Platform } from "react-native";

export const Colors = {
  light: {
    primary: "#7B9EA8",
    secondary: "#D4B5A0",
    accent: "#C9A690",
    text: "#3E3E3E",
    textSecondary: "#6B6B6B",
    buttonText: "#FFFFFF",
    tabIconDefault: "#6B6B6B",
    tabIconSelected: "#7B9EA8",
    link: "#7B9EA8",
    backgroundRoot: "#F7F4F1",
    backgroundDefault: "#FFFFFF",
    backgroundSecondary: "#F0EDE9",
    backgroundTertiary: "#E8E4E0",
    inputBackground: "rgba(123, 158, 168, 0.05)",
    energyLow: "#A8B4BA",
    energyMedium: "#B8A89A",
    energyHigh: "#A8BAA8",
    roomChaos: "#C9A690",
    roomGentle: "#B8C9D4",
    roomBuild: "#A8BAA8",
    roomRepair: "#D4C9B8",
    border: "rgba(123, 158, 168, 0.2)",
    success: "#A8BAA8",
    error: "#C9A690",
  },
  dark: {
    primary: "#8AAFB8",
    secondary: "#8A7A6B",
    accent: "#C9A690",
    text: "#E8E8E8",
    textSecondary: "#A8A8A8",
    buttonText: "#FFFFFF",
    tabIconDefault: "#A8A8A8",
    tabIconSelected: "#8AAFB8",
    link: "#8AAFB8",
    backgroundRoot: "#1E1E1E",
    backgroundDefault: "#2A2A2A",
    backgroundSecondary: "#353739",
    backgroundTertiary: "#404244",
    inputBackground: "rgba(138, 175, 184, 0.08)",
    energyLow: "#6B7A80",
    energyMedium: "#8A7A6B",
    energyHigh: "#6B8A6B",
    roomChaos: "#8A6B5A",
    roomGentle: "#6B8A9A",
    roomBuild: "#6B8A6B",
    roomRepair: "#9A8A6B",
    border: "rgba(138, 175, 184, 0.2)",
    success: "#6B8A6B",
    error: "#8A6B5A",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  inputHeight: 48,
  buttonHeight: 48,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 28,
    fontWeight: "600" as const,
    letterSpacing: 0.5,
  },
  h2: {
    fontSize: 22,
    fontWeight: "600" as const,
    letterSpacing: 0.5,
  },
  h3: {
    fontSize: 18,
    fontWeight: "500" as const,
    letterSpacing: 0.5,
  },
  h4: {
    fontSize: 16,
    fontWeight: "500" as const,
    letterSpacing: 0.5,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    letterSpacing: 0.5,
  },
  small: {
    fontSize: 14,
    fontWeight: "400" as const,
    letterSpacing: 0.5,
  },
  micro: {
    fontSize: 12,
    fontWeight: "400" as const,
    letterSpacing: 0.5,
  },
  link: {
    fontSize: 16,
    fontWeight: "400" as const,
    letterSpacing: 0.5,
  },
  mantra: {
    fontSize: 16,
    fontWeight: "400" as const,
    fontStyle: "italic" as const,
    letterSpacing: 0.5,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
