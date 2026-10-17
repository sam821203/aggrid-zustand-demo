# TanStack Query 樂觀更新練習

用 TanStack Query v5 管理一份商品清單的伺服器狀態，用 AG Grid 呈現與編輯，一步步從「一般更新」做到「樂觀更新 + 失敗回滾 + 併發處理」。

頁面網址：`/#/practice/tanstack-optimistic`

## 已經幫你準備好的

| 檔案 | 內容 | 要不要改 |
| --- | --- | --- |
| `api.ts` | 假後端：`fetchProducts`、`updateProduct`、`createProduct`、`deleteProduct`。資料存在記憶體，每個請求都會延遲，並依失敗率隨機失敗 | 不用改，但請先讀過 |
| `ApiPanel.tsx` | 頁面下方的控制面板：調延遲、調失敗率、看請求紀錄 | 不用改 |
| `index.tsx` | 已包好 `QueryClientProvider` 和 Devtools | 通常不用改 |
| `queries.ts` | 只有 query key，hooks 由你寫 | **你的主戰場** |
| `ProductsGrid.tsx` | 欄位定義好了，資料是空陣列 | **你的主戰場** |

假後端的驗證規則：價格或庫存是負數會失敗、商品名稱空白會失敗。這讓你不用靠運氣也能穩定觸發錯誤。

## 練習方式

每一步都有「目標」「驗收標準」「提示」。先只看目標和驗收標準自己做，卡住再看提示。每做完一步可以自己 commit 一次，方便回頭比較。

---

## Step 1：用 useQuery 讀取資料

**目標**：表格顯示假後端的 5 筆商品。

**驗收標準**
- 進頁面時有載入狀態（可以用 AG Grid 的 loading overlay，或在表格上方顯示文字）
- 把失敗率調到 100% 再重新整理，畫面要顯示錯誤訊息，而不是空白表格
- Devtools 裡看得到 `["products"]` 這個 query

**提示**
- `useQuery` 的 `queryKey` 用 `productKeys.all`，`queryFn` 用 `fetchProducts`
- AG Grid 有 `loading` prop
- 想一下：失敗時 TanStack Query 預設會重試幾次？請求紀錄裡看得出來嗎？

---

## Step 2：一般的 mutation（非樂觀）

**目標**：在表格裡改價格或庫存，送到後端，成功後重新抓資料。

**驗收標準**
- 改完儲存格後，請求紀錄出現 PATCH
- 等延遲過去、PATCH 成功後，表格才顯示新值（重新 GET 之後）
- 把價格改成負數，PATCH 失敗，畫面上要讓使用者知道失敗了，表格值要維持舊的

**提示**
- `useMutation` + 成功後 `queryClient.invalidateQueries`
- **AG Grid 的坑**：預設編輯會直接改掉 rowData 物件本身，等於你在 TanStack 快取外面偷改資料。查一下 `readOnlyEdit` 和 `onCellEditRequest`，讓表格只負責「發出想改的請求」，資料一律以快取為準
- 用 `getRowId` 讓 AG Grid 用 `id` 認列，資料更新時才不會整張表重繪

這一步做完，你會明顯感覺到「改完要等 1 秒多才看到」，這就是下一步要解決的問題。

---

## Step 3：用 mutation 的 variables 做「畫面層」樂觀更新

**目標**：不碰快取，只在 UI 上先顯示使用者送出的值。

**驗收標準**
- 改價格後，該儲存格立刻顯示新值，並有「處理中」的樣式（例如灰色或斜體）
- 成功後樣式消失，值維持
- 失敗後顯示回舊值

**提示**
- `useMutation` 回傳的 `variables` 和 `isPending`
- AG Grid 可以用 `cellClassRules` 或 `cellRenderer` 判斷這格是不是正在送出的那一格
- 想一下：這個做法在「只有一個元件會顯示這筆資料」時很好用，但如果別的元件也讀 `["products"]`，它們看得到新值嗎？

---

## Step 4：透過快取的樂觀更新（重點）

