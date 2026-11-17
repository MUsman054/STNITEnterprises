import Link from "next/link";
import { BadgeCheck, MessageSquareText, Store } from "lucide-react";
import { Rating } from "@/components/rating";
import { site } from "@/lib/site";
import type { PublicReview, ReviewSummary } from "@/server/reviews";

/** Presentational pieces shared by the product page preview and the full reviews page. */

export function reviewsHref(slug: string, query?: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) if (value !== undefined && value !== "") params.set(key, String(value));
  const qs = params.toString();
  return `/product/${slug}/reviews${qs ? `?${qs}` : ""}`;
}

const reviewCount = (count: number) => `${count.toLocaleString("en-US")} ${count === 1 ? "review" : "reviews"}`;

/** Average, stars and a 5→1 bar chart. Each bar links to the reviews page filtered to that rating. */
export function ReviewSummaryCard({ slug, summary, activeStars }: { slug: string; summary: ReviewSummary; activeStars?: number }) {
  return (
    <div className="rounded-2xl border border-border p-5">
      <div className="flex items-end gap-3">
        <span className="text-[44px] leading-none font-bold tracking-tight text-foreground tabular-nums">
          {summary.count ? summary.average.toFixed(1) : "–"}
        </span>
        <span className="pb-1 text-[14px] text-muted-foreground">out of 5</span>
      </div>
      <div className="mt-2">
        <Rating value={summary.average} size="md" />
      </div>
      <p className="mt-1 text-[14px] text-muted-foreground">{summary.count ? `Based on ${reviewCount(summary.count)}` : "No reviews yet"}</p>

      <ul className="mt-4 space-y-1">
        {summary.breakdown.map((n, index) => {
          const stars = 5 - index;
          const percent = summary.count ? Math.round((n / summary.count) * 100) : 0;
          const active = activeStars === stars;
          const row = (
            <>
              <span className="w-12 shrink-0 text-[14px] font-semibold text-foreground">{stars} star</span>
              <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface">
                <span className="block h-full rounded-full bg-star" style={{ width: `${percent}%` }} />
              </span>
              <span className="w-10 shrink-0 text-right text-[13px] text-muted-foreground tabular-nums">{percent}%</span>
            </>
          );
          const label = `${stars} star reviews: ${n}`;
          return (
            <li key={stars}>
              {n > 0 ? (
                <Link
                  href={active ? reviewsHref(slug) : reviewsHref(slug, { stars })}
                  aria-label={active ? `Show all reviews (currently ${label})` : `Show ${label}`}
                  aria-current={active ? "true" : undefined}
                  className={`flex min-h-9 items-center gap-3 rounded-lg px-2 transition-colors duration-150 hover:bg-surface ${active ? "bg-primary-soft" : ""}`}
                >
                  {row}
                </Link>
              ) : (
                <span className="flex min-h-9 items-center gap-3 px-2 opacity-60" aria-label={label}>
                  {row}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ReviewItem({ review }: { review: PublicReview }) {
  const date = review.createdAt.toLocaleDateString("en-US", { dateStyle: "long" });
  const edited = review.updatedAt.getTime() - review.createdAt.getTime() > 60_000;
  return (
    <article className="py-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-[14px] font-bold text-primary" aria-hidden="true">
          {review.authorName.charAt(0).toUpperCase()}
        </span>
        <span className="font-semibold text-foreground">{review.authorName}</span>
        <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary">
          <BadgeCheck aria-hidden="true" className="size-4" />
          Verified purchase
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <Rating value={review.rating} />
        {review.title && <h3 className="text-[15px] font-bold text-foreground">{review.title}</h3>}
      </div>
      <p className="mt-1 text-[13px] text-muted-foreground">
        Reviewed on <time dateTime={review.createdAt.toISOString()}>{date}</time>
        {edited ? " · Edited" : ""}
      </p>
      <p className="mt-2 text-[15px] leading-relaxed break-words whitespace-pre-line text-foreground">{review.body}</p>
      {review.replyBody && (
        <div className="mt-4 rounded-xl border-l-4 border-primary bg-surface px-4 py-3">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[14px]">
            <Store aria-hidden="true" className="size-4 text-primary" />
            <span className="font-semibold text-foreground">Response from {site.name}</span>
            {review.replyAt && (
              <time dateTime={review.replyAt.toISOString()} className="text-[13px] text-muted-foreground">
                {review.replyAt.toLocaleDateString("en-US", { dateStyle: "long" })}
              </time>
            )}
          </p>
          <p className="mt-1.5 text-[14px] leading-relaxed break-words whitespace-pre-line text-foreground">{review.replyBody}</p>
        </div>
      )}
    </article>
  );
}

export function NoReviews({ children }: { children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border px-5 py-10 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary-soft text-primary">
        <MessageSquareText aria-hidden="true" className="size-6" />
      </span>
      <p className="mt-3 font-bold text-foreground">No reviews yet</p>
      <p className="mx-auto mt-1 max-w-sm text-[14px] text-muted-foreground">Bought this item? Share your experience to help other buyers.</p>
      {children}
    </div>
  );
}
