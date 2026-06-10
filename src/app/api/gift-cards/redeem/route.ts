import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { code } = await req.json();

  if (!code?.trim()) {
    return NextResponse.json({ error: "کد کارت هدیه را وارد کنید" }, { status: 400 });
  }

  const card = await db.giftCard.findUnique({
    where: { code: code.trim().toUpperCase() },
  });

  if (!card) {
    return NextResponse.json({ error: "کد کارت هدیه نامعتبر است" }, { status: 404 });
  }

  if (card.isUsed) {
    return NextResponse.json({ error: "این کارت هدیه قبلاً استفاده شده" }, { status: 400 });
  }

  if (card.expiresAt && new Date() > card.expiresAt) {
    return NextResponse.json({ error: "کارت هدیه منقضی شده" }, { status: 400 });
  }

  await db.$transaction([
    db.giftCard.update({
      where: { id: card.id },
      data: { isUsed: true, usedBy: session.userId, usedAt: new Date() },
    }),
    db.user.update({
      where: { id: session.userId },
      data: { walletBalance: { increment: card.amount } },
    }),
    db.walletTransaction.create({
      data: {
        userId: session.userId,
        amount: card.amount,
        type: "GIFT_CARD",
        description: `شارژ کارت هدیه ${card.code}`,
      },
    }),
  ]);

  const scopeLabel = card.scope === "SUBSCRIPTION" ? "(اشتراک)" : card.scope === "SHOP" ? "(فروشگاه)" : "";

  await createNotification({
    userId: session.userId,
    title: "کارت هدیه شارژ شد!",
    message: `مبلغ ${card.amount.toLocaleString()} تومان ${scopeLabel} به کیف پول شما اضافه شد`,
    type: "GENERAL",
    link: "/profile",
  });

  const user = await db.user.findUnique({ where: { id: session.userId }, select: { walletBalance: true } });

  return NextResponse.json({
    success: true,
    amount: card.amount,
    scope: card.scope,
    newBalance: user?.walletBalance,
  });
}
