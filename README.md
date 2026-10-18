# AG Grid × Zustand 練習

AG Grid + Zustand 的小練習集合，每個練習一頁，從左側選單切換。

```bash
npm install
npm run dev
```

另外有一個獨立的 Next.js 練習在 [`nextjs-ssrm/`](./nextjs-ssrm)，練 App Router、Server Action 和 AG Grid Server-Side Row Model，安裝與步驟見該資料夾的 README。

## 結構

```
src/
  practices/
    index.ts                  練習清單（側邊欄與目錄都從這裡讀）
    column-state-persist/     每個練習一個資料夾
      index.tsx               練習頁面的進入點
      Grid.tsx
      store.ts
  layout/Layout.tsx           側邊欄 + 內容區
  pages/                      目錄頁、練習頁
```

## 新增練習

1. 在 `src/practices/` 下開一個資料夾，例如 `row-selection/`，裡面放 `index.tsx`（default export 一個元件），store、元件都放在同一個資料夾。
2. 到 `src/practices/index.ts` 加一筆：

```ts
{
  slug: "row-selection",
  title: "列選取",
  description: "這個練習在做什麼",
  date: "2026-10",
  component: lazy(() => import("./row-selection")),
},
```

網址會是 `/#/practice/row-selection`。每個練習的 zustand persist `name` 記得取不同的 key，避免互相覆蓋。
