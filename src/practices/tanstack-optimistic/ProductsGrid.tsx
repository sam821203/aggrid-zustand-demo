import { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import type {
  CellEditRequestEvent,
  ColDef,
  GetRowIdParams,
} from "ag-grid-community";
import type { Product } from "./api";
import { useProducts, useUpdateProduct } from "./queries";

const getRowId = (params: GetRowIdParams<Product>) => params.data.id;

export default function ProductsGrid() {
  const { data, isPending, isError, error } = useProducts();
  const updateMutation = useUpdateProduct();

  const columnDefs = useMemo<ColDef<Product>[]>(
    () => [
      { field: "id", width: 80 },
      { field: "name", flex: 1 },
      { field: "category", width: 130 },
      { field: "price", width: 110, editable: true },
      { field: "stock", width: 110, editable: true },
      { field: "active", headerName: "上架", width: 100 },
    ],
    [],
  );

  const onCellEditRequest = (event: CellEditRequestEvent<Product>) => {
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
        <AgGridReact<Product>
          rowData={data}
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
