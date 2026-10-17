import { lazy, type ComponentType, type LazyExoticComponent } from "react";

export type Practice = {
  slug: string;
  title: string;
  description: string;
  date: string;
  component: LazyExoticComponent<ComponentType>;
};

// 新增練習：在 src/practices/ 下開一個資料夾，再到這裡加一筆
export const practices: Practice[] = [
  {
    slug: "column-state-persist",
    title: "欄位狀態持久化",
    description:
      "用 zustand persist 記住 AG Grid 的欄位順序、寬度、隱藏與釘選，重新整理後還原。",
    date: "2025-08",
    component: lazy(() => import("./column-state-persist")),
  },
];
