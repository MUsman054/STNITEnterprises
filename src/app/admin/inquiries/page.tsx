import type { Metadata } from "next";
import { Suspense } from "react";
import { desc } from "drizzle-orm";
import { formatPrice } from "@/lib/site";
import { requirePermission } from "@/server/auth";
import { db, schema } from "@/server/db";
import { AdminLoading, AdminShell, tableWrap, td, th } from "../admin-ui";
import { InquiryStatusButton } from "./status-button";

export const metadata: Metadata = { title: "Admin · Inquiries", robots: { index: false, follow: false } };

const kindLabel = { contact: "Contact", quote: "Quote", part: "Part request" } as const;

export default function AdminInquiriesPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminShell active="inquiries" title="Inquiries">
        <InquiriesTable />
      </AdminShell>
    </Suspense>
  );
}

async function InquiriesTable() {
  await requirePermission("inquiries", "/admin/inquiries");
  const rows = await db().select().from(schema.inquiries).orderBy(desc(schema.inquiries.createdAt)).limit(300);

  return (
    <div className={tableWrap}>
      <table className="w-full min-w-[820px]">
        <thead className="border-b border-border">
          <tr>
            <th className={th}>Date</th>
            <th className={th}>Type</th>
            <th className={th}>From</th>
            <th className={th}>Details</th>
            <th className={th}>Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.length === 0 && (
            <tr>
              <td className={td} colSpan={5}>
                No messages yet.
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.id} className={row.status === "new" ? "bg-primary-soft/40" : ""}>
              <td className={`${td} whitespace-nowrap`}>{row.createdAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</td>
              <td className={td}>{kindLabel[row.kind]}</td>
              <td className={td}>
                {row.name}
                <a className="block text-primary underline" href={`mailto:${row.email}`}>
                  {row.email}
                </a>
              </td>
              <td className={`${td} max-w-md`}>
                {row.partNumber && <span className="block font-semibold">Part: {row.partNumber}</span>}
                {row.quantity != null && <span className="block">Qty: {row.quantity}</span>}
                {row.targetPriceCents != null && <span className="block">Target: {formatPrice(row.targetPriceCents / 100)} each</span>}
                {row.message && <span className="mt-1 block whitespace-pre-wrap text-muted-foreground">{row.message}</span>}
              </td>
              <td className={td}>
                <InquiryStatusButton id={row.id} status={row.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
