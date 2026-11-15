"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, gt, isNull } from "drizzle-orm";
import { createSession, destroyAllSessions, destroySession, safeNextPath } from "@/server/auth";
import { db, schema } from "@/server/db";
import { sendPasswordResetEmail } from "@/server/email";
import { appUrl } from "@/server/env";
import { safeAction, type ActionResult } from "@/server/action-utils";
import { isUniqueViolation } from "@/server/orders";
import { clientIp, fakePasswordCheck, hashPassword, hashToken, randomToken, rateLimit, verifyPassword } from "@/server/security";
import { fieldErrors, loginSchema, resetRequestSchema, resetSchema, signupSchema } from "@/server/validation";

export async function signup(input: unknown, next?: string): Promise<ActionResult> {
  const result = await safeAction("signup", async () => {
    const parsed = signupSchema.safeParse(input);
    if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };

    await rateLimit("signup", await clientIp(), 5, 60 * 60);

    try {
      const [user] = await db()
        .insert(schema.users)
        .values({
          email: parsed.data.email,
          name: parsed.data.name,
          company: parsed.data.company,
          passwordHash: await hashPassword(parsed.data.password),
        })
        .returning({ id: schema.users.id });
      await createSession(user.id);
    } catch (error) {
      if (isUniqueViolation(error)) {
        return { ok: false, fieldErrors: { email: "An account with this email already exists. Sign in or reset your password." } };
      }
      throw error;
    }
    return { ok: true };
  });
  if (result.ok) {
    // Re-render the header (and everything else) for the new signed-in state.
    refresh();
    redirect(safeNextPath(next));
  }
  return result;
}

// Sign-up already tells people when an email is taken, so hiding it here would only confuse
// customers without protecting anyone. Rate limits below still stop password guessing.
const NO_ACCOUNT = "We couldn't find an account with this email. Check the spelling or create a new account.";
const WRONG_PASSWORD = "Incorrect password. Try again, or use “Forgot your password?” to reset it.";
const GOOGLE_ONLY = "This account was created with Google. Use “Continue with Google” to sign in, or reset your password to add one.";

export async function login(input: unknown, next?: string): Promise<ActionResult> {
  const result = await safeAction("login", async () => {
    const parsed = loginSchema.safeParse(input);
    if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };

    // Two limits: per IP (spraying many accounts) and per email (guessing one password).
    await rateLimit("login-ip", await clientIp(), 20, 15 * 60);
    await rateLimit("login-email", parsed.data.email, 8, 15 * 60);

    const [user] = await db()
      .select({ id: schema.users.id, passwordHash: schema.users.passwordHash })
      .from(schema.users)
      .where(eq(schema.users.email, parsed.data.email))
      .limit(1);

    if (!user) {
      await fakePasswordCheck(parsed.data.password);
      return { ok: false, fieldErrors: { email: NO_ACCOUNT } };
    }
    if (!user.passwordHash) return { ok: false, error: GOOGLE_ONLY };
    if (!(await verifyPassword(parsed.data.password, user.passwordHash))) return { ok: false, fieldErrors: { password: WRONG_PASSWORD } };

    await createSession(user.id);
    return { ok: true };
  });
  if (result.ok) {
    // Re-render the header (and everything else) for the new signed-in state.
    refresh();
    redirect(safeNextPath(next));
  }
  return result;
}

export async function logout(): Promise<void> {
  await destroySession();
  refresh();
  redirect("/account");
}

/** Always answers the same way, whether or not the email has an account. */
export async function requestPasswordReset(input: unknown): Promise<ActionResult> {
  return safeAction("reset-request", async () => {
    const parsed = resetRequestSchema.safeParse(input);
    if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };

    await rateLimit("reset-ip", await clientIp(), 10, 60 * 60);
    await rateLimit("reset-email", parsed.data.email, 3, 60 * 60);

    const [user] = await db()
      .select({ id: schema.users.id, name: schema.users.name, email: schema.users.email })
      .from(schema.users)
      .where(eq(schema.users.email, parsed.data.email))
      .limit(1);

    if (user) {
      const token = randomToken();
      await db()
        .insert(schema.passwordResetTokens)
        .values({ id: hashToken(token), userId: user.id, expiresAt: new Date(Date.now() + 60 * 60 * 1000) });
      await sendPasswordResetEmail(user.email, user.name, `${appUrl()}/account/reset-password?token=${encodeURIComponent(token)}`);
    }
    return { ok: true };
  });
}

export async function resetPassword(input: unknown): Promise<ActionResult> {
  const result = await safeAction("reset", async () => {
    const parsed = resetSchema.safeParse(input);
    if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };

    await rateLimit("reset-confirm", await clientIp(), 10, 60 * 60);

    // Claim the token atomically so it can be used only once.
    const [claimed] = await db()
      .update(schema.passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(schema.passwordResetTokens.id, hashToken(parsed.data.token)),
          isNull(schema.passwordResetTokens.usedAt),
          gt(schema.passwordResetTokens.expiresAt, new Date()),
        ),
      )
      .returning({ userId: schema.passwordResetTokens.userId });

    if (!claimed) return { ok: false, error: "This reset link has expired or was already used. Request a new one." };

    await db()
      .update(schema.users)
      .set({ passwordHash: await hashPassword(parsed.data.password) })
      .where(eq(schema.users.id, claimed.userId));

    // Sign out everywhere (in case the old password was stolen), then sign in here.
    await destroyAllSessions(claimed.userId);
    await db().delete(schema.passwordResetTokens).where(eq(schema.passwordResetTokens.userId, claimed.userId));
    await createSession(claimed.userId);
    return { ok: true };
  });
  if (result.ok) {
    // Re-render the header (and everything else) for the new signed-in state.
    refresh();
    redirect("/account");
  }
  return result;
}
