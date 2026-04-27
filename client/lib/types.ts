export type EnergyLevel = "low" | "medium" | "high";

export type WeeklyRoom = "chaos" | "gentle" | "build" | "repair";

export interface Step {
  id: string;
  text: string;
  minutes: number;
  completed: boolean;
  completedAt?: string;
}

export interface HistoryEntry {
  date: string;
  bites: {
    taskTitle: string;
    biteText: string;
    minutes: number;
  }[];
}

export interface Task {
  id: string;
  title: string;
  steps: Step[];
  energyLevel: EnergyLevel;
  createdAt: string;
  lastWorkedOn?: string;
  savedSpot?: {
    stepIndex: number;
    notes?: string;
  };
  isArchived?: boolean;
  archivedAt?: string;
}

export interface DailyReflection {
  date: string;
  text: string;
}

export interface ThoughtItem {
  id: string;
  text: string;
  createdAt: string;
}

export type DopamineCost = "tiny" | "micro" | "snack" | "meal" | "recovery";

export type QuietRoomMode = "silent" | "gentle" | "sprint" | "recovery";

export interface DopamineItem {
  id: string;
  text: string;
  cost: DopamineCost;
}

export type ColorSchemePreference = "light" | "dark" | "system";

export interface AppState {
  energyLevel: EnergyLevel;
  colorScheme: ColorSchemePreference;
  weeklyRoom: WeeklyRoom;
  tasks: Task[];
  brainDump: string;
  thoughtDump: ThoughtItem[];
  dopamineMenu: DopamineItem[];
  oneTinyThing: string;
  displayName: string;
  avatarIndex: number;
  hapticsEnabled: boolean;
  reduceMotion: boolean;
  quietRoomMode: QuietRoomMode;
  notificationsEnabled: boolean;
  energyCheckInEnabled: boolean;
  bookendCompleted: boolean;
  lastBookendDate: string;
  activeDays: string[];
  onboardingCompleted: boolean;
  firstUseDate: string;
  dailyReflections: DailyReflection[];
}
