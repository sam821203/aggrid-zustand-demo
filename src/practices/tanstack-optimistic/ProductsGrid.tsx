import { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import type { Product } from "./api";
import { useProducts } from "./queries";

export default function ProductsGrid() {
  // Step 1：改成從 useProducts() 拿資料
  const { data, isPending, isError, error } = useProducts();

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

  return (
    <>
      {isError && <p>讀取失敗：{error.message}</p>}
      <div style={{ width: "100%", height: 360 }}>
        <AgGridReact<Product>
          rowData={data}
          columnDefs={columnDefs}
          loading={isPending}
        />
      </div>
    </>
  );
}
