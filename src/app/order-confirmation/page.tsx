import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { OrderConfirmationView, OrderNotFound } from "@/components/order-confirmation-view";
import { config } from "@/server/env";
import { getOrderByAccessToken, markOrderPaid } from "@/server/orders";
import { stripe } from "@/server/stripe";

export const metadata: Metadata = {
  title: "Your order",
  robots: { index: false },
};

export default function OrderConfirmationPage({ searchParams }: PageProps<"/order-confirmation">) {
  return (
    <div className="bg-canvas">
      <div className="container-page py-8 lg:py-12">
        <div className="mx-auto max-w-2xl rounded-2xl bg-background p-5 shadow-card sm:p-8">
          <Suspense
            fallback={
              <div aria-busy="true" className="mx-auto h-80 max-w-2xl animate-pulse rounded-2xl bg-surface">
                <p className="sr-only">Loading your order…</p>
              </div>
            }
          >
            <OrderDetails searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

async function OrderDetails({ searchParams }: { searchParams: PageProps<"/order-confirmation">["searchParams"] }) {
  const params = await searchParams;
  // Live order data (status can change at any moment): always render per request.
  await connection();
  const token = typeof params.order === "string" ? params.order : "";
  const sessionId = typeof params.session_id === "string" ? params.session_id : "";

  let found = token ? await getOrderByAccessToken(token) : null;
  if (!found) return <OrderNotFound />;

  // Back from Stripe before the webhook arrived: ask Stripe directly. markOrderPaid is
  // idempotent and checks the amount, so this can't double-process or be spoofed (the
  // session must belong to this order and Stripe must say it's paid).
  if (found.order.status === "pending_payment" && sessionId.startsWith("cs_") && config.stripeEnabled()) {
    try {
      const session = await stripe().checkout.sessions.retrieve(sessionId);
      if (session.metadata?.orderId === found.order.id && session.payment_status === "paid") {
        await markOrderPaid({
          orderId: found.order.id,
          stripeSessionId: session.id,
          paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? null),
          amountTotalCents: session.amount_total,
          currency: session.currency,
        });
        found = (await getOrderByAccessToken(token)) ?? found;
      }
    } catch (error) {
      console.error("[order-confirmation] could not check Stripe session:", error);
    }
  }

  const { order, items } = found;
  return (
    <OrderConfirmationView
      bankInstructions={order.status === "awaiting_bank_transfer" ? config.bankTransferInstructions() : null}
      order={{
        number: order.number,
        status: order.status,
        paymentMethod: order.paymentMethod,
        firstName: order.firstName,
        lastName: order.lastName,
        email: order.email,
        notes: order.notes,
        addressLines: [order.company, order.address1, order.address2, `${order.city}, ${order.state} ${order.zip}`].filter(
          (line): line is string => Boolean(line),
        ),
        subtotalCents: order.subtotalCents,
        shippingCents: order.shippingCents,
        totalCents: order.totalCents,
        items: items.map((item) => ({
          slug: item.productSlug,
          name: item.productName,
          quantity: item.quantity,
          lineTotalCents: item.lineTotalCents,
        })),
      }}
    />
  );
}
