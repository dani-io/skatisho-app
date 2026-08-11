import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, type SessionPayload, type SessionRole } from "@/lib/auth";
import { getSuperAdminEmails, getSuperAdminPhones } from "@/lib/env";
import { touchLastSeen } from "@/lib/presence";

// Single source of truth for admin identity. Previously this literal was
// copy-pasted into 13 route files; the mechanism is unchanged, the definition
// is not duplicated any more.
export const ADMIN_PHONES = ["09123456789", "09179498400"];

export function isAdminPhone(phone: string | null | undefined): boolean {
  return !!phone && ADMIN_PHONES.includes(phone);
}

// ==================== SUPER-ADMIN FLOOR ====================

/**
 * The env floor, evaluated against an identity rather than a role column.
 *
 * These two predicates are what make super-admin independent of login method:
 * whether the owner arrives via Google (email) or OTP (phone), the same
 * identity resolves to the same answer, even if the two paths landed on
 * different user rows.
 */
export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getSuperAdminEmails().includes(email.trim().toLowerCase());
}

export function isSuperAdminPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  return getSuperAdminPhones().includes(phone.trim());
}

/** Shape shared by a session and a user row for floor purposes. */
interface FloorIdentity {
  email?: string | null;
  phone?: string | null;
  role?: SessionRole | null;
}

/**
 * Is this identity a super-admin? True when EITHER the stored role says so OR
 * the env floor covers it.
 *
 * The floor half is deliberately grant-only: it can let someone in when the
 * database disagrees, but it never takes access away. That asymmetry is the
 * whole point — a wrong role column, a deleted row, or an unrun migration must
 * not be able to lock the owners out of their own panel.
 */
export function isSuperAdmin(identity: FloorIdentity | null | undefined): boolean {
  if (!identity) return false;
  return (
    identity.role === "SUPER_ADMIN" ||
    isSuperAdminEmail(identity.email) ||
    isSuperAdminPhone(identity.phone)
  );
}

/**
 * Session-level convenience wrapper. Note the caveat on SessionPayload.email:
 * a token minted before that claim existed carries no email, so this can return
 * false for a floor member whose session predates the change. That is safe
 * (they still qualify through their role claim, or through the DB-backed check
 * in requirePermission) precisely because the floor only ever grants.
 */
export function isSuperAdminSession(
  session: SessionPayload | null | undefined
): boolean {
  return isSuperAdmin(session);
}

/**
 * THE definition of admin-ness. Every gate in the app resolves to this one
 * predicate — do not re-implement it inline in a route.
 *
 * Ways to qualify, deliberately:
 *   1. SUPER_ADMIN — by role claim or by the env floor. Strictly above ADMIN,
 *      so it must pass every gate a plain ADMIN passes.
 *   2. role === "ADMIN" — the real, forward-looking check, backed by the DB
 *      column and carried in the token.
 *   3. phone in ADMIN_PHONES — a transitional fallback. Sessions minted before
 *      the role claim existed stay valid for 30 days and carry no role, and no
 *      user row has role=ADMIN until someone sets it. Without this, promoting
 *      the schema would lock every current admin out.
 *
 * Path 3 is temporary. Once admin rows carry role=ADMIN and the old tokens have
 * aged out, delete ADMIN_PHONES and that clause with it.
 */
export function isAdminSession(
  session: SessionPayload | null | undefined
): boolean {
  if (!session) return false;
  return (
    isSuperAdminSession(session) ||
    session.role === "ADMIN" ||
    isAdminPhone(session.phone)
  );
}

/**
 * Users who hold admin access solely through the legacy ADMIN_PHONES fallback —
 * i.e. they are NOT role=ADMIN or SUPER_ADMIN. The allowlist screen lists them
 * read-only so it doesn't misrepresent who can actually get in. Lives here so
 * ADMIN_PHONES stays confined to this module.
 *
 * `notIn` rather than `not`: with SUPER_ADMIN in the enum, `not: "ADMIN"` would
 * file a super-admin who happens to hold a legacy phone under "legacy", which
 * reads as a downgrade of the most privileged account in the system. Floor
 * members are filtered out for the same reason — their access does not come
 * from the legacy list.
 */
export async function listLegacyPhoneAdmins() {
  if (ADMIN_PHONES.length === 0) return [];
  const rows = await db.user.findMany({
    where: {
      phone: { in: ADMIN_PHONES },
      role: { notIn: ["ADMIN", "SUPER_ADMIN"] },
    },
    select: { id: true, name: true, phone: true, email: true },
  });
  return rows.filter((row) => !isSuperAdmin(row));
}

