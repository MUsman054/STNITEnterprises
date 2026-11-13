"use client";

import Link from "next/link";
import { FileText, Heart, Plus } from "lucide-react";
import { addToCart, removeFromCart, setCartQty, useCart } from "@/lib/cart-store";
import { brandName, discountPercent, type Product } from "@/lib/catalog";
import { formatPrice } from "@/lib/site";
import { toggleWishlist, useWishlist } from "@/lib/wishlist-store";
import { Price } from "@/components/price";
import { ProductImage } from "@/components/product-image";
import { QuantityStepper } from "@/components/quantity-stepper";
import { Rating } from "@/components/rating";

/** "+ Add" until the product is in the cart, then an inline quantity stepper. */
export function AddControl({ product }: { product: Product }) {
  const { qtyOf, hydrated } = useCart();
  const qty = hydrated ? qtyOf(product.slug) : 0;

  if (product.stock === "out") {
    return (
      <Link
        href={`/product/${product.slug}#quote`}
        className="relative z-10 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full border border-foreground/25 px-4 text-[14px] font-semibold text-foreground transition-colors duration-200 hover:border-primary hover:text-primary"
      >
        <FileText aria-hidden="true" className="size-4" />
        Request a quote
      </Link>
    );
  }

  if (qty > 0) {
    return (
      <div className="animate-fade-in relative z-10">
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
    <button
      type="button"
      onClick={() => addToCart(product.slug, 1, "toast")}
      aria-label={`Add ${product.name} to cart`}
      className="relative z-10 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-[15px] font-semibold text-white transition-[background-color,translate] duration-200 hover:bg-primary-hover active:translate-y-px"
    >
      <Plus aria-hidden="true" className="size-[18px]" strokeWidth={2.5} />
      Add
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

export function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const discount = discountPercent(product);
  const out = product.stock === "out";

  return (
    <article className="group relative flex h-full flex-col rounded-xl bg-background p-2.5 transition-shadow duration-300 hover:shadow-lift sm:p-3">
      <div className="relative">
        <ProductImage
          image={product.image}
          alt=""
          priority={priority}
          sizes="(min-width: 1280px) 230px, (min-width: 640px) 30vw, 46vw"
          className={`aspect-square rounded-lg bg-surface ${out ? "opacity-60" : ""}`}
        />
        <div className="pointer-events-none absolute top-2 left-2 flex flex-col items-start gap-1">
          {discount !== null && <span className="rounded-md bg-sale px-2 py-0.5 text-xs font-bold text-white">{discount}% off</span>}
          {product.condition === "Refurbished" && (
            <span className="rounded-md bg-background/95 px-2 py-0.5 text-xs font-semibold text-foreground shadow-card">Refurbished</span>
          )}
        </div>
        <WishlistButton product={product} className="absolute top-1 right-1 z-10 bg-background/80 backdrop-blur hover:bg-background" />
      </div>

      <div className="mt-3 flex flex-1 flex-col px-0.5">
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <Price
            amount={product.price}
            size="md"
            label={discount !== null ? "Sale price" : undefined}
            className={discount !== null ? "text-sale" : "text-foreground"}
          />
          {product.compareAt && discount !== null && (
            <span className="text-[13px] text-muted-foreground">
              <span className="sr-only">Was </span>
              <s>{formatPrice(product.compareAt)}</s>
            </span>
          )}
        </p>

        <h3 className="mt-1.5 line-clamp-2 text-[14px] leading-snug font-normal tracking-normal text-foreground">
          {/* ::after stretches the link across the card; controls sit above it (z-10). */}
          <Link href={`/product/${product.slug}`} className="rounded-sm after:absolute after:inset-0 after:rounded-xl after:content-[''] group-hover:underline">
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 truncate text-[12px] text-muted-foreground">
          {brandName(product.brand)} · Part # <span className="font-medium text-foreground">{product.mpn}</span>
        </p>

        <div className="mt-1.5">
          <Rating value={product.rating} count={product.reviews} />
        </div>

        <p className="mt-1.5 text-[13px]">
          {out ? (
            <span className="font-semibold text-sale">Out of stock</span>
          ) : (
            <>
              <span className="font-semibold text-primary">In stock</span>
              {product.stock === "low" && <span className="font-medium text-amber-text"> · Only a few left</span>}
            </>
          )}
        </p>

        <div className="mt-auto pt-3">
          <AddControl product={product} />
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
