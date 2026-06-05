import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

const ADMIN_PHONES = ["09123456789", "09179498400"];

export async function GET() {
  const session = await getSession();
  if (!session || !ADMIN_PHONES.includes(session.phone)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const tickets = await db.ticket.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      user: { select: { name: true, phone: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json({ tickets });
}
