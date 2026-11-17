import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, RotateCcw, Star, Truck } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { BuyBox } from "@/components/buy-box";
import { Breadcrumbs } from "@/components/page-banner";
import { ProductRail } from "@/components/product-rail";
import { Tabs } from "@/components/product-tabs";
import { ZoomImage } from "@/components/zoom-image";
import {
  brandName,
  childName,
  getBrand,
  getCategory,
  getProduct,
  products,
  productsByBrand,
  productsInCategory,
} from "@/lib/catalog";
import { site } from "@/lib/site";

// Every slug is prerendered by generateStaticParams; a navigation waits for that page instead of
// showing a loading shell first (no visible fallback to design).
export const instant = false;

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
  const brand = brandName(product.brand);
  const brandInfo = getBrand(product.brand);
  const related = productsInCategory(product.category).filter((p) => p.slug !== product.slug).sort((a, b) => Number(b.child === product.child) - Number(a.child === product.child));
  const sameBrand = productsByBrand(product.brand).filter((p) => p.slug !== product.slug && p.category !== product.category);

  const specs: [string, string][] = [
    ["Brand", brand],
    ["Part number (MPN)", product.mpn],
    ["SKU", product.sku],
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
      {/* Escape "<" so a value containing "</script>" can never close the tag (XSS). */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Breadcrumbs
        crumbs={[
          ...(category ? [{ label: category.short, href: `/category/${category.slug}` }] : []),
          ...(category ? [{ label: childName(product), href: `/category/${category.slug}/${product.child}` }] : []),
          { label: product.mpn },
        ]}
      />

      <div className="mt-2 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10 xl:gap-14">
        <div className="animate-fade-up">
          <div className="md:sticky md:top-24">
            <ZoomImage image={product.image} alt={product.name} />
          </div>
        </div>

        <div className="animate-fade-up min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/brand/${product.brand}`}
              className="group inline-flex min-h-9 items-center gap-2 rounded-full border border-border py-1 pr-3.5 pl-2.5 text-[14px] font-semibold text-foreground transition-colors duration-150 hover:border-primary hover:text-primary"
            >
              {brandInfo?.logo && !brandInfo.wordmark && <BrandMark brand={brandInfo} className="size-4 text-current" />}
              {brand}
            </Link>
            <span className="inline-flex min-h-9 items-center rounded-full border border-border px-3 text-[13px] font-semibold text-foreground">{product.condition}</span>
            {category && (
              <Link
                href={`/category/${category.slug}/${product.child}`}
                className="inline-flex min-h-9 items-center rounded-full bg-primary-soft px-3 text-[13px] font-semibold text-primary transition-colors duration-150 hover:bg-primary hover:text-white"
              >
                {childName(product)}
              </Link>
            )}
          </div>

          <h1 className="mt-4 text-[24px] leading-tight font-bold tracking-tight text-foreground sm:text-[30px]">{product.name}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px]">
            <dl className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1">
                <dt className="text-[12px] font-semibold tracking-wide text-muted-foreground uppercase">MPN</dt>
                <dd className="font-mono font-semibold text-foreground">{product.mpn}</dd>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1">
                <dt className="text-[12px] font-semibold tracking-wide text-muted-foreground uppercase">SKU</dt>
                <dd className="font-mono font-semibold text-foreground">{product.sku}</dd>
              </div>
            </dl>
            <p className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Star aria-hidden="true" className="size-4 fill-star text-star" />
              <span className="font-semibold text-foreground">{product.rating.toFixed(1)}</span>
              <span className="sr-only">out of 5,</span>
              <span>· {product.reviews} reviews</span>
            </p>
          </div>

          <p className="mt-4 text-[16px] text-muted-foreground">{product.summary}</p>

          <div className="mt-5">
            <BuyBox product={product} />
          </div>

          <section aria-labelledby="key-specs" className="mt-6">
            <h2 id="key-specs" className="text-[13px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
              Key specs
            </h2>
            <dl className="mt-3 grid grid-cols-2 gap-2">
              {product.specs.slice(0, 4).map(([label, value]) => (
                <div key={label} className="rounded-xl border border-border px-3.5 py-3">
                  <dt className="text-[12px] text-muted-foreground">{label}</dt>
                  <dd className="mt-0.5 text-[15px] font-semibold text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <ul className="mt-6 grid gap-3 border-t border-border pt-5 text-[14px] sm:grid-cols-3">
            {[
              { icon: Truck, title: "Free US shipping", body: "2–5 business days in the US", href: "/support/shipping-policy" },
              { icon: RotateCcw, title: "RMA returns", body: "See the return policy", href: "/support/return-policy" },
              { icon: Lock, title: "Secure checkout", body: "Encrypted payments", href: undefined },
            ].map(({ icon: Icon, title, body, href }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                  <Icon aria-hidden="true" className="size-[18px]" />
                </span>
                <span>
                  <span className="block font-semibold text-foreground">{title}</span>
                  {href ? (
                    <Link href={href} className="text-muted-foreground underline-offset-4 hover:text-primary hover:underline">
                      {body}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">{body}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
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
                      <li>Orders within the US ship in 2–5 business days.</li>
                      <li>We ship anywhere in the world.</li>
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
