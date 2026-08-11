import { NextRequest, NextResponse } from "next/server";
import { getLiveSession } from "@/lib/presence";
import { db } from "@/lib/db";

// GET: today's mood
export async function GET() {
  const session = await getLiveSession();
  if (!session) return NextResponse.json({ mood: null });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const log = await db.moodLog.findFirst({
    where: { userId: session.userId, createdAt: { gte: today } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ mood: log?.mood || null });
}

// POST: set mood
export async function POST(req: NextRequest) {
  const session = await getLiveSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { mood } = await req.json();
  if (!mood) return NextResponse.json({ error: "mood required" }, { status: 400 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Update or create today's mood
  const existing = await db.moodLog.findFirst({
    where: { userId: session.userId, createdAt: { gte: today } },
  });

  if (existing) {
    await db.moodLog.update({ where: { id: existing.id }, data: { mood } });
  } else {
    await db.moodLog.create({ data: { userId: session.userId, mood } });
  }

  return NextResponse.json({ success: true, mood });
}
