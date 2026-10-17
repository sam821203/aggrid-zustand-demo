import { create } from "zustand";

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  active: boolean;
};

export type NewProduct = Omit<Product, "id">;

type LogEntry = {
  id: number;
  time: string;
  method: string;
  detail: string;
  status: "pending" | "ok" | "error";
};

type ApiSettings = {
  latency: number;
  failRate: number;
  logs: LogEntry[];
  setLatency: (ms: number) => void;
  setFailRate: (rate: number) => void;
  clearLogs: () => void;
};

export const useApiSettings = create<ApiSettings>()((set) => ({
  latency: 1200,
  failRate: 0,
  logs: [],
  setLatency: (ms) => set({ latency: ms }),
  setFailRate: (rate) => set({ failRate: rate }),
  clearLogs: () => set({ logs: [] }),
}));

let serverProducts: Product[] = [
  { id: "p1", name: "Apple", category: "Fruit", price: 120, stock: 30, active: true },
  { id: "p2", name: "Banana", category: "Fruit", price: 90, stock: 12, active: true },
  { id: "p3", name: "Carrot", category: "Vegetable", price: 60, stock: 0, active: false },
  { id: "p4", name: "Durian", category: "Fruit", price: 300, stock: 5, active: true },
  { id: "p5", name: "Eggplant", category: "Vegetable", price: 75, stock: 18, active: true },
];

let nextId = 6;
let nextLogId = 1;

function addLog(method: string, detail: string) {
  const entry: LogEntry = {
    id: nextLogId++,
    time: new Date().toLocaleTimeString(),
    method,
    detail,
    status: "pending",
  };
  useApiSettings.setState((s) => ({ logs: [entry, ...s.logs].slice(0, 30) }));
  return entry.id;
}

function finishLog(id: number, status: "ok" | "error") {
  useApiSettings.setState((s) => ({
    logs: s.logs.map((log) => (log.id === id ? { ...log, status } : log)),
  }));
}

async function request<T>(method: string, detail: string, handler: () => T) {
  const { latency, failRate } = useApiSettings.getState();
  const logId = addLog(method, detail);

  await new Promise((resolve) => setTimeout(resolve, latency));

  try {
    if (Math.random() < failRate) {
      throw new Error(`${method} 失敗（模擬網路錯誤）`);
    }
    const result = handler();
    finishLog(logId, "ok");
    return structuredClone(result);
  } catch (error) {
    finishLog(logId, "error");
    throw error;
  }
}

export function fetchProducts() {
  return request("GET", "/products", () => serverProducts);
}

export function updateProduct(id: string, patch: Partial<NewProduct>) {
  return request("PATCH", `/products/${id} ${JSON.stringify(patch)}`, () => {
    const target = serverProducts.find((p) => p.id === id);
    if (!target) throw new Error(`找不到商品 ${id}`);
    if (patch.price !== undefined && patch.price < 0) {
      throw new Error("價格不能是負數");
    }
    if (patch.stock !== undefined && patch.stock < 0) {
      throw new Error("庫存不能是負數");
    }
    const updated = { ...target, ...patch };
    serverProducts = serverProducts.map((p) => (p.id === id ? updated : p));
    return updated;
  });
}

export function createProduct(input: NewProduct) {
  return request("POST", `/products ${input.name}`, () => {
    if (!input.name.trim()) throw new Error("商品名稱不能空白");
    const created = { ...input, id: `p${nextId++}` };
    serverProducts = [...serverProducts, created];
    return created;
  });
}

export function deleteProduct(id: string) {
  return request("DELETE", `/products/${id}`, () => {
    serverProducts = serverProducts.filter((p) => p.id !== id);
    return { id };
  });
}
