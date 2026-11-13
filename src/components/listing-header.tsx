import Image from "next/image";
import Link from "next/link";
import type { ChildCategory } from "@/lib/catalog";
import { Breadcrumbs, type Crumb } from "@/components/page-banner";

/** Dark banner at the top of category and brand pages, with optional child-category chips. */
export function ListingHeader({
  crumbs,
  title,
  description,
  image,
  stat,
  chips,
  activeChip,
}: {
  crumbs: Crumb[];
  title: string;
  description?: string;
  image?: { src: string };
  stat?: string;
  chips?: { base: string; items: ChildCategory[] };
  activeChip?: string;
}) {
  return (
    <>
      <Breadcrumbs crumbs={crumbs} />
      <section className="animate-fade-up on-dark relative mt-1 grid items-center overflow-hidden rounded-2xl bg-hero-dark text-white sm:grid-cols-[1fr_auto]">
        <div className="relative p-6 sm:p-9">
          <h1 className="text-[26px] leading-tight font-bold sm:text-[36px]">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-[16px] text-[#c9cfd5]">{description}</p>}
          {stat && <p className="mt-4 text-[15px] font-semibold text-lime">{stat}</p>}
        </div>
        {image && (
          <div className="relative mx-auto mb-6 size-32 overflow-hidden rounded-2xl bg-white sm:mr-9 sm:mb-0 sm:size-40">
            <Image src={image.src} alt="" fill sizes="160px" className="object-contain p-3" priority />
          </div>
        )}
      </section>
      {chips && chips.items.length > 1 && (
        <nav aria-label="Sub-categories" className="mt-4">
          <ul className="scrollbar-none -mx-3 flex gap-2 overflow-x-auto px-3">
            <li>
              <Link
                href={chips.base}
                aria-current={!activeChip ? "page" : undefined}
                className="inline-flex min-h-11 items-center rounded-full border border-foreground/20 px-4 text-[14px] font-medium whitespace-nowrap text-foreground transition-colors duration-150 hover:border-foreground aria-[current=page]:border-nav aria-[current=page]:bg-nav aria-[current=page]:text-white"
              >
                All
              </Link>
            </li>
            {chips.items.map((child) => (
              <li key={child.slug}>
                <Link
                  href={`${chips.base}/${child.slug}`}
                  aria-current={activeChip === child.slug ? "page" : undefined}
                  className="inline-flex min-h-11 items-center rounded-full border border-foreground/20 px-4 text-[14px] font-medium whitespace-nowrap text-foreground transition-colors duration-150 hover:border-foreground aria-[current=page]:border-nav aria-[current=page]:bg-nav aria-[current=page]:text-white"
                >
                  {child.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}