/**
 * Returns the session only if it belongs to an admin, else null.
 */
export async function getAdminSession() {
  const session = await getSession();
  if (!isAdminSession(session)) return null;
  return session;
}

/**
 * Guard for admin-only route handlers. Returns a response to bail out with,
 * or null when the caller is an admin and may proceed.
 *
 *   const denied = await requireAdmin();
 *   if (denied) return denied;
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  return null;
}

// ==================== PER-SECTION PERMISSIONS ====================

/**
 * Resolves what the caller may actually do, from the DATABASE rather than the
 * token. Permissions are edited far more often than roles, so a 30-day token
 * snapshot would mean a revoked permission keeps working for up to a month.
 * One primary-key read on an admin-only path is not a cost worth optimising.
 *
 * The floor is applied to the ROW, not the session, which is what makes it
 * independent of how the caller logged in.
 */
async function resolveAccess(userId: string) {
  const row = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, email: true, phone: true, permissions: true },
  });
  if (!row) return null;

  // Presence for the admin panel. Every admin gate resolves through here, so
  // this single call is what stops an admin who lives in /admin from reading as
  // offline in their own user list. Same throttled helper the user-facing routes
  // use — one write per ~2 minutes per person, deferred to after(), no
  // updatedAt bump — deliberately reused rather than reimplemented.
  //
  // It fires before the permission verdict, so a caller who is about to get a
  // 403 is still recorded as active. That is correct: lastSeenAt means "made an
  // authenticated request", not "was allowed in".
  touchLastSeen(userId);

  return {
    ...row,
    superAdmin: isSuperAdmin(row),
    // Legacy phone admins predate the permission model entirely; until
    // ADMIN_PHONES is retired they keep the unrestricted access they have now.
    legacyPhoneAdmin: isAdminPhone(row.phone),
  };
}

/**
 * Guard for a single admin section, e.g. requirePermission("courses").
 *
 * Passes when the caller is a super-admin (role, env floor, or legacy phone
 * fallback), or is an ADMIN whose permissions array contains `key`.
 */
export async function requirePermission(
  key: string
): Promise<NextResponse | null> {
  return requireAnyPermission([key]);
}

/**
 * Guard for a route legitimately shared by more than one section — holding ANY
 * of the listed keys is enough.
 *
 * Used sparingly and only for READS. A route that WRITES belongs to exactly one
 * section; widening a write would let an admin change data they were never
 * granted. See the shared-route notes on each call site.
 */
export async function requireAnyPermission(
  keys: string[]
): Promise<NextResponse | null> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const access = await resolveAccess(session.userId);
  if (!access) {
    // Session references a row that no longer exists.
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  if (access.superAdmin || access.legacyPhoneAdmin) return null;

  if (
    access.role === "ADMIN" &&
    keys.some((key) => access.permissions.includes(key))
  ) {
    return null;
  }

  return NextResponse.json({ error: "forbidden" }, { status: 403 });
}

/**
 * Guard for the admin-management section. Deliberately NOT a permission key:
 * granting admin access is the one action that can escalate every other
 * boundary, so it is reserved for super-admins and cannot be handed out through
 * the permissions array. An ADMIN holding every key still gets 403 here.
 *
 * Legacy ADMIN_PHONES holders still pass, and that is a conscious, temporary
 * choice: they are today's operators, and in an environment where no row is
 * SUPER_ADMIN yet and the env floor is unset, excluding them would lock everyone
 * out of admin management with no way back in through the UI. Phase 4 removes
 * this together with ADMIN_PHONES.
 */
export async function requireSuperAdmin(): Promise<NextResponse | null> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const access = await resolveAccess(session.userId);
  if (!access) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  if (access.superAdmin || access.legacyPhoneAdmin) return null;

  return NextResponse.json({ error: "forbidden" }, { status: 403 });
}

/**
 * Boolean forms of the guards above, for SERVER COMPONENTS — which render, and
 * so cannot do anything useful with a NextResponse. Same resolution, same DB
 * read; only the return shape differs.
 *
 * These are defence in depth, not the boundary: the boundary is the route
 * handler. A page that forgets to call these leaks nothing, because its data
 * still arrives through a gated API.
 */
export async function hasPermission(key: string): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  const access = await resolveAccess(session.userId);
  if (!access) return false;
  if (access.superAdmin || access.legacyPhoneAdmin) return true;
  return access.role === "ADMIN" && access.permissions.includes(key);
}

export async function hasSuperAdmin(): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  const access = await resolveAccess(session.userId);
  if (!access) return false;
  return access.superAdmin || access.legacyPhoneAdmin;
}

