import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, goal, skillLevel, birthDate, gender, height, weight } = body;

  const data: any = {};
  if (name !== undefined) data.name = name;
  if (goal !== undefined) data.goal = goal;
  if (skillLevel !== undefined) data.skillLevel = skillLevel;
  if (gender !== undefined) data.gender = gender;
  if (height !== undefined) data.height = height ? parseInt(height) : null;
  if (weight !== undefined) data.weight = weight ? parseInt(weight) : null;
  if (birthDate !== undefined) data.birthDate = birthDate ? new Date(birthDate) : null;

  const user = await db.user.update({
    where: { id: session.userId },
    data,
  });

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      goal: user.goal,
      skillLevel: user.skillLevel,
      birthDate: user.birthDate,
      gender: user.gender,
      height: user.height,
      weight: user.weight,
    },
  });
}
