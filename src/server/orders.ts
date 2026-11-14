import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { getProduct } from "@/lib/catalog";
import { site } from "@/lib/site";
import { db, schema } from "@/server/db";
import type { Order, OrderItem, OrderStatus } from "@/server/db/schema";
import { sendOrderEmails, sendShippedEmail } from "@/server/email";
import { appUrl } from "@/server/env";
import { hashToken, randomOrderNumber, randomToken } from "@/server/security";

/**
 * Order logic. Prices ALWAYS come from the server-side catalogue: the browser only says
 * which products and how many, so a tampered cart can't change what is charged.
 */

export class CheckoutError extends Error {}

export type PricedLine = {
  slug: string;
  name: string;
  mpn: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
};

export function priceCart(lines: { slug: string; qty: number }[]) {
  const merged = new Map<string, number>();
  for (const line of lines) merged.set(line.slug, (merged.get(line.slug) ?? 0) + line.qty);

  const priced: PricedLine[] = [];
  for (const [slug, quantity] of merged) {
    const product = getProduct(slug);
    if (!product) throw new CheckoutError("One of the items in your cart is no longer available. Please review your cart.");
    if (product.stock === "out") throw new CheckoutError(`${product.name} is out of stock. Remove it from your cart or request a quote.`);
    const unitPriceCents = Math.round(product.price * 100);
    if (!Number.isInteger(unitPriceCents) || unitPriceCents <= 0) throw new CheckoutError("A product in your cart has no valid price.");
    priced.push({ slug, name: product.name, mpn: product.mpn, unitPriceCents, quantity, lineTotalCents: unitPriceCents * quantity });
  }

  const subtotalCents = priced.reduce((sum, line) => sum + line.lineTotalCents, 0);
  const shippingCents = Math.round(site.shipping.cost * 100);
  return { lines: priced, subtotalCents, shippingCents, totalCents: subtotalCents + shippingCents };
}

type CustomerDetails = {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  company: string | null;
  address1: string;
  address2: string | null;
  city: string;
  state: string;
  zip: string;
  notes: string | null;
};

/** Saves the order and its items in one transaction. Returns the raw access token (shown once, in the link). */
export async function createOrder(input: {
  customer: CustomerDetails;
  payment: "card" | "bank";
  userId: string | null;
  cart: ReturnType<typeof priceCart>;
}) {
  const accessToken = randomToken();

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await db().transaction(async (tx) => {
        const [order] = await tx
          .insert(schema.orders)
          .values({
            number: randomOrderNumber(),
            accessTokenHash: hashToken(accessToken),
            userId: input.userId,
            status: input.payment === "bank" ? "awaiting_bank_transfer" : "pending_payment",
            paymentMethod: input.payment,
            ...input.customer,
            currency: site.currency.toLowerCase(),
            subtotalCents: input.cart.subtotalCents,
            shippingCents: input.cart.shippingCents,
            totalCents: input.cart.totalCents,
          })
          .returning();

        const items = await tx
          .insert(schema.orderItems)
          .values(
            input.cart.lines.map((line) => ({
              orderId: order.id,
              productSlug: line.slug,
              productName: line.name,
              mpn: line.mpn,
              unitPriceCents: line.unitPriceCents,
              quantity: line.quantity,
              lineTotalCents: line.lineTotalCents,
            })),
          )
          .returning();

        return { order, items, accessToken };
      });
    } catch (error) {
      // Retry only on the (astronomically unlikely) order-number collision.
      if (attempt < 2 && isUniqueViolation(error)) continue;
      throw error;
    }
  }
  throw new Error("Could not create order");
}

/** Postgres unique_violation (drizzle may wrap the driver error in `cause`). */
export function isUniqueViolation(error: unknown): boolean {
  const e = error as { code?: string; cause?: { code?: string } } | null;
  return e?.code === "23505" || e?.cause?.code === "23505";
}

export function orderAccessUrl(accessToken: string) {
  return `${appUrl()}/order-confirmation?order=${encodeURIComponent(accessToken)}`;
}

export async function getOrderItems(orderId: string): Promise<OrderItem[]> {
  return db().select().from(schema.orderItems).where(eq(schema.orderItems.orderId, orderId));
}

/** Looks up an order by the secret token in the customer's link. */
export async function getOrderByAccessToken(token: string) {
  if (token.length < 20 || token.length > 100) return null;
  const [order] = await db().select().from(schema.orders).where(eq(schema.orders.accessTokenHash, hashToken(token))).limit(1);
  if (!order) return null;
  return { order, items: await getOrderItems(order.id) };
}

export async function getOrdersForUser(userId: string) {
  const list = await db().select().from(schema.orders).where(eq(schema.orders.userId, userId)).orderBy(desc(schema.orders.createdAt)).limit(100);
  if (list.length === 0) return [];
  const items = await db().select().from(schema.orderItems).where(inArray(schema.orderItems.orderId, list.map((o) => o.id)));
  return list.map((order) => ({ order, items: items.filter((item) => item.orderId === order.id) }));
}

/**
 * Marks a card order paid. Safe to call more than once (webhook retries, or the
 * confirmation page checking first): only the first call changes the row and sends emails.
 */
export async function markOrderPaid(args: {
  orderId: string;
  stripeSessionId: string;
  paymentIntentId: string | null;
  amountTotalCents: number | null;
  currency: string | null;
}): Promise<boolean> {
  const [current] = await db().select().from(schema.orders).where(eq(schema.orders.id, args.orderId)).limit(1);
  if (!current) {
    console.error("[orders] paid session for unknown order", args.orderId);
    return false;
  }

  if (args.amountTotalCents !== current.totalCents || (args.currency ?? "").toLowerCase() !== current.currency) {
    // Never ship an order whose payment doesn't match. Flag it for manual review.
    console.error("[orders] AMOUNT MISMATCH — not marking paid", {
      order: current.number,
      expected: current.totalCents,
      got: args.amountTotalCents,
      currency: args.currency,
    });
    return false;
  }

  const [updated] = await db()
    .update(schema.orders)
    .set({
      status: "paid",
      paidAt: new Date(),
      stripeSessionId: args.stripeSessionId,
      stripePaymentIntentId: args.paymentIntentId,
    })
    .where(and(eq(schema.orders.id, args.orderId), eq(schema.orders.status, "pending_payment")))
    .returning();

  if (!updated) return false; // already processed

  await sendOrderEmails(updated, await getOrderItems(updated.id), null);
  return true;
}

/** Abandoned or failed card checkout. */
export async function cancelPendingOrder(orderId: string) {
  await db()
    .update(schema.orders)
    .set({ status: "cancelled" })
    .where(and(eq(schema.orders.id, orderId), eq(schema.orders.status, "pending_payment")));
}

export const adminStatusTransitions: OrderStatus[] = [
  "awaiting_bank_transfer",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

export async function updateOrderStatus(orderId: string, status: OrderStatus, shipping: { carrier: string | null; trackingNumber: string | null }) {
  const [before] = await db().select().from(schema.orders).where(eq(schema.orders.id, orderId)).limit(1);
  if (!before) return null;

  const [after] = await db()
    .update(schema.orders)
    .set({
      status,
      carrier: shipping.carrier,
      trackingNumber: shipping.trackingNumber,
      ...(status === "paid" && !before.paidAt ? { paidAt: new Date() } : {}),
    })
    .where(eq(schema.orders.id, orderId))
    .returning();

  if (after && status === "shipped" && before.status !== "shipped") await sendShippedEmail(after);
  return after;
}

export type OrderWithItems = { order: Order; items: OrderItem[] };
