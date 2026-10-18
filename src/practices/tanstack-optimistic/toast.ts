import { create } from "zustand";

export type Toast = {
  id: number;
  message: string;
};

type ToastState = {
  toasts: Toast[];
  showError: (message: string) => void;
  dismiss: (id: number) => void;
};

// 幾秒後自動關閉
const AUTO_DISMISS_MS = 4000;

let nextId = 1;

// toast 放在 zustand store，非 React 的地方（例如 mutation 的 onError）也能直接呼叫
export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],
  showError: (message) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, message }] }));
    setTimeout(() => get().dismiss(id), AUTO_DISMISS_MS);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