**目標**：改成直接改快取，讓所有讀 `["products"]` 的地方都立刻看到新值。

**驗收標準**
- 改價格後表格立刻變，不用等延遲
- 失敗時（價格改負數，或失敗率調 100%）自動回滾成舊值
- 不論成功或失敗，最後都會和後端重新同步一次
- Devtools 裡能看到快取先變、之後被重新抓取

**提示**
- 四個 callback：`onMutate`、`onError`、`onSuccess`、`onSettled`
- `onMutate` 裡要做的事有順序：先 `cancelQueries`，再 `getQueryData` 存一份舊資料，再 `setQueryData` 寫新值，最後把舊資料 return 出去當 context
- 為什麼要先 `cancelQueries`？試試看不加，然後在延遲 3000ms 時快速改值，觀察會發生什麼
- `setQueryData` 一定要回傳新陣列、新物件，不能直接改原本的

---

## Step 5：錯誤處理體驗

**目標**：失敗時讓使用者清楚知道哪裡失敗、為什麼。

**驗收標準**
- 失敗時顯示錯誤訊息（自己做一個簡單的 toast 或表格上方的提示列），內容包含後端回的錯誤原因
- 失敗訊息幾秒後自動消失，或可手動關閉
- 失敗率 50% 時連改好幾格，每一格的結果都要正確（成功的留著、失敗的回滾）

**提示**
- 錯誤訊息從 `onError` 的第一個參數拿
- 想一下：連改兩格，第一格失敗時用 context 回滾，會不會把第二格的樂觀值也一起蓋掉？如果會，要怎麼只回滾那一筆？

---

## Step 6：快速連點與併發

**目標**：讓「上架」欄可以點一下就切換 true/false，並處理使用者狂點的情況。

**驗收標準**
- 「上架」欄點擊即切換（checkbox 或自訂 renderer 都可以），樂觀更新
- 把延遲調到 3000ms，同一格連點 5 次：畫面不能閃回中間狀態，最終值要和後端一致
- 請求紀錄裡能看到 5 個 PATCH，但只在最後一個結束後才重新 GET 一次

**提示**
- 問題出在：每個 mutation 的 `onSettled` 都會 invalidate，前面幾個結束時觸發的 GET 會把還沒送完的樂觀值蓋回舊值
- 查 `mutationKey` 和 `queryClient.isMutating`，只在「沒有其他同類 mutation 進行中」時才 invalidate
- 加分：這種情況其實可以只送最後一次，查查 debounce 的做法，想想跟樂觀更新怎麼搭配

---

## Step 7：樂觀新增與刪除

**目標**：表格上方加「新增商品」和每列的「刪除」按鈕，兩者都要樂觀更新。

**驗收標準**
- 新增：按下後立刻出現一列（可以用預設值，例如名稱 `New product`），成功後換成後端給的真正 id
- 新增時把名稱留空送出，失敗後那一列要消失
- 刪除：按下立刻消失，失敗時要回到原本的位置（不是跑到最後一列）

**提示**
- 新增時先用暫時 id（例如 `temp-` 開頭），`onSuccess` 再把暫時那筆換成後端回傳的資料
- 暫時 id 的那列，在拿到真 id 之前能不能被編輯或刪除？想一下該怎麼處理
- 刪除回滾要回到原位置，context 裡要存什麼？

---

## 加分題

- 用 AG Grid 的 `rowClassRules` 讓「處理中」的整列有不同樣式
- 做一個「復原」按鈕：刪除後 5 秒內可以撤銷
- 把 Step 4 的 `onMutate` / `onError` 邏輯抽成可重用的 helper，讓 Step 6、7 共用
- 比較 Step 3 和 Step 4 的做法，寫幾句筆記放在這個資料夾，什麼情況各自比較適合

## 參考

- TanStack Query 官方文件 Optimistic Updates：https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates
- AG Grid Read Only Edit：https://www.ag-grid.com/react-data-grid/value-setters/
