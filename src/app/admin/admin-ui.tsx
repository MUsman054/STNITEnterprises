import Link from "next/link";
import type { ReactNode } from "react";
import { requireAdmin } from "@/server/auth";

/**
 * Admin page frame. It checks the admin session before rendering anything, so non-admins
 * get a 404 and never see the admin UI. Render it inside <Suspense> (it reads cookies).
 * The content components check again on their own, as defence in depth.
 */
export async function AdminShell({ active, title, children }: { active: "orders" | "inquiries" | "subscribers"; title: string; children: ReactNode }) {
  await requireAdmin();
  const tabs = [
    { key: "orders", href: "/admin", label: "Orders" },
    { key: "inquiries", href: "/admin/inquiries", label: "Inquiries" },
    { key: "subscribers", href: "/admin/subscribers", label: "Subscribers" },
  ] as const;
  return (
    <div className="bg-canvas">
      <div className="container-page py-6 lg:py-8">
        <p className="text-[13px] font-bold tracking-wider text-primary uppercase">Store admin</p>
        <h1 className="mt-1 text-[26px] font-bold text-foreground">{title}</h1>
        <nav aria-label="Admin sections" className="mt-4 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              aria-current={active === tab.key ? "page" : undefined}
              className={`flex min-h-11 items-center rounded-full px-4 text-[15px] font-semibold ${active === tab.key ? "bg-nav text-white" : "bg-background text-foreground hover:bg-primary-soft"}`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

export const tableWrap = "overflow-x-auto rounded-2xl bg-background shadow-card";
export const th = "px-4 py-3 text-left text-[13px] font-bold tracking-wide text-muted-foreground uppercase";
export const td = "px-4 py-3 align-top text-[14px] text-foreground";

export function AdminLoading() {
  return <div aria-busy="true" className="container-page my-8 h-72 animate-pulse rounded-2xl bg-surface" />;
}
