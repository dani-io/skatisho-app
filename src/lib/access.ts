import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, type SessionPayload } from "@/lib/auth";

// Single source of truth for admin identity. Previously this literal was
// copy-pasted into 13 route files; the mechanism is unchanged, the definition
// is not duplicated any more.
export const ADMIN_PHONES = ["09123456789", "09179498400"];

export function isAdminPhone(phone: string | null | undefined): boolean {
  return !!phone && ADMIN_PHONES.includes(phone);
}

/**
 * THE definition of admin-ness. Every gate in the app resolves to this one
 * predicate — do not re-implement it inline in a route.
 *
 * Two ways to qualify, deliberately:
 *   1. role === "ADMIN" — the real, forward-looking check, backed by the DB
 *      column and carried in the token.
 *   2. phone in ADMIN_PHONES — a transitional fallback. Sessions minted before
 *      the role claim existed stay valid for 30 days and carry no role, and no
 *      user row has role=ADMIN until someone sets it. Without this, promoting
 *      the schema would lock every current admin out.
 *
 * Path 2 is temporary. Once admin rows carry role=ADMIN and the old tokens have
 * aged out, delete ADMIN_PHONES and the second clause with it.
 */
export function isAdminSession(
  session: SessionPayload | null | undefined
): boolean {
  if (!session) return false;
  return session.role === "ADMIN" || isAdminPhone(session.phone);
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
    select: { phone: true, role: true },
  });
  if (!viewer) return false;
  // Same two-path rule as isAdminSession, resolved from the row rather than the
  // token because this is called with a bare userId.
  return viewer.role === "ADMIN" || isAdminPhone(viewer.phone);
}
