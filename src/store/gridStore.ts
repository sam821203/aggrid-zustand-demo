import type { ColumnState } from "ag-grid-community";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ColStateItem = Pick<
  ColumnState,
  "colId" | "hide" | "pinned" | "width"
>;
export type ColState = ColStateItem[];

type GridState = {
  colState: ColState | null;
  setColState: (s: ColState) => void;
  reset: () => void;
};

export const useGridStore = create<GridState>()(
  persist(
    (set) => ({
      colState: null,
      setColState: (s) => set({ colState: s }),
      reset: () => set({ colState: null }),
    }),
    {
      name: "grid-storage",
      partialize: (s) => ({ colState: s.colState }),
    }
  )
);
