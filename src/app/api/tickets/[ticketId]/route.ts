import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { ticketId } = await params;

  const ticket = await db.ticket.findFirst({
    where: { id: ticketId, userId: session.userId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!ticket) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // Mark admin messages as read
  await db.ticketMessage.updateMany({
    where: { ticketId, isAdmin: true, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });

  return NextResponse.json({ ticket });
}
