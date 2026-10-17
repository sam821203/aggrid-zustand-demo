import GridDemo from "./Grid";
import { useGridStore } from "./store";

const rowData = [
  { id: 1, name: "Apple", price: 120, category: "Fruit" },
  { id: 2, name: "Banana", price: 90, category: "Fruit" },
  { id: 3, name: "Carrot", price: 60, category: "Vegetable" },
  { id: 4, name: "Durian", price: 300, category: "Fruit" },
];

export default function ColumnStatePersist() {
  const reset = useGridStore((s) => s.reset);

  return (
    <div>
      <p className="hint">
        拖曳、調整寬度、隱藏或釘選欄位後重新整理頁面，欄位狀態會從 localStorage 還原。
      </p>
      <button
        onClick={() => {
          reset();
          window.location.reload();
        }}
      >
        重設欄位狀態
      </button>
      <div style={{ marginTop: 12 }}>
        <GridDemo rowData={rowData} />
      </div>
    </div>
  );
}
