"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";

/** A titled, horizontally scrolling row of product cards with arrow buttons. */
export function ProductRail({
  title,
  subtitle,
  href,
  linkLabel = "See all",
  products,
  className = "",
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  products: Product[];
  className?: string;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const headingId = useId();

  const update = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    setAtStart(list.scrollLeft < 8);
    setAtEnd(list.scrollLeft + list.clientWidth >= list.scrollWidth - 8);
  }, []);

  useEffect(() => {
    update();
    const list = listRef.current;
    if (!list) return;
    const observer = new ResizeObserver(update);
    observer.observe(list);
    return () => observer.disconnect();
  }, [update, products.length]);

  const scroll = (direction: 1 | -1) => {
    const list = listRef.current;
    if (!list) return;
    list.scrollBy({ left: direction * list.clientWidth * 0.85, behavior: "smooth" });
  };

  if (products.length === 0) return null;

  const arrow =
    "absolute top-[38%] z-20 hidden size-12 -translate-y-1/2 place-items-center rounded-full border border-border bg-background text-foreground shadow-lift transition-[opacity,scale,background-color] duration-200 hover:bg-surface md:grid";

  return (
    <section aria-labelledby={headingId} className={`reveal rounded-2xl bg-background p-4 shadow-card sm:p-5 ${className}`}>
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h2 id={headingId} className="text-xl font-bold text-foreground sm:text-[22px]">
            {title}
          </h2>
          {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {href && (
          <Link
            href={href}
            className="group inline-flex min-h-11 shrink-0 items-center gap-1 text-[15px] font-semibold text-primary"
          >
            <span className="link-underline">{linkLabel}</span>
            <ChevronRight
              aria-hidden="true"
              className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </Link>
        )}
      </div>

      <div className="relative -mx-1">
        <button
          type="button"
          onClick={() => scroll(-1)}
          aria-label={`Scroll ${title} back`}
          tabIndex={atStart ? -1 : 0}
          aria-hidden={atStart}
          className={`${arrow} left-0 ${atStart ? "pointer-events-none scale-90 opacity-0" : "opacity-100"}`}
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
        </button>
        <ul
          ref={listRef}
          onScroll={update}
          className="scrollbar-none flex snap-x snap-mandatory scroll-px-1 gap-1 overflow-x-auto scroll-smooth px-1 pb-1 sm:gap-2"
        >
          {products.map((product) => (
            <li key={product.slug} className="w-[47%] shrink-0 snap-start sm:w-[210px] xl:w-[226px]">
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => scroll(1)}
          aria-label={`Scroll ${title} forward`}
          tabIndex={atEnd ? -1 : 0}
          aria-hidden={atEnd}
          className={`${arrow} right-0 ${atEnd ? "pointer-events-none scale-90 opacity-0" : "opacity-100"}`}
        >
          <ChevronRight aria-hidden="true" className="size-5" />
        </button>
      </div>
    </section>
  );
}
