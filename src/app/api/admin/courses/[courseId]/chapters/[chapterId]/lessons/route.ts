import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/access";
import { deleteFileQuiet } from "@/lib/s3";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string; chapterId: string }> }
) {
  const denied = await requirePermission("courses");
  if (denied) return denied;

  const { chapterId } = await params;
  const body = await req.json();

  const maxOrder = await db.lesson.aggregate({
    where: { chapterId },
    _max: { order: true },
  });

  const lesson = await db.lesson.create({
    data: {
      title: body.title,
      description: body.description || null,
      videoUrl: body.videoUrl,
      duration: body.duration || 0,
      thumbnail: body.thumbnail || null,
      isFree: body.isFree ?? false,
      chapterId,
      order: (maxOrder._max.order ?? 0) + 1,
    },
  });

  return NextResponse.json({ lesson });
}

export async function PUT(req: NextRequest) {
  const denied = await requirePermission("courses");
  if (denied) return denied;

  const body = await req.json();

  const lesson = await db.lesson.update({
    where: { id: body.id },
    data: {
      title: body.title,
      description: body.description,
      videoUrl: body.videoUrl,
      duration: body.duration,
      isFree: body.isFree,
      order: body.order,
    },
  });

  return NextResponse.json({ lesson });
}

export async function DELETE(req: NextRequest) {
  const denied = await requirePermission("courses");
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const lesson = await db.lesson.findUnique({
    where: { id },
    select: { videoUrl: true, thumbnail: true },
  });

  await db.lesson.delete({ where: { id } });

  // Video lives in the private bucket, its thumbnail in the public one.
  await deleteFileQuiet("private", lesson?.videoUrl);
  await deleteFileQuiet("public", lesson?.thumbnail);

  return NextResponse.json({ success: true });
}
