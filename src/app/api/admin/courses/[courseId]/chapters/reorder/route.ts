import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/access";

/**
 * Reorder the chapters of one course. The body's `chapterIds` is the new order:
 * each chapter's `order` becomes its index in the array.
 *
 * The array must be exactly the course's chapters, each once. A partial list
 * would leave the omitted chapters with order values that collide with the new
 * ones, and an id from another course would let this URL rewrite chapters it
 * does not own. Either case is a 400 and nothing is written.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const denied = await requirePermission("courses");
  if (denied) return denied;

  const { courseId } = await params;
  const body = await req.json().catch(() => null);

  const chapterIds: unknown = body?.chapterIds;
  if (
    !Array.isArray(chapterIds) ||
    chapterIds.length === 0 ||
    !chapterIds.every((id) => typeof id === "string" && id)
  ) {
    return NextResponse.json({ error: "فهرست فصل‌ها نامعتبر است" }, { status: 400 });
  }

  const ids = chapterIds as string[];
  if (new Set(ids).size !== ids.length) {
    return NextResponse.json({ error: "شناسه فصل تکراری است" }, { status: 400 });
  }

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { chapters: { select: { id: true } } },
  });

  if (!course) {
    return NextResponse.json({ error: "دوره یافت نشد" }, { status: 404 });
  }

  const courseChapterIds = new Set(course.chapters.map((c) => c.id));
  if (
    ids.length !== courseChapterIds.size ||
    !ids.every((id) => courseChapterIds.has(id))
  ) {
    return NextResponse.json(
      { error: "فصل‌های ارسال‌شده با فصل‌های این دوره مطابقت ندارد. صفحه را بازخوانی کنید." },
      { status: 400 }
    );
  }

  // updateMany keeps the course in the WHERE, so a chapter moved to another
  // course between the check above and this write is not touched.
  await db.$transaction(
    ids.map((id, index) =>
      db.chapter.updateMany({
        where: { id, courseId },
        data: { order: index },
      })
    )
  );

  return NextResponse.json({ success: true });
}
