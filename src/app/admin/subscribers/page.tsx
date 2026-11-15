import type { Metadata } from "next";
import { Suspense } from "react";
import { desc, isNull } from "drizzle-orm";
import { requirePermission } from "@/server/auth";
import { db, schema } from "@/server/db";
import { AdminLoading, AdminShell, tableWrap, td, th } from "../admin-ui";

export const metadata: Metadata = { title: "Admin · Subscribers", robots: { index: false, follow: false } };

export default function AdminSubscribersPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminShell active="subscribers" title="Newsletter subscribers">
        <Subscribers />
      </AdminShell>
    </Suspense>
  );
}

async function Subscribers() {
  await requirePermission("subscribers", "/admin/subscribers");
  const rows = await db()
    .select()
    .from(schema.newsletterSubscribers)
    .where(isNull(schema.newsletterSubscribers.unsubscribedAt))
    .orderBy(desc(schema.newsletterSubscribers.createdAt))
    .limit(2000);

  return (
    <>
      <p className="mb-3 text-[15px] text-muted-foreground">{rows.length} active subscribers.</p>
      <div className={tableWrap}>
        <table className="w-full">
          <thead className="border-b border-border">
            <tr>
              <th className={th}>Email</th>
              <th className={th}>Subscribed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className={td}>{row.email}</td>
                <td className={td}>{row.createdAt.toLocaleDateString("en-US", { dateStyle: "medium" })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
