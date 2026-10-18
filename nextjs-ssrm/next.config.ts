import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 這個專案放在另一個專案（外層的 Vite 練習）的子資料夾裡，兩層都有 package-lock.json
  // 明確指定根目錄，避免 Next 把外層當成專案根目錄、從外層的 node_modules 解析套件
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
