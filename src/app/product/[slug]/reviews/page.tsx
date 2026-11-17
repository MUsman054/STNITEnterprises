import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight, LockKeyhole, PenLine } from "lucide-react";
import { Breadcrumbs } from "@/components/page-banner";
import { ProductImage } from "@/components/product-image";
import { ReviewForm } from "@/components/review-form";
import { NoReviews, ReviewItem, ReviewSummaryCard, reviewsHref } from "@/components/reviews";
import { brandName, getCategory, getProduct, products } from "@/lib/catalog";
import { btnOutline, btnPrimary } from "@/lib/ui";
import { getCurrentUser } from "@/server/auth";
import { findPurchase, findUnpaidPurchase, getMyReview, getReviews, getReviewSummary, REVIEWS_PAGE_SIZE, reviewSorts, type ReviewSort } from "@/server/reviews";

export const instant = false;

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: PageProps<"/product/[slug]/reviews">): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: `Customer reviews: ${product.name} (${product.mpn})`,
    description: `Verified-purchase customer reviews of the ${brandName(product.brand)} ${product.mpn}: ${product.name}.`,
    alternates: { canonical: `/product/${product.slug}/reviews` },
  };
}

export default async function ProductReviewsPage({ params, searchParams }: PageProps<"/product/[slug]/reviews">) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  const category = getCategory(product.category);

  return (
    <div className="container-page pt-2 pb-12">
      <Breadcrumbs
        crumbs={[
          ...(category ? [{ label: category.short, href: `/category/${category.slug}` }] : []),
          { label: product.mpn, href: `/product/${product.slug}` },
          { label: "Reviews" },
        ]}
      />

      <Link
        href={`/product/${product.slug}`}
        className="mt-2 flex max-w-2xl items-center gap-4 rounded-2xl border border-border p-3 transition-colors duration-150 hover:border-primary"
      >
        <ProductImage image={product.image} alt="" sizes="80px" zoom={false} className="size-16 shrink-0 rounded-xl bg-surface sm:size-20" />
        <span className="min-w-0">
          <span className="block text-[12px] font-semibold tracking-wide text-muted-foreground uppercase">
            {brandName(product.brand)} · <span className="font-mono normal-case">{product.mpn}</span>
          </span>
          <span className="mt-0.5 line-clamp-2 font-semibold text-foreground">{product.name}</span>
        </span>
      </Link>

      <h1 className="mt-6 text-[26px] font-bold tracking-tight text-foreground sm:text-[30px]">Customer reviews</h1>

      <div className="mt-5 grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-12">
        <Suspense fallback={<div aria-busy="true" className="h-72 animate-pulse rounded-2xl bg-surface" />}>
          <Sidebar slug={slug} searchParams={searchParams} />
        </Suspense>
        <Suspense fallback={<div aria-busy="true" className="h-96 animate-pulse rounded-2xl bg-surface" />}>
          <ReviewList slug={slug} searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

type Search = PageProps<"/product/[slug]/reviews">["searchParams"];

async function readFilters(searchParams: Search) {
  const query = await searchParams;
  const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const sort = reviewSorts.find((s) => s.id === one(query.sort))?.id ?? "newest";
  const starsNum = Number(one(query.stars));
  const stars = Number.isInteger(starsNum) && starsNum >= 1 && starsNum <= 5 ? starsNum : undefined;
  const pageNum = Number(one(query.page));
  const page = Number.isInteger(pageNum) && pageNum > 1 ? Math.min(pageNum, 1000) : 1;
  return { sort: sort as ReviewSort, stars, page };
}

async function Sidebar({ slug, searchParams }: { slug: string; searchParams: Search }) {
  const { stars } = await readFilters(searchParams);
  await connection();
  const summary = await getReviewSummary(slug);
  return (
    <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
      <ReviewSummaryCard slug={slug} summary={summary} activeStars={stars} />
      <div className="rounded-2xl border border-border p-5">
        <h2 className="text-[17px] font-bold text-foreground">Review this product</h2>
        <p className="mt-1 text-[14px] text-muted-foreground">Share your thoughts with other customers.</p>
        <a href="#write" className={`${btnOutline} mt-4 w-full`}>
          <PenLine aria-hidden="true" className="size-4" />
          Write a review
        </a>
      </div>
    </aside>
  );
}

async function ReviewList({ slug, searchParams }: { slug: string; searchParams: Search }) {
  const { sort, stars, page } = await readFilters(searchParams);
  await connection();
  const { reviews, total } = await getReviews(slug, { sort, stars, page });
  const pages = Math.max(1, Math.ceil(total / REVIEWS_PAGE_SIZE));
  const link = (over: { sort?: string; stars?: number; page?: number }) =>
    reviewsHref(slug, {
      sort: (over.sort ?? sort) === "newest" ? undefined : (over.sort ?? sort),
      stars: "stars" in over ? over.stars : stars,
      page: over.page && over.page > 1 ? over.page : undefined,
    });

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <p className="text-[15px] text-muted-foreground">
          {total === 0 ? "No reviews" : `${total.toLocaleString("en-US")} ${total === 1 ? "review" : "reviews"}`}
          {stars ? ` with ${stars} star${stars > 1 ? "s" : ""}` : ""}
          {stars && (
            <>
              {" · "}
              <Link href={link({ stars: undefined, page: 1 })} className="font-semibold text-primary hover:underline">
                Show all
              </Link>
            </>
          )}
        </p>
        <nav aria-label="Sort reviews" className="flex flex-wrap gap-1.5">
          {reviewSorts.map((option) => (
            <Link
              key={option.id}
              href={link({ sort: option.id, page: 1 })}
              aria-current={sort === option.id ? "true" : undefined}
              className={`inline-flex min-h-10 items-center rounded-full px-3.5 text-[14px] font-semibold transition-colors duration-150 ${
                sort === option.id ? "bg-nav text-white" : "border border-border text-foreground hover:border-primary hover:text-primary"
              }`}
            >
              {option.label}
            </Link>
          ))}
        </nav>
      </div>

      {reviews.length === 0 && total > 0 ? (
        <p className="mt-5 text-[15px] text-foreground">
          No more reviews.{" "}
          <Link href={link({ page: 1 })} className="font-semibold text-primary hover:underline">
            Back to the first page
          </Link>
        </p>
      ) : reviews.length === 0 ? (
        <div className="mt-5">
          <NoReviews />
        </div>
      ) : (
        <div className="divide-y divide-border">
          {reviews.map((review) => (
            <ReviewItem key={review.id} review={review} />
          ))}
        </div>
      )}

      {pages > 1 && (
        <nav aria-label="Review pages" className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
          {page > 1 ? (
            <Link href={link({ page: page - 1 })} className={btnOutline}>
              <ChevronLeft aria-hidden="true" className="size-4" /> Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-[14px] text-muted-foreground">
            Page {Math.min(page, pages)} of {pages}
          </span>
          {page < pages ? (
            <Link href={link({ page: page + 1 })} className={btnOutline}>
              Next <ChevronRight aria-hidden="true" className="size-4" />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}

      <section id="write" aria-labelledby="write-title" className="mt-10 scroll-mt-28 rounded-2xl border border-border p-5 sm:p-6">
        <h2 id="write-title" className="text-[20px] font-bold text-foreground">
          Write a review
        </h2>
        <div className="mt-4">
          <WriteReview slug={slug} />
        </div>
      </section>
    </div>
  );
}

async function WriteReview({ slug }: { slug: string }) {
  const user = await getCurrentUser();
  const next = encodeURIComponent(`/product/${slug}/reviews#write`);

  if (!user) {
    return (
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
          <LockKeyhole aria-hidden="true" className="size-5" />
        </span>
        <p className="flex-1 text-[15px] text-foreground">Sign in with the account you ordered with to review this item.</p>
        <Link href={`/account?next=${next}`} className={btnPrimary}>
          Sign in to review
        </Link>
      </div>
    );
  }

  const [purchase, existing] = await Promise.all([findPurchase(user.id, slug), getMyReview(user.id, slug)]);
  if (!purchase && !existing) {
    const unpaid = await findUnpaidPurchase(user.id, slug);
    if (unpaid) {
      return (
        <div className="rounded-xl bg-surface p-4 text-[15px] text-foreground">
          <p className="font-semibold">Your order {unpaid.number} is waiting for payment.</p>
          <p className="mt-1 text-muted-foreground">
            {unpaid.status === "awaiting_bank_transfer"
              ? "You can review this item as soon as we receive your bank transfer and confirm the order."
              : "You can review this item once the payment for your order is complete."}{" "}
            <Link href="/account/orders" className="font-semibold text-primary hover:underline">
              View your orders
            </Link>
          </p>
        </div>
      );
    }
    return (
      <p className="text-[15px] text-foreground">
        Only customers who have bought this item can review it, so every review here is a verified purchase. Ordered as a guest? Sign
        up with the same email and{" "}
        <Link href="/contact-us" className="font-semibold text-primary hover:underline">
          contact us
        </Link>{" "}
        to link your order.
      </p>
    );
  }

  return (
    <ReviewForm
      slug={slug}
      existing={existing ? { rating: existing.rating, title: existing.title, body: existing.body, hidden: existing.status === "hidden" } : null}
    />
  );
}
