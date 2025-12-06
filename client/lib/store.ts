import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AppState, Task, EnergyLevel, WeeklyRoom, Step } from "@/lib/types";

interface AppStore extends AppState {
  setEnergyLevel: (level: EnergyLevel) => void;
  setWeeklyRoom: (room: WeeklyRoom) => void;
  addTask: (task: Omit<Task, "id" | "createdAt">) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleStepComplete: (taskId: string, stepId: string) => void;
  setBrainDump: (text: string) => void;
  addDopamineItem: (item: string) => void;
  removeDopamineItem: (item: string) => void;
  setOneTinyThing: (text: string) => void;
  setDisplayName: (name: string) => void;
  setAvatarIndex: (index: number) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setEnergyCheckInEnabled: (enabled: boolean) => void;
  setBookendCompleted: (completed: boolean) => void;
  markActiveDay: () => void;
  completeOnboarding: () => void;
  resetAllData: () => void;
}

const initialState: AppState = {
  energyLevel: "medium",
  weeklyRoom: "gentle",
  tasks: [],
  brainDump: "",
  dopamineMenu: [],
  oneTinyThing: "",
  displayName: "",
  avatarIndex: 0,
  hapticsEnabled: true,
  notificationsEnabled: false,
  energyCheckInEnabled: true,
  bookendCompleted: false,
  lastBookendDate: "",
  activeDays: [],
  onboardingCompleted: false,
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setEnergyLevel: (level) => set({ energyLevel: level }),
      
      setWeeklyRoom: (room) => set({ weeklyRoom: room }),
      
      addTask: (task) => {
        const newTask: Task = {
          ...task,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ tasks: [newTask, ...state.tasks] }));
      },
      
      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }));
      },
      
      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        }));
      },
      
      toggleStepComplete: (taskId, stepId) => {
        const today = new Date().toISOString().split("T")[0];
        set((state) => {
          const task = state.tasks.find((t) => t.id === taskId);
          const step = task?.steps.find((s) => s.id === stepId);
          const isCompletingStep = step && !step.completed;

          let updatedActiveDays = state.activeDays;
          if (isCompletingStep && !state.activeDays.includes(today)) {
            updatedActiveDays = state.activeDays
              .filter((d) => {
                const dayDate = new Date(d);
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return dayDate >= thirtyDaysAgo;
              })
              .concat(today);
          }

          return {
            activeDays: updatedActiveDays,
            tasks: state.tasks.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    lastWorkedOn: new Date().toISOString(),
                    steps: t.steps.map((s) =>
                      s.id === stepId
                        ? {
                            ...s,
                            completed: !s.completed,
                            completedAt: !s.completed ? new Date().toISOString() : undefined,
                          }
                        : s
                    ),
                  }
                : t
            ),
          };
        });
      },
      
      setBrainDump: (text) => set({ brainDump: text }),
      
      addDopamineItem: (item) => {
        set((state) => ({
          dopamineMenu: [...state.dopamineMenu, item],
        }));
      },
      
      removeDopamineItem: (item) => {
        set((state) => ({
          dopamineMenu: state.dopamineMenu.filter((i) => i !== item),
        }));
      },
      
      setOneTinyThing: (text) => set({ oneTinyThing: text }),
      
      setDisplayName: (name) => set({ displayName: name }),
      
      setAvatarIndex: (index) => set({ avatarIndex: index }),
      
      setHapticsEnabled: (enabled) => set({ hapticsEnabled: enabled }),
      
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      
      setEnergyCheckInEnabled: (enabled) => set({ energyCheckInEnabled: enabled }),
      
      markActiveDay: () => {
        const today = new Date().toISOString().split("T")[0];
        set((state) => {
          if (state.activeDays.includes(today)) {
            return state;
          }
          const last30Days = state.activeDays
            .filter((d) => {
              const dayDate = new Date(d);
              const thirtyDaysAgo = new Date();
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
              return dayDate >= thirtyDaysAgo;
            })
            .concat(today);
          return { activeDays: last30Days };
        });
      },
      
      setBookendCompleted: (completed) => {
        const today = new Date().toISOString().split("T")[0];
        set({ bookendCompleted: completed, lastBookendDate: today });
      },
      
      completeOnboarding: () => set({ onboardingCompleted: true }),
      
      resetAllData: () => set(initialState),
    }),
    {
      name: "neuronibble-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const today = new Date().toISOString().split("T")[0];
          if (state.lastBookendDate !== today) {
            state.bookendCompleted = false;
          }
          
          state.tasks = state.tasks.map((task) => ({
            ...task,
            steps: task.steps.map((step) => {
              if (step.completed && !step.completedAt) {
                return {
                  ...step,
                  completedAt: task.lastWorkedOn || task.createdAt || new Date().toISOString(),
                };
              }
              return step;
            }),
          }));
        }
      },
    }
  )
);
