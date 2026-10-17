export const productKeys = {
  all: ["products"] as const,
};

// Step 1：useProducts
// Step 2：useUpdateProduct（先做非樂觀版本）
// Step 4：把 useUpdateProduct 改成樂觀更新
// Step 6：useToggleActive（處理連續點擊）
// Step 7：useCreateProduct、useDeleteProduct
