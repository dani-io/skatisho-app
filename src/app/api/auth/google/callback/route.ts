import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { getGoogleOAuthConfig, getSiteUrl } from "@/lib/env";
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

  // THE allowlist: a role=ADMIN user carrying this email. There is no separate
  // allowlist table, and no auto-provisioning — an unknown Google account is
  // simply not an admin here.
  const admin = await db.user.findFirst({
    where: { email: identity.email, role: "ADMIN" },
    select: { id: true, phone: true },
  });

  if (!admin) {
    // Deliberately does NOT create a user. Regular accounts are born from the
    // OTP flow only; this endpoint is admin sign-in, not registration.
    console.warn("[google-oauth] rejected non-allowlisted Google sign-in");
    return failure("not_admin");
  }

  // Same jose session everything else already understands. phone may be null
  // for a Google-only admin; the role claim is what grants access.
  await createSession(admin.id, admin.phone, "ADMIN");

  await db.user.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });

  const res = NextResponse.redirect(new URL("/admin", getSiteUrl()));
  res.cookies.delete(OAUTH_STATE_COOKIE);
  return res;
}
