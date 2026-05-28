import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      phone: true,
      name: true,
      avatar: true,
      skillLevel: true,
      referralCode: true,
      walletBalance: true,
      createdAt: true,
      subscription: {
        select: {
          endDate: true,
          isActive: true,
          plan: { select: { title: true } },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user });
}
