import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProducts, updateProduct, type NewProduct } from "./api";

type UpdateVariables = {
  id: string;
  patch: Partial<NewProduct>;
};

export const productKeys = {
  all: ["products"] as const,
};

// Step 1：useProducts
export function useProducts() {
  return useQuery({
    queryKey: productKeys.all,
    queryFn: fetchProducts,
  });
}

// Step 2：useUpdateProduct（先做非樂觀版本）
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patch }: UpdateVariables) => updateProduct(id, patch),
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

// Step 4：把 useUpdateProduct 改成樂觀更新
// Step 6：useToggleActive（處理連續點擊）
// Step 7：useCreateProduct、useDeleteProduct
