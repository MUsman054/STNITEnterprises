"use server";

import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, gt, isNull, ne } from "drizzle-orm";
import { canManageRole, isStaff, roleLabel, type Role } from "@/lib/roles";
import { createSession, destroyAllSessions, getCurrentUser, requirePermission } from "@/server/auth";
import { db, schema } from "@/server/db";
import { sendStaffInviteEmail } from "@/server/email";
import { appUrl } from "@/server/env";
import { safeAction, type ActionResult } from "@/server/action-utils";
import { isUniqueViolation } from "@/server/orders";
import { clientIp, hashPassword, hashToken, randomToken, rateLimit } from "@/server/security";
import { acceptInviteSchema, acceptInviteSignupSchema, changeRoleSchema, fieldErrors, idSchema, inviteSchema } from "@/server/validation";

/**
 * Store admin team: invitations, role changes and removals.
 * Every action re-checks the signed-in user's role on the server; hiding a button is not security.
 * Owners are never changed from here (only with `npm run make-admin`), and nobody can
 * change their own role, so the store can't be locked out by accident.
 */

const INVITE_HOURS = 72;
const NOT_ALLOWED = "You don't have permission to do that.";

const rank: Record<Role, number> = { customer: 0, sales: 1, admin: 2, owner: 3 };

type InviteResult = ActionResult<{ link: string; emailed: boolean }>;

function inviteLink(token: string) {
  return `${appUrl()}/invite?token=${encodeURIComponent(token)}`;
}

/** Creates a fresh token for an invite and emails it. The link is also returned so it can be shared by hand. */
async function issueInvite(inviteId: string, email: string, role: Role, inviterName: string) {
  const token = randomToken();
  await db()
    .update(schema.staffInvites)
    .set({ tokenHash: hashToken(token), expiresAt: new Date(Date.now() + INVITE_HOURS * 60 * 60 * 1000) })
    .where(eq(schema.staffInvites.id, inviteId));
  const link = inviteLink(token);
  const emailed = await sendStaffInviteEmail({ to: email, inviterName, roleLabel: roleLabel[role], acceptUrl: link, expiresHours: INVITE_HOURS });
  return { link, emailed };
}

export async function inviteStaff(input: unknown): Promise<InviteResult> {
  return safeAction("team-invite", async () => {
    const actor = await requirePermission("team:view");
    const parsed = inviteSchema.safeParse(input);
    if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
    const { email, role } = parsed.data;
    if (!canManageRole(actor.role, role)) return { ok: false, error: NOT_ALLOWED };

    await rateLimit("team-invite", actor.id, 30, 60 * 60);

    const [existing] = await db().select({ role: schema.users.role }).from(schema.users).where(eq(schema.users.email, email)).limit(1);
    if (existing && isStaff(existing.role)) {
      return { ok: false, fieldErrors: { email: `This person is already on the team (${roleLabel[existing.role]}). Change their role below instead.` } };
    }

    // One open invite per email: a new invite replaces any older one.
    await db().delete(schema.staffInvites).where(and(eq(schema.staffInvites.email, email), isNull(schema.staffInvites.acceptedAt)));
    const [invite] = await db()
      .insert(schema.staffInvites)
      // Placeholder hash and expiry; issueInvite sets the real ones.
      .values({ email, role, tokenHash: hashToken(randomToken()), invitedBy: actor.id, expiresAt: new Date() })
      .returning({ id: schema.staffInvites.id });

    const sent = await issueInvite(invite.id, email, role, actor.name);
    console.info(`[team] ${actor.email} invited ${email} as ${role}`);
    revalidatePath("/admin/team");
    return { ok: true, ...sent };
  });
}

export async function resendInvite(input: unknown): Promise<InviteResult> {
  return safeAction("team-resend", async () => {
    const actor = await requirePermission("team:view");
    const parsed = idSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Invalid request." };

    await rateLimit("team-invite", actor.id, 30, 60 * 60);

    const [invite] = await db()
      .select()
      .from(schema.staffInvites)
      .where(and(eq(schema.staffInvites.id, parsed.data.id), isNull(schema.staffInvites.acceptedAt)))
      .limit(1);
    if (!invite) return { ok: false, error: "This invitation was already accepted or cancelled." };
    if (!canManageRole(actor.role, invite.role)) return { ok: false, error: NOT_ALLOWED };

    // A new token: any earlier link for this invite stops working.
    const sent = await issueInvite(invite.id, invite.email, invite.role, actor.name);
    revalidatePath("/admin/team");
    return { ok: true, ...sent };
  });
}

export async function cancelInvite(input: unknown): Promise<ActionResult> {
  return safeAction("team-cancel", async () => {
    const actor = await requirePermission("team:view");
    const parsed = idSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Invalid request." };

    const [invite] = await db().select({ role: schema.staffInvites.role }).from(schema.staffInvites).where(eq(schema.staffInvites.id, parsed.data.id)).limit(1);
    if (!invite) return { ok: true };
    if (!canManageRole(actor.role, invite.role)) return { ok: false, error: NOT_ALLOWED };

    await db().delete(schema.staffInvites).where(and(eq(schema.staffInvites.id, parsed.data.id), isNull(schema.staffInvites.acceptedAt)));
    revalidatePath("/admin/team");
    return { ok: true };
  });
}

