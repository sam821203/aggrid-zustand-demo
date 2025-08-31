import { useCallback, useMemo, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  type GridReadyEvent,
  type ColumnMovedEvent,
  type ColumnResizedEvent,
  type ColumnVisibleEvent,
  type ColumnPinnedEvent,
  ModuleRegistry,
  NumberFilterModule,
  TextFilterModule,
  ClientSideRowModelModule,
} from "ag-grid-community";

import {
  ColumnMenuModule,
  ContextMenuModule,
  PivotModule,
  SetFilterModule,
} from "ag-grid-enterprise";

import { useGridStore } from "./store/gridStore";

type GridColumnEvent =
  | ColumnMovedEvent
  | ColumnResizedEvent
  | ColumnVisibleEvent
  | ColumnPinnedEvent;

ModuleRegistry.registerModules([
  NumberFilterModule,
  ClientSideRowModelModule,
  ColumnMenuModule,
  ContextMenuModule,
  PivotModule,
  SetFilterModule,
  TextFilterModule,
]);

type Props = { rowData: any[] };

export function GoodGrid({ rowData }: Props) {
  const { colState, setColState } = useGridStore();
  // console.log("[colState] ", colState);
  const applyingRef = useRef(false);

  const colDefs = useMemo(
    () => [
      { field: "id" },
      { field: "name" },
      { field: "price" },
      { field: "category" },
    ],
    []
  );

  const onGridReady = useCallback(
    (e: GridReadyEvent) => {
      if (colState && colState.length) {
        applyingRef.current = true;
        try {
          e.api.applyColumnState({ state: colState, applyOrder: true });
        } finally {
          applyingRef.current = false;
        }
      }
    },
    [colState]
  );

  const handleColumnEvent = useCallback(
    (e: GridColumnEvent) => {
      if (applyingRef.current) return;

      // Only 'columnMoved' has finished property
      if (e.type === "columnMoved" && "finished" in e && !e.finished) return;

      const state = e.api.getColumnState();
      setColState(state);
    },
    [setColState]
  );

  return (
    <div style={{ width: 1200, height: 800 }}>
      <AgGridReact
        rowData={rowData}
        columnDefs={colDefs}
        onGridReady={onGridReady}
        onColumnMoved={handleColumnEvent}
        onColumnResized={handleColumnEvent}
        onColumnVisible={handleColumnEvent}
        onColumnPinned={handleColumnEvent}
      />
    </div>
  );
}

export default GoodGrid;
