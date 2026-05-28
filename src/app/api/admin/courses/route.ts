import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const courses = await db.course.findMany({
    include: {
      coach: { select: { name: true } },
      chapters: {
        include: { lessons: { select: { id: true } } },
      },
    },
    orderBy: { order: "asc" },
  });

  const result = courses.map((c) => ({
    ...c,
    lessonsCount: c.chapters.reduce((acc, ch) => acc + ch.lessons.length, 0),
  }));

  return NextResponse.json({ courses: result });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const course = await db.course.create({
    data: {
      title: body.title,
      description: body.description || null,
      thumbnail: body.thumbnail || null,
      category: body.category,
      level: body.level,
      coachId: body.coachId,
      order: body.order || 0,
      isPublished: body.isPublished ?? false,
    },
  });

  return NextResponse.json({ course });
}
