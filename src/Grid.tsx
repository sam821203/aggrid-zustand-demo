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

import { useGridStore, type ColStateItem } from "./store/gridStore";

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

export function GridDemo({ rowData }: Props) {
  const { colState, setColState } = useGridStore();
  const applyingRef = useRef<boolean>(false);

  const colDefs = useMemo(() => {
    const baseDefs = [
      { field: "id" },
      { field: "name" },
      { field: "price" },
      { field: "category" },
    ];

    if (colState && colState.length) {
      return colState
        .map((col) => {
          const def = baseDefs.find((d) => d.field === col.colId);
          if (!def) return;
          return { ...def, ...col };
        })
        .filter(Boolean) as typeof baseDefs;
    }

    return baseDefs;
  }, [colState]);

  const onGridReady = useCallback(
    (event: GridReadyEvent) => {
      if (colState && colState.length) {
        applyingRef.current = true;
        try {
          event.api.applyColumnState({ state: colState, applyOrder: true });
        } finally {
          applyingRef.current = false;
        }
      }
    },
    [colState]
  );

  const handleColumnEvent = useCallback(
    (event: GridColumnEvent) => {
      if (applyingRef.current) return;

      // The "finished property exists only on columnMoved events
      if (
        event.type === "columnMoved" &&
        "finished" in event &&
        !event.finished
      )
        return;

      const state: ColStateItem[] = event.api.getColumnState();
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

export default GridDemo;
