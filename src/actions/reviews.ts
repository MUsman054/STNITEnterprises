"use server";

import { revalidatePath, updateTag } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getProduct } from "@/lib/catalog";
import { getCurrentUser, requirePermission } from "@/server/auth";
import { db, schema } from "@/server/db";
import { safeAction, type ActionResult } from "@/server/action-utils";
import { findPurchase, getMyReview, keepUpdatedAt, publicName, REVIEWS_TAG } from "@/server/reviews";
import { rateLimit } from "@/server/security";
import { fieldErrors, reviewReplySchema, reviewSchema } from "@/server/validation";

/**
 * Writes a review, or updates the customer's existing one for that product. The account
 * comes from the session cookie (never the input), and the purchase is re-checked here.
 */
export async function submitReview(input: unknown): Promise<ActionResult<{ updated: boolean }>> {
  return safeAction("review", async () => {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Please sign in to write a review." };

    const parsed = reviewSchema.safeParse(input);
    if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
    const { slug, rating, title, body } = parsed.data;
    if (!getProduct(slug)) return { ok: false, error: "This product is no longer available." };

    await rateLimit("review", user.id, 10, 60 * 60);

    const purchase = await findPurchase(user.id, slug);
    if (!purchase) return { ok: false, error: "Only customers who have bought this item can review it." };

    const existing = await getMyReview(user.id, slug);
    const values = { rating, title, body, authorName: publicName(user.name), orderId: purchase.orderId };
    if (existing) {
      // A review hidden by staff stays hidden when edited.
      await db().update(schema.reviews).set(values).where(eq(schema.reviews.id, existing.id));
    } else {
      await db()
        .insert(schema.reviews)
        .values({ ...values, productSlug: slug, userId: user.id })
        .onConflictDoNothing();
    }

    updateTag(REVIEWS_TAG);
    return { ok: true, updated: Boolean(existing) };
  });
}

export async function deleteMyReview(input: unknown): Promise<ActionResult> {
  return safeAction("review-delete", async () => {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Please sign in." };
    const parsed = z.object({ slug: z.string().max(200) }).safeParse(input);
    if (!parsed.success) return { ok: false, error: "Invalid request." };
    const existing = await getMyReview(user.id, parsed.data.slug);
    // A hidden review stays on record so it can't be deleted and posted again to get around moderation.
    if (existing && existing.status === "published") {
      await db().delete(schema.reviews).where(eq(schema.reviews.id, existing.id));
      updateTag(REVIEWS_TAG);
    }
    return { ok: true };
  });
}

const moderateSchema = z.object({ id: z.uuid(), action: z.enum(["publish", "hide", "delete"]) });

export async function adminModerateReview(input: unknown): Promise<ActionResult> {
  return safeAction("admin-review", async () => {
    const admin = await requirePermission("reviews", "/admin/reviews");
    const parsed = moderateSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Invalid update." };
    const { id, action } = parsed.data;

    if (action === "delete") await db().delete(schema.reviews).where(eq(schema.reviews.id, id));
    else
      await db()
        .update(schema.reviews)
        .set({ status: action === "hide" ? "hidden" : "published", ...keepUpdatedAt })
        .where(eq(schema.reviews.id, id));

    console.info(`[admin] ${admin.email} ${action} review ${id}`);
    updateTag(REVIEWS_TAG);
    revalidatePath("/admin/reviews");
    return { ok: true };
  });
}

/** Saves the store's public response to a review; an empty reply removes it. */
export async function adminReplyToReview(input: unknown): Promise<ActionResult> {
  return safeAction("admin-review-reply", async () => {
    const admin = await requirePermission("reviews", "/admin/reviews");
    const parsed = reviewReplySchema.safeParse(input);
    if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
    const { id, reply } = parsed.data;

    const updated = await db()
      .update(schema.reviews)
      .set(reply ? { replyBody: reply, replyAt: new Date(), replyBy: admin.id, ...keepUpdatedAt } : { replyBody: null, replyAt: null, replyBy: null, ...keepUpdatedAt })
      .where(eq(schema.reviews.id, id))
      .returning({ id: schema.reviews.id });
    if (updated.length === 0) return { ok: false, error: "Review not found." };

    console.info(`[admin] ${admin.email} ${reply ? "replied to" : "removed reply on"} review ${id}`);
    updateTag(REVIEWS_TAG);
    revalidatePath("/admin/reviews");
    return { ok: true };
  });
}
