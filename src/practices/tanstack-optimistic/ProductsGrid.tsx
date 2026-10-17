import { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import type { Product } from "./api";

export default function ProductsGrid() {
  // Step 1：改成從 useProducts() 拿資料
  const products: Product[] = [];

  const columnDefs = useMemo<ColDef<Product>[]>(
    () => [
      { field: "id", width: 80 },
      { field: "name", flex: 1 },
      { field: "category", width: 130 },
      { field: "price", width: 110, editable: true },
      { field: "stock", width: 110, editable: true },
      { field: "active", headerName: "上架", width: 100 },
    ],
    []
  );

  return (
    <div style={{ width: "100%", height: 360 }}>
      <AgGridReact<Product> rowData={products} columnDefs={columnDefs} />
    </div>
  );
}
