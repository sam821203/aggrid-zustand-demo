// 前後端共用的型別。這個檔案沒有任何 server-only 的東西，所以 Server 和 Client Component 都能 import

export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
};

export type CategorySummary = {
  category: string;
  count: number;
  averagePrice: number;
};

// AG Grid Server-Side Row Model 送來的請求，只取這個練習會用到的欄位
export type ProductsRequest = {
  startRow: number;
  endRow: number;
  sortModel: { colId: string; sort: "asc" | "desc" }[];
  filterModel: Record<string, { filterType: string; type?: string; filter?: string | number }>;
  category?: string;
};

export type ProductsResponse = {
  rows: Product[];
  // 符合條件的總筆數，讓 AG Grid 知道捲軸要多長、何時停止要資料
  rowCount: number;
};
