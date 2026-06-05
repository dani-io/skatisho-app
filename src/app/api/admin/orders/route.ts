import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

const ADMIN_PHONES = ["09123456789", "09179498400"];

export async function GET() {
  const session = await getSession();
  if (!session || !ADMIN_PHONES.includes(session.phone)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

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
