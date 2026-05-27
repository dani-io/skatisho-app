import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const products = await db.product.findMany({
    where: { isPublished: true, inStock: true },
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ products });
}
