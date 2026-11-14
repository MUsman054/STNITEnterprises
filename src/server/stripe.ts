import "server-only";
import Stripe from "stripe";
import { requireEnv } from "@/server/env";

let client: Stripe | undefined;

/** Stripe client. The secret key stays on the server; the browser never talks to Stripe's API. */
export function stripe(): Stripe {
  client ??= new Stripe(requireEnv("STRIPE_SECRET_KEY"), {
    maxNetworkRetries: 2,
    timeout: 20_000,
    appInfo: { name: "STN IT Enterprise store" },
  });
  return client;
}
