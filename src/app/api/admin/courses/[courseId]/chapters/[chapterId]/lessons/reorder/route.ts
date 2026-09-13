import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/access";

/**
 * Reorder the lessons of one chapter. The body's `lessonIds` is the new order:
 * each lesson's `order` becomes its index in the array.
 *
 * The array must be exactly the chapter's lessons, each once. A partial list
 * would leave the omitted lessons with order values that collide with the new
 * ones, and an id from another chapter would let this URL rewrite lessons it
 * does not own. Either case is a 400 and nothing is written.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string; chapterId: string }> }
) {
  const denied = await requirePermission("courses");
  if (denied) return denied;

  const { courseId, chapterId } = await params;
  const body = await req.json().catch(() => null);

  const lessonIds: unknown = body?.lessonIds;
  if (
    !Array.isArray(lessonIds) ||
    lessonIds.length === 0 ||
    !lessonIds.every((id) => typeof id === "string" && id)
  ) {
    return NextResponse.json({ error: "فهرست دروس نامعتبر است" }, { status: 400 });
  }

  const ids = lessonIds as string[];
  if (new Set(ids).size !== ids.length) {
    return NextResponse.json({ error: "شناسه درس تکراری است" }, { status: 400 });
  }

  // Same ownership rule as the other lesson routes: the chapter in the path
  // must belong to the course in the path.
  const chapter = await db.chapter.findFirst({
    where: { id: chapterId, courseId },
    select: { lessons: { select: { id: true } } },
  });

  if (!chapter) {
    return NextResponse.json({ error: "فصل یافت نشد" }, { status: 404 });
  }

  const chapterLessonIds = new Set(chapter.lessons.map((l) => l.id));
  if (
    ids.length !== chapterLessonIds.size ||
    !ids.every((id) => chapterLessonIds.has(id))
  ) {
    return NextResponse.json(
      { error: "دروس ارسال‌شده با دروس این فصل مطابقت ندارد. صفحه را بازخوانی کنید." },
      { status: 400 }
    );
  }

  // updateMany keeps the chapter in the WHERE, so a lesson moved to another
  // chapter between the check above and this write is not touched.
  await db.$transaction(
    ids.map((id, index) =>
      db.lesson.updateMany({
        where: { id, chapterId },
        data: { order: index },
      })
    )
  );

  return NextResponse.json({ success: true });
}
