import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cdnUrl } from "@/lib/storage";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ coachId: string }> }
) {
  const { coachId } = await params;

  const coach = await db.coach.findUnique({
    where: { id: coachId },
    include: {
      courses: {
        where: { isPublished: true },
        include: {
          _count: { select: { chapters: true } },
          chapters: {
            include: {
              _count: { select: { lessons: true } },
            },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!coach) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // Calculate total lessons per course
  const coursesWithStats = coach.courses.map((c: any) => ({
    id: c.id,
    title: c.title,
    thumbnail: c.thumbnail,
    level: c.level,
    category: c.category,
    chaptersCount: c._count.chapters,
    lessonsCount: c.chapters.reduce((acc: number, ch: any) => acc + ch._count.lessons, 0),
  }));

  return NextResponse.json({
    coach: {
      id: coach.id,
      name: coach.name,
      bio: coach.bio,
      avatar: cdnUrl(coach.avatar),
      specialty: coach.specialty,
      coursesCount: coach.courses.length,
      courses: coursesWithStats,
    },
  });
}
