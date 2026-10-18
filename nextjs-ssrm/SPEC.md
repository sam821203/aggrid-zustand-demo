# Next.js App Router × AG Grid SSRM 練習

用一個商品列表頁，練 Next.js App Router 的核心觀念：Server / Client Component 怎麼切、資料在哪裡拿、URL 當狀態、Server Action、Streaming。AG Grid 用 Server-Side Row Model（SSRM），讓排序、篩選、分頁都交給後端。

每一步最後的「面試這樣講」是重點：做完之後，試著不看文件把那幾句話講出來。

## 已經準備好的

| 檔案 | 內容 |
| --- | --- |
| `lib/products.ts` | 假資料庫，500 筆商品。`getProducts`（給 SSRM）、`getCategorySummary`（故意慢 1.5 秒）、`updateProductPrice`。開頭有 `import "server-only"` |
| `lib/types.ts` | 前後端共用的型別 |
| `app/layout.tsx`、`app/page.tsx` | 基本版面 |
| `app/products/page.tsx` | 空的頁面，從這裡開始 |

```bash
cd nextjs-ssrm
npm install
npm run dev   # http://localhost:3000/products
```

AG Grid SSRM 是 Enterprise 功能，沒有授權金鑰時會出現浮水印和 console 訊息，練習時可以忽略。

---

## Step 1：Server Component 直接讀資料

**做什麼**
- 把 `app/products/page.tsx` 改成 `async` 元件
- 直接 `await getCategorySummary()`，把每個分類的筆數和平均價格列出來
- 在元件裡 `console.log` 一行

**驗收**
- 畫面出現 5 個分類的統計
- `console.log` 出現在**跑 `npm run dev` 的終端機**。開發模式下瀏覽器 console 也會出現同一行，但前面有灰色的「Server」標籤，那是 React 為了方便除錯轉送過來的，不是在瀏覽器執行
- 瀏覽器 Network 面板看不到任何拿統計資料的 API 請求；右鍵「檢視原始碼」看得到資料已經在 HTML 裡
- 跑一次 `npm run build`：`/products` 前面是 ○（Static），而且 `console.log` 在 **build 的時候**就印出來了。想想看這代表什麼（Step 4 會回來處理）

**面試這樣講**
- App Router 裡元件預設是 Server Component，只在伺服器執行，不會打包進瀏覽器的 JS
- 所以可以直接 `await` 資料庫或內部服務，不用另外開 API，也不會把連線資訊、金鑰暴露給前端
- `server-only` 套件是保險：伺服器專用的模組被 Client Component import 時，build 會直接失敗

---

## Step 2：劃出 Client Component 的邊界

**做什麼**
- 建立 `components/ProductsGrid.tsx`，第一行加 `"use client"`
- 先用一般的 Client-Side Row Model 顯示幾筆假資料就好，下一步再換成 SSRM
- 在 `page.tsx` 裡 render `<ProductsGrid />`

**實驗（做完再改回來）**
1. 拿掉 `"use client"`，看錯誤訊息怎麼說
2. 在 `page.tsx` 傳一個函式給 `ProductsGrid`，例如 `onSelect={() => {}}`，看錯誤訊息
3. 在 `ProductsGrid.tsx` 裡 import `lib/products.ts`，看錯誤訊息

**面試這樣講**
- 需要狀態、事件、瀏覽器 API 或第三方互動元件（AG Grid）時，才標 `"use client"`
- `"use client"` 標的是**邊界**：這個檔案和它 import 的東西都會進到瀏覽器的 bundle。所以邊界要越靠近葉子越好，頁面本身維持 Server Component
- Server 傳給 Client 的 props 必須能序列化：字串、數字、純物件、陣列可以，函式、class 實例不行。Server Action 是例外
- Client Component 不能 import Server Component，但可以透過 `children` 或 props 接收已經 render 好的 Server Component

---

## Step 3：Route Handler + SSRM

**做什麼**
- 建立 `app/api/products/route.ts`，匯出 `POST`，讀 request body，呼叫 `getProducts`，用 `Response.json()` 回傳
- `ProductsGrid` 改成 `rowModelType="serverSide"`，註冊 `ServerSideRowModelModule`（來自 `ag-grid-enterprise`）
- 寫一個 `serverSideDatasource`：在 `getRows` 裡把 `params.request` POST 到 `/api/products`，成功時呼叫 `params.success({ rowData, rowCount })`，失敗時呼叫 `params.fail()`
- name 欄加文字篩選、price 欄加數字篩選
- 設定 `getRowId`

**驗收**
- 一開始只請求 `startRow: 0, endRow: 100`（或你設定的 `cacheBlockSize`），往下捲才請求下一段
- 點欄位標題排序、或使用篩選，會帶著 `sortModel` / `filterModel` 重新請求
- 捲軸長度對應總筆數 500

**面試這樣講**
- SSRM 適合資料量大到不能一次全部載入的情況：表格只跟後端要「目前看得到的那一段」，排序、篩選、分頁都由後端處理
- Route Handler 就是 App Router 裡的 API endpoint。這裡用它，是因為 AG Grid 的 datasource 在瀏覽器裡，需要一個可以被 `fetch` 的 HTTP 介面
- 想想看：為什麼這裡不用 Server Component 直接把資料傳給表格？（提示：誰決定要哪一段資料、什麼時候要）

---

## Step 4：用 URL 當狀態

