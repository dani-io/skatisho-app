import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

// GET: list notifications + unread count
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const countOnly = url.searchParams.get("count") === "true";

  if (countOnly) {
    const unreadCount = await db.notification.count({
      where: { userId: session.userId, isRead: false },
    });
    return NextResponse.json({ unreadCount });
  }

  const notifications = await db.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  return NextResponse.json({ notifications, unreadCount });
}

// PATCH: mark as read
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id, all } = await req.json();

  if (all) {
    await db.notification.updateMany({
      where: { userId: session.userId, isRead: false },
      data: { isRead: true },
    });
  } else if (id) {
    await db.notification.updateMany({
      where: { id, userId: session.userId },
      data: { isRead: true },
    });
  }

  return NextResponse.json({ ok: true });
}
