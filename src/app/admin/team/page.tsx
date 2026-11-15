import type { Metadata } from "next";
import { Suspense } from "react";
import { asc, desc, isNull, ne, sql } from "drizzle-orm";
import { canManageRole, invitableRoles, roleDescription, roleLabel, type StaffRole } from "@/lib/roles";
import { cardClass } from "@/lib/ui";
import { requirePermission } from "@/server/auth";
import { db, schema } from "@/server/db";
import { AdminLoading, AdminShell, tableWrap, td, th } from "../admin-ui";
import { InviteActions, InviteForm, MemberActions } from "./team-ui";

export const metadata: Metadata = { title: "Admin · Team", robots: { index: false, follow: false } };

const dateFormat: Intl.DateTimeFormatOptions = { dateStyle: "medium" };
const roleOrder: Record<StaffRole, number> = { owner: 0, admin: 1, sales: 2 };

export default function AdminTeamPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminShell active="team" title="Team">
        <Team />
      </AdminShell>
    </Suspense>
  );
}

async function Team() {
  const actor = await requirePermission("team:view", "/admin/team");

  const [members, invites] = await Promise.all([
    db()
      .select({ id: schema.users.id, name: schema.users.name, email: schema.users.email, role: schema.users.role, createdAt: schema.users.createdAt })
      .from(schema.users)
      .where(ne(schema.users.role, "customer"))
      .orderBy(asc(schema.users.name)),
    db()
      .select({
        id: schema.staffInvites.id,
        email: schema.staffInvites.email,
        role: schema.staffInvites.role,
        expiresAt: schema.staffInvites.expiresAt,
        expired: sql<boolean>`${schema.staffInvites.expiresAt} <= now()`,
      })
      .from(schema.staffInvites)
      .where(isNull(schema.staffInvites.acceptedAt)).orderBy(desc(schema.staffInvites.createdAt)),
  ]);
  const staff = members
    .filter((m): m is typeof m & { role: StaffRole } => m.role !== "customer")
    .sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);

  const assignable = invitableRoles.filter((role) => canManageRole(actor.role, role));

  return (
    <div className="grid gap-6">
      {assignable.length > 0 && (
        <section className={cardClass} aria-labelledby="invite-title">
          <h2 id="invite-title" className="text-lg font-bold">
            Invite someone
          </h2>
          <p className="mt-1 text-[14px] text-muted-foreground">
            They get an email with a link to join. The link works once and expires in 72 hours.
          </p>
          <InviteForm roles={assignable.map((role) => ({ value: role, label: roleLabel[role], description: roleDescription[role] }))} />
        </section>
      )}

      <section aria-labelledby="members-title">
        <h2 id="members-title" className="mb-3 text-lg font-bold">
          Team members <span className="font-normal text-muted-foreground">({staff.length})</span>
        </h2>
        <div className={tableWrap}>
          <table className="w-full min-w-[680px]">
            <thead className="border-b border-border">
              <tr>
                <th className={th}>Name</th>
                <th className={th}>Role</th>
                <th className={th}>Account since</th>
                <th className={th}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {staff.map((member) => {
                const isSelf = member.id === actor.id;
                const manageable = !isSelf && canManageRole(actor.role, member.role);
                return (
                  <tr key={member.id}>
                    <td className={td}>
                      <span className="font-semibold">{member.name}</span>
                      {isSelf && <span className="ml-2 rounded-full bg-surface px-2 py-0.5 text-[12px] font-semibold text-muted-foreground">You</span>}
                      <span className="block text-muted-foreground">{member.email}</span>
                    </td>
                    <td className={td}>
                      <span className="font-semibold">{roleLabel[member.role]}</span>
                      <span className="block max-w-xs text-[13px] text-muted-foreground">{roleDescription[member.role]}</span>
                    </td>
                    <td className={`${td} whitespace-nowrap`}>{member.createdAt.toLocaleDateString("en-US", dateFormat)}</td>
                    <td className={`${td} text-right`}>
                      {manageable ? (
                        <MemberActions
                          userId={member.id}
                          name={member.name}
                          role={member.role as "admin" | "sales"}
                          roles={assignable.map((role) => ({ value: role, label: roleLabel[role] }))}
                        />
                      ) : (
                        <span className="text-[13px] text-muted-foreground">{isSelf ? "" : member.role === "owner" ? "Owner" : "—"}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="invites-title">
        <h2 id="invites-title" className="mb-3 text-lg font-bold">
          Pending invitations <span className="font-normal text-muted-foreground">({invites.length})</span>
        </h2>
        <div className={tableWrap}>
          <table className="w-full min-w-[680px]">
            <thead className="border-b border-border">
              <tr>
                <th className={th}>Email</th>
                <th className={th}>Role</th>
                <th className={th}>Status</th>
                <th className={th}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invites.length === 0 && (
                <tr>
                  <td className={td} colSpan={4}>
                    No pending invitations.
                  </td>
                </tr>
              )}
              {invites.map((invite) => {
                return (
                  <tr key={invite.id}>
                    <td className={td}>{invite.email}</td>
                    <td className={td}>{roleLabel[invite.role]}</td>
                    <td className={`${td} whitespace-nowrap`}>
                      {invite.expired ? (
                        <span className="font-semibold text-sale">Expired</span>
                      ) : (
                        <>Expires {invite.expiresAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</>
                      )}
                    </td>
                    <td className={`${td} text-right`}>
                      {canManageRole(actor.role, invite.role) ? <InviteActions id={invite.id} email={invite.email} /> : <span className="text-[13px] text-muted-foreground">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
