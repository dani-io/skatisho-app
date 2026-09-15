import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/access";
import { deleteFileQuiet } from "@/lib/s3";

export async function GET() {
  const denied = await requirePermission("banners");
  if (denied) return denied;

  const banners = await db.banner.findMany({
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ banners });
}

export async function POST(req: NextRequest) {
  const denied = await requirePermission("banners");
  if (denied) return denied;

  const { title, description, link, imageKey, backgroundColor, textColor, order, isActive } = await req.json();

  const banner = await db.banner.create({
    data: {
      title: title || null,
      description: description || null,
      link: link || null,
      imageKey: imageKey || null,
      backgroundColor: backgroundColor || null,
      textColor: textColor || null,
      order: order ?? 0,
      isActive: isActive ?? true,
    },
  });

  return NextResponse.json({ banner }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const denied = await requirePermission("banners");
  if (denied) return denied;

  const { id, title, description, link, imageKey, backgroundColor, textColor, order, isActive } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const banner = await db.banner.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(link !== undefined && { link }),
      ...(imageKey !== undefined && { imageKey }),
      ...(backgroundColor !== undefined && { backgroundColor }),
      ...(textColor !== undefined && { textColor }),
      ...(order !== undefined && { order }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return NextResponse.json({ banner });
}

export async function DELETE(req: NextRequest) {
  const denied = await requirePermission("banners");
  if (denied) return denied;

  const { id } = await req.json();
  const banner = await db.banner.findUnique({
    where: { id },
    select: { imageKey: true },
  });
  await db.banner.delete({ where: { id } });
  if (banner?.imageKey) await deleteFileQuiet("public", banner.imageKey);

  return NextResponse.json({ ok: true });
}
