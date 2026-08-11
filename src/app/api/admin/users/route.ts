import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/access";

export async function GET() {
  const denied = await requirePermission("users");
  if (denied) return denied;

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      phone: true,
      skillLevel: true,
      createdAt: true,
      lastSeenAt: true,
      subscription: {
        select: {
          isActive: true,
          plan: { select: { title: true } },
        },
      },
    },
  });

  // The presence dot is a comparison between lastSeenAt and "now", and the
  // client's clock is not a reliable source for the second half of it — a phone
  // with a drifting clock would show every user online, or nobody. Serving our
  // own clock alongside the rows keeps both sides of the comparison on server
  // time.
  return NextResponse.json({ users, now: new Date() });
}
