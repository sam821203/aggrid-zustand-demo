import Link from "next/link";

export default function Home() {
  return (
    <div>
      <h1>Next.js App Router 練習</h1>
      <p className="hint">
        規格在 <code>SPEC.md</code>，練習頁面是 <Link href="/products">/products</Link>。
      </p>
    </div>
  );
}
