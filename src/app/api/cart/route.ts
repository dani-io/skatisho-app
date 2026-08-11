import { NextRequest, NextResponse } from "next/server";
import { getLiveSession } from "@/lib/presence";
import { db } from "@/lib/db";

// GET: load cart
export async function GET() {
  const session = await getLiveSession();
  if (!session) return NextResponse.json({ cart: null });

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { cart: true },
  });

  return NextResponse.json({ cart: user?.cart || null });
}

// POST: save cart
export async function POST(req: NextRequest) {
  const session = await getLiveSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { items } = await req.json();

  await db.user.update({
    where: { id: session.userId },
    data: { cart: items && items.length > 0 ? items : null },
  });

  return NextResponse.json({ success: true });
}
