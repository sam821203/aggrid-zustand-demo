import { useMemo, useState } from "react";
import { AgGridReact, type CustomCellRendererProps } from "ag-grid-react";
import type {
  CellClassParams,
  CellEditRequestEvent,
  ColDef,
  EditableCallbackParams,
  GetRowIdParams,
  RowClassParams,
} from "ag-grid-community";
import type { Product } from "./api";
import {
  isTempId,
  productKeys,
  useCreateProduct,
  useDeleteProduct,
  useProducts,
  useToggleActive,
  useUpdateProduct,
  type UpdateVariables,
} from "./queries";
import { useMutationState } from "@tanstack/react-query";

type GridRow = Product & { pendingFields?: string[] };

const getRowId = (params: GetRowIdParams<GridRow>) => params.data.id;

const pendingRule = {
  "cell-pending": (params: CellClassParams<GridRow>) =>
    !!params.data?.pendingFields?.includes(params.colDef.field ?? ""),
};

// 暫時 id 的列（後端還沒回應的新增）不能編輯
// 這時候送 PATCH 會帶著 temp id，後端根本找不到這筆商品
const editableIfSaved = (params: EditableCallbackParams<GridRow>) =>
  !isTempId(params.data?.id ?? "");

// 還在新增中的整列套用處理中樣式
const rowClassRules = {
  "row-pending": (params: RowClassParams<GridRow>) =>
    isTempId(params.data?.id ?? ""),
};

function DeleteButton({ data }: CustomCellRendererProps<GridRow>) {
  const deleteMutation = useDeleteProduct();
  if (!data) return null;

  return (
    <button
      className="grid-button"
      disabled={isTempId(data.id)}
      onClick={() => deleteMutation.mutate(data.id)}
    >
      刪除
    </button>
  );
}

// Step 7：新增商品的預設值，名稱由輸入框決定
const newProductDefaults = {
  category: "Uncategorized",
  price: 0,
  stock: 0,
  active: false,
};

export default function ProductsGrid() {
  const { data, isPending, isError, error } = useProducts();
  const updateMutation = useUpdateProduct();
  const toggleActive = useToggleActive();
  const createMutation = useCreateProduct();
  const [newName, setNewName] = useState("New product");

  // 取出「所有」還在進行中的更新的 variables
  const pendingVariables = useMutationState({
    filters: { mutationKey: productKeys.update, status: "pending" },
    select: (mutation) => mutation.state.variables as UpdateVariables,
  });

  // 值已經在快取裡了（onMutate 寫進去的），這裡只負責加上處理中的標記
  const rows = useMemo<GridRow[] | undefined>(() => {
    if (!data) return data;
    if (pendingVariables.length === 0) return data;

    return data.map((row) => {
      // 找出這一列所有進行中的更新，把它們改到的欄位全部收集起來
      const fields = pendingVariables
        .filter((variables) => variables.id === row.id)
        .flatMap((variables) => Object.keys(variables.patch));

      // 沒有處理中的欄位就維持原物件，AG Grid 不用重繪這一列
      return fields.length > 0 ? { ...row, pendingFields: fields } : row;
    });
  }, [data, pendingVariables]);

  const columnDefs = useMemo<ColDef<GridRow>[]>(
    () => [
      { field: "id", width: 80 },
      { field: "name", flex: 1 },
      { field: "category", width: 130 },
      {
        field: "price",
        width: 110,
        editable: editableIfSaved,
        cellClassRules: pendingRule,
      },
      {
        field: "stock",
        width: 110,
        editable: editableIfSaved,
        cellClassRules: pendingRule,
      },
      {
        field: "active",
        headerName: "上架",
        width: 100,
        editable: editableIfSaved,
        cellClassRules: pendingRule,
      },
      {
        headerName: "",
        width: 90,
        sortable: false,
        cellRenderer: DeleteButton,
      },
    ],
    [],
  );

  const onCellEditRequest = (event: CellEditRequestEvent<GridRow>) => {
    const field = event.colDef.field;

    // 在 Number() 轉換之前
    if (field === "active") {
      toggleActive(event.data.id);
      return;
    }

    const value = Number(event.newValue);

    if (event.newValue === null || Number.isNaN(value)) return;

    if (field === "price") {
      updateMutation.mutate({ id: event.data.id, patch: { price: value } });
    } else if (field === "stock") {
      updateMutation.mutate({ id: event.data.id, patch: { stock: value } });
    }
  };

  return (
    <>
      {isError && <p>讀取失敗：{error.message}</p>}
      <form
        className="grid-toolbar"
        onSubmit={(event) => {
          event.preventDefault();
          createMutation.mutate({ ...newProductDefaults, name: newName });
        }}
      >
        <input
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder="商品名稱"
          aria-label="商品名稱"
        />
        <button type="submit">新增商品</button>
      </form>
      <div style={{ width: "100%", height: 360 }}>
        <AgGridReact<GridRow>
          rowData={rows}
          getRowId={getRowId}
          columnDefs={columnDefs}
          loading={isPending}
          rowClassRules={rowClassRules}
          readOnlyEdit // 資料只有一個來源，就是 TanStack 快取
          onCellEditRequest={onCellEditRequest}
        />
      </div>
    </>
  );
}
