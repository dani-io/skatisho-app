import { after } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

/**
 * "Last seen" — when the user last made an authenticated REQUEST, as opposed to
 * lastLoginAt, which only moves at sign-in. The admin user list needs the first
 * to answer "are they here right now".
 *
 * This module is where Prisma meets the session. lib/auth.ts and proxy.ts stay
 * Prisma-free by design (see the note on SessionRole in lib/auth), so the write
 * lives here and the routes import getLiveSession from this module instead.
 */

/** Write at most one row per user per this window. */
const THROTTLE_MS = 2 * 60 * 1000;

/**
 * Pinned on globalThis for the same reason the Prisma client is in lib/db:
 * without it, dev HMR hands every edit a fresh Map and the throttle stops
 * throttling. Single container per docker-compose, so a per-process Map is the
 * whole story; with N instances the worst case is N writes per window per user,
 * which is still bounded and still correct.
 */
const globalForPresence = globalThis as unknown as {
  lastSeenWrites: Map<string, number> | undefined;
  lastSeenPrunedAt: number | undefined;
};

const lastWrite = (globalForPresence.lastSeenWrites ??= new Map<string, number>());

/**
 * Drop entries that are already older than the window: they no longer suppress
 * anything, so forgetting them changes no behaviour. Bounded to once per window
 * rather than once per write — otherwise this is an O(active users) sweep on
 * every write, which is the cost the throttle exists to avoid.
 */
function prune(now: number) {
  if (now - (globalForPresence.lastSeenPrunedAt ?? 0) < THROTTLE_MS) return;
  globalForPresence.lastSeenPrunedAt = now;
  for (const [userId, at] of lastWrite) {
    if (now - at >= THROTTLE_MS) lastWrite.delete(userId);
  }
}

/**
 * Records the write in a raw UPDATE rather than through the Prisma client.
 *
 * This is deliberate and load-bearing. `db.user.update` and `db.user.updateMany`
 * BOTH bump the row's `@updatedAt` — verified against Postgres with Prisma
 * 6.19.3, where updateMany moved updatedAt by the full delay between the create
 * and the write. `updatedAt` means "profile last modified"; a presence ping
 * every two minutes would destroy that meaning for every active user. Raw SQL is
 * the only write that touches exactly one column.
 *
 * Two further properties, both verified rather than assumed:
 *   - A row deleted mid-request is 0 rows affected, not a P2025 throw, so the
 *     admin deleting a user cannot crash that user's in-flight request.
 *   - The timestamp is BOUND as a JS Date, never Postgres NOW(). "lastSeenAt" is
 *     `timestamp(3)` without time zone, so NOW() is converted using the session
 *     TimeZone — on a server set to Asia/Tehran that lands 3.5 hours off, and
 *     every user reads as online. A bound Date round-trips as exact UTC.
 */
async function writeLastSeen(userId: string, at: Date) {
  await db.$executeRaw`
    UPDATE "users" SET "lastSeenAt" = ${at} WHERE "id" = ${userId}
  `;
}

/**
 * Marks the user as active now, at most once per THROTTLE_MS.
 *
 * Never awaited by the caller and never throws: presence is telemetry, and a
 * failing presence write must not turn a working page into an error. The DB work
 * is handed to after(), so it runs once the response is already on its way and
 * the user waits for none of it.
 */
export function touchLastSeen(userId: string) {
  const now = Date.now();

  const previous = lastWrite.get(userId);
  if (previous !== undefined && now - previous < THROTTLE_MS) return;

  // Claimed BEFORE the write is scheduled, so a burst of concurrent requests
  // from one user collapses to a single write rather than one per request.
  lastWrite.set(userId, now);
  prune(now);

  const stamp = new Date(now);
  const write = () =>
    writeLastSeen(userId, stamp).catch(() => {
      // Let the next request retry instead of going dark for the rest of the
      // window. Swallowed on purpose — see the note above.
      if (lastWrite.get(userId) === now) lastWrite.delete(userId);
    });

  try {
    after(write);
  } catch {
    // after() requires a request scope. If we are somehow outside one, fall
    // back to a floating promise rather than losing the ping; the catch inside
    // `write` keeps it from becoming an unhandled rejection.
    void write();
  }
}

/**
 * getSession() plus a presence ping — the version authenticated USER routes
 * should call. Same return value as getSession, so it is a drop-in swap.
 *
 * Admin-only routes deliberately keep plain getSession: /admin/users lists
 * regular users, and an admin's own browsing is not what that column is for.
 * (An admin who also uses the app as a user still gets a lastSeenAt from the
 * user-facing routes, which is harmless.)
 */
export async function getLiveSession() {
  const session = await getSession();
  if (session) touchLastSeen(session.userId);
  return session;
}
