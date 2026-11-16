import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingHeader } from "@/components/listing-header";
import { ProductListing } from "@/components/product-listing";
import { brands, getBrand, productsByBrand } from "@/lib/catalog";

// Every slug is prerendered by generateStaticParams; a navigation waits for that page instead of
// showing a loading shell first (no visible fallback to design).
export const instant = false;

export function generateStaticParams() {
  return brands.map((brand) => ({ slug: brand.slug }));
}

export async function generateMetadata({ params }: PageProps<"/brand/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const brand = getBrand(slug);
  if (!brand) return { title: "Brand not found" };
  return {
    title: `${brand.name} products`,
    description: `Shop ${brand.name} servers, parts and accessories from STN IT Enterprise.`,
    alternates: { canonical: `/brand/${slug}` },
  };
}

export default async function BrandPage({ params }: PageProps<"/brand/[slug]">) {
  const { slug } = await params;
  const brand = getBrand(slug);
  if (!brand) notFound();
  const list = productsByBrand(brand.slug);

  return (
    <div className="container-page pt-2 pb-10">
      <ListingHeader
        crumbs={[{ label: "Brands", href: "/brands" }, { label: brand.name }]}
        title={brand.name}
        description={`New and refurbished ${brand.name} hardware, quality-assured by STN IT Enterprise.`}
        stat={list.length ? `${list.length} ${list.length === 1 ? "product" : "products"}` : undefined}
      />
      <div className="mt-6">
        <ProductListing
          products={list}
          emptyState={
            <div className="rounded-2xl bg-surface px-6 py-12 text-center">
              <p className="text-xl font-bold text-foreground">No {brand.name} products listed yet</p>
              <p className="mx-auto mt-1 max-w-md text-muted-foreground">
                We source {brand.name} parts on request. Search for the part number, or contact our sales team for a quote.
              </p>
            </div>
          }
        />
      </div>
    </div>
  );
}
