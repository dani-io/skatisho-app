import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;

  const product = await db.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    return NextResponse.json({ error: "محصول یافت نشد" }, { status: 404 });
  }

  // Get related products in same category
  const related = await db.product.findMany({
    where: {
      category: product.category,
      id: { not: product.id },
      isPublished: true,
    },
    take: 4,
  });

  return NextResponse.json({ product, related });
}
