"use client";

import Link from "next/link";
import { Heart, Star } from "lucide-react";
import { addToCart, removeFromCart, setCartQty, useCart } from "@/lib/cart-store";
import { brandName, discountPercent, type Product } from "@/lib/catalog";
import { toggleWishlist, useWishlist } from "@/lib/wishlist-store";
import { PriceStack } from "@/components/price";
import { ProductImage } from "@/components/product-image";
import { QuantityStepper } from "@/components/quantity-stepper";

/** Card purchase control: a plain "Add to cart" button, then a quantity stepper once added. */
export function AddControl({ product }: { product: Product }) {
  const { qtyOf, hydrated } = useCart();
  const qty = hydrated ? qtyOf(product.slug) : 0;

  const button =
    "relative z-10 flex min-h-11 w-full items-center justify-center rounded-lg border border-foreground/20 px-3 text-[14px] font-semibold text-foreground transition-colors duration-200 hover:border-primary hover:bg-primary hover:text-white";

  if (product.stock === "out") {
    return (
      <Link href={`/product/${product.slug}#quote`} aria-label={`Request a quote for ${product.name}`} className={button}>
        Request a quote
      </Link>
    );
  }

  if (qty > 0) {
    return (
      <div className="animate-fade-in relative z-10 w-full">
        <QuantityStepper
          block
          size="sm"
          value={qty}
          label={product.name}
          onChange={(next) => setCartQty(product.slug, next)}
          onRemove={() => removeFromCart(product.slug)}
        />
      </div>
    );
  }

  return (
    <button type="button" onClick={() => addToCart(product.slug, 1, "toast")} aria-label={`Add ${product.name} to cart`} className={button}>
      Add to cart
    </button>
  );
}

export function WishlistButton({ product, className = "" }: { product: Product; className?: string }) {
  const list = useWishlist();
  const saved = list.includes(product.slug);
  return (
    <button
      type="button"
      onClick={() => toggleWishlist(product.slug)}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
      className={`grid size-11 place-items-center rounded-full transition-colors duration-200 ${className}`}
    >
      <Heart
        aria-hidden="true"
        className={`size-5 transition-[color,fill,scale] duration-200 ${saved ? "scale-110 fill-sale text-sale" : "text-foreground"}`}
      />
    </button>
  );
}

/** Stock as a short coloured label. */
export function StockLabel({ product, className = "" }: { product: Product; className?: string }) {
  const state =
    product.stock === "out"
      ? { text: "text-sale", label: "Out of stock" }
      : product.stock === "low"
        ? { text: "text-amber-text", label: "Low stock" }
        : { text: "text-primary", label: "In stock" };
  return <span className={`font-semibold ${state.text} ${className}`}>{state.label}</span>;
}

export function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const discount = discountPercent(product);
  const out = product.stock === "out";

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background transition-[border-color,box-shadow] duration-300 hover:border-foreground/20 hover:shadow-lift">
      <div className="relative">
        <ProductImage
          image={product.image}
          alt=""
          priority={priority}
          sizes="(min-width: 1280px) 230px, (min-width: 640px) 30vw, 46vw"
          className={`aspect-[5/4] bg-surface ${out ? "opacity-60" : ""}`}
        />
        <span className="pointer-events-none absolute top-2.5 left-2.5 rounded-full bg-background/95 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-foreground uppercase shadow-card">
          {product.condition === "Refurbished" ? "Refurb" : "New"}
        </span>
        {discount !== null && (
          <span className="pointer-events-none absolute bottom-2.5 left-2.5 rounded-full bg-nav px-2.5 py-1 text-[12px] font-bold text-lime tabular-nums">
            −{discount}%
          </span>
        )}
        <WishlistButton product={product} className="absolute top-1 right-1 z-10 bg-background/80 backdrop-blur hover:bg-background" />
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="flex items-center justify-between gap-2 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          <span className="truncate">{brandName(product.brand)}</span>
          <span className="max-w-[55%] truncate font-mono tracking-normal normal-case" title={`Part # ${product.mpn}`}>
            <span className="sr-only">Part number </span>
            {product.mpn}
          </span>
        </p>

        <h3 className="mt-1.5 line-clamp-2 text-[14px] leading-snug font-semibold tracking-normal text-foreground sm:text-[15px]">
          {/* ::after stretches the link across the card; controls sit above it (z-10). */}
          <Link
            href={`/product/${product.slug}`}
            className="rounded-sm transition-colors duration-150 after:absolute after:inset-0 after:rounded-2xl after:content-[''] group-hover:text-primary"
          >
            {product.name}
          </Link>
        </h3>

        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
          <StockLabel product={product} />
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Star aria-hidden="true" className="size-3.5 fill-star text-star" />
            <span aria-hidden="true" className="font-semibold text-foreground tabular-nums">
              {product.rating.toFixed(1)}
            </span>
            <span aria-hidden="true" className="tabular-nums">
              ({product.reviews})
            </span>
            <span className="sr-only">
              Rated {product.rating.toFixed(1)} out of 5 from {product.reviews} ratings
            </span>
          </span>
        </p>

        <div className="mt-auto pt-3">
          <PriceStack product={product} size="md" className="min-h-[3.4rem] border-t border-border pt-3" />
          <div className="mt-3">
            <AddControl product={product} />
          </div>
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: Product[]; priorityCount?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 xl:grid-cols-4">
      {products.map((product, index) => (
        <li key={product.slug} className="animate-fade-up">
          <ProductCard product={product} priority={index < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
