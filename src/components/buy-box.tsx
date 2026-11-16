"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Heart, ShoppingCart } from "lucide-react";
import { addToCart, useCart } from "@/lib/cart-store";
import type { Product } from "@/lib/catalog";
import { toggleWishlist, useWishlist } from "@/lib/wishlist-store";
import { btnOutline, btnPrimary } from "@/lib/ui";
import { PriceStack } from "@/components/price";
import { StockLabel } from "@/components/product-card";
import { QuantityStepper } from "@/components/quantity-stepper";
import { QuoteRequest } from "@/components/request-forms";

const secondary =
  "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-[14px] whitespace-nowrap font-semibold text-foreground transition-colors duration-150 hover:border-foreground/40";

/** Purchase panel on the product page: price, stock, quantity and actions in one card. */
export function BuyBox({ product }: { product: Product }) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const { qtyOf, hydrated } = useCart();
  const wishlist = useWishlist();
  const saved = hydrated && wishlist.includes(product.slug);
  const inCart = hydrated ? qtyOf(product.slug) : 0;
  const out = product.stock === "out";

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PriceStack product={product} size="xl" />
        <StockLabel product={product} className="pt-1 text-[15px]" />
      </div>
      {out && (
        <p className="mt-3 text-[14px] text-muted-foreground">
          Request a quote and we’ll tell you when we can supply it.
        </p>
      )}

      {!out && (
        <div className="mt-4 flex flex-wrap gap-2.5">
          <QuantityStepper size="sm" value={qty} onChange={setQty} label={product.name} />
          <button
            type="button"
            onClick={() => {
              addToCart(product.slug, qty, "drawer");
              setQty(1);
            }}
            className={`${btnPrimary} min-h-12 flex-1 rounded-xl`}
          >
            <ShoppingCart aria-hidden="true" className="size-[18px]" />
            Add to cart
          </button>
          <button
            type="button"
            onClick={() => {
              addToCart(product.slug, qty, "none");
              router.push("/checkout");
            }}
            className={`${btnOutline} min-h-12 w-full rounded-xl border-primary text-primary hover:border-primary-hover hover:bg-primary-soft`}
          >
            Buy now
          </button>
        </div>
      )}

      <div className={`flex gap-2.5 ${out ? "mt-4" : "mt-2.5"}`}>
        <QuoteRequest
          product={product}
          prominent={out}
          label={out ? "Request a quote" : "Get a quote"}
          className={out ? `${btnPrimary} min-h-12 flex-1 rounded-xl` : secondary}
        />
        <button type="button" onClick={() => toggleWishlist(product.slug)} aria-pressed={saved} className={secondary}>
          <Heart aria-hidden="true" className={`size-[18px] transition-[fill,color] duration-200 ${saved ? "fill-sale text-sale" : ""}`} />
          {saved ? "Saved" : "Save"}
        </button>
      </div>

      {inCart > 0 && (
        <p className="animate-fade-up mt-3 text-center text-[14px] text-muted-foreground">
          {inCart} in your cart ·{" "}
          <Link href="/cart" className="font-semibold text-primary hover:underline">
            View cart
          </Link>
        </p>
      )}
    </div>
  );
}
