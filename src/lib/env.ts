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

/**
 * Public origin, with any trailing slash removed so callers can concatenate a
 * path without producing a double slash (Google rejects a redirect_uri that
 * does not match the registered one byte for byte).
 */
export function getSiteUrl(): string {
  return requireEnv("NEXT_PUBLIC_SITE_URL").replace(/\/+$/, "");
}

/** Splits a comma-separated env list, trimming blanks. */
function parseCsv(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

let superAdminEmails: string[] | null = null;
let superAdminPhones: string[] | null = null;

/**
 * The super-admin floor: identities that hold SUPER_ADMIN no matter what the
 * database says. This is the anti-lockout guarantee — it is what lets the owners
 * back in when a role column is wrong, a row was deleted, or a migration has not
 * run yet.
 *
 * Deliberately NOT requireEnv. An unset floor must degrade to "no env
 * super-admins" (i.e. today's behaviour, DB roles only); throwing here would
 * take down every admin route at once, since requireAdmin resolves through this.
 * Lower-cased to match lib/google, which already normalises the verified address.
 */
export function getSuperAdminEmails(): string[] {
  if (!superAdminEmails) {
    superAdminEmails = parseCsv(process.env.SUPER_ADMIN_EMAILS).map((email) =>
      email.toLowerCase()
    );
  }
  return superAdminEmails;
}

/**
 * Phone-number half of the floor. Optional, and separate from the legacy
 * ADMIN_PHONES list (which grants plain ADMIN and goes away in a later phase):
 * this one exists so an owner who signs in with OTP rather than Google still
 * lands on SUPER_ADMIN.
 */
export function getSuperAdminPhones(): string[] {
  if (!superAdminPhones) {
    superAdminPhones = parseCsv(process.env.SUPER_ADMIN_PHONES);
  }
  return superAdminPhones;
}

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

/**
 * Lazy like everything else here: a deploy without Google credentials still
 * builds and still serves the OTP flow. Only the two Google routes throw.
 */
export function getGoogleOAuthConfig(): GoogleOAuthConfig {
  return {
    clientId: requireEnv("GOOGLE_CLIENT_ID"),
    clientSecret: requireEnv("GOOGLE_CLIENT_SECRET"),
    redirectUri: `${getSiteUrl()}/api/auth/google/callback`,
  };
}
