import "server-only";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { and, eq, gt, lt } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { isProduction } from "@/server/env";
import { hashToken, randomToken } from "@/server/security";

/**
 * Database-backed sessions.
 * - The cookie holds a random 256-bit token; the database stores only its SHA-256 hash.
 * - Cookie is HttpOnly (no JavaScript access), Secure in production, SameSite=Lax.
 * - Sessions last 30 days and are renewed when used in the second half of that window.
 * - Logging out, or resetting a password, deletes sessions server-side immediately.
 */

// "__Host-" makes browsers refuse the cookie unless it is Secure, host-only and Path=/.
const COOKIE_NAME = isProduction ? "__Host-stn_session" : "stn_session";
const SESSION_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  company: string | null;
  role: "customer" | "admin";
};

async function setSessionCookie(token: string, expires: Date) {
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    expires,
  });
}

/** Starts a fresh session (new token every sign-in, so a planted cookie can't be reused). */
export async function createSession(userId: string) {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * DAY_MS);
  await db().insert(schema.sessions).values({ id: hashToken(token), userId, expiresAt });
  await setSessionCookie(token, expiresAt);

  // Housekeeping: drop this user's expired sessions.
  await db()
    .delete(schema.sessions)
    .where(and(eq(schema.sessions.userId, userId), lt(schema.sessions.expiresAt, new Date())));
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (token) await db().delete(schema.sessions).where(eq(schema.sessions.id, hashToken(token)));
  jar.delete(COOKIE_NAME);
}

export async function destroyAllSessions(userId: string) {
  await db().delete(schema.sessions).where(eq(schema.sessions.userId, userId));
}

/** The signed-in user, or null. Reads the request cookie, so callers must sit inside <Suspense>. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token || token.length > 100) return null;

  // Session checks compare against the current time, so they must run per request,
  // never during prerendering.
  await connection();

  const id = hashToken(token);
  const [row] = await db()
    .select({
      id: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
      company: schema.users.company,
      role: schema.users.role,
      expiresAt: schema.sessions.expiresAt,
    })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
    .where(and(eq(schema.sessions.id, id), gt(schema.sessions.expiresAt, new Date())))
    .limit(1);

  if (!row) return null;

  // Sliding renewal. Cookies can only be written in Server Actions / Route Handlers, so
  // during page renders this quietly does nothing and the next action renews instead.
  if (row.expiresAt.getTime() - Date.now() < (SESSION_DAYS / 2) * DAY_MS) {
    const expiresAt = new Date(Date.now() + SESSION_DAYS * DAY_MS);
    try {
      await setSessionCookie(token, expiresAt);
      await db().update(schema.sessions).set({ expiresAt }).where(eq(schema.sessions.id, id));
    } catch {
      // Rendering a Server Component: cookie is read-only here.
    }
  }

  return { id: row.id, email: row.email, name: row.name, company: row.company, role: row.role };
}

export async function requireUser(next = "/account"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/account?next=${encodeURIComponent(next)}`);
  return user;
}

/** For admin pages and actions. Non-admins get a 404, so the admin area isn't advertised. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/account?next=/admin");
  if (user.role !== "admin") notFound();
  return user;
}

/** Only allow same-site relative paths as post-login destinations (prevents open redirects). */
export function safeNextPath(value: unknown, fallback = "/account"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (/[\r\n]/.test(value)) return fallback;
  return value;
}
