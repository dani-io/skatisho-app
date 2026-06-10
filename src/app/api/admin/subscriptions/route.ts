import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  // Return plans if requested
  if (url.searchParams.get("plans") === "1") {
    const plans = await db.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });
    return NextResponse.json({ plans });
  }

  const subscriptions = await db.subscription.findMany({
    orderBy: { startDate: "desc" },
    include: {
      user: { select: { name: true, phone: true } },
      plan: { select: { title: true, price: true } },
    },
  });
  return NextResponse.json({ subscriptions });
}
