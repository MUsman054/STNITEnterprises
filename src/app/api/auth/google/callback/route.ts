import { timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { createSession, safeNextPath } from "@/server/auth";
import { db, schema } from "@/server/db";
import { finishGoogleFlow, GOOGLE_FLOW_COOKIE, type GoogleFlow } from "@/server/google";
import { clientIp, rateLimit, RateLimitError } from "@/server/security";

function sameString(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function readFlow(raw: string | undefined): GoogleFlow | null {
  if (!raw) return null;
  try {
    const flow = JSON.parse(raw) as Partial<GoogleFlow>;
    return typeof flow.state === "string" && typeof flow.verifier === "string" ? { state: flow.state, verifier: flow.verifier, next: safeNextPath(flow.next) } : null;
  } catch {
    return null;
  }
}

/** Finds the account for this Google profile, linking or creating one as needed. */
async function upsertGoogleUser(profile: { sub: string; email: string; name: string }): Promise<string> {
  const [byGoogle] = await db().select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.googleId, profile.sub)).limit(1);
  if (byGoogle) return byGoogle.id;

  // Same (Google-verified) email as an existing password account: link the two.
  const [byEmail] = await db()
    .update(schema.users)
    .set({ googleId: profile.sub })
    .where(eq(schema.users.email, profile.email))
    .returning({ id: schema.users.id });
  if (byEmail) return byEmail.id;

  const [created] = await db()
    .insert(schema.users)
    .values({ email: profile.email, name: profile.name, googleId: profile.sub, passwordHash: null })
    .returning({ id: schema.users.id });
  return created.id;
}

/** Step 2 of "Continue with Google": Google sends the visitor back here with a one-time code. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const jar = await cookies();
  const flow = readFlow(jar.get(GOOGLE_FLOW_COOKIE)?.value);
  jar.delete({ name: GOOGLE_FLOW_COOKIE, path: "/api/auth/google" });

  // The visitor pressed "Cancel" on Google's screen.
  if (params.get("error")) redirect("/account?error=google_cancelled");

  const code = params.get("code");
  const state = params.get("state");
  if (!flow || !code || !state || !sameString(state, flow.state)) redirect("/account?error=google_expired");

  let destination: string;
  try {
    await rateLimit("google-login", await clientIp(), 30, 15 * 60);
    const profile = await finishGoogleFlow(code, flow.verifier);
    if (!profile.emailVerified) {
      destination = "/account?error=google_unverified";
    } else {
      await createSession(await upsertGoogleUser(profile));
      destination = flow.next;
    }
  } catch (error) {
    if (error instanceof RateLimitError) {
      destination = "/account?error=rate_limited";
    } else {
      console.error("[google-login] failed:", error);
      destination = "/account?error=google_failed";
    }
  }
  redirect(destination);
}
