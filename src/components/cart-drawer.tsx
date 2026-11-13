"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ShoppingCart, X } from "lucide-react";
import {
  closeCartDrawer,
  removeFromCart,
  setCartQty,
  useCart,
  useCartAnnouncement,
  useCartDrawerOpen,
} from "@/lib/cart-store";
import { formatPrice } from "@/lib/site";
import { btnOutline, btnPrimary } from "@/lib/ui";
import { Price } from "@/components/price";
import { ProductImage } from "@/components/product-image";
import { QuantityStepper } from "@/components/quantity-stepper";

/**
 * Slide-out mini cart. Uses the native <dialog> element, which provides the focus trap,
 * Escape-to-close and background inerting. The slide animation is in globals.css.
 */
export function CartDrawer() {
  const open = useCartDrawerOpen();
  const { items, count, subtotal, savings } = useCart();
  const announcement = useCartAnnouncement();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <dialog
        ref={dialogRef}
        className="drawer"
        data-side="right"
        aria-labelledby="cart-drawer-title"
        onClose={closeCartDrawer}
        onClick={(event) => {
          // A click on the dialog element itself is a click on the backdrop.
          if (event.target === event.currentTarget) closeCartDrawer();
        }}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border px-5 py-2">
            <h2 id="cart-drawer-title" className="text-lg font-bold text-foreground">
              Cart{" "}
              <span className="text-base font-normal text-muted-foreground">
                ({count} {count === 1 ? "item" : "items"})
              </span>
            </h2>
            <button
              type="button"
              onClick={closeCartDrawer}
              aria-label="Close cart"
              className="-mr-2 grid size-11 place-items-center rounded-full text-foreground transition-colors duration-150 hover:bg-surface"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>

          {items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
              <span className="grid size-16 place-items-center rounded-full bg-primary-soft text-primary">
                <ShoppingCart aria-hidden="true" className="size-7" />
              </span>
              <p className="text-lg font-bold text-foreground">Your cart is empty</p>
              <p className="text-muted-foreground">Find something you need and it will show up here.</p>
              <Link href="/deals" onClick={closeCartDrawer} className={`${btnPrimary} mt-2`}>
                Shop today&apos;s deals
              </Link>
            </div>
          ) : (
            <>
              <ul className="flex-1 divide-y divide-border overflow-y-auto overscroll-contain px-5">
                {items.map(({ product, qty, lineTotal }) => (
                  <li key={product.slug} className="group flex gap-3 py-4">
                    <ProductImage
                      image={product.image}
                      alt=""
                      sizes="80px"
                      className="size-20 shrink-0 rounded-lg bg-surface"
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/product/${product.slug}`}
                        onClick={closeCartDrawer}
                        className="line-clamp-2 text-[14px] leading-snug text-foreground hover:text-primary hover:underline"
                      >
                        {product.name}
                      </Link>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <QuantityStepper
                          size="sm"
                          value={qty}
                          label={product.name}
                          onChange={(next) => setCartQty(product.slug, next)}
                          onRemove={() => removeFromCart(product.slug)}
                        />
                        <Price amount={lineTotal} size="sm" />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="border-t border-border bg-surface px-5 py-4">
                <p className="flex items-baseline justify-between">
                  <span className="text-[15px] font-semibold text-foreground">Subtotal</span>
                  <span className="text-xl font-bold text-foreground tabular-nums">{formatPrice(subtotal)}</span>
                </p>
                {savings > 0 && (
                  <p className="mt-0.5 flex justify-between text-[13px] font-semibold text-sale">
                    <span>You save</span>
                    <span className="tabular-nums">{formatPrice(savings)}</span>
                  </p>
                )}
                <p className="mt-1 text-[13px] text-primary">Free shipping on this order</p>
                <div className="mt-4 grid gap-2">
                  <Link href="/checkout" onClick={closeCartDrawer} className={btnPrimary}>
                    Proceed to checkout
                  </Link>
                  <Link href="/cart" onClick={closeCartDrawer} className={btnOutline}>
                    Go to cart
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </dialog>

      {/* Screen-reader announcements for every cart change, wherever it happens. */}
      <div className="sr-only" role="status" aria-live="polite">
        {announcement}
      </div>
    </>
  );
}
