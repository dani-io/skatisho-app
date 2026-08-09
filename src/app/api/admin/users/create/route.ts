import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/access";


export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { phone, name, planId, duration } = await req.json();

  if (!phone?.trim()) {
    return NextResponse.json({ error: "شماره موبایل الزامی است" }, { status: 400 });
  }

  // Find or create user
  let user = await db.user.findUnique({ where: { phone: phone.trim() } });

  if (!user) {
    const refCode = Array.from({length: 7}, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
    user = await db.user.create({
      data: {
        phone: phone.trim(),
        name: name?.trim() || null,
        referralCode: refCode,
      },
    });
  } else if (name?.trim()) {
    user = await db.user.update({
      where: { id: user.id },
      data: { name: name.trim() },
    });
  }

  // Create subscription if plan selected
  if (planId && duration) {
    const daysMap: Record<string, number> = {
      "7": 7, "30": 30, "90": 90, "180": 180, "365": 365,
    };
    const days = daysMap[duration] || 30;
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    // Upsert subscription
    const existing = await db.subscription.findUnique({ where: { userId: user.id } });
    if (existing) {
      await db.subscription.update({
        where: { userId: user.id },
        data: {
          planId,
          isActive: true,
          startDate: new Date(),
          endDate,
        },
      });
    } else {
      await db.subscription.create({
        data: {
          userId: user.id,
          planId,
          isActive: true,
          startDate: new Date(),
          endDate,
        },
      });
    }
  }

  return NextResponse.json({ success: true, user });
}
