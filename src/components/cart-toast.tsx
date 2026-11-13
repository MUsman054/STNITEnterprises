"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { CircleCheck, X } from "lucide-react";
import { dismissToast, openCartDrawer, useCart, useToast } from "@/lib/cart-store";
import { getProduct } from "@/lib/catalog";
import { formatPrice } from "@/lib/site";
import { ProductImage } from "@/components/product-image";

const VISIBLE_MS = 5000;

/**
 * Small "Added to cart" confirmation after adding from a product card. Does not take
 * focus (the change is announced through the cart's live region) and pauses its timer
 * while hovered or focused.
 */
export function CartToast() {
  const toast = useToast();
  const { count, subtotal } = useCart();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(dismissToast, VISIBLE_MS);
  };
  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
  };

  useEffect(() => {
    if (!toast) return;
    timer.current = setTimeout(dismissToast, VISIBLE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [toast]);

  if (!toast) return null;
  const product = getProduct(toast.slug);
  if (!product) return null;

  return (
    <div
      key={toast.id}
      className="animate-toast fixed inset-x-3 bottom-3 z-50 rounded-2xl border border-border bg-background p-4 shadow-pop sm:inset-x-auto sm:top-4 sm:right-4 sm:bottom-auto sm:w-[380px]"
      onMouseEnter={stop}
      onMouseLeave={start}
      onFocus={stop}
      onBlur={start}
    >
      <div className="flex items-start gap-3">
        <ProductImage
          image={product.image}
          alt=""
          sizes="64px"
          zoom={false}
          className="size-16 shrink-0 rounded-lg bg-surface"
        />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[15px] font-bold text-primary">
            <CircleCheck aria-hidden="true" className="size-[18px]" />
            Added to cart
          </p>
          <p className="mt-0.5 line-clamp-1 text-sm text-foreground">{product.name}</p>
          <p className="text-[13px] text-muted-foreground">
            Cart: {count} {count === 1 ? "item" : "items"} · {formatPrice(subtotal)}
          </p>
        </div>
        <button
          type="button"
          onClick={dismissToast}
          aria-label="Dismiss"
          className="-mt-2 -mr-2 grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-surface hover:text-foreground"
        >
          <X aria-hidden="true" className="size-[18px]" />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={openCartDrawer}
          className="min-h-11 rounded-full border border-foreground/25 text-[15px] font-semibold text-foreground transition-colors duration-200 hover:border-foreground hover:bg-surface"
        >
          View cart
        </button>
        <Link
          href="/checkout"
          onClick={dismissToast}
          className="flex min-h-11 items-center justify-center rounded-full bg-primary text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-primary-hover"
        >
          Checkout
        </Link>
      </div>
    </div>
  );
}
