import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/account-views";
import { Breadcrumbs } from "@/components/page-banner";
import { btnPrimary, cardClass } from "@/lib/ui";

export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { index: false },
  // The token is in the URL: don't leak it to other sites.
  referrer: "no-referrer",
};

export default function ResetPasswordPage({ searchParams }: PageProps<"/account/reset-password">) {
  return (
    <div className="bg-canvas">
      <div className="container-page pt-2 pb-10">
        <Breadcrumbs crumbs={[{ label: "My Account", href: "/account" }, { label: "New password" }]} />
        <section className={`${cardClass} mx-auto mt-2 max-w-md sm:p-8`} aria-labelledby="reset-title">
          <h1 id="reset-title" className="text-[26px] font-bold text-foreground">
            Choose a new password
          </h1>
          <Suspense fallback={<div aria-busy="true" className="mt-6 h-48 animate-pulse rounded-xl bg-surface" />}>
            <Reset searchParams={searchParams} />
          </Suspense>
        </section>
      </div>
    </div>
  );
}

async function Reset({ searchParams }: { searchParams: PageProps<"/account/reset-password">["searchParams"] }) {
  const { token } = await searchParams;
  if (typeof token !== "string" || token.length < 20) {
    return (
      <div className="mt-4">
        <p className="text-muted-foreground">This reset link is incomplete. Request a new one.</p>
        <Link href="/account/forgot-password" className={`${btnPrimary} mt-5`}>
          Request a new link
        </Link>
      </div>
    );
  }
  return (
    <>
      <p className="mt-1 text-muted-foreground">After saving, you&apos;ll be signed out on other devices.</p>
      <ResetPasswordForm token={token} />
    </>
  );
}
