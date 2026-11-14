import type Stripe from "stripe";
import { requireEnv } from "@/server/env";
import { cancelPendingOrder, markOrderPaid } from "@/server/orders";
import { stripe } from "@/server/stripe";

/**
 * Stripe webhook. This is the source of truth for card payments.
 * - The signature is verified with STRIPE_WEBHOOK_SECRET against the raw body, so forged
 *   requests are rejected.
 * - Handlers are idempotent: Stripe retries deliveries, and replays change nothing.
 *
 * Subscribe the endpoint (https://<your-domain>/api/stripe/webhook) to:
 *   checkout.session.completed, checkout.session.async_payment_succeeded,
 *   checkout.session.async_payment_failed, checkout.session.expired
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function orderIdOf(session: Stripe.Checkout.Session): string | null {
  const id = session.metadata?.orderId ?? session.client_reference_id;
  return id && UUID.test(id) ? id : null;
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  const body = await request.text();
  if (body.length > 512 * 1024) return new Response("Payload too large", { status: 413 });

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, signature, requireEnv("STRIPE_WEBHOOK_SECRET"));
  } catch (error) {
    console.warn("[stripe-webhook] signature verification failed:", (error as Error).message);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;
        const orderId = orderIdOf(session);
        if (orderId && session.payment_status === "paid") {
          await markOrderPaid({
            orderId,
            stripeSessionId: session.id,
            paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? null),
            amountTotalCents: session.amount_total,
            currency: session.currency,
          });
        }
        break;
      }
      case "checkout.session.async_payment_failed":
      case "checkout.session.expired": {
        const orderId = orderIdOf(event.data.object);
        if (orderId) await cancelPendingOrder(orderId);
        break;
      }
      default:
        break;
    }
  } catch (error) {
    // 500 makes Stripe retry later.
    console.error(`[stripe-webhook] failed to handle ${event.type} ${event.id}:`, error);
    return new Response("Webhook handler failed", { status: 500 });
  }

  return Response.json({ received: true });
}
