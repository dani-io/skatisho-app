import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { serverFileUrl } from "@/lib/storage";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  const { courseId, lessonId } = await params;
  const session = await getSession();

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

  if (!lesson) {
    return NextResponse.json({ error: "درس یافت نشد" }, { status: 404 });
  }

  // Check access: free lesson OR VIP subscription OR individual purchase
  if (!lesson.isFree && session) {
    const subscription = await db.subscription.findUnique({
      where: { userId: session.userId },
    });
    const hasVIP = !!subscription?.isActive && new Date(subscription.endDate) > new Date();

    const hasPurchased = await db.courseAccess.findUnique({
      where: { userId_courseId: { userId: session.userId, courseId: courseId as string } },
    });

    if (!hasVIP && !hasPurchased) {
      return NextResponse.json({ error: "برای مشاهده این درس، اشتراک VIP یا خرید دوره نیاز دارید" }, { status: 403 });
    }
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

  return NextResponse.json({ lesson: { ...lesson, videoUrl: serverFileUrl(lesson.videoUrl), thumbnail: serverFileUrl(lesson.thumbnail) }, completed });
}
