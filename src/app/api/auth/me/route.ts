import { NextResponse } from "next/server";
import { getLiveSession } from "@/lib/presence";
import { db } from "@/lib/db";
import { userAvatarUrl } from "@/lib/storage";

export async function GET() {
  const session = await getLiveSession();
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
      goal: true,
      birthDate: true,
      gender: true,
      height: true,
      weight: true,
      points: true,
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
      _count: {
        select: {
          progress: { where: { completed: true } },
          badges: true,
          orders: true,
          favorites: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  // Avatars are private: hand back the protected route, never a storage URL.
  return NextResponse.json({
    user: {
      ...user,
      avatar: user.avatar ? userAvatarUrl(user.id, user.avatar) : null,
    },
  });
}
