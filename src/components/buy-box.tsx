"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock, RotateCcw, Truck } from "lucide-react";
import { addToCart, useCart } from "@/lib/cart-store";
import { discountPercent, type Product } from "@/lib/catalog";
import { formatPrice, site } from "@/lib/site";
import { toggleWishlist, useWishlist } from "@/lib/wishlist-store";
import { btnDark, btnPrimary } from "@/lib/ui";
import { Price } from "@/components/price";
import { QuantityStepper } from "@/components/quantity-stepper";
import { QuoteRequest } from "@/components/request-forms";

/** Purchase panel on the product page. */
export function BuyBox({ product }: { product: Product }) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const { qtyOf, hydrated } = useCart();
  const wishlist = useWishlist();
  const saved = hydrated && wishlist.includes(product.slug);
  const inCart = hydrated ? qtyOf(product.slug) : 0;
  const discount = discountPercent(product);
  const out = product.stock === "out";

  return (
    <div className="rounded-2xl border border-border p-5">
      <p className="flex flex-wrap items-baseline gap-x-2">
        <Price amount={product.price} size="lg" label={discount !== null ? "Sale price" : undefined} className={discount !== null ? "text-sale" : "text-foreground"} />
        {product.compareAt && discount !== null && (
          <span className="text-sm text-muted-foreground">
            <span className="sr-only">Was </span>
            <s>{formatPrice(product.compareAt)}</s>
          </span>
        )}
      </p>

      <p className={`mt-3 text-lg font-semibold ${out ? "text-sale" : product.stock === "low" ? "text-amber-text" : "text-primary"}`}>
        {out ? "Out of stock" : product.stock === "low" ? "Only a few left in stock" : "In stock"}
      </p>
      {out && <p className="mt-1 text-[14px] text-muted-foreground">Request a quote and we&apos;ll tell you when we can supply it.</p>}

      <ul className="mt-3 space-y-2 text-[14px]">
        <li className="flex items-start gap-2.5">
          <Truck aria-hidden="true" className="mt-0.5 size-[18px] shrink-0 text-primary" />
          <span>
            <span className="font-semibold text-foreground">Free shipping</span>
            <span className="block text-muted-foreground">{site.shipping.estimate}</span>
          </span>
        </li>
        <li className="flex items-start gap-2.5">
          <RotateCcw aria-hidden="true" className="mt-0.5 size-[18px] shrink-0 text-muted-foreground" />
          <Link href="/support/return-policy" className="-my-3 inline-block py-3 text-foreground underline-offset-4 hover:text-primary hover:underline">
            Returns with RMA, see policy
          </Link>
        </li>
      </ul>

      {!out && (
        <>
          <div className="mt-4 flex items-center gap-3">
            <span className="text-[14px] font-semibold text-foreground">Quantity</span>
            <QuantityStepper size="sm" value={qty} onChange={setQty} label={product.name} />
          </div>
          <div className="mt-4 grid gap-2.5">
            <button
              type="button"
              onClick={() => {
                addToCart(product.slug, qty, "drawer");
                setQty(1);
              }}
              className={`${btnPrimary} min-h-12 w-full`}
            >
              Add to cart
            </button>
            <button
              type="button"
              onClick={() => {
                addToCart(product.slug, qty, "none");
                router.push("/checkout");
              }}
              className={`${btnDark} min-h-12 w-full`}
            >
              Buy now
            </button>
          </div>
        </>
      )}

      <div className={`grid gap-2.5 ${out ? "mt-4" : "mt-2.5"}`}>
        <QuoteRequest product={product} prominent={out} />
        <button
          type="button"
          onClick={() => toggleWishlist(product.slug)}
          aria-pressed={saved}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full text-[15px] font-semibold text-foreground transition-colors duration-150 hover:bg-surface"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className={`size-5 transition-[fill,color] duration-200 ${saved ? "fill-sale text-sale" : "fill-none text-foreground"}`} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
          {saved ? "Saved to wishlist" : "Add to wishlist"}
        </button>
      </div>

      {inCart > 0 && (
        <p className="animate-fade-up mt-2 text-center text-[14px] text-muted-foreground">
          {inCart} in your cart ·{" "}
          <Link href="/cart" className="font-semibold text-primary hover:underline">
            View cart
          </Link>
        </p>
      )}

      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-t border-border pt-4 text-[13px]">
        <dt className="text-muted-foreground">Ships from</dt>
        <dd className="text-foreground">{site.name}</dd>
        <dt className="text-muted-foreground">Payment</dt>
        <dd className="flex items-center gap-1 text-foreground">
          <Lock aria-hidden="true" className="size-3.5" />
          Secure checkout
        </dd>
      </dl>
    </div>
  );
}
