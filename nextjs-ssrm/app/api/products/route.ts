import { getProducts } from "@/lib/products";
import { ProductsRequest } from "@/lib/types";

export async function POST(request: Request) {
  // AG Grid 送來的 { startRow, endRow, sortModel, filterModel, ... }
  const body = (await request.json()) as ProductsRequest;

  const result = await getProducts(body);

  // 回傳 { rows, rowCount }
  return Response.json(result);
}
