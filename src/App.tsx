import "./App.css";
import GoodGrid from "./Grid";

const rowData = [
  { id: 1, name: "Apple", price: 120, category: "Fruit" },
  { id: 2, name: "Banana", price: 90, category: "Fruit" },
  { id: 3, name: "Carrot", price: 60, category: "Vegetable" },
  { id: 4, name: "Durian", price: 300, category: "Fruit" },
];

function App() {
  return (
    <div style={{ padding: 16 }}>
      <GoodGrid rowData={rowData} />
    </div>
  );
}

export default App;
