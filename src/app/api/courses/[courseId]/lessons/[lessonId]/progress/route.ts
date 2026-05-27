import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  const { lessonId } = await params;
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "لطفاً وارد شوید" }, { status: 401 });
  }

  const { completed } = await req.json();

  await db.lessonProgress.upsert({
    where: {
      userId_lessonId: { userId: session.userId, lessonId },
    },
    update: { completed, lastWatched: new Date() },
    create: {
      userId: session.userId,
      lessonId,
      completed: completed ?? false,
    },
  });

  return NextResponse.json({ success: true });
}
