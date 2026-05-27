import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const courses = await db.course.findMany({
    where: { isPublished: true },
    include: {
      coach: { select: { name: true, avatar: true } },
      chapters: {
        include: {
          lessons: { select: { id: true } },
        },
      },
    },
    orderBy: { order: "asc" },
  });

  const result = courses.map((course) => ({
    id: course.id,
    title: course.title,
    description: course.description,
    thumbnail: course.thumbnail,
    category: course.category,
    level: course.level,
    coachName: course.coach.name,
    coachAvatar: course.coach.avatar,
    lessonsCount: course.chapters.reduce(
      (acc, ch) => acc + ch.lessons.length,
      0
    ),
  }));

  return NextResponse.json({ courses: result });
}
