import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAnyPermission } from "@/lib/access";

/**
 * SHARED READ. This is the subscriptions section's own route, but the users
 * screens also read it — /admin/users lists plans to assign, and
 * /admin/users/[userId] shows the user's subscription. Gating it on
 * "subscriptions" alone would half-break the users section for an admin who
 * legitimately holds "users".
 *
 * Safe to widen because the route is GET-only: it reads, it never writes. If a
 * write method is ever added here it must NOT inherit this widening — give it
 * requirePermission("subscriptions").
 */
export async function GET(req: NextRequest) {
  const denied = await requireAnyPermission(["subscriptions", "users"]);
  if (denied) return denied;

  const url = new URL(req.url);

  // Return plans if requested
  if (url.searchParams.get("plans") === "1") {
    const plans = await db.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });
    return NextResponse.json({ plans });
  }

  const subscriptions = await db.subscription.findMany({
    orderBy: { startDate: "desc" },
    include: {
      user: { select: { name: true, phone: true } },
      plan: { select: { title: true, price: true } },
    },
  });
  return NextResponse.json({ subscriptions });
}
