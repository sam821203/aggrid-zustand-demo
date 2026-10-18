import { Suspense } from "react";
import ProductsGrid from "@/components/ProductsGrid";
import CategorySummary from "./CategorySummary";

type ProductsPageProps = {
  searchParams: Promise<{ category?: string }>;
};

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  // Step 6：頁面本身不再 await 慢的資料，只讀網址參數，很快就能 return
  const { category } = await searchParams;
  const current = category ?? "all";

  console.log(
    "[ProductsPage] render on server",
    category ?? "all",
    new Date().toLocaleTimeString(),
  );

  return (
    <div>
      <h1>Products</h1>
      {/* 統計還沒好之前先顯示 fallback，好了再由伺服器補送 */}
      {/* key 換了就是一個新的 Suspense，切換分類時才會重新顯示 fallback，不會卡住整個導覽 */}
      {/* Add a prefix so the two siblings' keys differ */}
      <Suspense
        key={`summary-${current}`}
        fallback={<p className="hint">分類統計載入中…</p>}
      >
        <CategorySummary active={category} />
      </Suspense>
      <ProductsGrid key={`grid-${current}`} category={category} />
    </div>
  );
}
