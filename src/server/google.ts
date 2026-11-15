import "server-only";
import { createHash } from "node:crypto";
import { appUrl, requireEnv } from "@/server/env";
import { randomToken } from "@/server/security";

/**
 * "Sign in with Google" using the OAuth 2.0 authorization code flow with PKCE and a state
 * value, as Google recommends for web servers. No client library needed.
 *
 * Google Cloud Console → APIs & Services → Credentials → OAuth client ID (Web application):
 *   Authorized redirect URI: <APP_URL>/api/auth/google/callback
 */

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

export const GOOGLE_FLOW_COOKIE = "stn_google_flow";

export function googleRedirectUri(): string {
  return `${appUrl()}/api/auth/google/callback`;
}

export type GoogleFlow = { state: string; verifier: string; next: string };

/** Builds the Google consent URL plus the values to keep (in a short-lived cookie) for the callback. */
export function startGoogleFlow(next: string): { url: string; flow: GoogleFlow } {
  const state = randomToken();
  const verifier = randomToken(48);
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const params = new URLSearchParams({
    client_id: requireEnv("GOOGLE_CLIENT_ID"),
    redirect_uri: googleRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  });
  return { url: `${AUTH_URL}?${params}`, flow: { state, verifier, next } };
}

export type GoogleProfile = { sub: string; email: string; emailVerified: boolean; name: string };

/** Exchanges the authorization code and returns the verified Google profile. */
export async function finishGoogleFlow(code: string, verifier: string): Promise<GoogleProfile> {
  const tokenResponse = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: requireEnv("GOOGLE_CLIENT_ID"),
      client_secret: requireEnv("GOOGLE_CLIENT_SECRET"),
      redirect_uri: googleRedirectUri(),
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
    cache: "no-store",
  });
  if (!tokenResponse.ok) throw new Error(`Google token exchange failed: ${tokenResponse.status} ${await tokenResponse.text()}`);
  const { access_token: accessToken } = (await tokenResponse.json()) as { access_token?: string };
  if (!accessToken) throw new Error("Google token response had no access_token");

  // Fetched straight from Google over TLS with the fresh token, so the claims can be trusted.
  const profileResponse = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
  if (!profileResponse.ok) throw new Error(`Google userinfo failed: ${profileResponse.status}`);
  const info = (await profileResponse.json()) as { sub?: string; email?: string; email_verified?: boolean; name?: string; given_name?: string };
  if (!info.sub || !info.email) throw new Error("Google profile is missing sub or email");

  return {
    sub: info.sub,
    email: info.email.trim().toLowerCase(),
    emailVerified: info.email_verified === true,
    name: (info.name || info.given_name || info.email.split("@")[0]).slice(0, 120),
  };
}
