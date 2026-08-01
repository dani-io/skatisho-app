import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { ADMIN_PHONES } from "@/lib/access";


// GET: list all coupons
export async function GET() {
  const session = await getSession();
  if (!session || !ADMIN_PHONES.includes(session.phone)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const coupons = await db.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { usages: true } } },
  });

  return NextResponse.json({ coupons });
}

// POST: create coupon
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !ADMIN_PHONES.includes(session.phone)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { code, type, value, minAmount, maxDiscount, usageLimit, expiresAt, description } = await req.json();

  if (!code?.trim() || !type || !value) {
    return NextResponse.json({ error: "required fields missing" }, { status: 400 });
  }

  const coupon = await db.coupon.create({
    data: {
      code: code.trim().toUpperCase(),
      type,
      value: parseInt(value),
      minAmount: minAmount ? parseInt(minAmount) : null,
      maxDiscount: maxDiscount ? parseInt(maxDiscount) : null,
      usageLimit: usageLimit ? parseInt(usageLimit) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      description: description?.trim() || null,
    },
  });

  return NextResponse.json({ coupon }, { status: 201 });
}

// DELETE: delete coupon
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || !ADMIN_PHONES.includes(session.phone)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  await db.coupon.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
