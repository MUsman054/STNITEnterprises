import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Heart, LogOut, Package, Shield, ShoppingCart } from "lucide-react";
import { logout } from "@/actions/auth";
import { AuthView } from "@/components/auth-view";
import { Breadcrumbs } from "@/components/page-banner";
import { btnOutline, cardClass } from "@/lib/ui";
import { getCurrentUser, safeNextPath } from "@/server/auth";
import { config } from "@/server/env";

export const metadata: Metadata = { title: "My Account", robots: { index: false } };

export default function AccountPage({ searchParams }: PageProps<"/account">) {
  return (
    <div className="bg-canvas">
      <div className="container-page pt-2 pb-10">
        <Breadcrumbs crumbs={[{ label: "My Account" }]} />
        <Suspense fallback={<div aria-busy="true" className="mx-auto mt-2 h-96 max-w-5xl animate-pulse rounded-2xl bg-background" />}>
          <Account searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function Account({ searchParams }: { searchParams: PageProps<"/account">["searchParams"] }) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  if (!user) {
    const error = typeof params.error === "string" ? params.error : undefined;
    return (
      <AuthView
        next={safeNextPath(params.next)}
        initialMode={params.mode === "signup" ? "signup" : "login"}
        googleEnabled={config.googleEnabled()}
        oauthError={error}
      />
    );
  }

  const links = [
    { href: "/account/orders", label: "Order History", icon: Package },
    { href: "/wishlist", label: "Wishlist", icon: Heart },
    { href: "/cart", label: "Cart", icon: ShoppingCart },
    ...(user.role === "admin" ? [{ href: "/admin", label: "Store admin", icon: Shield }] : []),
  ];

  return (
    <section className={`${cardClass} mx-auto mt-2 max-w-3xl sm:p-8`} aria-labelledby="account-title">
      <h1 id="account-title" className="text-[26px] font-bold text-foreground">
        Hi, {user.name.split(" ")[0]}
      </h1>
      <p className="mt-1 text-muted-foreground">
        Signed in as <span className="font-semibold text-foreground">{user.email}</span>
        {user.company && <> · {user.company}</>}
      </p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {links.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link href={href} className="flex min-h-14 items-center gap-3 rounded-xl border border-border px-4 text-[15px] font-semibold text-foreground transition-colors duration-150 hover:border-primary hover:bg-surface">
              <span className="grid size-9 place-items-center rounded-full bg-primary-soft text-primary">
                <Icon aria-hidden="true" className="size-4" />
              </span>
              {label}
            </Link>
          </li>
        ))}
      </ul>
      <form action={logout} className="mt-6">
        <button type="submit" className={btnOutline}>
          <LogOut aria-hidden="true" className="size-4" />
          Sign out
        </button>
      </form>
    </section>
  );
}
