"use client";

import { useSearchParams } from "next/navigation";
import { PackageSearch } from "lucide-react";
import { bestSellers, categories, getCategory, looksLikePartNumber, searchProducts } from "@/lib/catalog";
import { CategoryCircles } from "@/components/category-tiles";
import { ProductListing } from "@/components/product-listing";
import { ProductRail } from "@/components/product-rail";
import { PartRequestForm } from "@/components/request-forms";

/** All products, narrowed by the `?q=` search term and `?cat=` category when present. */
export function ShopResults() {
  const params = useSearchParams();
  const query = (params.get("q") ?? "").trim();
  const catSlug = params.get("cat") ?? "";
  const category = getCategory(catSlug);
  const results = searchProducts(query, category?.slug);

  return (
    <>
      <h1 className="text-[26px] leading-tight font-bold text-foreground sm:text-[30px]">
        {query ? (
          <>
            Results for “{query}”{category ? <span className="text-muted-foreground"> in {category.short}</span> : null}
          </>
        ) : (
          (category?.name ?? "All products")
        )}
      </h1>
      <div className="mt-5">
        <ProductListing
          key={`${query}|${catSlug}`}
          products={results}
          query={query || undefined}
          emptyState={
            <div className="space-y-6">
              <section aria-labelledby="no-results-title" className="grid gap-6 rounded-2xl border border-border p-5 sm:p-8 lg:grid-cols-[1fr_1.2fr] lg:gap-10">
                <div>
                  <span className="grid size-14 place-items-center rounded-full bg-primary-soft text-primary">
                    <PackageSearch aria-hidden="true" className="size-7" />
                  </span>
                  <h2 id="no-results-title" className="mt-4 text-2xl font-bold text-foreground">
                    No results found
                  </h2>
                  <p className="mt-2 text-[15px] text-foreground">
                    We couldn&apos;t locate any products matching <strong className="font-semibold">“{query}”</strong>.
                  </p>
                  <p className="mt-2 text-[15px] text-muted-foreground">
                    It&apos;s possible the item is currently out of stock, or there may have been a small error in the
                    {looksLikePartNumber(query) ? " part number you entered" : " search term"}. If you&apos;re looking for something specific,
                    let us know with the request form. We&apos;re here to help!
                  </p>
                </div>
                <div>
                  <h3 className="mb-4 text-lg font-bold text-foreground">Request a part</h3>
                  <PartRequestForm partNumber={query} />
                </div>
              </section>
              <section aria-labelledby="browse-title">
                <h2 id="browse-title" className="mb-2 text-xl font-bold text-foreground">
                  Or browse a category
                </h2>
                <CategoryCircles categories={categories} />
              </section>
              <ProductRail title="Best sellers" products={bestSellers.slice(0, 10)} href="/shop" className="border border-border shadow-none" />
            </div>
          }
        />
      </div>
    </>
  );
}
