import type { Metadata } from "next";
import { Tag } from "lucide-react";
import { Breadcrumbs } from "@/components/page-banner";
import { ProductListing } from "@/components/product-listing";
import { dealProducts, maxDiscount } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Deals & Special Offers",
  description: "Reduced prices on hard drives, memory, servers, networking and more.",
};

export default function DealsPage() {
  return (
    <div className="container-page pt-2 pb-10">
      <Breadcrumbs crumbs={[{ label: "Deals" }]} />
      <section className="animate-fade-up on-dark relative mt-1 overflow-hidden rounded-2xl bg-hero-dark p-6 text-white sm:p-10">
        <p className="relative inline-flex items-center gap-2 rounded-full bg-lime px-3 py-1 text-[13px] font-bold text-ink">
          <Tag aria-hidden="true" className="size-4" />
          Up to {maxDiscount}% off
        </p>
        <h1 className="relative mt-3 text-[30px] leading-tight font-bold sm:text-[42px]">Deals &amp; Special Offers</h1>
        <p className="relative mt-2 max-w-xl text-lg text-[#c9cfd5]">Reduced prices on enterprise hardware, while stock lasts.</p>
      </section>
      <div className="mt-8">
        <ProductListing products={dealProducts} />
      </div>
    </div>
  );
}