/**
 * What the panel may render for this caller. Rendering only — every route does
 * its own server-side check, and this must never be the thing that protects
 * data. Returns null when the caller is not an admin at all.
 */
export async function getAdminAccessSummary(): Promise<{
  role: SessionRole;
  superAdmin: boolean;
  permissions: string[];
} | null> {
  const session = await getSession();
  if (!session) return null;

  const access = await resolveAccess(session.userId);
  if (!access) return null;

  // A legacy phone admin has no permission rows but full access this phase; the
  // sidebar treats them like a super-admin so their panel does not go blank.
  const superAdmin = access.superAdmin || access.legacyPhoneAdmin;
  if (!superAdmin && access.role !== "ADMIN") return null;

  return {
    role: access.role,
    superAdmin,
    permissions: superAdmin ? [] : access.permissions,
  };
}

/**
 * Login-time reconciliation: when the identity signing in is covered by the env
 * floor, make the database say so too, and return the role the session should
 * carry.
 *
 * Both login paths call this. Over time it converges the "Reza has two rows"
 * problem — whichever row he authenticates through gets promoted — while the
 * floor keeps guaranteeing access in the meantime. It only ever promotes; it
 * never demotes, so removing someone from the floor is a deliberate DB edit
 * rather than a silent side effect of somebody else logging in.
 */
export async function applySuperAdminFloor(user: {
  id: string;
  email: string | null;
  phone: string | null;
  role: SessionRole;
}): Promise<SessionRole> {
  if (!isSuperAdmin(user)) return user.role;

  if (user.role !== "SUPER_ADMIN") {
    await db.user.update({
      where: { id: user.id },
      data: { role: "SUPER_ADMIN" },
    });
  }
  return "SUPER_ADMIN";
}

async function hasActiveSubscription(userId: string): Promise<boolean> {
  const subscription = await db.subscription.findUnique({
    where: { userId },
    select: { isActive: true, endDate: true },
  });
  return !!subscription?.isActive && new Date(subscription.endDate) > new Date();
}

export interface CourseAccessDetail {
  hasVIP: boolean;
  hasPurchased: boolean;
  hasAccess: boolean;
}

/**
 * Granular breakdown, for UI that distinguishes "subscribed" from "bought this
 * one". Authorization decisions should use hasCourseAccess / canAccessLesson.
 */
export async function getCourseAccessDetail(
  userId: string | null,
  courseId: string
): Promise<CourseAccessDetail> {
  if (!userId) {
    return { hasVIP: false, hasPurchased: false, hasAccess: false };
  }

  const [hasVIP, purchase] = await Promise.all([
    hasActiveSubscription(userId),
    db.courseAccess.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { id: true },
    }),
  ]);

  const hasPurchased = !!purchase;
  return { hasVIP, hasPurchased, hasAccess: hasVIP || hasPurchased };
}

/**
 * Does this user have access to watch this course's paid lessons?
 *
 * Rule: active VIP subscription OR a CourseAccess row for THIS course.
 * A null userId (logged out) is always denied — free lessons are handled by
 * the caller via canAccessLesson, never by weakening this check.
 */
export async function hasCourseAccess(
  userId: string | null,
  courseId: string
): Promise<boolean> {
  const { hasAccess } = await getCourseAccessDetail(userId, courseId);
  return hasAccess;
}

/**
 * Full lesson rule: lesson.isFree OR hasCourseAccess for the lesson's REAL
 * course. Pass the courseId taken from the lesson's own chapter — never the
 * one from the request path.
 */
export async function canAccessLesson(
  userId: string | null,
  lesson: { isFree: boolean; courseId: string }
): Promise<boolean> {
  if (lesson.isFree) return true;
  return hasCourseAccess(userId, lesson.courseId);
}

/**
 * Can this user read this avatar? Owner or admin only.
 */
export async function canAccessAvatar(
  userId: string | null,
  targetUserId: string
): Promise<boolean> {
  if (!userId) return false;
  if (userId === targetUserId) return true;

  const viewer = await db.user.findUnique({
    where: { id: userId },
    select: { phone: true, role: true, email: true },
  });
  if (!viewer) return false;
  // Same rule as isAdminSession, resolved from the row rather than the token
  // because this is called with a bare userId. `email` is selected so the
  // super-admin floor applies here too — without it, an owner whose row still
  // says USER would be denied a moderation view every plain ADMIN can see.
  return (
    isSuperAdmin(viewer) ||
    viewer.role === "ADMIN" ||
    isAdminPhone(viewer.phone)
  );
}
