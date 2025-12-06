import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AppState, Task, EnergyLevel, WeeklyRoom, Step, DailyReflection, ThoughtItem, DopamineItem, DopamineCost } from "@/lib/types";

interface AppStore extends AppState {
  setEnergyLevel: (level: EnergyLevel) => void;
  setWeeklyRoom: (room: WeeklyRoom) => void;
  addTask: (task: Omit<Task, "id" | "createdAt">) => void;
  restoreTask: (task: Task, index?: number) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  archiveTask: (id: string) => void;
  toggleStepComplete: (taskId: string, stepId: string) => void;
  restoreStep: (taskId: string, step: Step, removeDayFromActive: string | null) => void;
  setBrainDump: (text: string) => void;
  addThought: (text: string) => void;
  removeThought: (id: string) => void;
  convertThoughtToTask: (thought: ThoughtItem) => void;
  addDopamineItem: (text: string, cost: DopamineCost) => void;
  updateDopamineItem: (id: string, updates: Partial<Omit<DopamineItem, "id">>) => void;
  removeDopamineItem: (id: string) => void;
  setOneTinyThing: (text: string) => void;
  setDisplayName: (name: string) => void;
  setAvatarIndex: (index: number) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setEnergyCheckInEnabled: (enabled: boolean) => void;
  setBookendCompleted: (completed: boolean) => void;
  restoreBookendState: (completed: boolean, lastDate: string) => void;
  markActiveDay: () => void;
  completeOnboarding: () => void;
  addDailyReflection: (text: string) => void;
  resetAllData: () => void;
}

const initialState: AppState = {
  energyLevel: "medium",
  weeklyRoom: "gentle",
  tasks: [],
  brainDump: "",
  thoughtDump: [],
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
  firstUseDate: "",
  dailyReflections: [],
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
      
      restoreTask: (task, index) => {
        set((state) => {
          const newTasks = [...state.tasks];
          const insertIndex = index !== undefined ? Math.min(index, newTasks.length) : 0;
          newTasks.splice(insertIndex, 0, task);
          return { tasks: newTasks };
        });
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
      
      archiveTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? { ...t, isArchived: true, archivedAt: new Date().toISOString() }
              : t
          ),
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
      
      restoreStep: (taskId, step, removeDayFromActive) => {
        set((state) => {
          let newActiveDays = state.activeDays;
          if (removeDayFromActive) {
            const hasOtherCompletedStepsToday = state.tasks.some((t) =>
              t.steps.some((s) => 
                s.id !== step.id && 
                s.completed && 
                s.completedAt?.startsWith(removeDayFromActive)
              )
            );
            if (!hasOtherCompletedStepsToday) {
              newActiveDays = state.activeDays.filter((d) => d !== removeDayFromActive);
            }
          }
          
          return {
            activeDays: newActiveDays,
            tasks: state.tasks.map((t) => {
              if (t.id !== taskId) return t;
              
              const newSteps = t.steps.map((s) =>
                s.id === step.id ? { ...step } : s
              );
              
              const completedSteps = newSteps.filter((s) => s.completed && s.completedAt);
              let computedLastWorkedOn: string | undefined;
              if (completedSteps.length > 0) {
                const mostRecent = completedSteps.reduce((latest, s) => {
                  if (!latest.completedAt) return s;
                  if (!s.completedAt) return latest;
                  return s.completedAt > latest.completedAt ? s : latest;
                });
                computedLastWorkedOn = mostRecent.completedAt;
              }
              
              return {
                ...t,
                lastWorkedOn: computedLastWorkedOn,
                steps: newSteps,
              };
            }),
          };
        });
      },
      
      setBrainDump: (text) => set({ brainDump: text }),
      
      addThought: (text) => {
        const newThought: ThoughtItem = {
          id: Date.now().toString(),
          text,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ thoughtDump: [...state.thoughtDump, newThought] }));
      },
      
      removeThought: (id) => {
        set((state) => ({
          thoughtDump: state.thoughtDump.filter((t) => t.id !== id),
        }));
      },
      
      convertThoughtToTask: (thought) => {
        const newTask: Task = {
          id: Date.now().toString(),
          title: thought.text,
          steps: [],
          energyLevel: "medium",
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          tasks: [newTask, ...state.tasks],
          thoughtDump: state.thoughtDump.filter((t) => t.id !== thought.id),
        }));
      },
      
      addDopamineItem: (text, cost) => {
        const newItem: DopamineItem = {
          id: Date.now().toString(),
          text,
          cost,
        };
        set((state) => ({
          dopamineMenu: [...state.dopamineMenu, newItem],
        }));
      },
      
      updateDopamineItem: (id, updates) => {
        set((state) => ({
          dopamineMenu: state.dopamineMenu.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }));
      },
      
      removeDopamineItem: (id) => {
        set((state) => ({
          dopamineMenu: state.dopamineMenu.filter((item) => item.id !== id),
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
      
      restoreBookendState: (completed, lastDate) => {
        set({ bookendCompleted: completed, lastBookendDate: lastDate });
      },
      
      completeOnboarding: () => set({ onboardingCompleted: true }),
      
      addDailyReflection: (text) => {
        const today = new Date().toISOString().split("T")[0];
        set((state) => {
          const existingIndex = state.dailyReflections.findIndex((r) => r.date === today);
          if (existingIndex >= 0) {
            const updated = [...state.dailyReflections];
            updated[existingIndex] = { date: today, text };
            return { dailyReflections: updated };
          }
          return { 
            dailyReflections: [...state.dailyReflections.slice(-30), { date: today, text }] 
          };
        });
      },
      
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
          
          if (!state.firstUseDate) {
            state.firstUseDate = new Date().toISOString();
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
