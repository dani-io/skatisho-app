import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/access";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      phone: true,
      skillLevel: true,
      createdAt: true,
      subscription: {
        select: {
          isActive: true,
          plan: { select: { title: true } },
        },
      },
    },
  });

  return NextResponse.json({ users });
}
