import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { getGoogleOAuthConfig, getSiteUrl } from "@/lib/env";
import { applySuperAdminFloor, isSuperAdminEmail } from "@/lib/access";
import { OAUTH_STATE_COOKIE, resolveGoogleIdentity } from "@/lib/google";

/**
 * Step 2: Google sends the browser back here with a one-time code.
 *
 * The only thing that grants admin access in this app via Google is reaching
 * the bottom of this handler with an email that Google verified AND that
 * belongs to an existing role=ADMIN user. Every other path redirects with an
 * error code and creates nothing — no user row, no session cookie.
 */

/** Constant-time compare that tolerates unequal lengths. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function failure(reason: string): NextResponse {
  const res = NextResponse.redirect(
    new URL(`/admin/login?error=${reason}`, getSiteUrl())
  );
  // A failed or replayed attempt must not leave a reusable state behind.
  res.cookies.delete(OAUTH_STATE_COOKIE);
  return res;
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;

  // The user hit "Cancel" on the consent screen, or Google refused outright.
  if (params.get("error")) {
    return failure("denied");
  }

  const code = params.get("code");
  const state = params.get("state");
  const expectedState = req.cookies.get(OAUTH_STATE_COOKIE)?.value;

  // CSRF: the state echoed by Google must match the one we planted before the
  // redirect. A callback forged by a third party has no way to set that cookie.
  if (!code || !state || !expectedState || !safeEqual(state, expectedState)) {
    console.error("[google-oauth] callback rejected: bad state or missing code");
    return failure("invalid_request");
  }

  let config;
  try {
    config = getGoogleOAuthConfig();
  } catch {
    console.error("[google-oauth] not configured");
    return failure("unconfigured");
  }

  // Trades the code with Google and reads the VERIFIED email from Google's own
  // userinfo endpoint. Nothing the browser supplied is trusted as an identity.
  const identity = await resolveGoogleIdentity(config, code);
  if (!identity) {
    return failure("google_failed");
  }

  // THE allowlist: a user row carrying this email whose role is ADMIN or
  // SUPER_ADMIN, OR an address covered by the env super-admin floor. There is
  // no separate allowlist table.
  //
  // SUPER_ADMIN had to be added here explicitly: the previous query filtered on
  // role === "ADMIN", so promoting an owner to SUPER_ADMIN would have locked
  // that owner out of the only login method they use.
  const inFloor = isSuperAdminEmail(identity.email);

  const existing = await db.user.findUnique({
    where: { email: identity.email },
    select: { id: true, phone: true, email: true, role: true },
  });

  if (!existing && !inFloor) {
    // Deliberately does NOT create a user. Regular accounts are born from the
    // OTP flow only; this endpoint is admin sign-in, not registration.
    console.warn("[google-oauth] rejected non-allowlisted Google sign-in");
    return failure("not_admin");
  }

  if (existing && !inFloor && existing.role !== "ADMIN" && existing.role !== "SUPER_ADMIN") {
    // The address belongs to a regular account. Having a row is not authority.
    console.warn("[google-oauth] rejected non-admin Google sign-in");
    return failure("not_admin");
  }

  // A floor member with no row yet still gets in — that is the point of the
  // floor. This is the one auto-provisioning case, and it is bounded by an env
  // list only a deployer can change, so an unknown Google account still
  // creates nothing.
  const admin =
    existing ??
    (await db.user.create({
      data: { email: identity.email, name: identity.name, role: "SUPER_ADMIN" },
      select: { id: true, phone: true, email: true, role: true },
    }));

  // Reconciles the DB with the floor and tells us what the token should say.
  const role = await applySuperAdminFloor(admin);

  // Same jose session everything else already understands. phone may be null
  // for a Google-only admin; the role claim is what grants access. The email
  // claim lets the floor be evaluated without a DB read on cheap paths.
  await createSession(admin.id, admin.phone, role, admin.email);

  await db.user.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });

  const res = NextResponse.redirect(new URL("/admin", getSiteUrl()));
  res.cookies.delete(OAUTH_STATE_COOKIE);
  return res;
}
