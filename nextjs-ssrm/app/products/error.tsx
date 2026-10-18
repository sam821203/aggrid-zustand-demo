"use client";

// error.tsx 一定要是 Client Component：它是 React 的 Error Boundary，還要處理「重試」按鈕的點擊
type ErrorProps = {
  error: unknown;
  retry: () => void;
};

export default function ProductsError({ error, retry }: ErrorProps) {
  // production 下 Server Component 的錯誤訊息會被遮掉，只留 digest 讓你去伺服器 log 對照
  const digest =
    error instanceof Error
      ? (error as Error & { digest?: string }).digest
      : undefined;

  return (
    <div>
      <h2>載入失敗</h2>
      <p className="error">
        {error instanceof Error ? error.message : "發生錯誤"}
      </p>
      {digest && <p className="hint">錯誤代碼：{digest}</p>}
      {/* retry：重新向伺服器要這一段，再重新渲染 */}
      <button onClick={() => retry()}>重試</button>
    </div>
  );
}
