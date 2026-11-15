import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Info, LockKeyhole, Package } from "lucide-react";
import { Breadcrumbs } from "@/components/page-banner";
import { orderStatusLabel, paymentMethods } from "@/lib/order";
import { formatPrice } from "@/lib/site";
import { btnOutline, btnPrimary, cardClass } from "@/lib/ui";
import { getCurrentUser } from "@/server/auth";
import { getOrdersForUser } from "@/server/orders";

export const metadata: Metadata = { title: "Order History", robots: { index: false } };

export default function OrdersPage() {
  return (
    <div className="bg-canvas">
      <div className="container-page pt-2 pb-10">
        <Breadcrumbs crumbs={[{ label: "My Account", href: "/account" }, { label: "Order History" }]} />
        <section className={`${cardClass} mt-2`} aria-labelledby="orders-title">
          <h1 id="orders-title" className="border-b border-border pb-3 text-[26px] font-bold text-foreground">
            Order History
          </h1>
          <Suspense fallback={<div aria-busy="true" className="mt-4 h-40 animate-pulse rounded-xl bg-surface" />}>
            <Orders />
          </Suspense>
        </section>
      </div>
    </div>
  );
}

async function Orders() {
  const user = await getCurrentUser();
  if (!user) return <SignInPrompt />;
  const orders = await getOrdersForUser(user.id);

  if (orders.length === 0) {
    return (
      <div className="py-12 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-primary-soft text-primary">
          <Package aria-hidden="true" className="size-7" />
        </span>
        <p className="mt-4 text-xl font-bold text-foreground">No orders yet</p>
        <p className="mt-1 text-muted-foreground">Orders you place while signed in appear here.</p>
        <Link href="/shop" className={`${btnPrimary} mt-5`}>
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="mt-3 flex items-start gap-2 text-[14px] text-muted-foreground">
        <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        Orders placed as a guest aren&apos;t listed here; use the link in your order email to view them.
      </p>
      <ul className="mt-4 space-y-3">
        {orders.map(({ order, items }) => (
          <li key={order.id} className="overflow-hidden rounded-xl border border-border">
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 bg-surface px-4 py-3 text-[13px]">
              <span>
                <span className="block text-muted-foreground">Order placed</span>
                <span className="font-semibold text-foreground">{order.createdAt.toLocaleDateString("en-US", { dateStyle: "medium" })}</span>
              </span>
              <span>
                <span className="block text-muted-foreground">Total</span>
                <span className="font-semibold text-foreground">{formatPrice(order.totalCents / 100)}</span>
              </span>
              <span>
                <span className="block text-muted-foreground">Payment</span>
                <span className="font-semibold text-foreground">{paymentMethods.find((m) => m.id === order.paymentMethod)?.label}</span>
              </span>
              <span>
                <span className="block text-muted-foreground">Status</span>
                <span className="font-semibold text-foreground">{orderStatusLabel[order.status]}</span>
              </span>
              <span className="ml-auto">
                <span className="block text-muted-foreground">Order #</span>
                <span className="font-semibold text-foreground">{order.number}</span>
              </span>
            </div>
            <ul className="divide-y divide-border px-4">
              {items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-4 py-3 text-[15px]">
                  <Link href={`/product/${item.productSlug}`} className="-my-1.5 min-w-0 py-3 text-foreground hover:text-primary hover:underline">
                    {item.productName} <span className="text-muted-foreground">× {item.quantity}</span>
                  </Link>
                  <span className="shrink-0 font-semibold tabular-nums">{formatPrice(item.lineTotalCents / 100)}</span>
                </li>
              ))}
            </ul>
            {order.trackingNumber && (
              <p className="border-t border-border px-4 py-3 text-[14px] text-foreground">
                Tracking: <span className="font-semibold">{order.carrier ? `${order.carrier} ` : ""}{order.trackingNumber}</span>
              </p>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

const next = encodeURIComponent("/account/orders");

/** Shown instead of redirecting, so visitors can see what the page is for. */
function SignInPrompt() {
  return (
    <div className="py-12 text-center">
      <span className="mx-auto grid size-16 place-items-center rounded-full bg-primary-soft text-primary">
        <LockKeyhole aria-hidden="true" className="size-7" />
      </span>
      <p className="mt-4 text-xl font-bold text-foreground">Sign in to see your orders</p>
      <p className="mx-auto mt-1 max-w-md text-muted-foreground">
        Your order history, order status and tracking numbers appear here once you&apos;re signed in.
      </p>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link href={`/account?next=${next}`} className={`${btnPrimary} w-full sm:w-auto sm:min-w-40`}>
          Sign in
        </Link>
        <Link href={`/account?mode=signup&next=${next}`} className={`${btnOutline} w-full sm:w-auto sm:min-w-40`}>
          Create an account
        </Link>
      </div>
      <p className="mx-auto mt-6 flex max-w-md items-start justify-center gap-2 text-[14px] text-muted-foreground">
        <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        Checked out as a guest? Use the link in your order confirmation email to view that order.
      </p>
    </div>
  );
}
