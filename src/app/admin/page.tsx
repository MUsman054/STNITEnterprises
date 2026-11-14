import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { desc, eq } from "drizzle-orm";
import { orderStatusLabel, type OrderStatus } from "@/lib/order";
import { formatPrice } from "@/lib/site";
import { requireAdmin } from "@/server/auth";
import { db, schema } from "@/server/db";
import { AdminLoading, AdminShell, tableWrap, td, th } from "./admin-ui";

export const metadata: Metadata = { title: "Admin · Orders", robots: { index: false, follow: false } };

const statuses = Object.keys(orderStatusLabel) as OrderStatus[];

export default function AdminOrdersPage({ searchParams }: PageProps<"/admin">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminShell active="orders" title="Orders">
        <OrdersTable searchParams={searchParams} />
      </AdminShell>
    </Suspense>
  );
}

async function OrdersTable({ searchParams }: { searchParams: PageProps<"/admin">["searchParams"] }) {
  await requireAdmin();
  const { status } = await searchParams;
  const filter = statuses.find((s) => s === status);

  const rows = await db()
    .select()
    .from(schema.orders)
    .where(filter ? eq(schema.orders.status, filter) : undefined)
    .orderBy(desc(schema.orders.createdAt))
    .limit(200);

  return (
    <>
      <nav aria-label="Filter by status" className="mb-4 flex flex-wrap gap-2 text-[14px]">
        <Link href="/admin" className={`rounded-full px-3 py-2 font-semibold ${!filter ? "bg-primary text-white" : "bg-background"}`}>
          All
        </Link>
        {statuses.map((s) => (
          <Link key={s} href={`/admin?status=${s}`} className={`rounded-full px-3 py-2 font-semibold ${filter === s ? "bg-primary text-white" : "bg-background"}`}>
            {orderStatusLabel[s]}
          </Link>
        ))}
      </nav>
      <div className={tableWrap}>
        <table className="w-full min-w-[760px]">
          <thead className="border-b border-border">
            <tr>
              <th className={th}>Order</th>
              <th className={th}>Date</th>
              <th className={th}>Customer</th>
              <th className={th}>Payment</th>
              <th className={th}>Status</th>
              <th className={`${th} text-right`}>Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 && (
              <tr>
                <td className={td} colSpan={6}>
                  No orders yet.
                </td>
              </tr>
            )}
            {rows.map((order) => (
              <tr key={order.id} className="hover:bg-surface">
                <td className={td}>
                  <Link href={`/admin/orders/${order.id}`} className="font-semibold text-primary underline-offset-4 hover:underline">
                    {order.number}
                  </Link>
                </td>
                <td className={td}>{order.createdAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</td>
                <td className={td}>
                  {order.firstName} {order.lastName}
                  <span className="block text-muted-foreground">{order.email}</span>
                </td>
                <td className={td}>{order.paymentMethod === "card" ? "Card (Stripe)" : "Bank transfer"}</td>
                <td className={td}>{orderStatusLabel[order.status]}</td>
                <td className={`${td} text-right font-semibold tabular-nums`}>{formatPrice(order.totalCents / 100)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
