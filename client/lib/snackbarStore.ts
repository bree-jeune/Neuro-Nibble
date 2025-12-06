import { create } from "zustand";

export interface SnackbarState {
  visible: boolean;
  message: string;
  undoAction: (() => void) | null;
  timeoutId: ReturnType<typeof setTimeout> | null;
}

interface SnackbarStore extends SnackbarState {
  show: (message: string, undoAction?: () => void) => void;
  hide: () => void;
  undo: () => void;
}

export const useSnackbarStore = create<SnackbarStore>((set, get) => ({
  visible: false,
  message: "",
  undoAction: null,
  timeoutId: null,

  show: (message, undoAction) => {
    const current = get();
    if (current.timeoutId) {
      clearTimeout(current.timeoutId);
    }

    const timeoutId = setTimeout(() => {
      set({ visible: false, message: "", undoAction: null, timeoutId: null });
    }, 4000);

    set({
      visible: true,
      message,
      undoAction: undoAction || null,
      timeoutId,
    });
  },

  hide: () => {
    const { timeoutId } = get();
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    set({ visible: false, message: "", undoAction: null, timeoutId: null });
  },

  undo: () => {
    const { undoAction, timeoutId } = get();
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    if (undoAction) {
      undoAction();
    }
    set({ visible: false, message: "", undoAction: null, timeoutId: null });
  },
}));
