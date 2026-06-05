import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

// GET: list user's tickets
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const tickets = await db.ticket.findMany({
    where: { userId: session.userId },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json({ tickets });
}

// POST: create new ticket
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { subject, message } = await req.json();

  if (!subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "subject and message required" }, { status: 400 });
  }

  const ticket = await db.ticket.create({
    data: {
      userId: session.userId,
      subject: subject.trim(),
      messages: {
        create: {
          content: message.trim(),
          isAdmin: false,
        },
      },
    },
    include: { messages: true },
  });

  return NextResponse.json({ ticket }, { status: 201 });
}
