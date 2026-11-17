"use server";

import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/server/auth";
import { db, schema } from "@/server/db";
import { sendOrderEmails } from "@/server/email";
import { appUrl, config } from "@/server/env";
import { safeAction, type ActionResult } from "@/server/action-utils";
import type { Order } from "@/server/db/schema";
import { cancelPendingOrder, CheckoutError, createOrder, orderAccessUrl, priceCart } from "@/server/orders";
import { clientIp, rateLimit } from "@/server/security";
import { stripe } from "@/server/stripe";
import { checkoutSchema, fieldErrors } from "@/server/validation";

/**
 * Places an order.
 * - Card: saves a pending order, creates a Stripe Checkout Session priced from the server
 *   catalogue, and returns Stripe's URL. The order is marked paid only by the verified
 *   Stripe webhook (or by the confirmation page asking Stripe directly).
 * - Bank transfer: saves the order as awaiting transfer and emails the bank details.
 */
export async function placeOrder(input: unknown): Promise<ActionResult<{ redirectUrl: string }>> {
  return safeAction("checkout", async () => {
    const parsed = checkoutSchema.safeParse(input);
    if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
    const data = parsed.data;

    if (data.payment === "card" && !config.stripeEnabled()) {
      return { ok: false, error: "Card payments are temporarily unavailable. Please choose bank transfer or contact us." };
    }
    if (data.payment === "bank" && !config.bankTransferInstructions()) {
      return { ok: false, error: "Bank transfer is not available right now. Please pay by card or contact us." };
    }

    await rateLimit("checkout", await clientIp(), 10, 10 * 60);

    let cart;
    try {
      cart = priceCart(data.lines);
    } catch (error) {
      if (error instanceof CheckoutError) return { ok: false, error: error.message };
      throw error;
    }

    const user = await getCurrentUser();
    const { order, items, accessToken } = await createOrder({
      payment: data.payment,
      userId: user?.id ?? null,
      cart,
      customer: {
        email: data.email,
        phone: data.phone,
        firstName: data.firstName,
        lastName: data.lastName,
        company: data.company,
        address1: data.address1,
        address2: data.address2,
        city: data.city,
        state: data.state,
        zip: data.zip,
        country: data.country,
        notes: data.notes,
      },
    });

    const confirmationUrl = orderAccessUrl(accessToken);

    if (data.payment === "bank") {
      await sendOrderEmails(order, items, confirmationUrl);
      return { ok: true, redirectUrl: `/order-confirmation?order=${encodeURIComponent(accessToken)}` };
    }

    const session = await createStripeSession(order, cart, confirmationUrl).catch(async (error) => {
      // Don't leave an unpayable order behind if Stripe is unreachable or rejects the request.
      await cancelPendingOrder(order.id);
      throw error;
    });

    await db().update(schema.orders).set({ stripeSessionId: session.id }).where(eq(schema.orders.id, order.id));

    if (!session.url?.startsWith("https://checkout.stripe.com/")) throw new Error("Unexpected Stripe Checkout URL");
    return { ok: true, redirectUrl: session.url };
  });
}

function createStripeSession(order: Order, cart: ReturnType<typeof priceCart>, confirmationUrl: string) {
  return stripe().checkout.sessions.create(
      {
        mode: "payment",
        customer_email: order.email,
        client_reference_id: order.id,
        metadata: { orderId: order.id, orderNumber: order.number },
        payment_intent_data: {
          description: `Order ${order.number}`,
          metadata: { orderId: order.id, orderNumber: order.number },
        },
        line_items: cart.lines.map((line) => ({
          quantity: line.quantity,
          price_data: {
            currency: order.currency,
            unit_amount: line.unitPriceCents,
            product_data: { name: line.name.slice(0, 250), metadata: { mpn: line.mpn, slug: line.slug } },
          },
        })),
        ...(cart.shippingCents > 0
          ? {
              shipping_options: [
                {
                  shipping_rate_data: {
                    type: "fixed_amount" as const,
                    display_name: "Shipping",
                    fixed_amount: { amount: cart.shippingCents, currency: order.currency },
                  },
                },
              ],
            }
          : {}),
        // Stripe replaces {CHECKOUT_SESSION_ID} itself.
        success_url: `${confirmationUrl}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl()}/cart?checkout=cancelled`,
        expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
      },
      { idempotencyKey: `checkout-${order.id}` },
    );
}
