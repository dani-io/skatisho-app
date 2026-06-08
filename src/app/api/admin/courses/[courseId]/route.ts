import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      coach: true,
      chapters: {
        orderBy: { order: "asc" },
        include: {
          lessons: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  if (!course) {
    return NextResponse.json({ error: "دوره یافت نشد" }, { status: 404 });
  }

  const coaches = await db.coach.findMany({ orderBy: { name: "asc" } });

  return NextResponse.json({ course, coaches });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const body = await req.json();

  const course = await db.course.update({
    where: { id: courseId },
    data: {
      title: body.title,
      description: body.description,
      thumbnail: body.thumbnail,
      category: body.category,
      level: body.level,
      coachId: body.coachId,
      order: body.order,
      isPublished: body.isPublished,
      price: body.price || null,
    },
  });

  return NextResponse.json({ course });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  await db.course.delete({ where: { id: courseId } });
  return NextResponse.json({ success: true });
}
