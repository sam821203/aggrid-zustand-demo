import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchProducts,
  updateProduct,
  type NewProduct,
  type Product,
} from "./api";

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

      // 2. 先存一份目前的快取，失敗時用來還原（一定要在 setQueryData 之前）
      const previous = queryClient.getQueryData<Product[]>(productKeys.all);

      // 3. 直接把新值寫進快取，所有讀 ["products"] 的元件都會立刻更新
      //    回傳新陣列、新物件，不能改 old 本身
      const applyPatch = (old: Product[] | undefined) =>
        old?.map((product) =>
          product.id === id ? { ...product, ...patch } : product,
        );
      queryClient.setQueryData<Product[]>(productKeys.all, applyPatch);

      // 4. 回傳值會變成 onError / onSettled 的第三個參數
      return { previous };
    },
    // 請求失敗時，用 onMutate 存下的舊資料把快取還原
    onError: (_error, _variables, onMutateResult) => {
      if (onMutateResult?.previous) {
        queryClient.setQueryData(productKeys.all, onMutateResult.previous);
      }
    },
    // 不管成功或失敗都向伺服器重抓一次，確保快取最後跟後端一致
    onSettled: () => {
      return queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

// Step 6：useToggleActive（處理連續點擊）
// Step 7：useCreateProduct、useDeleteProduct
