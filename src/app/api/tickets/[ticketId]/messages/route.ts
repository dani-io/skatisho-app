import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { ticketId } = await params;
  const { message } = await req.json();

  if (!message?.trim()) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  // Verify ticket belongs to user
  const ticket = await db.ticket.findFirst({
    where: { id: ticketId, userId: session.userId },
  });

  if (!ticket) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const newMessage = await db.ticketMessage.create({
    data: {
      ticketId,
      content: message.trim(),
      isAdmin: false,
    },
  });

  // Reopen ticket if it was closed/answered
  if (ticket.status !== "OPEN") {
    await db.ticket.update({
      where: { id: ticketId },
      data: { status: "OPEN" },
    });
  }

  return NextResponse.json({ message: newMessage }, { status: 201 });
}
