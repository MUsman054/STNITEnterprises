"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play, ShieldCheck, Truck, Wrench } from "lucide-react";
import { discountPercent, getCategory, products, type Product } from "@/lib/catalog";
import { formatPrice } from "@/lib/site";

/** Products shown in the hero, in order. Use products that have a real manufacturer photo. */
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

/** Soft background per slide (cycled). Light enough to keep dark text readable. */
const SLIDE_BACKGROUNDS = [
  "radial-gradient(circle at 75% 50%, #ffffff 0%, transparent 55%), linear-gradient(120deg, #e3f4dc 0%, #c9ead0 100%)", // mint
  "radial-gradient(circle at 75% 50%, #ffffff 0%, transparent 55%), linear-gradient(120deg, #e1eefc 0%, #c7dcf7 100%)", // sky
  "radial-gradient(circle at 75% 50%, #ffffff 0%, transparent 55%), linear-gradient(120deg, #fdebdc 0%, #f9d4b8 100%)", // peach
  "radial-gradient(circle at 75% 50%, #ffffff 0%, transparent 55%), linear-gradient(120deg, #ece6fb 0%, #d9cdf5 100%)", // lavender
  "radial-gradient(circle at 75% 50%, #ffffff 0%, transparent 55%), linear-gradient(120deg, #fdf5d6 0%, #f7e6a8 100%)", // butter
  "radial-gradient(circle at 75% 50%, #ffffff 0%, transparent 55%), linear-gradient(120deg, #fce4ea 0%, #f6c9d5 100%)", // rose
];

/**
 * Auto-advancing product banner: a compact white card, text on the left and a large
 * product photo on the right. Keeps running under the mouse; pauses only with the pause
 * button, while a keyboard user is inside it, or when the tab is hidden. Never auto-plays
 * under prefers-reduced-motion. Swipe on touch.
 */
export function Hero() {
  const [index, setIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [keyboardInside, setKeyboardInside] = useState(false);
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
  // pausing the animation pauses the slideshow at exactly the same point.
  const playing = !userPaused && !reducedMotion && count > 1;
  const running = playing && !keyboardInside && !hidden;

  if (count === 0) return null;

  return (
    <section aria-roledescription="carousel" aria-label="Featured products" className="bg-canvas pt-3 sm:pt-5">
      <h1 className="sr-only">STN IT Enterprise: servers, parts and storage, sourced right</h1>

      <div className="container-page">
        <div
          className="relative overflow-hidden rounded-3xl bg-background shadow-card"
          // Only keyboard focus pauses (a mouse click on an arrow should not).
          onFocus={(event) => {
            if (event.target.matches(":focus-visible")) setKeyboardInside(true);
          }}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setKeyboardInside(false);
          }}
        >
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

          {/* Controls: bottom of the text column */}
          <div className="flex items-center gap-3 px-5 pb-5 sm:px-8 md:absolute md:bottom-0 md:left-0 md:w-1/2 md:px-10 md:pb-7 lg:px-12">
            <div className="flex items-center gap-1.5" role="group" aria-label="Choose slide">
              {slides.map((product, i) => {
                const active = i === index;
                return (
                  <button
                    key={product.slug}
                    type="button"
                    onClick={() => go(i)}
                    aria-label={`Slide ${i + 1}: ${product.name}`}
                    aria-current={active ? "true" : undefined}
                    className="group flex h-11 items-center"
                  >
                    <span
                      className={`relative block h-1.5 overflow-hidden rounded-full transition-[width,background-color] duration-300 ${
                        active ? "w-10 bg-foreground/15" : "w-4 bg-foreground/15 group-hover:bg-foreground/30"
                      }`}
                    >
                      {active && (
                        <span
                          key={`bar-${index}`}
                          className={`absolute inset-0 origin-left rounded-full bg-primary ${playing ? "animate-hero-progress" : ""}`}
                          style={{ animationDuration: `${INTERVAL}ms`, animationPlayState: running ? "running" : "paused" }}
                          onAnimationEnd={playing ? () => go(index + 1) : undefined}
                        />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="ml-auto flex items-center gap-1">
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

        <ul className="flex flex-wrap gap-x-8 gap-y-2 px-1 pt-4 text-[14px] text-muted-foreground">
          <li className="flex items-center gap-2">
            <Truck aria-hidden="true" className="size-4 text-primary" />
            Ships in 2–5 business days in the US
          </li>
          <li className="flex items-center gap-2">
            <ShieldCheck aria-hidden="true" className="size-4 text-primary" />
            Certified sourcing
          </li>
          <li className="flex items-center gap-2">
            <Wrench aria-hidden="true" className="size-4 text-primary" />
            Expert procurement team
          </li>
        </ul>
      </div>
    </section>
  );
}

const controlButton =
  "grid size-11 place-items-center rounded-full border border-border bg-background text-foreground transition-colors duration-200 hover:border-foreground/40";

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
      style={{ background: SLIDE_BACKGROUNDS[position % SLIDE_BACKGROUNDS.length] }}
      className={`[grid-area:1/1] grid transition-[opacity,visibility] duration-500 ease-out md:min-h-[440px] md:grid-cols-2 ${
        active ? "visible opacity-100" : "invisible opacity-0"
      }`}
    >
      {/* Text (leaves room at the bottom for the controls on desktop) */}
      <div className="order-2 flex flex-col justify-center px-5 pt-2 pb-4 sm:px-8 md:order-1 md:px-10 md:pt-10 md:pb-24 lg:px-12">
        <p className="text-[13px] font-semibold tracking-[0.14em] text-primary uppercase">
          {category?.short ?? "Featured"} / {product.condition}
        </p>
        <p className="mt-3 font-display text-[28px] leading-[1.1] font-bold text-balance text-foreground sm:text-[36px] lg:text-[44px]">
          {headline}
        </p>
        <p className="mt-3 max-w-lg text-[15px] text-muted-foreground sm:text-[16px]">
          <span className="font-semibold text-foreground">{product.name}</span>
          <span className="hidden lg:inline">. {product.summary}</span>
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
          <p className="flex items-baseline gap-2">
            <span className="text-[26px] leading-none font-bold text-foreground tabular-nums">{formatPrice(product.price)}</span>
            {discount !== null && product.compareAt && (
              <span className="text-[14px] text-muted-foreground tabular-nums">
                <span className="sr-only">was </span>
                <s>{formatPrice(product.compareAt)}</s>
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-2.5">
            <Link
              href={`/product/${product.slug}`}
              className="group inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-primary-hover"
            >
              View product
              <span className="sr-only">: {product.name}</span>
              <ArrowRight aria-hidden="true" className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            {category && (
              <Link
                href={`/category/${category.slug}`}
                className="inline-flex min-h-11 items-center rounded-full border border-foreground/20 bg-white/60 px-5 text-[15px] font-semibold text-foreground transition-colors duration-200 hover:border-foreground/50"
              >
                Shop {category.short}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Photo: the whole right half, no frame */}
      <div className="relative order-1 h-56 overflow-hidden sm:h-72 md:order-2 md:h-auto">
        <Image
          src={product.image.src}
          alt={product.name}
          fill
          priority={position === 0}
          sizes="(min-width: 768px) 50vw, 100vw"
          // Manufacturer photos carry wide white margins, so they are scaled up on desktop.
          className={`object-contain p-4 mix-blend-multiply transition-[translate,scale] duration-700 ease-[var(--ease-out-soft)] md:p-6 ${
            active ? "translate-x-0 scale-100 md:scale-[1.3]" : "translate-x-6 scale-95 md:scale-[1.2]"
          }`}
        />
      </div>
    </div>
  );
}
