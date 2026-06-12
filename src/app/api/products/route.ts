import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serverFileUrl } from "@/lib/storage";

export async function GET() {
  const products = await db.product.findMany({
    where: { isPublished: true, inStock: true },
    orderBy: { order: "asc" },
  });

  const result = products.map((p: any) => ({ ...p, thumbnail: serverFileUrl(p.thumbnail) }));
  return NextResponse.json({ products: result });
}
