import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getJwtSecret } from "@/lib/env";

/**
 * Matched with startsWith. "/admin/login" is the admin Google sign-in screen and
 * must be reachable with no session — note it does NOT open "/admin", since
 * "/admin" is not prefixed by "/admin/login". The admin panel itself stays
 * gated. "/api/auth" already covers the Google routes.
 */
const PUBLIC_PATHS = ["/login", "/verify", "/api/auth", "/admin/login"];

/**
 * Coarse gate only. It redirects browsers to the login page and answers API
 * calls with JSON — it is NOT an authorization layer. Route handlers do their
 * own session and access checks and are authoritative; note that the static
 * bypass below lets any non-API path containing a dot through untouched.
 *
 * Browsers are sent to the login screen that matches where they were going: an
 * admin URL leads to the Google admin sign-in, everything else to the OTP page.
 * Sending an admin to /login would offer them the one method that cannot get
 * them where they asked to go.
 *
 * This cannot loop. "/admin/login" is in PUBLIC_PATHS, which is checked before
 * the session test below, so the admin login screen returns early and never
 * reaches this function — the redirect target is therefore never itself gated.
 *
 * API callers are unaffected: the isApi branch returns first, and "/api/admin/*"
 * is not prefixed by "/admin" in any case. API auth stays 401/403 JSON from the
 * route handlers.
 */
function deny(req: NextRequest, isApi: boolean) {
  if (isApi) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { pathname } = req.nextUrl;
  // Exact "/admin" plus the "/admin/" subtree — deliberately not a bare
  // startsWith("/admin"), which would also swallow a sibling like
  // "/administrators".
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const target = isAdminPage ? "/admin/login" : "/login";
  return NextResponse.redirect(new URL(target, req.url));
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");

  // The public marketing landing. This is deliberately an exact `===` match and
  // deliberately NOT an entry in PUBLIC_PATHS: those are matched with
  // startsWith, so a "/" there would prefix-match every path and disable the
  // gate entirely. Only the root itself is public; "/profile" and friends still
  // fall through to the session check below.
  if (pathname === "/") {
    return NextResponse.next();
  }

  // Allow public paths
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Allow static files. The dot check must not apply to API routes, or a key
  // with an extension in the path would skip the gate entirely.
  if (
    !isApi &&
    (pathname.startsWith("/_next") ||
      pathname.startsWith("/fonts") ||
      pathname.startsWith("/icons") ||
      pathname.startsWith("/images") ||
      pathname.includes("."))
  ) {
    return NextResponse.next();
  }

  // Check session
  const token = req.cookies.get("skatisho-session")?.value;

  if (!token) {
    return deny(req, isApi);
  }

  // Same key as lib/auth's createSession. Resolved outside the try so a missing
  // JWT_SECRET surfaces as an error rather than a blanket redirect to /login.
  const secret = getJwtSecret();

  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    return deny(req, isApi);
  }
}

export const config = {
  /**
   * Upload routes are deliberately excluded.
   *
   * When a request passes through proxy, Next clones and buffers its body in
   * memory so both proxy and the route handler can read it. For a 500MB video
   * that defeats the whole point of streaming the upload to storage. Those two
   * routes authenticate themselves (requireAdmin / getSession), which is the
   * authoritative check anyway.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/upload|api/auth/avatar).*)",
  ],
};
