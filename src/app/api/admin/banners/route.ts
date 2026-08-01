import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { ADMIN_PHONES } from "@/lib/access";
import { deleteFileQuiet } from "@/lib/s3";


async function checkAdmin() {
  const session = await getSession();
  if (!session || !ADMIN_PHONES.includes(session.phone)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const unauth = await checkAdmin();
  if (unauth) return unauth;

  const banners = await db.banner.findMany({
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ banners });
}

export async function POST(req: NextRequest) {
  const unauth = await checkAdmin();
  if (unauth) return unauth;

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
  const unauth = await checkAdmin();
  if (unauth) return unauth;

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
  const unauth = await checkAdmin();
  if (unauth) return unauth;

  const { id } = await req.json();
  const banner = await db.banner.findUnique({
    where: { id },
    select: { imageKey: true },
  });
  await db.banner.delete({ where: { id } });
  await deleteFileQuiet("public", banner?.imageKey);

  return NextResponse.json({ ok: true });
}
