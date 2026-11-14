"use server";

import { sql } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { sendInquiryNotification } from "@/server/email";
import { safeAction, type ActionResult } from "@/server/action-utils";
import { clientIp, rateLimit } from "@/server/security";
import { contactSchema, fieldErrors, newsletterSchema, requestSchema } from "@/server/validation";

/**
 * Public form submissions. Each one: validates on the server, rate-limits by IP, silently
 * drops bots that fill the honeypot field, stores the record, then emails the team.
 */

export async function submitContact(input: unknown): Promise<ActionResult> {
  return safeAction("contact", async () => {
    const parsed = contactSchema.safeParse(input);
    if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
    if (parsed.data.website) return { ok: true }; // bot

    await rateLimit("form", await clientIp(), 5, 10 * 60);

    const [inquiry] = await db()
      .insert(schema.inquiries)
      .values({ kind: "contact", name: parsed.data.name, email: parsed.data.email, message: parsed.data.message })
      .returning();
    await sendInquiryNotification(inquiry);
    return { ok: true };
  });
}

export async function submitRequest(input: unknown): Promise<ActionResult> {
  return safeAction("request", async () => {
    const parsed = requestSchema.safeParse(input);
    if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
    const data = parsed.data;
    if (data.website) return { ok: true };

    await rateLimit("form", await clientIp(), 5, 10 * 60);

    const [inquiry] = await db()
      .insert(schema.inquiries)
      .values({
        kind: data.kind,
        name: data.name,
        email: data.email,
        partNumber: data.part,
        message: data.message,
        ...(data.kind === "quote" ? { quantity: data.quantity, targetPriceCents: data.targetPrice } : {}),
      })
      .returning();
    await sendInquiryNotification(inquiry);
    return { ok: true };
  });
}

export async function subscribeNewsletter(input: unknown): Promise<ActionResult> {
  return safeAction("newsletter", async () => {
    const parsed = newsletterSchema.safeParse(input);
    if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
    if (parsed.data.website) return { ok: true };

    await rateLimit("newsletter", await clientIp(), 5, 60 * 60);

    // Same response whether or not the address was already subscribed (no enumeration).
    await db()
      .insert(schema.newsletterSubscribers)
      .values({ email: parsed.data.email })
      .onConflictDoUpdate({ target: schema.newsletterSubscribers.email, set: { unsubscribedAt: sql`null` } });
    return { ok: true };
  });
}
