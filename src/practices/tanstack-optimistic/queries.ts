import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createProduct,
  deleteProduct,
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

export const TEMP_ID_PREFIX = "temp-";

export const productKeys = {
  all: ["products"] as const,
  // mutation 的識別 key，讓別的地方能用 useMutationState 找到「所有進行中的更新」
  mutations: ["productMutation"] as const,
  update: ["productMutation", "update"] as const,
  create: ["productMutation", "create"] as const,
  remove: ["productMutation", "delete"] as const,
};

export function isTempId(id: string) {
  return id.startsWith(TEMP_ID_PREFIX);
}

export function useProducts() {
  return useQuery({
    queryKey: productKeys.all,
    queryFn: fetchProducts,
  });
}

function refetchIfLastMutation(queryClient: QueryClient) {
  // 改成數 productKeys.mutations，新增、更新、刪除會一起算
  // 不然一筆更新完成時，如果還有新增在跑，重抓回來的清單會把那筆暫時的新增列蓋掉
  if (queryClient.isMutating({ mutationKey: productKeys.mutations }) === 1) {
    return queryClient.invalidateQueries({ queryKey: productKeys.all });
  }
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
    // 不管成功或失敗都向伺服器重抓一次，只有最後一個才重抓
    onSettled: () => refetchIfLastMutation(queryClient),
  });
}

// 處理連續點擊
export function useToggleActive() {
  const queryClient = useQueryClient();
  const { mutate } = useUpdateProduct();

  return (id: string) => {
    const product = queryClient
      .getQueryData<Product[]>(productKeys.all)
      ?.find((item) => item.id === id);
    if (!product) return;

    mutate({ id, patch: { active: !product.active } });
  };
}
// 樂觀新增
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: productKeys.create,
    mutationFn: (input: NewProduct) => createProduct(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: productKeys.all });

      // 後端還沒給 id，先產生一個暫時 id，讓 AG Grid 的 getRowId 有東西可以認
      const tempId = `${TEMP_ID_PREFIX}${Date.now()}`;

      // 直接把新的一列加到清單最後面，使用者馬上就看得到
      queryClient.setQueryData<Product[]>(productKeys.all, (old) => [
        ...(old ?? []),
        { ...input, id: tempId },
      ]);

      return { tempId };
    },
    // 成功：把暫時那一列換成後端回傳的資料（帶有真 id）
    onSuccess: (created, _input, onMutateResult) => {
      queryClient.setQueryData<Product[]>(productKeys.all, (old) => {
        old?.map((product) =>
          product.id === onMutateResult?.tempId ? created : product,
        );
      });
    },

    // 失敗：新增的回滾就是把暫時那一列拿掉，不用存舊資料
    onError: (error, _input, onMutateResult) => {
      queryClient.setQueryData<Product[]>(productKeys.all, (old) =>
        old?.filter((product) => product.id !== onMutateResult?.tempId),
      );
      useToastStore.getState().showError(`新增失敗：${error.message}`);
    },
  });
}

// 樂觀刪除
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: productKeys.remove,
    mutationFn: (id: string) => deleteProduct(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: productKeys.all });

      const list = queryClient.getQueryData<Product[]>(productKeys.all) ?? [];

      // 失敗時要放回「原本的位置」，所以除了被刪掉的那筆資料，還要記住它在第幾列
      const index = list.findIndex((product) => product.id === id);
      const removed = index >= 0 ? list[index] : undefined;

      queryClient.setQueryData<Product[]>(productKeys.all, (old) =>
        old?.filter((product) => product.id !== id),
      );

      return { removed, index };
    },

    // 失敗：用存下來的 index 插回原位，而不是 push 到最後
    onError: (error, id, onMutateResult) => {
      const removed = onMutateResult?.removed;

      if (removed) {
        queryClient.setQueryData<Product[]>(productKeys.all, (old) => {
          const list = old ?? [];
          // 防止重複：如果期間重抓過，這一列可能已經被放回來了
          if (list.some((product) => product.id === id)) return list;

          const next = [...list];
          // 期間如果有別列被刪掉，清單變短，index 可能超出範圍，所以取較小值
          next.splice(Math.min(onMutateResult.index, next.length), 0, removed);
          return next;
        });
      }

      const name = removed?.name ?? id;
      useToastStore.getState().showError(`刪除 ${name} 失敗：${error.message}`);
    },

    onSettled: () => refetchIfLastMutation(queryClient),
  });
}
