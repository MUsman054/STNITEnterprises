import Image from "next/image";
import Link from "next/link";
import { ChevronRight, FileText, Headset, Lock, PackageCheck, Quote, Star, Truck } from "lucide-react";
import { BrandLogo } from "@/components/brand-mark";
import { ProductRail } from "@/components/product-rail";
import { brands, categories, dealProducts, maxDiscount, productsInCategory } from "@/lib/catalog";
import { site } from "@/lib/site";
import { cardClass, eyebrowClass } from "@/lib/ui";

function SectionHead({ id, eyebrow, title, action }: { id: string; eyebrow?: string; title: string; action?: { href: string; label: string } }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
      <div>
        {eyebrow && <p className={eyebrowClass}>{eyebrow}</p>}
        <h2 id={id} className="mt-1 text-[24px] font-bold text-foreground sm:text-[28px]">
          {title}
        </h2>
      </div>
      {action && (
        <Link href={action.href} className="group inline-flex min-h-11 items-center gap-1 text-[15px] font-semibold text-primary">
          <span className="link-underline">{action.label}</span>
          <ChevronRight aria-hidden="true" className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

export function FeaturedCategories() {
  return (
    <section aria-labelledby="featured-categories" className="reveal">
      <SectionHead id="featured-categories" eyebrow="Shop categories" title="Featured categories" action={{ href: "/shop", label: "All products" }} />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9">
        {categories.map((category) => {
          const count = productsInCategory(category.slug).length;
          return (
            <li key={category.slug}>
              <Link
                href={`/category/${category.slug}`}
                className="group flex h-full flex-col items-center rounded-2xl bg-background p-3 text-center shadow-card transition-[box-shadow,translate] duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                <span className="relative block aspect-square w-full overflow-hidden rounded-xl bg-surface">
                  <Image
                    src={category.image.src}
                    alt=""
                    fill
                    sizes="(min-width: 1280px) 140px, (min-width: 640px) 30vw, 45vw"
                    className="object-contain p-2 mix-blend-multiply transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:scale-110"
                  />
                </span>
                <span className="mt-2.5 text-[14px] leading-tight font-semibold text-foreground group-hover:text-primary">{category.short}</span>
                <span className="mt-0.5 text-[12px] text-muted-foreground">{count} products</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function BrandCarousel() {
  // Generic is a catch-all, not a brand worth advertising.
  const shown = brands.filter((brand) => brand.slug !== "generic");
  const loop = [...shown, ...shown];
  return (
    <section aria-labelledby="brands-title" className={`reveal ${cardClass} overflow-hidden`}>
      <SectionHead id="brands-title" title="Brands we carry" action={{ href: "/brands", label: "All brands" }} />
      <div className="marquee relative -mx-4 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_6%,black_94%,transparent)] sm:-mx-5">
        <ul className="marquee-track flex w-max gap-3 px-5">
          {loop.map((brand, index) => (
            <li key={`${brand.slug}-${index}`} aria-hidden={index >= shown.length ? true : undefined}>
              <Link
                href={`/brand/${brand.slug}`}
                tabIndex={index >= shown.length ? -1 : undefined}
                className="group flex h-20 min-w-44 items-center justify-center gap-3 rounded-xl border border-border px-6 text-muted-foreground transition-[color,border-color,background-color] duration-200 hover:border-foreground/30 hover:shadow-card"
              >
                <BrandLogo brand={brand} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function DealsOfTheWeek() {
  return (
    <section aria-labelledby="deals-week" className="reveal grid grid-cols-1 gap-3 lg:grid-cols-[300px_minmax(0,1fr)]">
      <div className="on-dark relative flex flex-col justify-between overflow-hidden rounded-2xl bg-hero-dark p-6 text-white">
        <div className="relative">
          <p className="text-[15px] font-semibold text-lime">Up to {maxDiscount}% off</p>
          <h2 id="deals-week" className="mt-4 text-[28px] leading-tight font-bold">
            Deals of the week
          </h2>
          <p className="mt-2 text-[15px] text-[#c9cfd5]">Reduced prices on drives, memory, networking and more, while stock lasts.</p>
        </div>
        <Link href="/deals" className="relative mt-6 inline-flex min-h-11 w-fit items-center gap-1.5 rounded-full bg-lime px-5 text-[15px] font-bold text-ink transition-colors duration-200 hover:bg-white">
          Shop all deals
          <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
      <ProductRail title="Special offers" products={dealProducts} href="/deals" linkLabel="See all" />
    </section>
  );
}

export function WhyShopWithUs() {
  const items = [
    { icon: Lock, title: "Secure checkout", body: "Encrypted payments through trusted gateways." },
    { icon: Truck, title: "Fast shipping", body: "Orders ship within 2–5 business days, with tracking." },
    { icon: PackageCheck, title: "Quality assured", body: "Sourced from certified distributors and manufacturers." },
    { icon: Headset, title: "Expert support", body: "Procurement professionals who know the hardware." },
  ];
  return (
    <section aria-labelledby="why-title" className="reveal">
      <SectionHead id="why-title" eyebrow="Why STN IT Enterprise" title="Why shop with us" />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ icon: Icon, title, body }) => (
          <li key={title} className={`${cardClass} group transition-shadow duration-300 hover:shadow-lift`}>
            <span className="grid size-12 place-items-center rounded-xl bg-primary-soft text-primary">
              <Icon aria-hidden="true" className="size-6" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-foreground">{title}</h3>
            <p className="mt-1 text-[15px] text-muted-foreground">{body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/*
 * SAMPLE testimonials so the section can be designed. They are not real customer reviews:
 * replace them with genuine, attributed reviews (or remove the section) before launch.
 */
const testimonials = [
  { quote: "They found the exact cache module our RAID controller needed and checked compatibility before shipping.", role: "IT manager, logistics company" },
  { quote: "Quick quotes on a mixed order of drives and memory, and clear communication through to delivery.", role: "System integrator" },
  { quote: "Our go-to for refurbished server parts. Good pricing and the RMA process is straightforward.", role: "Data center operations lead" },
];

export function Testimonials() {
  return (
    <section aria-labelledby="reviews-title" className="reveal">
      <SectionHead id="reviews-title" eyebrow="Customer reviews" title="What our customers say" />
      <p className="-mt-2 mb-4 text-[13px] text-muted-foreground">Sample reviews shown for layout. They will be replaced with verified customer reviews.</p>
      <ul className="grid gap-3 md:grid-cols-3">
        {testimonials.map((item) => (
          <li key={item.role}>
            <figure className={`${cardClass} flex h-full flex-col`}>
              <Quote aria-hidden="true" className="size-7 text-brand" />
              <p className="mt-2 flex gap-0.5" role="img" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} aria-hidden="true" className="size-4 fill-star text-star" />
                ))}
              </p>
              <blockquote className="mt-3 flex-1 text-[16px] text-foreground">
                <p>{item.quote}</p>
              </blockquote>
              <figcaption className="mt-4 border-t border-border pt-3 text-[14px] font-semibold text-muted-foreground">{item.role}</figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function QuoteBand() {
  return (
    <section aria-labelledby="quote-band" className="reveal on-dark relative overflow-hidden rounded-2xl bg-nav p-6 text-white sm:p-10">
      <div className="relative grid items-center gap-6 lg:grid-cols-[1fr_auto]">
        <div>
          <h2 id="quote-band" className="text-[26px] leading-tight font-bold sm:text-[32px]">
            Can&apos;t find a part? We&apos;ll source it.
          </h2>
          <p className="mt-2 max-w-2xl text-[16px] text-[#c9cfd5]">
            Send us the part number and quantity. Our procurement team works with certified distributors to find what you need at a competitive price.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/contact-us" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-lime px-6 text-[15px] font-bold text-ink transition-colors duration-200 hover:bg-white">
            <FileText aria-hidden="true" className="size-[18px]" />
            Request a quote
          </Link>
          <a href={site.contact.phoneHref} className="inline-flex min-h-12 items-center rounded-full border border-white/25 px-6 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-white/10">
            Call {site.contact.phone}
          </a>
        </div>
      </div>
    </section>
  );
}
