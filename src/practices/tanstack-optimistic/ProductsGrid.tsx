import { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import type {
  CellClassParams,
  CellEditRequestEvent,
  ColDef,
  GetRowIdParams,
} from "ag-grid-community";
import type { Product } from "./api";
import { useProducts, useUpdateProduct } from "./queries";

type GridRow = Product & { pendingFields?: string[] };

const getRowId = (params: GetRowIdParams<GridRow>) => params.data.id;

const pendingRule = {
  "cell-pending": (params: CellClassParams<GridRow>) =>
    !!params.data?.pendingFields?.includes(params.colDef.field ?? ""),
};

export default function ProductsGrid() {
  const { data, isPending, isError, error } = useProducts();
  const updateMutation = useUpdateProduct();

  const rows = useMemo<GridRow[] | undefined>(() => {
    if (!data) return data;

    if (!updateMutation.isPending || !updateMutation.variables) return data;

    // variables 就是最近一次 mutate() 傳入的 { id, patch }
    const { id, patch } = updateMutation.variables;

    return data.map((row) =>
      row.id === id
        ? { ...row, ...patch, pendingFields: Object.keys(patch) }
        : row,
    );
  }, [data, updateMutation.isPending, updateMutation.variables]);

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
