import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { courseId } = await params;

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, title: true, price: true },
  });

  if (!course || !course.price) {
    return NextResponse.json({ error: "این دوره قابل خرید تکی نیست" }, { status: 400 });
  }

  // Check if already purchased
  const existing = await db.courseAccess.findUnique({
    where: { userId_courseId: { userId: session.userId, courseId } },
  });

  if (existing) {
    return NextResponse.json({ error: "شما قبلاً این دوره را خریداری کرده‌اید" }, { status: 400 });
  }

  // Check wallet balance
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { walletBalance: true },
  });

  if (!user || user.walletBalance < course.price) {
    return NextResponse.json({
      error: "موجودی کیف پول کافی نیست",
      needed: course.price,
      balance: user?.walletBalance || 0,
    }, { status: 402 });
  }

  // Deduct from wallet and create access
  await db.$transaction([
    db.user.update({
      where: { id: session.userId },
      data: { walletBalance: { decrement: course.price } },
    }),
    db.courseAccess.create({
      data: {
        userId: session.userId,
        courseId,
        amount: course.price,
      },
    }),
  ]);

  await createNotification({
    userId: session.userId,
    title: "دوره خریداری شد! 🎉",
    message: `دوره «${course.title}» با موفقیت خریداری شد`,
    type: "GENERAL",
    link: `/courses/${courseId}`,
  });

  return NextResponse.json({ success: true });
}
