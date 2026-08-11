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

  const { courseId, chapterId } = await params;
  const body = await req.json();

  // Same ownership rule the PUT enforces: the chapter in the path must actually
  // belong to the course in the path, or the lesson would be created under a
  // chapter this URL does not own.
  const chapter = await db.chapter.findFirst({
    where: { id: chapterId, courseId },
    select: { id: true },
  });

  if (!chapter) {
    return NextResponse.json({ error: "فصل یافت نشد" }, { status: 404 });
  }

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

/**
 * Text-only edit of an existing lesson.
 *
 * videoUrl and thumbnail are deliberately NOT writable here. Replacing either
 * one orphans the object it points at (private bucket for video, public for the
 * thumbnail), so media replacement needs the same cleanup DELETE does and is a
 * separate change. Omitting them from `data` also means a form that never sends
 * a video cannot blank the stored key.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string; chapterId: string }> }
) {
  const denied = await requirePermission("courses");
  if (denied) return denied;

  const { courseId, chapterId } = await params;
  const body = await req.json();

  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "عنوان درس الزامی است" }, { status: 400 });
  }

  const duration = body.duration ?? 0;
  if (!Number.isInteger(duration) || duration < 0) {
    return NextResponse.json(
      { error: "مدت درس باید عددی صحیح و نامنفی باشد" },
      { status: 400 }
    );
  }

  if (typeof body.isFree !== "boolean") {
    return NextResponse.json(
      { error: "مقدار رایگان باید بولین باشد" },
      { status: 400 }
    );
  }

  const description =
    typeof body.description === "string" && body.description.trim()
      ? body.description.trim()
      : null;

  // The lesson is addressed by id, but the id alone says nothing about who owns
  // it. Without this check any admin holding "courses" could edit a lesson in
  // any other course by posting its id to a chapter they can reach. Scoping to
  // BOTH the chapter and that chapter's course means the URL has to name the
  // real owner; anything else is a 404, same as an unknown id.
  const owned = await db.lesson.findFirst({
    where: { id, chapterId, chapter: { courseId } },
    select: { id: true },
  });

  if (!owned) {
    return NextResponse.json({ error: "درس یافت نشد" }, { status: 404 });
  }

  const lesson = await db.lesson.update({
    where: { id },
    data: {
      title,
      description,
      duration,
      isFree: body.isFree,
      // Reordering is not part of this form; only honour an explicit valid value.
      ...(Number.isInteger(body.order) && body.order >= 0
        ? { order: body.order }
        : {}),
    },
  });

  return NextResponse.json({ lesson });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string; chapterId: string }> }
) {
  const denied = await requirePermission("courses");
  if (denied) return denied;

  const { courseId, chapterId } = await params;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Ownership is settled BEFORE anything is destroyed, and the same query
  // fetches the keys the cleanup below needs. This is the delete path, so a
  // missed check is unrecoverable: the row goes, and the video goes with it out
  // of the private bucket. A lesson that does not belong to this chapter, in
  // this course, is a 404 and nothing is touched.
  const lesson = await db.lesson.findFirst({
    where: { id, chapterId, chapter: { courseId } },
    select: { videoUrl: true, thumbnail: true },
  });

  if (!lesson) {
    return NextResponse.json({ error: "درس یافت نشد" }, { status: 404 });
  }

  await db.lesson.delete({ where: { id } });

  // Video lives in the private bucket, its thumbnail in the public one.
  await deleteFileQuiet("private", lesson.videoUrl);
  await deleteFileQuiet("public", lesson.thumbnail);

  return NextResponse.json({ success: true });
}
