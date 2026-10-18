import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import ProductsGrid from "./ProductsGrid";
import ApiPanel from "./ApiPanel";
import Toaster from "./Toaster";

const queryClient = new QueryClient();

export default function TanstackOptimistic() {
  return (
    <QueryClientProvider client={queryClient}>
      <p className="hint">
        規格與步驟在 <code>src/practices/tanstack-optimistic/SPEC.md</code>。
        右下角的 TanStack 圖示可以打開 Devtools 看快取。
      </p>
      <ProductsGrid />
      <h2 className="section-title">假後端</h2>
      <ApiPanel />
      <Toaster />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
