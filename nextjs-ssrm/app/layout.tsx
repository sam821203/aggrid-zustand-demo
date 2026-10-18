import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Next.js App Router 練習",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      {/* 用 Providers 包住 body 內容；layout 本身仍然是 Server Component */}
      <Providers>
        <body>
          <header className="site-header">
            <Link href="/">Next.js × AG Grid SSRM</Link>
            <nav>
              <Link href="/products">Products</Link>
            </nav>
          </header>
          <main className="site-main">{children}</main>
        </body>
      </Providers>
    </html>
  );
}
