import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { ADMIN_PHONES } from "@/lib/access";


// GET: ticket detail with messages
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const session = await getSession();
  if (!session || !ADMIN_PHONES.includes(session.phone)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { ticketId } = await params;

  const ticket = await db.ticket.findUnique({
    where: { id: ticketId },
    include: {
      user: { select: { name: true, phone: true, avatar: true } },
      messages: { orderBy: { createdAt: "asc" } },
      lesson: { select: { id: true, title: true, chapter: { select: { title: true, course: { select: { id: true, title: true } } } } } },
    },
  });

  if (!ticket) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // Mark user messages as read
  await db.ticketMessage.updateMany({
    where: { ticketId, isAdmin: false, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
  return NextResponse.json({ ticket });
}

// PATCH: change ticket status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const session = await getSession();
  if (!session || !ADMIN_PHONES.includes(session.phone)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { ticketId } = await params;
  const { status } = await req.json();

  if (!["OPEN", "ANSWERED", "CLOSED"].includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  const ticket = await db.ticket.update({
    where: { id: ticketId },
    data: { status },
  });

  return NextResponse.json({ ticket });
}
