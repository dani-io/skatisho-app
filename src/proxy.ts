import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getJwtSecret } from "@/lib/env";

const PUBLIC_PATHS = ["/login", "/verify", "/api/auth"];

/**
 * Coarse gate only. It redirects browsers to the login page and answers API
 * calls with JSON — it is NOT an authorization layer. Route handlers do their
 * own session and access checks and are authoritative; note that the static
 * bypass below lets any non-API path containing a dot through untouched.
 */
function deny(req: NextRequest, isApi: boolean) {
  if (isApi) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", req.url));
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");

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
