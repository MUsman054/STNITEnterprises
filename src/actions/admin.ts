"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requirePermission } from "@/server/auth";
import { db, schema } from "@/server/db";
import { safeAction, type ActionResult } from "@/server/action-utils";
import { adminStatusTransitions, updateOrderStatus } from "@/server/orders";

/** Every admin action re-checks the session and role itself; the UI hiding a button is not security. */

const orderUpdateSchema = z.object({
  orderId: z.uuid(),
  status: z.enum(adminStatusTransitions as [string, ...string[]]),
  carrier: z.string().trim().max(60).transform((v) => v || null),
  trackingNumber: z.string().trim().max(100).transform((v) => v || null),
});

export async function adminUpdateOrder(input: unknown): Promise<ActionResult> {
  return safeAction("admin-order", async () => {
    const admin = await requirePermission("orders:edit");
    const parsed = orderUpdateSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Invalid update." };

    const updated = await updateOrderStatus(parsed.data.orderId, parsed.data.status as (typeof adminStatusTransitions)[number], {
      carrier: parsed.data.carrier,
      trackingNumber: parsed.data.trackingNumber,
    });
    if (!updated) return { ok: false, error: "Order not found." };

    console.info(`[admin] ${admin.email} set order ${updated.number} to ${updated.status}`);
    revalidatePath(`/admin/orders/${updated.id}`);
    revalidatePath("/admin");
    return { ok: true };
  });
}

const inquiryUpdateSchema = z.object({ id: z.uuid(), status: z.enum(["new", "handled"]) });

export async function adminSetInquiryStatus(input: unknown): Promise<ActionResult> {
  return safeAction("admin-inquiry", async () => {
    await requirePermission("inquiries");
    const parsed = inquiryUpdateSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Invalid update." };
    await db().update(schema.inquiries).set({ status: parsed.data.status }).where(eq(schema.inquiries.id, parsed.data.id));
    revalidatePath("/admin/inquiries");
    return { ok: true };
  });
}
