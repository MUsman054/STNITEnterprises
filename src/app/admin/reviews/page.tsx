import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { desc, eq } from "drizzle-orm";
import { Rating } from "@/components/rating";
import { getProduct } from "@/lib/catalog";
import { requirePermission } from "@/server/auth";
import { db, schema } from "@/server/db";
import { AdminLoading, AdminShell, tableWrap, td, th } from "../admin-ui";
import { ReviewModeration, ReviewReply } from "./moderation";

export const metadata: Metadata = { title: "Admin · Reviews", robots: { index: false, follow: false } };

export default function AdminReviewsPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminShell active="reviews" title="Reviews">
        <ReviewsTable />
      </AdminShell>
    </Suspense>
  );
}

async function ReviewsTable() {
  await requirePermission("reviews", "/admin/reviews");
  const rows = await db()
    .select({
      review: schema.reviews,
      email: schema.users.email,
      orderNumber: schema.orders.number,
      orderId: schema.orders.id,
    })
    .from(schema.reviews)
    .innerJoin(schema.users, eq(schema.reviews.userId, schema.users.id))
    .leftJoin(schema.orders, eq(schema.reviews.orderId, schema.orders.id))
    .orderBy(desc(schema.reviews.createdAt))
    .limit(300);

  return (
    <div className={tableWrap}>
      <table className="w-full min-w-[900px]">
        <thead className="border-b border-border">
          <tr>
            <th className={th}>Date</th>
            <th className={th}>Product</th>
            <th className={th}>Customer</th>
            <th className={th}>Review</th>
            <th className={th}>Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.length === 0 && (
            <tr>
              <td className={td} colSpan={5}>
                No reviews yet.
              </td>
            </tr>
          )}
          {rows.map(({ review, email, orderNumber, orderId }) => {
            const product = getProduct(review.productSlug);
            return (
              <tr key={review.id} className={review.status === "hidden" ? "bg-surface" : ""}>
                <td className={`${td} whitespace-nowrap`}>{review.createdAt.toLocaleDateString("en-US", { dateStyle: "medium" })}</td>
                <td className={`${td} max-w-[200px]`}>
                  <Link href={`/product/${review.productSlug}/reviews`} className="text-primary underline">
                    {product?.mpn ?? review.productSlug}
                  </Link>
                </td>
                <td className={td}>
                  {review.authorName}
                  <a className="block text-primary underline" href={`mailto:${email}`}>
                    {email}
                  </a>
                  {orderNumber && orderId && (
                    <Link href={`/admin/orders/${orderId}`} className="block text-[13px] text-muted-foreground underline">
                      {orderNumber}
                    </Link>
                  )}
                </td>
                <td className={`${td} max-w-md`}>
                  <Rating value={review.rating} />
                  {review.title && <span className="mt-1 block font-semibold">{review.title}</span>}
                  <span className="mt-1 block whitespace-pre-wrap text-muted-foreground">{review.body}</span>
                  <ReviewReply id={review.id} reply={review.replyBody} />
                </td>
                <td className={td}>
                  <ReviewModeration id={review.id} status={review.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
