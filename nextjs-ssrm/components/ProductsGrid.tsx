"use client";

import { useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  CellEditRequestEvent,
  GetRowIdParams,
  IServerSideDatasource,
  ModuleRegistry,
  type ColDef,
} from "ag-grid-community";
import type { Product, ProductsRequest, ProductsResponse } from "@/lib/types";
import {
  ServerSideRowModelApiModule,
  ServerSideRowModelModule,
} from "ag-grid-enterprise";
import { updatePriceAction } from "@/app/products/actions";

ModuleRegistry.registerModules([
  AllCommunityModule,
  ServerSideRowModelModule,
  ServerSideRowModelApiModule,
]);

type ProductsGridProps = {
  category?: string;
};

// SSRM 會分段載入、重新載入資料，要靠 id 認出「同一列」
// AG Grid 要求 row id 是字串，所以把數字 id 轉成字串
const getRowId = (params: GetRowIdParams<Product>) => String(params.data.id);

const createDatasource = (
  category?: string,
): IServerSideDatasource<Product> => {
  return {
    getRows: async (params) => {
      try {
        // AG Grid 的請求內容，再加上分類條件
        const body: ProductsRequest = {
          ...(params.request as ProductsRequest),
          category,
        };

        // params.request 就是 AG Grid 算好的 { startRow, endRow, sortModel, filterModel, ... }
        // 原封不動送給 Route Handler
        const response = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = (await response.json()) as ProductsResponse;

        // 交還給 AG Grid：這一段的資料，以及符合條件的總筆數
        // rowCount 讓 AG Grid 知道捲軸要多長、捲到底時不用再要資料
        params.success({ rowData: data.rows, rowCount: data.rowCount });
      } catch (error) {
        console.error(error);
        // 一定要呼叫 fail，不然那一段會一直顯示載入中
        params.fail();
      }
    },
  };
};

export default function ProductsGrid({ category }: ProductsGridProps) {
  const [message, setMessage] = useState<string | null>(null);

  const columnDefs = useMemo<ColDef<Product>[]>(
    () => [
      { field: "id", width: 80 },
      { field: "name", flex: 1, filter: "agTextColumnFilter" },
      { field: "category", width: 130 },
      {
        field: "price",
        width: 110,
        filter: "agNumberColumnFilter",
        editable: true,
        cellEditor: "agNumberCellEditor",
      },
      { field: "stock", width: 110 },
    ],
    [],
  );

  const datasource = useMemo(() => createDatasource(category), [category]);

  const onCellEditRequest = async (event: CellEditRequestEvent<Product>) => {
    const price = Number(event.newValue);
    if (event.newValue === null || Number.isNaN(price)) return;

    setMessage(null);

    // 像呼叫普通 async 函式一樣，實際上是送一個 POST 給伺服器
    const result = await updatePriceAction(event.data.id, price);

    if (!result.ok) {
      setMessage(`更新 ${event.data.name} 失敗：${result.message}`);
      return;
    }

    // 成功後重抓目前已載入的那幾段，格子才會顯示伺服器上的新值
    // purge: false 會保留目前的列，等新資料回來再換掉，不會閃一下 loading
    event.api.refreshServerSide({ purge: false });
  };

  return (
    <>
      {message && <p className="error">{message}</p>}
      <div style={{ height: 300 }}>
        <AgGridReact<Product>
          rowModelType="serverSide"
          serverSideDatasource={datasource}
          columnDefs={columnDefs}
          getRowId={getRowId}
          readOnlyEdit
          onCellEditRequest={onCellEditRequest}
        />
      </div>
    </>
  );
}
