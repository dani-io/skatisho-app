import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/access";
import { deleteFileQuiet } from "@/lib/s3";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const products = await db.product.findMany({
    orderBy: { order: "asc" },
  });
  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

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
  const denied = await requireAdmin();
  if (denied) return denied;

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
  const denied = await requireAdmin();
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const product = await db.product.findUnique({
    where: { id },
    select: { thumbnail: true, images: true },
  });

  await db.product.delete({ where: { id } });

  for (const key of [product?.thumbnail, ...(product?.images ?? [])]) {
    await deleteFileQuiet("public", key);
  }

  return NextResponse.json({ success: true });
}
