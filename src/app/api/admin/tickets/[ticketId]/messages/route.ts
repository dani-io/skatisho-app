import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { ADMIN_PHONES } from "@/lib/access";


export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const session = await getSession();
  if (!session || !ADMIN_PHONES.includes(session.phone)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { ticketId } = await params;
  const { message } = await req.json();

  if (!message?.trim()) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  const newMessage = await db.ticketMessage.create({
    data: {
      ticketId,
      content: message.trim(),
      isAdmin: true,
    },
  });

  // Update ticket status to ANSWERED
  await db.ticket.update({
    where: { id: ticketId },
    data: { status: "ANSWERED" },
  });

  // Send notification to user
  const ticket = await db.ticket.findUnique({
    where: { id: ticketId },
    select: { userId: true, subject: true },
  });
  if (ticket) {
    await createNotification({
      userId: ticket.userId,
      title: "پاسخ جدید به تیکت",
      message: `تیکت «${ticket.subject}» پاسخ داده شد`,
      type: "TICKET_REPLY",
      link: `/tickets/${ticketId}`,
    });
  }

  return NextResponse.json({ message: newMessage }, { status: 201 });
}
