import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "dev-secret-change-me"
);

const COOKIE_NAME = "skatisho-session";

// ==================== OTP STORE (in-memory for dev) ====================
// In production, use Redis
const otpStore = new Map<string, { code: string; expires: number }>();

export function generateOTP(): string {
  // In dev mode, always return 123456
  if (process.env.NODE_ENV !== "production") {
    return "123456";
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function storeOTP(phone: string, code: string) {
  otpStore.set(phone, {
    code,
    expires: Date.now() + 2 * 60 * 1000, // 2 minutes
  });
}

export function verifyOTP(phone: string, code: string): boolean {
  // Dev mode: accept 123456
  if (process.env.NODE_ENV !== "production" && code === "123456") {
    return true;
  }

  const stored = otpStore.get(phone);
  if (!stored) return false;
  if (Date.now() > stored.expires) {
    otpStore.delete(phone);
    return false;
  }
  if (stored.code !== code) return false;

  otpStore.delete(phone);
  return true;
}

// ==================== SMS (Kavenegar) ====================
export async function sendSMS(phone: string, code: string): Promise<boolean> {
  const apiKey = process.env.SMS_API_KEY;

  // Dev mode: just log
  if (!apiKey || process.env.NODE_ENV !== "production") {
    console.log(`📱 OTP for ${phone}: ${code}`);
    return true;
  }

  try {
    const url = `https://api.kavenegar.com/v1/${apiKey}/verify/lookup.json?receptor=${phone}&token=${code}&template=skatisho-verify`;
    const res = await fetch(url);
    return res.ok;
  } catch {
    console.error("SMS send failed");
    return false;
  }
}

// ==================== JWT SESSION ====================
export async function createSession(userId: string, phone: string) {
  const token = await new SignJWT({ userId, phone })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: "/",
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { userId: string; phone: string };
  } catch {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
