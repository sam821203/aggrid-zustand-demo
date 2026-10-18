"use server";

import { updateProductPrice } from "@/lib/products";
import { revalidatePath } from "next/cache";

export type ActionResult = { ok: true } | { ok: false; message: string };

export async function updatePriceAction(
  id: number,
  price: number,
): Promise<ActionResult> {
  // Server Action 等於公開的 API，參數是瀏覽器送來的，TypeScript 型別擋不住，要自己檢查
  if (!Number.isInteger(id) || typeof price !== "number") {
    return { ok: false, message: "參數格式錯誤" };
  }

  try {
    await updateProductPrice(id, price);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "更新失敗",
    };
  }

  // 讓 /products 的 Server Component 重新執行，分類統計的平均價格才會更新
  // revalidatePath 放在 try 外面，失敗時就不用重新渲染頁面
  revalidatePath("products");
  return { ok: true };
}
