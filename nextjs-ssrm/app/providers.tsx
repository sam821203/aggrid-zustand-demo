"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function Providers({ children }: { children: React.ReactNode }) {
  // 用初始化函式建立，整個 App 生命週期只建立一次
  // 不放在模組最外層，避免伺服器上不同使用者的請求共用同一份快取
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
