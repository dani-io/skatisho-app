import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      phone: true,
      skillLevel: true,
      createdAt: true,
      subscription: {
        select: {
          isActive: true,
          plan: { select: { title: true } },
        },
      },
    },
  });

  return NextResponse.json({ users });
}
