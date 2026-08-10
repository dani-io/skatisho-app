import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireSuperAdmin, listLegacyPhoneAdmins } from "@/lib/access";

/**
 * Manages the admin allowlist — which is simply the set of role=ADMIN users.
 * Adding an email here is what authorizes someone to sign in with Google.
 *
 * Gated by requireSuperAdmin, NOT by a permission key. Granting admin access is
 * the one action that can escalate every other boundary, so it stays with
 * super-admins and cannot be delegated through the permissions array — an ADMIN
 * holding every key still gets 403 here.
 */

// Intentionally permissive: Google is the actual authority on whether the
// address exists. This only catches typos before they become a dead row.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  const denied = await requireSuperAdmin();
  if (denied) return denied;

  const [admins, legacyPhoneAdmins] = await Promise.all([
    db.user.findMany({
      where: { role: "ADMIN" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    listLegacyPhoneAdmins(),
  ]);

  return NextResponse.json({ admins, legacyPhoneAdmins });
}

/**
 * Add an admin by email. Two cases:
 *   - the email already belongs to a user -> promote that user to ADMIN
 *   - nobody has it -> create a phone-less ADMIN row, ready for Google sign-in
 */
export async function POST(req: NextRequest) {
  const denied = await requireSuperAdmin();
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const rawEmail = typeof body?.email === "string" ? body.email : "";
  const email = rawEmail.trim().toLowerCase();
  const name = typeof body?.name === "string" ? body.name.trim() || null : null;

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "ایمیل نامعتبر است" }, { status: 400 });
  }

  const existing = await db.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });

  if (existing) {
    if (existing.role === "ADMIN") {
      return NextResponse.json(
        { error: "این ایمیل هم‌اکنون ادمین است" },
        { status: 409 }
      );
    }
    // Promote an existing (OTP) user rather than creating a duplicate row —
    // email is @unique, so a create would fail anyway.
    const admin = await db.user.update({
      where: { id: existing.id },
      data: { role: "ADMIN" },
      select: { id: true, name: true, email: true, phone: true, createdAt: true },
    });
    return NextResponse.json({ admin, promoted: true }, { status: 200 });
  }

  // Google-only admin: no phone, which is why phone is nullable.
  const admin = await db.user.create({
    data: { email, name, role: "ADMIN" },
    select: { id: true, name: true, email: true, phone: true, createdAt: true },
  });

  return NextResponse.json({ admin, promoted: false }, { status: 201 });
}

/**
 * Revoke admin access.
 *
 * A row that exists only to be an admin (no phone, so it can never sign in via
 * OTP) is deleted outright. A real user who was promoted is demoted back to
 * USER so their account, orders and progress survive.
 */
export async function DELETE(req: NextRequest) {
  const denied = await requireSuperAdmin();
  if (denied) return denied;

  // Guaranteed non-null: requireSuperAdmin already returned on a missing session.
  const session = await getSession();

  const body = await req.json().catch(() => null);
  const userId = typeof body?.userId === "string" ? body.userId : "";
  if (!userId) {
    return NextResponse.json({ error: "userId لازم است" }, { status: 400 });
  }

  // Removing yourself is the easiest way to lock the whole team out mid-session.
  if (session?.userId === userId) {
    return NextResponse.json(
      { error: "نمی‌توانید دسترسی ادمین خودتان را حذف کنید" },
      { status: 400 }
    );
  }

  const target = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, phone: true, role: true },
  });

  if (!target || target.role !== "ADMIN") {
    return NextResponse.json({ error: "ادمین پیدا نشد" }, { status: 404 });
  }

  // Never leave the panel with zero role=ADMIN users.
  const adminCount = await db.user.count({ where: { role: "ADMIN" } });
  if (adminCount <= 1) {
    return NextResponse.json(
      { error: "آخرین ادمین را نمی‌توان حذف کرد" },
      { status: 400 }
    );
  }

  if (target.phone === null) {
    await db.user.delete({ where: { id: userId } });
    return NextResponse.json({ success: true, deleted: true });
  }

  await db.user.update({ where: { id: userId }, data: { role: "USER" } });
  return NextResponse.json({ success: true, deleted: false });
}
