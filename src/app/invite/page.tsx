import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { and, eq, gt, isNull } from "drizzle-orm";
import { logout } from "@/actions/auth";
import { Breadcrumbs } from "@/components/page-banner";
import { AcceptInviteButton, InviteSignupForm } from "@/components/invite-views";
import { roleDescription, roleLabel } from "@/lib/roles";
import { btnOutline, btnPrimary, cardClass } from "@/lib/ui";
import { getCurrentUser } from "@/server/auth";
import { db, schema } from "@/server/db";
import { hashToken } from "@/server/security";

export const metadata: Metadata = {
  title: "Join the team",
  robots: { index: false },
  // The token is in the URL: don't leak it to other sites.
  referrer: "no-referrer",
};

export default function InvitePage({ searchParams }: PageProps<"/invite">) {
  return (
    <div className="bg-canvas">
      <div className="container-page pt-2 pb-10">
        <Breadcrumbs crumbs={[{ label: "Team invitation" }]} />
        <section className={`${cardClass} mx-auto mt-2 max-w-md sm:p-8`} aria-labelledby="invite-title">
          <Suspense fallback={<div aria-busy="true" className="h-64 animate-pulse rounded-xl bg-surface" />}>
            <Invite searchParams={searchParams} />
          </Suspense>
        </section>
      </div>
    </div>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1 id="invite-title" className="text-[26px] font-bold text-foreground">
      {children}
    </h1>
  );
}

async function Invite({ searchParams }: { searchParams: PageProps<"/invite">["searchParams"] }) {
  const { token } = await searchParams;
  await connection();

  const invite =
    typeof token === "string" && token.length >= 20 && token.length <= 100
      ? (
          await db()
            .select({ email: schema.staffInvites.email, role: schema.staffInvites.role, inviterName: schema.users.name })
            .from(schema.staffInvites)
            .leftJoin(schema.users, eq(schema.staffInvites.invitedBy, schema.users.id))
            .where(and(eq(schema.staffInvites.tokenHash, hashToken(token)), isNull(schema.staffInvites.acceptedAt), gt(schema.staffInvites.expiresAt, new Date())))
            .limit(1)
        )[0]
      : undefined;

  if (!invite || typeof token !== "string" || invite.role === "customer") {
    return (
      <>
        <Title>Invitation not valid</Title>
        <p className="mt-2 text-muted-foreground">
          This invitation has expired, was cancelled, or was already used. Ask the person who invited you to send a new one.
        </p>
        <Link href="/" className={`${btnPrimary} mt-6`}>
          Go to the homepage
        </Link>
      </>
    );
  }

  const role = invite.role;
  const intro = (
    <>
      <Title>Join the team</Title>
      <p className="mt-2 text-muted-foreground">
        {invite.inviterName ? `${invite.inviterName} invited` : "You've been invited"} <span className="font-semibold text-foreground">{invite.email}</span> to the store
        admin as <span className="font-semibold text-foreground">{roleLabel[role]}</span>.
      </p>
      <p className="mt-2 text-[14px] text-muted-foreground">{roleDescription[role]}</p>
    </>
  );

  const user = await getCurrentUser();

  if (user && user.email !== invite.email) {
    return (
      <>
        {intro}
        <p className="mt-5 rounded-2xl bg-surface p-4 text-[15px]">
          You&apos;re signed in as <span className="font-semibold">{user.email}</span>. Sign out, then open the invitation link again and sign in as{" "}
          <span className="font-semibold">{invite.email}</span>.
        </p>
        <form action={logout} className="mt-5">
          <button type="submit" className={`${btnOutline} w-full`}>
            Sign out
          </button>
        </form>
      </>
    );
  }

  if (user) {
    return (
      <>
        {intro}
        <AcceptInviteButton token={token} />
      </>
    );
  }

  const [account] = await db().select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, invite.email)).limit(1);
  const next = `/invite?token=${encodeURIComponent(token)}`;

  if (account) {
    return (
      <>
        {intro}
        <p className="mt-5 text-[15px]">You already have an account with this email. Sign in to accept the invitation.</p>
        <Link href={`/account?next=${encodeURIComponent(next)}`} className={`${btnPrimary} mt-4 w-full`}>
          Sign in to accept
        </Link>
        <p className="mt-3 text-[14px] text-muted-foreground">
          Forgot your password?{" "}
          <Link href="/account/forgot-password" className="font-semibold text-primary underline-offset-4 hover:underline">
            Reset it
          </Link>
          , then open this link again.
        </p>
      </>
    );
  }

  return (
    <>
      {intro}
      <p className="mt-5 text-[15px]">Create your account to accept.</p>
      <InviteSignupForm token={token} email={invite.email} />
    </>
  );
}
