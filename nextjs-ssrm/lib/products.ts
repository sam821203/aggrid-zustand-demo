// 假資料庫。import "server-only" 讓這個檔案只能在伺服器端使用，
// 如果不小心在 Client Component 裡 import，build 會直接報錯
import "server-only";
import type {
  CategorySummary,
  Product,
  ProductsRequest,
  ProductsResponse,
} from "./types";

export const CATEGORIES = ["Fruit", "Vegetable", "Dairy", "Bakery", "Seafood"];

const ADJECTIVES = ["Fresh", "Organic", "Local", "Premium", "Classic", "Wild", "Golden", "Smoked"];
const NOUNS: Record<string, string[]> = {
  Fruit: ["Apple", "Banana", "Mango", "Grape", "Peach", "Kiwi"],
  Vegetable: ["Carrot", "Spinach", "Tomato", "Onion", "Pepper", "Leek"],
  Dairy: ["Milk", "Cheese", "Yogurt", "Butter", "Cream", "Kefir"],
  Bakery: ["Bagel", "Baguette", "Croissant", "Muffin", "Rye Loaf", "Scone"],
  Seafood: ["Salmon", "Shrimp", "Tuna", "Oyster", "Squid", "Clam"],
};

// 固定的亂數種子，每次啟動產生的 500 筆資料都一樣
function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function createProducts(): Product[] {
  const random = seededRandom(42);
  return Array.from({ length: 500 }, (_, index) => {
    const category = CATEGORIES[index % CATEGORIES.length];
    const nouns = NOUNS[category];
    const name = `${ADJECTIVES[Math.floor(random() * ADJECTIVES.length)]} ${
      nouns[Math.floor(random() * nouns.length)]
    }`;
    return {
      id: index + 1,
      name,
      category,
      price: Math.round(20 + random() * 480),
      stock: Math.floor(random() * 200),
    };
  });
}

// dev 模式下修改檔案會重新載入模組，掛在 globalThis 上讓資料在 hot reload 之間保留
const globalForDb = globalThis as unknown as { products?: Product[] };
const products = (globalForDb.products ??= createProducts());

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 給 SSRM 用：依照請求做分類篩選、欄位篩選、排序，再切出 startRow ~ endRow 這一段
export async function getProducts(request: ProductsRequest): Promise<ProductsResponse> {
  await sleep(400);

  let result = products;

  if (request.category) {
    result = result.filter((p) => p.category === request.category);
  }

  const nameFilter = request.filterModel?.name;
  if (nameFilter?.filter) {
    const keyword = String(nameFilter.filter).toLowerCase();
    result = result.filter((p) => p.name.toLowerCase().includes(keyword));
  }

  const priceFilter = request.filterModel?.price;
  if (priceFilter?.filter !== undefined && priceFilter.filter !== null) {
    const value = Number(priceFilter.filter);
    if (priceFilter.type === "greaterThan") result = result.filter((p) => p.price > value);
    else if (priceFilter.type === "lessThan") result = result.filter((p) => p.price < value);
    else result = result.filter((p) => p.price === value);
  }

  const sort = request.sortModel?.[0];
  if (sort) {
    const key = sort.colId as keyof Product;
    const direction = sort.sort === "asc" ? 1 : -1;
    result = [...result].sort((a, b) => (a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0) * direction);
  }

  return {
    rows: result.slice(request.startRow, request.endRow),
    rowCount: result.length,
  };
}

// 給 Server Component 用的統計資料，故意很慢，Step 6 用來練習 streaming
export async function getCategorySummary(): Promise<CategorySummary[]> {
  await sleep(1500);

  return CATEGORIES.map((category) => {
    const items = products.filter((p) => p.category === category);
    const total = items.reduce((sum, p) => sum + p.price, 0);
    return {
      category,
      count: items.length,
      averagePrice: Math.round(total / items.length),
    };
  });
}

// 給 Server Action 用
export async function updateProductPrice(id: number, price: number): Promise<Product> {
  await sleep(300);

  if (!Number.isFinite(price) || price < 0) {
    throw new Error("價格必須是 0 以上的數字");
  }

  const target = products.find((p) => p.id === id);
  if (!target) throw new Error(`找不到商品 ${id}`);

  target.price = price;
  return target;
}
