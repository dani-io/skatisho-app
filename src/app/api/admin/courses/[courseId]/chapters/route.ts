import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/access";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const denied = await requirePermission("courses");
  if (denied) return denied;

  const { courseId } = await params;
  const body = await req.json();

  const maxOrder = await db.chapter.aggregate({
    where: { courseId },
    _max: { order: true },
  });

  const chapter = await db.chapter.create({
    data: {
      title: body.title,
      courseId,
      order: (maxOrder._max.order ?? 0) + 1,
    },
  });

  return NextResponse.json({ chapter });
}

export async function PUT(req: NextRequest) {
  const denied = await requirePermission("courses");
  if (denied) return denied;

  const body = await req.json();

  const chapter = await db.chapter.update({
    where: { id: body.id },
    data: { title: body.title, order: body.order },
  });

  return NextResponse.json({ chapter });
}

export async function DELETE(req: NextRequest) {
  const denied = await requirePermission("courses");
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await db.chapter.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
