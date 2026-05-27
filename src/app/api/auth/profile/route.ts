import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "لطفاً وارد شوید" }, { status: 401 });
  }

  const { name, goal, skillLevel } = await req.json();

  const user = await db.user.update({
    where: { id: session.userId },
    data: {
      name: name || undefined,
      goal: goal || undefined,
      skillLevel: skillLevel || undefined,
    },
  });

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      goal: user.goal,
      skillLevel: user.skillLevel,
    },
  });
}
