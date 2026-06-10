import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { serverFileUrl } from "@/lib/storage";

const ADMIN_PHONES = ["09123456789", "09179498400"];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getSession();
  if (!session || !ADMIN_PHONES.includes(session.phone)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { userId } = await params;

  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      subscription: { include: { plan: true } },
      addresses: true,
      _count: {
        select: {
          progress: true,
          badges: true,
          orders: true,
          tickets: true,
          lessonBookmarks: true,
          courseAccess: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // Get mood
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const mood = await db.moodLog.findFirst({
    where: { userId, createdAt: { gte: today } },
    orderBy: { createdAt: "desc" },
  });

  // Recent orders
  const orders = await db.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Wallet transactions
  const walletTx = await db.walletTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // Purchased courses
  const courseAccess = await db.courseAccess.findMany({
    where: { userId },
    include: { course: { select: { title: true } } },
  });

  // Tickets
  const tickets = await db.ticket.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 5,
    include: { _count: { select: { messages: true } } },
  });

  return NextResponse.json({
    user: { ...user, avatar: serverFileUrl(user.avatar) },
    mood: mood?.mood || null,
    orders,
    walletTx,
    courseAccess,
    tickets,
  });
}

// PUT: update subscription
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getSession();
  if (!session || !ADMIN_PHONES.includes(session.phone)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { userId } = await params;
  const body = await req.json();

  if (body.action === "subscribe") {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (body.days || 30));

    const existing = await db.subscription.findUnique({ where: { userId } });
    if (existing) {
      await db.subscription.update({
        where: { userId },
        data: { planId: body.planId, isActive: true, startDate: new Date(), endDate },
      });
    } else {
      await db.subscription.create({
        data: { userId, planId: body.planId, isActive: true, startDate: new Date(), endDate },
      });
    }
  }

  if (body.action === "unsubscribe") {
    await db.subscription.updateMany({
      where: { userId },
      data: { isActive: false },
    });
  }

  if (body.action === "addWallet") {
    await db.$transaction([
      db.user.update({
        where: { id: userId },
        data: { walletBalance: { increment: body.amount } },
      }),
      db.walletTransaction.create({
        data: {
          userId,
          amount: body.amount,
          type: "ADMIN_CREDIT",
          description: body.description || "شارژ توسط ادمین",
        },
      }),
    ]);
  }

  if (body.action === "sendNotification") {
    const { createNotification } = await import("@/lib/notifications");
    await createNotification({
      userId,
      title: body.title,
      message: body.message,
      type: "GENERAL",
    });
  }

  return NextResponse.json({ success: true });
}

// DELETE: remove user
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getSession();
  if (!session || !ADMIN_PHONES.includes(session.phone)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { userId } = await params;
  await db.user.delete({ where: { id: userId } });
  return NextResponse.json({ success: true });
}
