"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play, ShieldCheck, Truck, Wrench } from "lucide-react";
import { discountPercent, getCategory, products, type Product } from "@/lib/catalog";
import { formatPrice } from "@/lib/site";

/** Products shown in the hero, in order. Change the part numbers to change the slides. */
/** Use products that have a real manufacturer photo. */
const SLIDE_MPNS = ["868703-B21", "DS920+", "ST4000NM000A", "JL253A", "M393A4K40DB2-CVF", "720479-B21"];

/** One headline per category, so slides read as offers rather than long product titles. */
const headlines: Record<string, string> = {
  "servers-workstations": "Rack servers, ready to deploy.",
  networking: "Switching that keeps up.",
  "hard-drives": "Enterprise drives, tested and ready.",
  processors: "Xeon performance for less.",
  memory: "Server memory that just fits.",
  "storage-arrays": "Storage that grows with you.",
  "power-supplies": "Power that keeps racks running.",
  motherboards: "Boards for every build.",
  accessories: "The finishing pieces.",
};

const slides = SLIDE_MPNS.map((mpn) => products.find((product) => product.mpn === mpn)).filter(
  (product): product is Product => product !== undefined && product.stock !== "out",
);

const INTERVAL = 6000;

/**
 * Auto-advancing product showcase. Pauses on hover, keyboard focus, when the tab is hidden
 * and with the pause button; never auto-plays under prefers-reduced-motion. Swipe on touch.
 */
