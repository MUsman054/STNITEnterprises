import type { Metadata } from "next";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/page-banner";
import { ShopResults } from "@/components/shop-results";

export const metadata: Metadata = {
  title: "Shop all products",
  description: "Laptops, server processors, cache memory, label printers, power supplies and more.",
};

export default function ShopPage() {
  return (
    <div className="container-page pt-2 pb-10">
      <Breadcrumbs crumbs={[{ label: "Shop" }]} />
      {/* Reads ?q= and ?dept=, which are only known in the browser. */}
      <Suspense
        fallback={
          <div aria-busy="true" className="mt-4 grid gap-6 lg:grid-cols-[240px_1fr]">
            <div className="hidden h-96 animate-pulse rounded-2xl bg-surface lg:block" />
            <div className="h-96 animate-pulse rounded-2xl bg-surface" />
          </div>
        }
      >
        <ShopResults />
      </Suspense>
    </div>
  );
}
