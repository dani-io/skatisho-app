import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/access";


export async function GET() {
  const methods = await db.shippingMethod.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json({ methods });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await req.json();
  const method = await db.shippingMethod.create({
    data: {
      title: body.title,
      price: body.price,
      description: body.description || null,
      minFreeAmount: body.minFreeAmount || null,
      isActive: body.isActive ?? true,
      order: body.order || 0,
    },
  });
  return NextResponse.json({ method }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await req.json();
  await db.shippingMethod.update({
    where: { id: body.id },
    data: {
      title: body.title,
      price: body.price,
      description: body.description,
      minFreeAmount: body.minFreeAmount || null,
      isActive: body.isActive,
    },
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await req.json();
  await db.shippingMethod.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
