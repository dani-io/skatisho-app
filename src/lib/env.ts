/**
 * Required-environment access.
 *
 * Everything here is lazy: the throw happens on first use at runtime, never at
 * module import, so `next build` succeeds with an empty environment.
 */

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    // Deliberately loud. A silent fallback is how a public default secret ends
    // up signing production sessions.
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

let jwtSecret: Uint8Array | null = null;

/**
 * Signing/verification key for the session JWT. Both sides — createSession in
 * lib/auth and the proxy gate — must go through this, or tokens signed by one
 * will not verify in the other.
 */
export function getJwtSecret(): Uint8Array {
  if (!jwtSecret) {
    jwtSecret = new TextEncoder().encode(requireEnv("JWT_SECRET"));
  }
  return jwtSecret;
}
