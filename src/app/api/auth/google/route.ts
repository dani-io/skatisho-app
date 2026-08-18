import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import {
  getGoogleOAuthConfig,
  getSiteUrlOrLocal,
  SECURE_COOKIES,
} from "@/lib/env";
import { buildConsentUrl, OAUTH_STATE_COOKIE } from "@/lib/google";

/**
 * Step 1 of the admin Google sign-in: mint a CSRF state, remember it in an
 * httpOnly cookie, and bounce the browser to Google's consent screen.
 *
 * This route grants nothing on its own. Authorization happens entirely in the
 * callback, after Google has vouched for an email.
 */
export async function GET() {
  let config;
  try {
    config = getGoogleOAuthConfig();
  } catch {
    // Missing GOOGLE_* env. Don't echo the underlying message to the browser.
    console.error("[google-oauth] not configured");
    // Via lib/env, not process.env.NEXT_PUBLIC_SITE_URL directly: a static read
    // is inlined at build time and would bake the build host's domain into the
    // image. This resolves at runtime, so the same image works under any domain.
    return NextResponse.redirect(
      new URL("/admin/login?error=unconfigured", getSiteUrlOrLocal())
    );
  }

  const state = randomBytes(32).toString("base64url");

  const res = NextResponse.redirect(buildConsentUrl(config, state));

  // The state cookie is the other half of the CSRF check: the callback only
  // trusts a state that it can match against this cookie. sameSite "lax" is
  // required — Google returns via a top-level GET navigation, and "strict"
  // would withhold the cookie on exactly that request.
  res.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: SECURE_COOKIES,
    sameSite: "lax",
    maxAge: 600, // 10 minutes; a consent screen left open longer starts over
    path: "/",
  });

  return res;
}
