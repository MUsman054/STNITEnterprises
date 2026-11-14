import Link from "next/link";
import { CircleCheck, Clock, Info, XCircle } from "lucide-react";
import { ClearCartOnMount } from "@/components/clear-cart";
import { orderStatusLabel, paymentMethods, type OrderStatus } from "@/lib/order";
import { formatPrice } from "@/lib/site";
import { btnOutline, btnPrimary } from "@/lib/ui";

export type ConfirmationOrder = {
  number: string;
  status: OrderStatus;
  paymentMethod: "card" | "bank";
  firstName: string;
  lastName: string;
  email: string;
  notes: string | null;
  addressLines: string[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  items: { slug: string; name: string; quantity: number; lineTotalCents: number }[];
};

const money = (cents: number) => formatPrice(cents / 100);

export function OrderNotFound() {
  return (
    <div className="mx-auto max-w-2xl px-2 py-10 text-center">
      <h1 className="text-2xl font-semibold text-foreground">We couldn&apos;t find that order</h1>
      <p className="mx-auto mt-2 max-w-md text-muted-foreground">
        Use the link in your order email, or sign in to see orders placed with your account.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/account/orders" className={btnPrimary}>
          My orders
        </Link>
        <Link href="/contact-us" className={btnOutline}>
          Contact us
        </Link>
      </div>
    </div>
  );
}

export function OrderConfirmationView({ order, bankInstructions }: { order: ConfirmationOrder; bankInstructions?: string | null }) {
  const payment = paymentMethods.find((method) => method.id === order.paymentMethod);
  const cancelled = order.status === "cancelled";
  const waiting = order.status === "pending_payment";
  const bank = order.status === "awaiting_bank_transfer";
  const Icon = cancelled ? XCircle : waiting || bank ? Clock : CircleCheck;

  return (
    <div className="animate-fade-up mx-auto max-w-2xl">
      {!cancelled && <ClearCartOnMount />}
      <div className="text-center">
        <span className="mx-auto grid size-20 place-items-center rounded-full bg-primary-soft text-primary">
          <Icon aria-hidden="true" className="size-10" />
        </span>
        <h1 className="mt-6 text-3xl font-bold text-foreground">
          {cancelled ? "This order was cancelled" : `Thank you, ${order.firstName}`}
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Order <span className="font-semibold text-foreground">{order.number}</span> ·{" "}
          <span className="font-semibold text-foreground">{orderStatusLabel[order.status]}</span>
        </p>
      </div>

      {waiting && (
        <p role="status" className="mt-8 flex items-start gap-3 rounded-2xl border border-brand/40 bg-primary-soft p-4 text-[15px] text-foreground">
          <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
          <span>We&apos;re confirming your payment with the bank. This usually takes a few seconds; refresh this page or watch for our email.</span>
        </p>
      )}

      {bank && (
        <div className="mt-8 rounded-2xl border border-brand/40 bg-primary-soft p-5 text-[15px] text-foreground">
          <p className="font-semibold">Please pay by bank transfer</p>
          <p className="mt-1">
            Use <strong>{order.number}</strong> as the payment reference. We&apos;ve emailed these details to {order.email}. Your order ships once the payment arrives.
          </p>
          {bankInstructions && <pre className="mt-3 rounded-xl bg-background p-4 font-sans text-[14px] whitespace-pre-wrap">{bankInstructions}</pre>}
        </div>
      )}

      {!waiting && !bank && !cancelled && (
        <p className="mt-8 text-center text-[15px] text-muted-foreground">A confirmation email is on its way to {order.email}.</p>
      )}

      <div className="mt-6 overflow-hidden rounded-3xl border border-border">
        <ul className="divide-y divide-border px-6">
          {order.items.map((line) => (
            <li key={line.slug} className="flex items-baseline justify-between gap-4 py-4">
              <span className="min-w-0 text-foreground">
                <span className="font-medium">{line.name}</span>
                <span className="text-muted-foreground"> × {line.quantity}</span>
              </span>
              <span className="shrink-0 font-semibold text-foreground tabular-nums">{money(line.lineTotalCents)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-2 border-t border-border bg-surface px-6 py-5 text-[15px]">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="font-semibold tabular-nums">{money(order.subtotalCents)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Shipping</dt>
            <dd className="font-semibold text-primary">{order.shippingCents === 0 ? "Free" : money(order.shippingCents)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3">
            <dt className="text-base font-semibold text-foreground">Total</dt>
            <dd className="font-heading text-2xl font-bold tabular-nums">{money(order.totalCents)}</dd>
          </div>
        </dl>
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border p-5">
          <dt className="text-[13px] font-bold tracking-wider text-primary uppercase">Shipping to</dt>
          <dd className="mt-2 text-foreground">
            <span className="block font-semibold">
              {order.firstName} {order.lastName}
            </span>
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
