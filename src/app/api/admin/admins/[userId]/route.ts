import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/access";
import { normalizePermissions } from "@/lib/permissions";

/**
 * Sets one admin's per-section permissions.
 *
 * Super-admin only, like the rest of this section: the ability to grant access
 * must never be reachable through a granted permission, or an admin could widen
 * their own boundary.
 *
 * Takes effect on the target's NEXT request — requirePermission resolves
 * role+permissions from the database per call rather than from the session
 * token, so nobody has to log out and back in for a change to land.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const denied = await requireSuperAdmin();
  if (denied) return denied;

  const { userId } = await params;
  const body = await req.json().catch(() => null);

  // Rejects unknown keys outright rather than filtering them out, so a typo
  // surfaces as an error instead of quietly granting less than intended.
  const permissions = normalizePermissions(body?.permissions);
  if (permissions === null) {
    return NextResponse.json(
      { error: "فهرست دسترسی نامعتبر است" },
      { status: 400 }
    );
  }

  const target = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!target) {
    return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
  }

  // A super-admin's access comes from their role and ignores this column
  // entirely; writing it would be a lie the UI later reads back. A plain USER
  // has no admin access to scope, so permissions there mean nothing either.
  if (target.role !== "ADMIN") {
    return NextResponse.json(
      {
        error:
          target.role === "SUPER_ADMIN"
            ? "سوپر ادمین به همه بخش‌ها دسترسی دارد و نیازی به تنظیم دسترسی ندارد"
            : "فقط برای ادمین‌ها می‌توان دسترسی تعیین کرد",
      },
      { status: 400 }
    );
  }

  const admin = await db.user.update({
    where: { id: userId },
    data: { permissions },
    select: {
      id: true, name: true, email: true, phone: true,
      role: true, permissions: true,
    },
  });

  return NextResponse.json({ admin });
}
