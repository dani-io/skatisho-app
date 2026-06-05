import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const coaches = await db.coach.findMany({
    include: {
      _count: { select: { courses: true } },
      courses: {
        where: { isPublished: true },
        select: { id: true, title: true, level: true, category: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ coaches });
}
