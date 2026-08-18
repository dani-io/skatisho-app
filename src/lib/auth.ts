import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getJwtSecret, SECURE_COOKIES } from "@/lib/env";

const COOKIE_NAME = "skatisho-session";

// OTP send/verify now lives in the provider-agnostic layer at lib/sms.
// This module owns only the jose session JWT.

/**
 * Mirrors the Prisma `Role` enum, declared structurally so this module (and the
 * proxy, which must stay Prisma-free) never pulls in the client at runtime.
 */
export type SessionRole = "USER" | "ADMIN" | "SUPER_ADMIN";

export interface SessionPayload {
  userId: string;
  /**
   * Null for admins who signed in with Google and have no phone on record.
   * isAdminPhone already treats null as "not a legacy phone admin".
   */
  phone: string | null;
  /**
   * Optional on purpose. Tokens minted before the role claim existed are valid
   * for up to 30 days, and they carry no `role`. Readers must treat a missing
   * role as USER — never as an error and never as ADMIN.
   */
  role?: SessionRole;
  /**
   * Also optional, and for the same reason: tokens minted before this claim
   * existed carry no `email`. It is here so the super-admin env floor can be
   * evaluated without a database round trip on cheap paths. It may only ever
   * GRANT access — never deny it — because a missing claim is indistinguishable
   * from "this user has no email".
   */
  email?: string | null;
}

// ==================== JWT SESSION ====================
export async function createSession(
  userId: string,
  phone: string | null,
  role: SessionRole = "USER",
  email: string | null = null
) {
  const token = await new SignJWT({ userId, phone, role, email })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(getJwtSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: SECURE_COOKIES,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: "/",
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  // Resolved outside the try: a missing JWT_SECRET must surface as an error,
  // not get swallowed into a silent "not logged in".
  const secret = getJwtSecret();

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
