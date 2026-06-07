import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { serverFileUrl } from "@/lib/storage";

// GET: list user's bookmarks
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const bookmarks = await db.lessonBookmark.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    include: {
      lesson: {
        select: {
          id: true,
          title: true,
          duration: true,
          thumbnail: true,
          chapter: {
            select: {
              title: true,
              course: { select: { id: true, title: true, thumbnail: true } },
            },
          },
        },
      },
    },
  });

  const result = bookmarks.map((b: any) => ({
    ...b,
    lesson: {
      ...b.lesson,
      thumbnail: serverFileUrl(b.lesson.thumbnail),
      chapter: {
        ...b.lesson.chapter,
        course: {
          ...b.lesson.chapter.course,
          thumbnail: serverFileUrl(b.lesson.chapter.course.thumbnail),
        },
      },
    },
  }));

  return NextResponse.json({ bookmarks: result });
}

// POST: toggle bookmark + save note
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { lessonId, note } = await req.json();

  if (!lessonId) {
    return NextResponse.json({ error: "lessonId required" }, { status: 400 });
  }

  const existing = await db.lessonBookmark.findUnique({
    where: { userId_lessonId: { userId: session.userId, lessonId } },
  });

  if (existing) {
    // If note is provided, update it; otherwise toggle (delete)
    if (note !== undefined) {
      const updated = await db.lessonBookmark.update({
        where: { id: existing.id },
        data: { note },
      });
      return NextResponse.json({ bookmark: updated, action: "updated" });
    }
    await db.lessonBookmark.delete({ where: { id: existing.id } });
    return NextResponse.json({ action: "removed" });
  }

  const bookmark = await db.lessonBookmark.create({
    data: {
      userId: session.userId,
      lessonId,
      note: note || null,
    },
  });

  return NextResponse.json({ bookmark, action: "added" });
}