/** Loads a team member the actor may manage, or explains why not. */
async function manageableMember(actorId: string, actorRole: Role, userId: string) {
  if (userId === actorId) return { error: "You can't change your own access. Ask another admin or the owner." } as const;
  const [member] = await db()
    .select({ id: schema.users.id, email: schema.users.email, role: schema.users.role })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);
  if (!member || !isStaff(member.role)) return { error: "This person isn't on the team any more." } as const;
  if (member.role === "owner") return { error: "Owners can't be changed from the website." } as const;
  if (!canManageRole(actorRole, member.role)) return { error: NOT_ALLOWED } as const;
  return { member } as const;
}

export async function changeStaffRole(input: unknown): Promise<ActionResult> {
  return safeAction("team-role", async () => {
    const actor = await requirePermission("team:view");
    const parsed = changeRoleSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Invalid request." };
    if (!canManageRole(actor.role, parsed.data.role)) return { ok: false, error: NOT_ALLOWED };

    const found = await manageableMember(actor.id, actor.role, parsed.data.userId);
    if ("error" in found) return { ok: false, error: found.error };

    // Only touch the row if it still has the role we checked (no race with another change).
    await db()
      .update(schema.users)
      .set({ role: parsed.data.role })
      .where(and(eq(schema.users.id, found.member.id), eq(schema.users.role, found.member.role)));
    console.info(`[team] ${actor.email} changed ${found.member.email} from ${found.member.role} to ${parsed.data.role}`);
    revalidatePath("/admin/team");
    return { ok: true };
  });
}

export async function removeStaff(input: unknown): Promise<ActionResult> {
  return safeAction("team-remove", async () => {
    const actor = await requirePermission("team:view");
    const parsed = idSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Invalid request." };

    const found = await manageableMember(actor.id, actor.role, parsed.data.id);
    if ("error" in found) return { ok: false, error: found.error };

    // They keep their customer account (orders, wishlist); only admin access goes.
    // Roles are read from the database on every request, so access ends immediately.
    await db()
      .update(schema.users)
      .set({ role: "customer" })
      .where(and(eq(schema.users.id, found.member.id), eq(schema.users.role, found.member.role)));
    console.info(`[team] ${actor.email} removed ${found.member.email} (${found.member.role}) from the team`);
    revalidatePath("/admin/team");
    return { ok: true };
  });
}

// ---------- accepting an invitation (the invited person, who isn't staff yet) ----------

const INVALID_INVITE = "This invitation has expired, was cancelled, or was already used. Ask for a new one.";

function openInviteWhere(token: string) {
  return and(eq(schema.staffInvites.tokenHash, hashToken(token)), isNull(schema.staffInvites.acceptedAt), gt(schema.staffInvites.expiresAt, new Date()));
}

/** Signed in with the invited email: grant the role. */
export async function acceptInvite(input: unknown): Promise<ActionResult> {
  const result = await safeAction("invite-accept", async () => {
    const parsed = acceptInviteSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: INVALID_INVITE };
    await rateLimit("invite-accept", await clientIp(), 20, 60 * 60);

    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Sign in first, then open the invitation link again." };

    // Claim atomically (works once), and only for the account the invite was sent to.
    const [invite] = await db()
      .update(schema.staffInvites)
      .set({ acceptedAt: new Date() })
      .where(and(openInviteWhere(parsed.data.token), eq(schema.staffInvites.email, user.email)))
      .returning({ role: schema.staffInvites.role });
    if (!invite) return { ok: false, error: INVALID_INVITE };

    // Never lower an existing role (an admin accepting an old sales invite stays admin).
    if (rank[invite.role] > rank[user.role]) {
      await db().update(schema.users).set({ role: invite.role }).where(and(eq(schema.users.id, user.id), ne(schema.users.role, "owner")));
    }
    // Staff access starts on a fresh session: sign this account out everywhere else.
    await destroyAllSessions(user.id);
    await createSession(user.id);
    console.info(`[team] ${user.email} accepted an invitation as ${invite.role}`);
    return { ok: true };
  });
  if (result.ok) {
    refresh();
    redirect("/admin");
  }
  return result;
}

/** No account for the invited email yet: create it with the role. The emailed token proves the address. */
export async function acceptInviteWithNewAccount(input: unknown): Promise<ActionResult> {
  const result = await safeAction("invite-signup", async () => {
    const parsed = acceptInviteSignupSchema.safeParse(input);
    if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
    await rateLimit("invite-accept", await clientIp(), 20, 60 * 60);

    const passwordHash = await hashPassword(parsed.data.password);
    try {
      const userId = await db().transaction(async (tx) => {
        const [invite] = await tx
          .update(schema.staffInvites)
          .set({ acceptedAt: new Date() })
          .where(openInviteWhere(parsed.data.token))
          .returning({ email: schema.staffInvites.email, role: schema.staffInvites.role });
        if (!invite) return null;
        const [user] = await tx
          .insert(schema.users)
          .values({ email: invite.email, name: parsed.data.name, passwordHash, role: invite.role })
          .returning({ id: schema.users.id });
        return user.id;
      });
      if (!userId) return { ok: false, error: INVALID_INVITE };
      await createSession(userId);
    } catch (error) {
      // Someone created an account with this email in the meantime; the invite is untouched.
      if (isUniqueViolation(error)) return { ok: false, error: "An account with this email already exists. Sign in, then open the invitation link again." };
      throw error;
    }
    return { ok: true };
  });
  if (result.ok) {
    refresh();
    redirect("/admin");
  }
  return result;
}
