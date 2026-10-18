// Step 1 從這裡開始：把這個頁面改成 async Server Component，直接呼叫 lib/products.ts 讀資料

import ProductsGrid from "@/components/ProductsGrid";
import { getCategorySummary } from "@/lib/products";
import Link from "next/link";

type ProductsPageProps = {
  searchParams: Promise<{ category?: string }>;
};

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  // 讀 searchParams 之後，這一頁就變成每個請求都重新渲染（Dynamic）
  const { category } = await searchParams;
  const summary = await getCategorySummary();
  console.log(
    "[ProductsPage] render on server",
    category ?? "all",
    new Date().toLocaleTimeString(),
  );

  return (
    <div>
      <h1>Products</h1>
      <ul className="category-list">
        {/* 「全部」就是沒有 category 的網址 */}
        <li>
          <Link
            href="/products"
            className={category ? "category-link" : "category-link active"}
          >
            全部
          </Link>
        </li>
        {summary.map((item) => (
          <li key={item.category}>
            {/* 用 <Link> 換網址：只重新跑 Server Component，不會整頁重新載入 */}
            <Link
              href={{
                pathname: "/products",
                query: { category: item.category },
              }}
              className={
                item.category ? "category-link" : "category-link active"
              }
            >
              <strong>{item.category}</strong> {item.count} 筆 · 平均 $
              {item.averagePrice}
            </Link>
          </li>
        ))}
      </ul>
      <ProductsGrid key={category ?? "all"} category={category} />
    </div>
  );
}
