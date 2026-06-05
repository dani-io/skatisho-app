import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { code, amount } = await req.json();

  if (!code?.trim()) {
    return NextResponse.json({ error: "کد تخفیف را وارد کنید" }, { status: 400 });
  }

  const coupon = await db.coupon.findUnique({
    where: { code: code.trim().toUpperCase() },
  });

  if (!coupon || !coupon.isActive) {
    return NextResponse.json({ error: "کد تخفیف نامعتبر است" }, { status: 404 });
  }

  if (coupon.expiresAt && new Date() > coupon.expiresAt) {
    return NextResponse.json({ error: "کد تخفیف منقضی شده" }, { status: 400 });
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return NextResponse.json({ error: "ظرفیت استفاده از این کد تمام شده" }, { status: 400 });
  }

  const used = await db.couponUsage.findUnique({
    where: { couponId_userId: { couponId: coupon.id, userId: session.userId } },
  });
  if (used) {
    return NextResponse.json({ error: "شما قبلاً از این کد استفاده کرده‌اید" }, { status: 400 });
  }

  if (coupon.minAmount && amount < coupon.minAmount) {
    return NextResponse.json({
      error: `حداقل مبلغ سفارش برای این کد ${coupon.minAmount.toLocaleString()} تومان است`,
    }, { status: 400 });
  }

  let discount = 0;
  if (coupon.type === "PERCENT") {
    discount = Math.round((amount * coupon.value) / 100);
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else {
    discount = coupon.value;
  }
  if (discount > amount) discount = amount;

  return NextResponse.json({
    valid: true,
    couponId: coupon.id,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    discount,
    description: coupon.description,
  });
}
