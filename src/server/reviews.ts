import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/server/db";
import type { OrderStatus } from "@/server/db/schema";

/**
 * Product reviews.
 *
 * Public reads are cached and tagged "reviews"; every write calls updateTag("reviews") so the
 * writer sees their change straight away. Callers must be dynamic (after `connection()` or a
 * cookie read) so these never run during the build, when there may be no database.
 */

export const REVIEWS_TAG = "reviews";
export const REVIEWS_PAGE_SIZE = 10;

/** Orders in these states count as a real purchase (bank transfers count once the money arrives). */
export const reviewableOrderStatuses: OrderStatus[] = ["paid", "processing", "shipped", "delivered"];

export type ReviewSummary = {
  count: number;
  average: number;
  /** Number of reviews with 5, 4, 3, 2 and 1 stars (index 0 = 5 stars). */
  breakdown: [number, number, number, number, number];
};

export type PublicReview = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
  replyBody: string | null;
  replyAt: Date | null;
};

export type ReviewSort = "newest" | "highest" | "lowest";
export const reviewSorts: { id: ReviewSort; label: string }[] = [
  { id: "newest", label: "Most recent" },
  { id: "highest", label: "Highest rated" },
  { id: "lowest", label: "Lowest rated" },
];

const published = (slug: string) => and(eq(schema.reviews.productSlug, slug), eq(schema.reviews.status, "published"));

export async function getReviewSummary(slug: string): Promise<ReviewSummary> {
  "use cache";
  cacheLife("hours");
  cacheTag(REVIEWS_TAG);

  const rows = await db()
    .select({ rating: schema.reviews.rating, total: count() })
    .from(schema.reviews)
    .where(published(slug))
    .groupBy(schema.reviews.rating);

  const breakdown: ReviewSummary["breakdown"] = [0, 0, 0, 0, 0];
  let total = 0;
  let sum = 0;
  for (const row of rows) {
    if (row.rating < 1 || row.rating > 5) continue;
    breakdown[5 - row.rating] += row.total;
    total += row.total;
    sum += row.rating * row.total;
  }
  return { count: total, average: total ? Math.round((sum / total) * 10) / 10 : 0, breakdown };
}

export async function getReviews(
  slug: string,
  { sort = "newest", stars, page = 1, limit = REVIEWS_PAGE_SIZE }: { sort?: ReviewSort; stars?: number; page?: number; limit?: number } = {},
): Promise<{ reviews: PublicReview[]; total: number }> {
  "use cache";
  cacheLife("hours");
  cacheTag(REVIEWS_TAG);

  const where = stars ? and(published(slug), eq(schema.reviews.rating, stars)) : published(slug);
  const order =
    sort === "highest"
      ? [desc(schema.reviews.rating), desc(schema.reviews.createdAt)]
      : sort === "lowest"
        ? [asc(schema.reviews.rating), desc(schema.reviews.createdAt)]
        : [desc(schema.reviews.createdAt)];

  const [rows, [{ total }]] = await Promise.all([
    db()
      .select({
        id: schema.reviews.id,
        rating: schema.reviews.rating,
        title: schema.reviews.title,
        body: schema.reviews.body,
        authorName: schema.reviews.authorName,
        createdAt: schema.reviews.createdAt,
        updatedAt: schema.reviews.updatedAt,
        replyBody: schema.reviews.replyBody,
        replyAt: schema.reviews.replyAt,
      })
      .from(schema.reviews)
      .where(where)
      .orderBy(...order, desc(schema.reviews.id))
      .limit(limit)
      .offset((Math.max(1, page) - 1) * limit),
    db().select({ total: count() }).from(schema.reviews).where(where),
  ]);
  return { reviews: rows, total };
}

/** Average and count for every reviewed product (for product cards). */
export async function getAllReviewStats(): Promise<Record<string, [average: number, count: number]>> {
  "use cache";
  cacheLife("hours");
  cacheTag(REVIEWS_TAG);

  const rows = await db()
    .select({
      slug: schema.reviews.productSlug,
      average: sql<string>`avg(${schema.reviews.rating})`,
      total: count(),
    })
    .from(schema.reviews)
    .where(eq(schema.reviews.status, "published"))
    .groupBy(schema.reviews.productSlug);

  return Object.fromEntries(rows.map((row) => [row.slug, [Math.round(Number(row.average) * 10) / 10, row.total]]));
}

/** The paid order that lets this customer review the product, or null if they haven't bought it. */
export async function findPurchase(userId: string, slug: string): Promise<{ orderId: string } | null> {
  const [row] = await db()
    .select({ orderId: schema.orders.id })
    .from(schema.orders)
    .innerJoin(schema.orderItems, eq(schema.orderItems.orderId, schema.orders.id))
    .where(
      and(
        eq(schema.orders.userId, userId),
        eq(schema.orderItems.productSlug, slug),
        inArray(schema.orders.status, reviewableOrderStatuses),
      ),
    )
    .orderBy(desc(schema.orders.createdAt))
    .limit(1);
  return row ?? null;
}

export async function getMyReview(userId: string, slug: string) {
  const [row] = await db()
    .select()
    .from(schema.reviews)
    .where(and(eq(schema.reviews.userId, userId), eq(schema.reviews.productSlug, slug)))
    .limit(1);
  return row ?? null;
}

/** Slugs this customer has already reviewed (for "Write a review" links on the order history). */
export async function reviewedSlugs(userId: string): Promise<Set<string>> {
  const rows = await db().select({ slug: schema.reviews.productSlug }).from(schema.reviews).where(eq(schema.reviews.userId, userId));
  return new Set(rows.map((row) => row.slug));
}

/** Keeps `updated_at` as it is, so staff actions don't mark the customer's review "Edited". */
export const keepUpdatedAt = { updatedAt: sql`${schema.reviews.updatedAt}` } as const;

/** "Umar Younas" → "Umar Y." so reviews show a real-sounding name without the full surname. */
export function publicName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Customer";
  const first = parts[0].slice(0, 40);
  return parts.length > 1 ? `${first} ${parts[parts.length - 1][0].toUpperCase()}.` : first;
}
