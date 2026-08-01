import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cdnUrl } from "@/lib/storage";

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

  // Coach avatars are marketing content: public bucket, served from the CDN.
  return NextResponse.json({
    coaches: coaches.map((c) => ({ ...c, avatar: cdnUrl(c.avatar) })),
  });
}
