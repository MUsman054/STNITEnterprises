import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { eq } from "drizzle-orm";
import { addressLines, orderStatusLabel } from "@/lib/order";
import { formatPrice } from "@/lib/site";
import { cardClass } from "@/lib/ui";
import { can } from "@/lib/roles";
import { requirePermission } from "@/server/auth";
import { db, schema } from "@/server/db";
import { adminStatusTransitions, getOrderItems } from "@/server/orders";
import { AdminLoading, AdminShell } from "../../admin-ui";
import { OrderStatusForm } from "./status-form";

export const metadata: Metadata = { title: "Admin · Order", robots: { index: false, follow: false } };

// Private, per-request page with an id in the URL: it may block instead of prerendering a shell.
export const instant = false;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminShell active="orders" title="Order details">
        <OrderDetail params={params} />
      </AdminShell>
    </Suspense>
  );
}

async function OrderDetail({ params }: { params: PageProps<"/admin/orders/[id]">["params"] }) {
  const user = await requirePermission("orders:view");
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const [order] = await db().select().from(schema.orders).where(eq(schema.orders.id, id)).limit(1);
  if (!order) notFound();
  const items = await getOrderItems(order.id);

  const dl = (label: string, value: React.ReactNode) => (
    <div className="grid grid-cols-[140px_1fr] gap-3 py-1.5 text-[15px]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        <section className={cardClass}>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-xl font-bold">{order.number}</h2>
            <span className="rounded-full bg-primary-soft px-3 py-1 text-[14px] font-semibold text-primary">{orderStatusLabel[order.status]}</span>
          </div>
          <dl className="mt-3">
            {dl("Placed", order.createdAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }))}
            {dl("Payment", order.paymentMethod === "card" ? "Card (Stripe)" : "Bank transfer")}
            {order.paidAt && dl("Paid", order.paidAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }))}
            {order.stripePaymentIntentId &&
              dl(
                "Stripe",
                <a
                  className="font-semibold text-primary underline"
                  href={`https://dashboard.stripe.com/payments/${encodeURIComponent(order.stripePaymentIntentId)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View payment
                </a>,
              )}
          </dl>
        </section>

        <section className={cardClass}>
          <h2 className="text-lg font-bold">Items</h2>
          <ul className="mt-2 divide-y divide-border">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4 py-3 text-[15px]">
                <span>
                  {item.productName}
                  <span className="block text-[13px] text-muted-foreground">
                    {item.mpn} · {formatPrice(item.unitPriceCents / 100)} × {item.quantity}
                  </span>
                </span>
                <span className="shrink-0 font-semibold tabular-nums">{formatPrice(item.lineTotalCents / 100)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-2 border-t border-border pt-3">
            {dl("Subtotal", formatPrice(order.subtotalCents / 100))}
            {dl("Shipping", order.shippingCents === 0 ? "Free" : formatPrice(order.shippingCents / 100))}
            {dl("Total", <strong>{formatPrice(order.totalCents / 100)}</strong>)}
          </dl>
        </section>

        <section className={cardClass}>
          <h2 className="text-lg font-bold">Customer</h2>
          <dl className="mt-2">
            {dl("Name", `${order.firstName} ${order.lastName}`)}
            {dl("Email", <a className="text-primary underline" href={`mailto:${order.email}`}>{order.email}</a>)}
            {dl("Phone", <a className="text-primary underline" href={`tel:${order.phone.replace(/[^\d+]/g, "")}`}>{order.phone}</a>)}
            {dl(
              "Ship to",
              <>
                {addressLines(order).map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </>,
            )}
            {order.notes && dl("Notes", <span className="whitespace-pre-wrap">{order.notes}</span>)}
            {dl("Account", order.userId ? "Registered customer" : "Guest checkout")}
          </dl>
        </section>
      </div>

      <section className={`${cardClass} lg:sticky lg:top-24`}>
        {can(user.role, "orders:edit") ? (
          <>
            <h2 className="text-lg font-bold">Update order</h2>
            <p className="mt-1 text-[14px] text-muted-foreground">Setting the status to Shipped emails the customer, with tracking if given.</p>
            <OrderStatusForm
              orderId={order.id}
              status={order.status}
              carrier={order.carrier ?? ""}
              trackingNumber={order.trackingNumber ?? ""}
              options={adminStatusTransitions.map((s) => ({ value: s, label: orderStatusLabel[s] }))}
            />
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold">Order status</h2>
            <p className="mt-1 text-[15px] font-semibold">{orderStatusLabel[order.status]}</p>
            <p className="mt-1 text-[14px] text-muted-foreground">Ask an admin to change the status or add tracking.</p>
          </>
        )}
        <Link href="/admin" className="mt-4 inline-block py-2 text-[14px] font-semibold text-primary underline-offset-4 hover:underline">
          ← All orders
        </Link>
      </section>
    </div>
  );
}