export function Hero() {
  const [index, setIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hidden, setHidden] = useState(false);
  const swipeStart = useRef<number | null>(null);
  const count = slides.length;

  const go = useCallback((next: number) => setIndex(((next % count) + count) % count), [count]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      query.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // The active progress bar's CSS animation is the timer: when it ends we advance, and
  // pausing it (hover, focus, hidden tab) pauses the slideshow at exactly the same point.
  const playing = !userPaused && !reducedMotion && count > 1;
  const running = playing && !hovered && !focused && !hidden;

  if (count === 0) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured products"
      className="on-dark relative overflow-hidden bg-hero-dark text-white"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <h1 className="sr-only">STN IT Enterprise: servers, parts and storage, sourced right</h1>

      <div className="container-page relative pt-6 pb-5 md:pt-10 lg:pt-12">
        <div
          aria-live={running ? "off" : "polite"}
          className="grid touch-pan-y"
          onPointerDown={(event) => {
            if (event.pointerType !== "mouse") swipeStart.current = event.clientX;
          }}
          onPointerUp={(event) => {
            if (swipeStart.current === null) return;
            const delta = event.clientX - swipeStart.current;
            swipeStart.current = null;
            if (Math.abs(delta) > 50) go(index + (delta < 0 ? 1 : -1));
          }}
          onPointerCancel={() => {
            swipeStart.current = null;
          }}
        >
          {slides.map((product, i) => (
            <Slide key={product.slug} product={product} position={i} total={count} active={i === index} />
          ))}
        </div>

        {/* Controls */}
        <div className="mt-6 flex items-center gap-3 lg:mt-8">
          <div className="flex flex-1 items-center gap-1.5 sm:gap-2" role="group" aria-label="Choose slide">
            {slides.map((product, i) => {
              const active = i === index;
              return (
                <button
                  key={product.slug}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Slide ${i + 1}: ${product.name}`}
                  aria-current={active ? "true" : undefined}
                  className="group flex h-11 flex-1 items-center sm:max-w-24"
                >
                  <span className={`relative block h-1 w-full overflow-hidden rounded-full transition-colors duration-200 ${active ? "bg-white/35" : "bg-white/15 group-hover:bg-white/30"}`}>
                    <span
                      key={active ? `on-${index}` : "off"}
                      className={`absolute inset-0 origin-left rounded-full bg-lime ${
                        active ? (playing ? "animate-hero-progress" : "") : "scale-x-0"
                      }`}
                      style={active ? { animationDuration: `${INTERVAL}ms`, animationPlayState: running ? "running" : "paused" } : undefined}
                      onAnimationEnd={active && playing ? () => go(index + 1) : undefined}
                    />
                  </span>
                </button>
              );
            })}
          </div>

          <span className="hidden text-[13px] font-medium text-nav-muted tabular-nums sm:inline" aria-hidden="true">
            {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
          </span>

          <div className="flex items-center gap-1">
            <button type="button" onClick={() => go(index - 1)} aria-label="Previous slide" className={controlButton}>
              <ChevronLeft aria-hidden="true" className="size-5" />
            </button>
            {!reducedMotion && (
              <button
                type="button"
                onClick={() => setUserPaused((value) => !value)}
                aria-label={userPaused ? "Play slideshow" : "Pause slideshow"}
                className={controlButton}
              >
                {userPaused ? <Play aria-hidden="true" className="size-4" /> : <Pause aria-hidden="true" className="size-4" />}
              </button>
            )}
            <button type="button" onClick={() => go(index + 1)} aria-label="Next slide" className={controlButton}>
              <ChevronRight aria-hidden="true" className="size-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Trust strip */}
      <div className="relative border-t border-white/10 bg-black/20">
        <ul className="container-page flex flex-wrap gap-x-8 gap-y-2 py-3.5 text-[14px] text-[#c9cfd5]">
          <li className="flex items-center gap-2">
            <Truck aria-hidden="true" className="size-4 text-lime" />
            Ships in 2–5 business days
          </li>
          <li className="flex items-center gap-2">
            <ShieldCheck aria-hidden="true" className="size-4 text-lime" />
            Certified sourcing
          </li>
          <li className="flex items-center gap-2">
            <Wrench aria-hidden="true" className="size-4 text-lime" />
            Expert procurement team
          </li>
        </ul>
      </div>
    </section>
  );
}

const controlButton =
  "grid size-11 place-items-center rounded-full border border-white/15 text-white transition-colors duration-200 hover:border-lime hover:text-lime";

function Slide({ product, position, total, active }: { product: Product; position: number; total: number; active: boolean }) {
  const category = getCategory(product.category);
  const discount = discountPercent(product);
  const headline = headlines[product.category] ?? product.name;

  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-label={`${position + 1} of ${total}`}
      aria-hidden={!active}
      inert={!active}
      className={`[grid-area:1/1] grid items-center gap-6 transition-[opacity,visibility] duration-700 ease-[var(--ease-out-soft)] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12 ${
        active ? "visible opacity-100" : "invisible opacity-0"
      }`}
    >
      {/* Text */}
      <div
        className={`order-2 transition-[translate] duration-700 ease-[var(--ease-out-soft)] md:order-1 ${active ? "translate-x-0" : "-translate-x-6"}`}
      >
        <p className="text-[13px] font-semibold tracking-[0.14em] text-nav-muted uppercase">
          {category?.short ?? "Featured"} / {product.condition}
        </p>
        <p className="mt-4 font-display text-[30px] leading-[1.08] font-bold text-balance sm:text-[42px] lg:text-[52px]">{headline}</p>
        <p className="mt-3 max-w-xl text-[16px] text-[#c9cfd5] sm:text-lg">
          <span className="font-semibold text-white">{product.name}</span>
          <span className="hidden sm:inline"> — {product.summary}</span>
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
          <div>
            <p className="text-[12px] font-semibold tracking-[0.12em] text-nav-muted uppercase">{discount !== null ? "Now" : "Price"}</p>
            <p className="flex items-baseline gap-2.5">
              <span className="text-[30px] leading-none font-bold tabular-nums">{formatPrice(product.price)}</span>
              {discount !== null && product.compareAt && (
                <span className="text-[15px] text-nav-muted tabular-nums">
                  <span className="sr-only">was </span>
                  <s>{formatPrice(product.compareAt)}</s>
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link
              href={`/product/${product.slug}`}
              className="group inline-flex min-h-12 items-center gap-2 rounded-full bg-lime px-6 text-[15px] font-bold text-ink transition-colors duration-200 hover:bg-white"
            >
              View product
              <span className="sr-only">: {product.name}</span>
              <ArrowRight aria-hidden="true" className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            {category && (
              <Link
                href={`/category/${category.slug}`}
                className="inline-flex min-h-12 items-center rounded-full border border-white/25 px-6 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-white/10"
              >
                Shop {category.short}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Product photo */}
      <div className="order-1 md:order-2">
        <div className="relative mx-auto aspect-[16/10] w-full max-w-[560px] overflow-hidden rounded-3xl bg-white md:aspect-[5/4]">
          <Image
            src={product.image.src}
            alt={product.name}
            fill
            priority={position === 0}
            sizes="(min-width: 1024px) 560px, (min-width: 768px) 45vw, 92vw"
            className={`object-contain p-6 transition-[scale,opacity] duration-700 ease-[var(--ease-out-soft)] sm:p-10 ${active ? "scale-100" : "scale-95"}`}
          />
        </div>
      </div>
    </div>
  );
}
