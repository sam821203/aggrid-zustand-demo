import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchProducts,
  updateProduct,
  type NewProduct,
  type Product,
} from "./api";
import { useToastStore } from "./toast";

export type UpdateVariables = {
  id: string;
  patch: Partial<NewProduct>;
};

export const productKeys = {
  all: ["products"] as const,
  // mutation 的識別 key，讓別的地方能用 useMutationState 找到「所有進行中的更新」
  update: ["updateProduct"] as const,
};

export function useProducts() {
  return useQuery({
    queryKey: productKeys.all,
    queryFn: fetchProducts,
  });
}

// 把 useUpdateProduct 改成樂觀更新
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: productKeys.update,
    mutationFn: ({ id, patch }: UpdateVariables) => updateProduct(id, patch),
    // 送出前
    onMutate: async ({ id, patch }) => {
      // 1. 取消正在進行的 GET，避免它帶著舊資料回來，蓋掉等一下寫入的樂觀值
      await queryClient.cancelQueries({ queryKey: productKeys.all });

      // 2. 只記住「這一列、這次要改的欄位」的舊值，而不是整份清單
      //    整份快照在回滾時會把其他列進行中的樂觀值一起蓋掉
      const target = queryClient
        .getQueryData<Product[]>(productKeys.all)
        ?.find((product) => product.id === id);

      const previousValues = target
        ? (Object.fromEntries(
            Object.keys(patch).map((key) => [
              key,
              target[key as keyof NewProduct],
            ]),
          ) as Partial<NewProduct>)
        : undefined;

      // 3. 直接把新值寫進快取，所有讀 ["products"] 的元件都會立刻更新
      //    回傳新陣列、新物件，不能改 old 本身
      const applyPatch = (old: Product[] | undefined) =>
        old?.map((product) =>
          product.id === id ? { ...product, ...patch } : product,
        );
      queryClient.setQueryData<Product[]>(productKeys.all, applyPatch);

      // 4. 回傳值會變成 onError / onSettled 的第三個參數
      //    name 留給錯誤訊息用，讓使用者知道是哪個商品失敗
      return { previousValues, name: target?.name };
    },
    // 請求失敗時，只回滾這一列被這次修改動到的欄位，並顯示錯誤訊息
    onError: (error, { id, patch }, onMutateResult) => {
      const previousValues = onMutateResult?.previousValues;

      if (previousValues) {
        queryClient.setQueryData<Product[]>(productKeys.all, (old) =>
          old?.map((product) => {
            if (product.id !== id) return product;

            // 只還原「目前值還是這次寫入的樂觀值」的欄位
            // 如果使用者在這次請求失敗前又改了同一格，就保留比較新的那個值
            const rollback = Object.fromEntries(
              Object.entries(previousValues).filter(
                ([key]) =>
                  product[key as keyof NewProduct] ===
                  patch[key as keyof NewProduct],
              ),
            );

            return { ...product, ...rollback };
          }),
        );
      }

      // 錯誤原因從 onError 的第一個參數拿，也就是後端丟出的 Error
      const name = onMutateResult?.name ?? id;
      useToastStore.getState().showError(`更新 ${name} 失敗：${error.message}`);
    },
    // 不管成功或失敗都向伺服器重抓一次，確保快取最後跟後端一致
    onSettled: () => {
      return queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

// Step 6：useToggleActive（處理連續點擊）
// Step 7：useCreateProduct、useDeleteProduct
