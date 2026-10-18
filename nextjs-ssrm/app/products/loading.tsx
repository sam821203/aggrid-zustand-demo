// 整個 /products 路由段的 fallback，等於 Next 自動幫 page.tsx 外面包一層 <Suspense>
export default function Loading() {
  return <p className="hint">頁面載入中…</p>;
}
