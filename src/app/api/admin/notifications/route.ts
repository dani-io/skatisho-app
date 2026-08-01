import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { ADMIN_PHONES } from "@/lib/access";


// POST: send notification (to one user or all)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !ADMIN_PHONES.includes(session.phone)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { title, message, type, userId, toAll } = await req.json();

  if (!title?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "title and message required" }, { status: 400 });
  }

  if (toAll) {
    const users = await db.user.findMany({ select: { id: true } });
    await db.notification.createMany({
      data: users.map((u: any) => ({
        userId: u.id,
        title: title.trim(),
        message: message.trim(),
        type: type || "SYSTEM",
      })),
    });
    return NextResponse.json({ sent: users.length }, { status: 201 });
  }

  if (userId) {
    const notif = await db.notification.create({
      data: {
        userId,
        title: title.trim(),
        message: message.trim(),
        type: type || "GENERAL",
      },
    });
    return NextResponse.json({ notification: notif }, { status: 201 });
  }

  return NextResponse.json({ error: "userId or toAll required" }, { status: 400 });
}
