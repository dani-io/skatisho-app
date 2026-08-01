import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Single source of truth for admin identity. Previously this literal was
// copy-pasted into 13 route files; the mechanism is unchanged, the definition
// is not duplicated any more.
export const ADMIN_PHONES = ["09123456789", "09179498400"];

export function isAdminPhone(phone: string | null | undefined): boolean {
  return !!phone && ADMIN_PHONES.includes(phone);
}

/**
 * Returns the session only if it belongs to an admin, else null.
 */
export async function getAdminSession() {
  const session = await getSession();
  if (!session || !isAdminPhone(session.phone)) return null;
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
  if (!isAdminPhone(session.phone)) {
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
    select: { phone: true },
  });
  return isAdminPhone(viewer?.phone);
}
