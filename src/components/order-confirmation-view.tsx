"use client";

import Link from "next/link";
import { CircleCheck, Info } from "lucide-react";
import { useHydrated } from "@/lib/cart-store";
import { paymentMethods, useLastOrder } from "@/lib/order";
import { formatPrice } from "@/lib/site";
import { btnOutline, btnPrimary } from "@/lib/ui";

export function OrderConfirmationView() {
  const hydrated = useHydrated();
  const order = useLastOrder();

  if (!hydrated) {
    return (
      <div aria-busy="true" className="mx-auto h-80 max-w-2xl animate-pulse rounded-2xl bg-surface">
        <p className="sr-only">Loading your order…</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-2 py-10 text-center">
        <h1 className="text-2xl font-semibold text-foreground">No recent order to show</h1>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          Order details are only kept for this browsing session.
        </p>
        <Link href="/shop" className={`${btnPrimary} mt-7`}>
          Browse the shop
        </Link>
      </div>
    );
  }

  const payment = paymentMethods.find((method) => method.id === order.paymentMethod);

  return (
    <div className="animate-fade-up mx-auto max-w-2xl">
      <div className="text-center">
        <span className="mx-auto grid size-20 place-items-center rounded-full bg-primary-soft text-primary">
          <CircleCheck aria-hidden="true" className="size-10" />
        </span>
        <h1 className="mt-6 text-3xl font-bold text-foreground">Thank you, {order.name.split(" ")[0]}</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Your order <span className="font-semibold text-foreground">{order.number}</span> has been
          received.
        </p>
      </div>

      <p className="mt-8 flex items-start gap-3 rounded-2xl border border-brand/40 bg-primary-soft p-4 text-[15px] text-foreground">
        <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
        <span>
          <strong className="font-semibold">Demo order.</strong> Nothing was charged and no email
          was sent. This page shows what customers will see once payments are connected.
        </span>
      </p>

      <div className="mt-6 overflow-hidden rounded-3xl border border-border">
        <ul className="divide-y divide-border px-6">
          {order.lines.map((line) => (
            <li key={line.slug} className="flex items-baseline justify-between gap-4 py-4">
              <span className="min-w-0 text-foreground">
                <span className="font-medium">{line.name}</span>
                <span className="text-muted-foreground"> × {line.qty}</span>
              </span>
              <span className="shrink-0 font-semibold text-foreground tabular-nums">
                {formatPrice(line.price * line.qty)}
              </span>
            </li>
          ))}
        </ul>
        <dl className="space-y-2 border-t border-border bg-surface px-6 py-5 text-[15px]">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="font-semibold tabular-nums">{formatPrice(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Shipping</dt>
            <dd className="font-semibold text-primary">
              {order.shipping === 0 ? "Free" : formatPrice(order.shipping)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3">
            <dt className="text-base font-semibold text-foreground">Total</dt>
            <dd className="font-heading text-2xl font-bold tabular-nums">{formatPrice(order.total)}</dd>
          </div>
        </dl>
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border p-5">
          <dt className="text-[13px] font-bold tracking-wider text-primary uppercase">Shipping to</dt>
          <dd className="mt-2 text-foreground">
            <span className="block font-semibold">{order.name}</span>
            {order.addressLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </dd>
        </div>
        <div className="rounded-2xl border border-border p-5">
          <dt className="text-[13px] font-bold tracking-wider text-primary uppercase">Payment and contact</dt>
          <dd className="mt-2 text-foreground">
            <span className="block font-semibold">{payment?.label ?? "Not selected"}</span>
            <span className="block break-all">{order.email}</span>
            {order.notes && <span className="mt-2 block text-muted-foreground">Note: {order.notes}</span>}
          </dd>
        </div>
      </dl>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className={btnPrimary}>
          Continue shopping
        </Link>
        <Link href="/contact-us" className={btnOutline}>
          Contact us
        </Link>
      </div>
    </div>
  );
}
