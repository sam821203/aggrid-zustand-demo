import { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import type {
  CellClassParams,
  CellEditRequestEvent,
  ColDef,
  GetRowIdParams,
} from "ag-grid-community";
import type { Product } from "./api";
import {
  productKeys,
  useProducts,
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

export default function ProductsGrid() {
  const { data, isPending, isError, error } = useProducts();
  const updateMutation = useUpdateProduct();

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
        editable: true,
        cellClassRules: pendingRule,
      },
      {
        field: "stock",
        width: 110,
        editable: true,
        cellClassRules: pendingRule,
      },
      { field: "active", headerName: "上架", width: 100 },
    ],
    [],
  );

  const onCellEditRequest = (event: CellEditRequestEvent<GridRow>) => {
    const field = event.colDef.field;
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
      {updateMutation.isError && (
        <p className="hint">更新失敗：{updateMutation.error.message}</p>
      )}
      <div style={{ width: "100%", height: 360 }}>
        <AgGridReact<GridRow>
          rowData={rows}
          getRowId={getRowId}
          columnDefs={columnDefs}
          loading={isPending}
          readOnlyEdit // 資料只有一個來源，就是 TanStack 快取
          onCellEditRequest={onCellEditRequest}
        />
      </div>
    </>
  );
}
