import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const products = await db.product.findMany({
    orderBy: { order: "asc" },
  });
  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const product = await db.product.create({
    data: {
      title: body.title,
      description: body.description || null,
      price: body.price,
      originalPrice: body.originalPrice || null,
      thumbnail: body.thumbnail || null,
      images: body.images || [],
      category: body.category,
      brand: body.brand || null,
      inStock: body.inStock ?? true,
      isPublished: body.isPublished ?? true,
      order: body.order || 0,
      customizable: body.customizable || false,
      options: body.options || null,
    },
  });
  return NextResponse.json({ product });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const product = await db.product.update({
    where: { id: body.id },
    data: {
      title: body.title,
      description: body.description,
      price: body.price,
      originalPrice: body.originalPrice,
      thumbnail: body.thumbnail,
      images: body.images || [],
      category: body.category,
      brand: body.brand,
      inStock: body.inStock,
      isPublished: body.isPublished,
      customizable: body.customizable,
      options: body.options,
    },
  });
  return NextResponse.json({ product });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.product.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
