import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

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

  // Check if user has active subscription
  let hasAccess = false;
  let progress: Record<string, boolean> = {};

  if (session) {
    const subscription = await db.subscription.findUnique({
      where: { userId: session.userId },
    });
    hasAccess = !!subscription?.isActive && new Date(subscription.endDate) > new Date();

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
      hasAccess,
      progress,
    },
  });
}
