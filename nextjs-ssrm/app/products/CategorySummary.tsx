import Link from "next/link";
import { getCategorySummary } from "@/lib/products";

type CategorySummaryProps = {
  active?: string;
};

// 慢的資料抽成自己的 async Server Component
// 它在 await 的時候，只有它自己被卡住，頁面其他部分可以先送出去
export default async function CategorySummary({
  active,
}: CategorySummaryProps) {
  const summary = await getCategorySummary();

  return (
    <ul className="category-list">
      <li>
        <Link
          href="/products"
          className={active ? "category-link" : "category-link active"}
        >
          全部
        </Link>
      </li>
      {summary.map((item) => (
        <li key={item.category}>
          <Link
            href={{ pathname: "/products", query: { category: item.category } }}
            className={
              item.category === active
                ? "category-link active"
                : "category-link"
            }
          >
            <strong>{item.category}</strong> {item.count} 筆 · 平均 $
            {item.averagePrice}
          </Link>
        </li>
      ))}
    </ul>
  );
}
