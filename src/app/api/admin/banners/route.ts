import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/access";
import { deleteFileQuiet } from "@/lib/s3";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const banners = await db.banner.findMany({
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ banners });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { title, link, imageKey, order, isActive } = await req.json();

  if (!imageKey) {
    return NextResponse.json({ error: "imageKey required" }, { status: 400 });
  }

  const banner = await db.banner.create({
    data: {
      title: title || null,
      link: link || null,
      imageKey,
      order: order ?? 0,
      isActive: isActive ?? true,
    },
  });

  return NextResponse.json({ banner }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id, title, link, imageKey, order, isActive } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const banner = await db.banner.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(link !== undefined && { link }),
      ...(imageKey !== undefined && { imageKey }),
      ...(order !== undefined && { order }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return NextResponse.json({ banner });
}

export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await req.json();
  const banner = await db.banner.findUnique({
    where: { id },
    select: { imageKey: true },
  });
  await db.banner.delete({ where: { id } });
  await deleteFileQuiet("public", banner?.imageKey);

  return NextResponse.json({ ok: true });
}
