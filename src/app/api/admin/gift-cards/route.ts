import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

const ADMIN_PHONES = ["09123456789", "09179498400"];

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "GF-";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// GET: list gift cards
export async function GET() {
  const session = await getSession();
  if (!session || !ADMIN_PHONES.includes(session.phone)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const cards = await db.giftCard.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ cards });
}

// POST: create gift card(s)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !ADMIN_PHONES.includes(session.phone)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { amount, scope, count, expiresAt } = await req.json();

  if (!amount) {
    return NextResponse.json({ error: "amount required" }, { status: 400 });
  }

  const qty = Math.min(parseInt(count) || 1, 50);
  const cards = [];

  for (let i = 0; i < qty; i++) {
    const card = await db.giftCard.create({
      data: {
        code: generateCode(),
        amount: parseInt(amount),
        scope: scope || "ALL",
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });
    cards.push(card);
  }

  return NextResponse.json({ cards }, { status: 201 });
}

// DELETE
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || !ADMIN_PHONES.includes(session.phone)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  await db.giftCard.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
