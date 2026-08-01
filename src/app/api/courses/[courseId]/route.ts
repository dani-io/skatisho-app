import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getCourseAccessDetail } from "@/lib/access";
import { cdnUrl } from "@/lib/storage";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const session = await getSession();

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      coach: true,
      chapters: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              duration: true,
              isFree: true,
              order: true,
              thumbnail: true,
            },
          },
        },
      },
    },
  });

  if (!course) {
    return NextResponse.json({ error: "دوره یافت نشد" }, { status: 404 });
  }

  // Advisory flags for the UI. The authoritative gate lives in the video
  // route, which re-checks on every request.
  const { hasVIP, hasPurchased, hasAccess } = await getCourseAccessDetail(
    session?.userId ?? null,
    courseId
  );

  let progress: Record<string, boolean> = {};
  if (session) {
    // Get user progress
    const userProgress = await db.lessonProgress.findMany({
      where: { userId: session.userId },
      select: { lessonId: true, completed: true },
    });
    progress = Object.fromEntries(
      userProgress.map((p) => [p.lessonId, p.completed])
    );
  }

  return NextResponse.json({
    course: {
      ...course,
      thumbnail: cdnUrl(course.thumbnail),
      coach: { ...course.coach, avatar: cdnUrl(course.coach.avatar) },
      chapters: course.chapters.map((ch: any) => ({ ...ch, lessons: ch.lessons.map((l: any) => ({ ...l, thumbnail: cdnUrl(l.thumbnail) })) })),
      hasAccess,
      hasVIP,
      hasPurchased,
      progress,
    },
  });
}
