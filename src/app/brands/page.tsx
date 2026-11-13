import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BrandLogo } from "@/components/brand-mark";
import { Breadcrumbs } from "@/components/page-banner";
import { brands, productsByBrand } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Brands",
  description: "Shop by brand: Dell, HP, IBM, Cisco, Seagate, Western Digital and more.",
};

export default function BrandsPage() {
  return (
    <div className="bg-canvas">
      <div className="container-page pt-2 pb-10">
        <Breadcrumbs crumbs={[{ label: "Brands" }]} />
        <h1 className="text-[28px] font-bold text-foreground sm:text-[34px]">Shop by brand</h1>
        <p className="mt-1 text-muted-foreground">Trusted manufacturers, sourced through certified distributors.</p>
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {brands.map((brand) => {
            const count = productsByBrand(brand.slug).length;
            return (
              <li key={brand.slug}>
                <Link
                  href={`/brand/${brand.slug}`}
                  className="group flex h-full items-center justify-between gap-3 rounded-2xl bg-background p-5 shadow-card transition-[box-shadow,translate] duration-200 hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <span className="min-w-0">
                    <BrandLogo brand={brand} align="left" className="h-10 text-foreground" />
                    <span className="mt-2 block text-[13px] text-muted-foreground">
                      {count} {count === 1 ? "product" : "products"}
                    </span>
                  </span>
                  <ChevronRight aria-hidden="true" className="size-5 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
