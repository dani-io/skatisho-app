import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/access";


export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const orders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, phone: true } },
      items: {
        include: { product: { select: { title: true, thumbnail: true } } },
      },
    },
  });

  return NextResponse.json({ orders });
}
