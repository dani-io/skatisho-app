import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const subscriptions = await db.subscription.findMany({
    orderBy: { startDate: "desc" },
    include: {
      user: { select: { name: true, phone: true } },
      plan: { select: { title: true, price: true } },
    },
  });

  return NextResponse.json({ subscriptions });
}
