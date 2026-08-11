import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getLiveSession } from "@/lib/presence";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  const { lessonId } = await params;
  const session = await getLiveSession();

  if (!session) {
    return NextResponse.json({ error: "لطفاً وارد شوید" }, { status: 401 });
  }

  const { completed, watchedSec } = await req.json();

  await db.lessonProgress.upsert({
    where: {
      userId_lessonId: { userId: session.userId, lessonId },
    },
    update: {
      completed: completed ?? undefined,
      watchedSec: watchedSec ?? undefined,
      lastWatched: new Date(),
    },
    create: {
      userId: session.userId,
      lessonId,
      completed: completed ?? false,
      watchedSec: watchedSec ?? 0,
    },
  });

  return NextResponse.json({ success: true });
}
