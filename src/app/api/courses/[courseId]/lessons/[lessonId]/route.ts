import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getLiveSession } from "@/lib/presence";
import { canAccessLesson } from "@/lib/access";
import { cdnUrl, lessonVideoUrl } from "@/lib/storage";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  const { courseId, lessonId } = await params;
  const session = await getLiveSession();

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: {
      chapter: {
        include: {
          course: { select: { id: true, title: true } },
        },
      },
    },
  });

  // 404 both for a missing lesson and for one that belongs to another course.
  // Answering 403 to the latter would confirm the lesson exists.
  if (!lesson || lesson.chapter.courseId !== courseId) {
    return NextResponse.json({ error: "درس یافت نشد" }, { status: 404 });
  }

  const allowed = await canAccessLesson(session?.userId ?? null, {
    isFree: lesson.isFree,
    courseId: lesson.chapter.courseId,
  });

  if (!allowed) {
    return session
      ? NextResponse.json(
          { error: "برای مشاهده این درس، اشتراک VIP یا خرید دوره نیاز دارید" },
          { status: 403 }
        )
      : NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Get progress
  let completed = false;
  if (session) {
    const progress = await db.lessonProgress.findUnique({
      where: {
        userId_lessonId: { userId: session.userId, lessonId },
      },
    });
    completed = progress?.completed ?? false;
  }

  return NextResponse.json({
    lesson: {
      ...lesson,
      // Not a storage URL: the protected route that re-checks access and
      // streams the bytes. Thumbnails are public and come from the CDN.
      videoUrl: lessonVideoUrl(lesson.chapter.courseId, lesson.id),
      thumbnail: cdnUrl(lesson.thumbnail),
    },
    completed,
  });
}
