import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { BuyBox } from "@/components/buy-box";
import { Breadcrumbs } from "@/components/page-banner";
import { Price } from "@/components/price";
import { ProductRail } from "@/components/product-rail";
import { Tabs } from "@/components/product-tabs";
import { Rating } from "@/components/rating";
import { ZoomImage } from "@/components/zoom-image";
import {
  brandName,
  childName,
  discountPercent,
  getCategory,
  getProduct,
  products,
  productsByBrand,
  productsInCategory,
} from "@/lib/catalog";
import { formatPrice, site } from "@/lib/site";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Product not found" };
  const title = `${product.name} (${product.mpn})`;
  return {
    title,
    description: `${brandName(product.brand)} ${product.mpn}: ${product.summary} ${product.condition}. ${site.shipping.estimate}.`,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: { title, description: product.summary, images: [product.image.src] },
  };
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const category = getCategory(product.category);
  const discount = discountPercent(product);
  const brand = brandName(product.brand);
  const related = productsInCategory(product.category).filter((p) => p.slug !== product.slug).sort((a, b) => Number(b.child === product.child) - Number(a.child === product.child));
  const sameBrand = productsByBrand(product.brand).filter((p) => p.slug !== product.slug && p.category !== product.category);

  const specs: [string, string][] = [
    ["Brand", brand],
    ["Part number (MPN)", product.mpn],
    ["SKU", product.sku],
    ["Category", `${category?.name ?? ""} › ${childName(product)}`],
    ["Condition", product.condition],
    ...product.specs,
  ];

  const tableRow = (label: string, value: string, index: number) => (
    <div key={label} className={`grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] ${index % 2 === 0 ? "bg-surface" : "bg-background"}`}>
      <dt className="px-4 py-3 font-semibold text-foreground">{label}</dt>
      <dd className="px-4 py-3 text-foreground">{value}</dd>
    </div>
  );

  // Structured data so search engines can show price and availability.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    mpn: product.mpn,
    brand: { "@type": "Brand", name: brand },
    image: `${site.url}${product.image.src}`,
    description: product.summary,
    itemCondition: product.condition === "New" ? "https://schema.org/NewCondition" : "https://schema.org/RefurbishedCondition",
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: product.price.toFixed(2),
      availability: product.stock === "out" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      url: `${site.url}/product/${product.slug}`,
    },
  };

  return (
    <div className="container-page pt-2 pb-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumbs
        crumbs={[
          ...(category ? [{ label: category.short, href: `/category/${category.slug}` }] : []),
          ...(category ? [{ label: childName(product), href: `/category/${category.slug}/${product.child}` }] : []),
          { label: product.mpn },
        ]}
      />

      <div className="mt-2 grid gap-6 md:grid-cols-2 lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)_minmax(0,3fr)] lg:gap-8">
        <div className="animate-fade-up md:row-span-2 lg:row-span-1">
          <div className="md:sticky md:top-24">
            <ZoomImage image={product.image} alt={product.name} />
          </div>
        </div>

        <div className="animate-fade-up min-w-0">
          <Link href={`/brand/${product.brand}`} className="text-[14px] font-semibold text-primary underline-offset-4 hover:underline">
            {brand}
          </Link>
          <h1 className="mt-1 text-[22px] leading-snug font-semibold tracking-tight text-foreground sm:text-[26px]">{product.name}</h1>
          <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[14px]">
            <div className="flex gap-1.5">
              <dt className="text-muted-foreground">Part #</dt>
              <dd className="font-semibold text-foreground">{product.mpn}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="text-muted-foreground">SKU</dt>
              <dd className="font-semibold text-foreground">{product.sku}</dd>
            </div>
          </dl>
          <div className="mt-2">
            <Rating value={product.rating} count={product.reviews} size="md" showValue />
          </div>

          <div className="mt-4 border-t border-border pt-4">
            {discount !== null && <p className="mb-1 inline-flex rounded-md bg-sale px-2 py-0.5 text-[13px] font-bold text-white">{discount}% off</p>}
            <p className="flex flex-wrap items-baseline gap-x-3">
              <Price amount={product.price} size="xl" label={discount !== null ? "Sale price" : undefined} className={discount !== null ? "text-sale" : "text-foreground"} />
              {product.compareAt && discount !== null && (
                <span className="text-[14px] text-muted-foreground">
                  List price: <s>{formatPrice(product.compareAt)}</s>
                  <span className="ml-2 font-semibold text-sale">You save {formatPrice(product.compareAt - product.price)}</span>
                </span>
              )}
            </p>
            <p className="mt-1 text-[14px] text-muted-foreground">
              {product.condition} · Availability:{" "}
              <span className={`font-semibold ${product.stock === "out" ? "text-sale" : "text-primary"}`}>{product.stock === "out" ? "Out of stock" : "In stock"}</span>
            </p>
          </div>

          <div className="mt-5 border-t border-border pt-4">
            <h2 className="text-lg font-bold text-foreground">Overview</h2>
            <p className="mt-2 text-[15px] text-foreground">{product.summary}</p>
            <ul className="mt-3 space-y-1.5 text-[15px] text-foreground">
              {product.specs.slice(0, 4).map(([label, value]) => (
                <li key={label} className="flex gap-2.5">
                  <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-primary" />
                  <span>
                    <span className="text-muted-foreground">{label}:</span> {value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="animate-fade-up md:col-start-2 lg:col-start-auto">
          <div className="lg:sticky lg:top-24">
            <BuyBox product={product} />
          </div>
        </div>
      </div>

      <section aria-label="Product information" className="mt-10 max-w-4xl">
        <Tabs
          tabs={[
            {
              id: "description",
              label: "Description",
              content: (
                <div className="space-y-3 text-[15px] text-foreground">
                  <p>{product.summary}</p>
                  <p>
                    The {brand} {product.mpn} is supplied {product.condition === "New" ? "new" : "refurbished and quality-checked"} by {site.name}, a
                    reseller of enterprise IT hardware for businesses, system integrators and data centers. Need several, or a matching part?{" "}
                    <Link href="/contact-us" className="font-semibold text-primary hover:underline">
                      Talk to our sales team
                    </Link>
                    .
                  </p>
                </div>
              ),
            },
            {
              id: "specs",
              label: "Technical Specifications",
              content: <dl className="overflow-hidden rounded-xl border border-border text-[15px]">{specs.map(([label, value], i) => tableRow(label, value, i))}</dl>,
            },
            {
              id: "shipping",
              label: "Shipping & Warranty",
              content: (
                <div className="grid gap-6 text-[15px] text-foreground sm:grid-cols-2">
                  <div>
                    <h3 className="font-bold">Shipping</h3>
                    <ul className="mt-2 list-disc space-y-1.5 pl-5 marker:text-brand">
                      <li>Orders ship within 2–5 business days.</li>
                      <li>We ship anywhere in the USA.</li>
                      <li>Tracking is emailed once available.</li>
                    </ul>
                    <Link href="/support/shipping-policy" className="mt-3 inline-flex min-h-11 items-center font-semibold text-primary hover:underline">
                      Full shipping policy
                    </Link>
                  </div>
                  <div>
                    <h3 className="font-bold">Returns &amp; warranty</h3>
                    <ul className="mt-2 list-disc space-y-1.5 pl-5 marker:text-brand">
                      <li>Returns need an RMA number first.</li>
                      <li>Report any order discrepancies within 2 days of delivery.</li>
                      <li>Warranty for this item is confirmed on your invoice.</li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-x-4">
                      <Link href="/support/return-policy" className="inline-flex min-h-11 items-center font-semibold text-primary hover:underline">
                        Return policy
                      </Link>
                      <Link href="/support/warranty" className="inline-flex min-h-11 items-center font-semibold text-primary hover:underline">
                        Warranty
                      </Link>
                    </div>
                  </div>
                </div>
              ),
            },
          ]}
        />
      </section>

      <div className="mt-10 space-y-5">
        <ProductRail title="Related products" products={related} href={category ? `/category/${category.slug}` : undefined} className="border border-border shadow-none" />
        {sameBrand.length > 0 && (
          <ProductRail title={`More from ${brand}`} products={sameBrand} href={`/brand/${product.brand}`} className="border border-border shadow-none" />
        )}
      </div>
    </div>
  );
}
