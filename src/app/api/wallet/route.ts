import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [user, transactions] = await Promise.all([
    db.user.findUnique({ where: { id: session.userId }, select: { walletBalance: true } }),
    db.walletTransaction.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return NextResponse.json({ balance: user?.walletBalance || 0, transactions });
}
