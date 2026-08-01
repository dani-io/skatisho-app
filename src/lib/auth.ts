import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getJwtSecret } from "@/lib/env";

const COOKIE_NAME = "skatisho-session";

// OTP send/verify now lives in the provider-agnostic layer at lib/sms.
// This module owns only the jose session JWT.

// ==================== JWT SESSION ====================
export async function createSession(userId: string, phone: string) {
  const token = await new SignJWT({ userId, phone })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(getJwtSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: false,
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
    return payload as { userId: string; phone: string };
  } catch {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
