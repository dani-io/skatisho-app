import type { GoogleOAuthConfig } from "@/lib/env";

/**
 * Minimal Google OAuth 2.0 (Authorization Code) client.
 *
 * Hand-rolled over fetch rather than pulling in google-auth-library: the flow is
 * three HTTP calls and adding an SDK for it would be more surface, not less.
 *
 * Nothing in this module logs a token, a code, or a full response body. The
 * callers only ever surface generic failure strings.
 */

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const USERINFO_ENDPOINT = "https://openidconnect.googleapis.com/v1/userinfo";

export const OAUTH_STATE_COOKIE = "skatisho-oauth-state";

/**
 * Where the browser gets sent to pick a Google account.
 *
 * `prompt=select_account` matters here: without it, a machine already signed
 * into a personal Google account silently reuses it, and the admin gets an
 * "unauthorized" bounce with no obvious way to switch accounts.
 */
export function buildConsentUrl(
  config: GoogleOAuthConfig,
  state: string
): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
    // We never call Google again on the user's behalf, so there is no refresh
    // token to ask for. access_type stays the default (online).
  });
  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

/**
 * Trades the one-time code for an access token. Server-to-server over TLS, so
 * the response is authenticated by the channel and the client secret.
 */
async function exchangeCodeForAccessToken(
  config: GoogleOAuthConfig,
  code: string
): Promise<string | null> {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    // Status only. The body can echo the code and the client_id back.
    console.error("[google-oauth] token exchange failed:", res.status);
    return null;
  }

  const data = (await res.json()) as { access_token?: string };
  return data.access_token ?? null;
}

export interface GoogleIdentity {
  email: string;
  name: string | null;
}

/**
 * Resolves the identity behind an access token.
 *
 * The email is read from Google's userinfo endpoint — never from anything the
 * browser sent us — and is rejected unless Google marks it verified, so a
 * Google account cannot claim an address it has not proven it owns.
 */
async function fetchGoogleIdentity(
  accessToken: string
): Promise<GoogleIdentity | null> {
  const res = await fetch(USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("[google-oauth] userinfo failed:", res.status);
    return null;
  }

  const profile = (await res.json()) as {
    email?: string;
    email_verified?: boolean | string;
    name?: string;
  };

  // Google has historically sent this as both a boolean and the string "true".
  const verified =
    profile.email_verified === true || profile.email_verified === "true";

  if (!profile.email || !verified) {
    console.error("[google-oauth] rejected: missing or unverified email");
    return null;
  }

  return {
    email: profile.email.trim().toLowerCase(),
    name: profile.name?.trim() || null,
  };
}

/**
 * Full code -> verified identity path. Returns null on any failure; the caller
 * turns that into a generic error redirect.
 */
export async function resolveGoogleIdentity(
  config: GoogleOAuthConfig,
  code: string
): Promise<GoogleIdentity | null> {
  const accessToken = await exchangeCodeForAccessToken(config, code);
  if (!accessToken) return null;
  return fetchGoogleIdentity(accessToken);
}