**做什麼**
- 把 Step 1 的分類統計改成連結，點下去網址變成 `/products?category=Fruit`
- `page.tsx` 從 `searchParams` 讀出 `category`（Next 15 之後它是 Promise，要 `await`），當成 props 傳給 `ProductsGrid`
- `ProductsGrid` 在請求裡帶上 `category`，分類變了要重新載入表格
- 目前選中的分類要有不同的樣式

**驗收**
- 點分類，表格只剩那一類，網址跟著變
- 直接打開 `/products?category=Dairy`，一進來就是 Dairy
- 瀏覽器上一頁、下一頁可以切回去
- `npm run build` 的輸出裡，`/products` 從 ○（Static）變成 ƒ（Dynamic）

**面試這樣講**
- 篩選條件放在 URL，可以分享、可以重新整理、可以上一頁，伺服器也拿得到，不用額外的全域 state
- 讀 `searchParams` 會讓頁面變成動態渲染，因為每個請求的結果都不一樣
- 表格重新載入有兩種做法：給 `ProductsGrid` 加 `key={category}` 讓它重新掛載，或保留實例、在 effect 裡呼叫 `api.refreshServerSide({ purge: true })`。兩種的差別是什麼？

---

## Step 5：Server Action 修改資料

**做什麼**
- 建立 `app/products/actions.ts`，第一行 `"use server"`，匯出 `updatePriceAction(id, price)`，裡面呼叫 `updateProductPrice`
- 成功後呼叫 `revalidatePath("/products")`
- price 欄改成可編輯，編輯完成時在 Client Component 裡**直接呼叫** `updatePriceAction`
- 錯誤不要直接丟出去，回傳 `{ ok: false, message }` 讓畫面顯示
- 成功後重新整理表格那一段資料

**驗收**
- 改價格後，Step 1 的平均價格跟著更新，頁面沒有整頁重新整理
- 價格改成負數，畫面顯示錯誤訊息
- Network 面板裡，Server Action 是一個 POST 到 `/products` 的請求，不是你寫的 API

**面試這樣講**
- Server Action 是可以從 Client Component 直接呼叫的伺服器函式，Next 會自動幫你產生 endpoint 和序列化
- 改資料時優先用 Server Action：型別一路共用，還能搭配 `revalidatePath` / `revalidateTag` 讓 Server Component 拿到新資料
- Route Handler 適合要給外部呼叫、要控制 HTTP 細節（method、header、status），或像 SSRM 這種由第三方套件主動發請求的情況
- Server Action 的參數來自瀏覽器，等同公開 API，伺服器端一定要自己驗證

---

## Step 6：Streaming

**做什麼**
- 把分類統計抽成獨立的 async Server Component，用 `<Suspense fallback={...}>` 包起來
- 加 `app/products/loading.tsx` 和 `app/products/error.tsx`
- 在 `getCategorySummary` 裡暫時丟一個錯誤，看 `error.tsx` 的效果，再改回來

**驗收**
- 打開頁面時，標題和表格先出現，統計區塊先顯示 fallback，大約 1.5 秒後才出現
- 統計丟錯時，只有那個區塊受影響，或整頁顯示 `error.tsx`（取決於你把錯誤邊界放在哪）

**面試這樣講**
- Streaming 讓伺服器把 HTML 分段送出：快的部分先到，慢的部分準備好再補上，不用等最慢的資料
- `loading.tsx` 等於自動幫整個路由段包一層 Suspense；手動加 `<Suspense>` 可以控制得更細
- `error.tsx` 必須是 Client Component，因為它要提供「重試」這種互動

---

## Step 7：Providers 與 TanStack Query

**做什麼**
- 建立 `app/providers.tsx`（`"use client"`），裡面用 `QueryClientProvider` 包住 `children`，在 `layout.tsx` 使用
- 在 SSRM 的 `getRows` 裡改用 `queryClient.fetchQuery`，`queryKey` 包含整個請求內容，設定 `staleTime`
- Server Action 成功後，`invalidateQueries` 再重新整理表格

**驗收**
- 依序做「排序 asc → desc → asc」，第二次 asc 不會發出新的請求
- 改價格後，表格顯示新值，不會拿到快取裡的舊資料

**面試這樣講**
- Context Provider 只能在 Client Component 裡使用，所以 App Router 的慣例是做一個 `providers.tsx`，在 layout 裡包住 `children`
- `children` 是 Server Component 先 render 好再傳進來的，所以包在 Client Provider 裡面，**不會**讓整個 App 變成 Client Component
- 分工：初始資料、SEO 需要的內容交給 Server Component；使用者互動後才需要、要快取和重試的資料交給 TanStack Query

---

## 面試自我檢查

做完之後，試著各用兩三句話回答：

1. Server Component 和 Client Component 怎麼劃分？`"use client"` 標在哪裡比較好？
2. 從 Server 傳 props 給 Client 有什麼限制？
3. Route Handler 和 Server Action 各在什麼情況用？
4. `revalidatePath` 做了什麼？跟 TanStack Query 的 `invalidateQueries` 有什麼不同？
5. 為什麼讀 `searchParams` 會讓頁面變成動態渲染？
6. Streaming 和 Suspense 解決什麼問題？
7. 有了 Server Component，什麼時候還需要 TanStack Query？
8. AG Grid 的 SSRM 和 Client-Side Row Model 差在哪？什麼時候該用 SSRM？
