import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/access";


export async function GET() {
  const denied = await requirePermission("tickets");
  if (denied) return denied;

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
