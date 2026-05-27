import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  const { lessonId } = await params;
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

  // Check access
  if (!lesson.isFree && session) {
    const subscription = await db.subscription.findUnique({
      where: { userId: session.userId },
    });
    const hasAccess =
      !!subscription?.isActive && new Date(subscription.endDate) > new Date();
    if (!hasAccess) {
      return NextResponse.json({ error: "اشتراک فعال ندارید" }, { status: 403 });
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

  return NextResponse.json({ lesson, completed });
}
