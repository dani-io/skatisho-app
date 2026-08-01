import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cdnUrl } from "@/lib/storage";

export async function GET() {
  const products = await db.product.findMany({
    where: { isPublished: true, inStock: true },
    orderBy: { order: "asc" },
  });

  const result = products.map((p: any) => ({ ...p, thumbnail: cdnUrl(p.thumbnail) }));
  return NextResponse.json({ products: result });
}
