"use client";

import Link from "next/link";
import { Lock, ShoppingCart } from "lucide-react";
import {
  clearCart,
  moveToCart,
  removeFromCart,
  removeSaved,
  saveForLater,
  setCartQty,
  useCart,
} from "@/lib/cart-store";
import { discountPercent, featuredProducts } from "@/lib/catalog";
import { formatPrice, site } from "@/lib/site";
import { btnOutline, btnPrimary, cardClass } from "@/lib/ui";
import { Price } from "@/components/price";
import { ProductImage } from "@/components/product-image";
import { ProductRail } from "@/components/product-rail";
import { QuantityStepper } from "@/components/quantity-stepper";

const actionLink =
  "inline-flex min-h-11 items-center px-2 text-[14px] font-medium text-primary underline-offset-4 transition-colors duration-150 hover:text-primary-hover hover:underline";

export function CartView() {
  const { items, saved, count, subtotal, savings, hydrated } = useCart();

  if (!hydrated) {
    return (
      <div aria-busy="true" className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="h-80 animate-pulse rounded-2xl bg-background" />
        <div className="h-52 animate-pulse rounded-2xl bg-background" />
        <p className="sr-only">Loading your cart…</p>
      </div>
    );
  }

  const inCart = new Set(items.map((item) => item.product.slug));
  const suggestions = featuredProducts.filter((product) => !inCart.has(product.slug));

  return (
    <div className="space-y-5">
      <div className="grid items-start gap-5 lg:grid-cols-[1fr_320px]">
        {/* Items */}
        <section aria-labelledby="cart-title" className={cardClass}>
          <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border pb-3">
            <h1 id="cart-title" className="text-[26px] font-bold text-foreground sm:text-[30px]">
              Shopping cart
            </h1>
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => clearCart()}
                className="min-h-11 px-1 text-[14px] font-medium text-primary underline-offset-4 hover:underline"
              >
                Remove all items
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-12 text-center sm:flex-row sm:gap-8 sm:text-left">
              <span className="grid size-24 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                <ShoppingCart aria-hidden="true" className="size-11" />
              </span>
              <div className="mt-4 sm:mt-0">
                <p className="text-xl font-bold text-foreground">Your cart is empty</p>
                <p className="mt-1 text-muted-foreground">
                  {saved.length > 0
                    ? "You have items saved for later below. Move them back when you're ready."
                    : "Browse the deals or search for the parts you need."}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                  <Link href="/deals" className={btnPrimary}>
                    Shop today&apos;s deals
                  </Link>
                  <Link href="/shop" className={btnOutline}>
                    Browse all products
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-border">
                {items.map(({ product, qty, lineTotal }) => {
                  const discount = discountPercent(product);
                  return (
                    <li key={product.slug} className="group animate-fade-in flex gap-3 py-4 sm:gap-5">
                      <Link href={`/product/${product.slug}`} tabIndex={-1} aria-hidden="true" className="shrink-0">
                        <ProductImage
                          image={product.image}
                          alt=""
                          sizes="160px"
                          className="size-24 rounded-xl bg-surface sm:size-40"
                        />
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-4">
                          <Link
                            href={`/product/${product.slug}`}
                            className="-my-2.5 line-clamp-2 py-2.5 text-[15px] leading-snug text-foreground hover:text-primary hover:underline sm:text-lg"
                          >
                            {product.name}
                          </Link>
                          <div className="hidden shrink-0 text-right sm:block">
                            <Price amount={lineTotal} size="md" />
                            {qty > 1 && (
                              <p className="text-[13px] text-muted-foreground">{formatPrice(product.price)} each</p>
                            )}
                          </div>
                        </div>
                        <p className={`mt-1 text-[13px] font-semibold ${product.stock === "in" ? "text-primary" : "text-amber-text"}`}>
                          {product.stock === "in" ? "In stock" : "Only a few left"}
                        </p>
                        <p className="text-[13px] text-muted-foreground">
                          {product.condition} · Free shipping
                          {discount !== null && <span className="font-semibold text-sale"> · {discount}% off</span>}
                        </p>
                        <p className="mt-1 sm:hidden">
                          <Price amount={lineTotal} size="sm" />
                        </p>
                        <div className="mt-auto flex flex-wrap items-center gap-x-1 gap-y-1 pt-2">
                          <QuantityStepper
                            size="sm"
                            value={qty}
                            label={product.name}
                            onChange={(next) => setCartQty(product.slug, next)}
                            onRemove={() => removeFromCart(product.slug)}
                          />
                          <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
                          <button
                            type="button"
                            onClick={() => removeFromCart(product.slug)}
                            aria-label={`Delete ${product.name}`}
                            className={actionLink}
                          >
                            Delete
                          </button>
                          <span aria-hidden="true" className="h-5 w-px bg-border" />
                          <button
                            type="button"
                            onClick={() => saveForLater(product.slug)}
                            aria-label={`Save ${product.name} for later`}
                            className={actionLink}
                          >
                            Save for later
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="border-t border-border pt-3 text-right text-lg text-foreground">
                Subtotal ({count} {count === 1 ? "item" : "items"}):{" "}
                <span className="font-bold tabular-nums">{formatPrice(subtotal)}</span>
              </p>
            </>
          )}
        </section>

        {/* Summary */}
        {items.length > 0 && (
          <aside aria-label="Order summary" className={`${cardClass} lg:sticky lg:top-24`}>
            <p className="text-[15px] font-semibold text-primary">Your order ships free</p>
            <p className="mt-2 text-lg text-foreground">
              Subtotal ({count} {count === 1 ? "item" : "items"}):{" "}
              <span className="font-bold tabular-nums">{formatPrice(subtotal)}</span>
            </p>
            {savings > 0 && (
              <p className="mt-0.5 text-[14px] font-semibold text-sale">You save {formatPrice(savings)}</p>
            )}
            <Link href="/checkout" className={`${btnPrimary} mt-4 min-h-12 w-full`}>
              <Lock aria-hidden="true" className="size-4" />
              Proceed to checkout
            </Link>
            <p className="mt-3 text-[13px] text-muted-foreground">
              {site.shipping.estimate}. Shipping anywhere in the USA.
            </p>
          </aside>
        )}
      </div>

      {/* Saved for later */}
      {saved.length > 0 && (
        <section aria-labelledby="saved-title" className={cardClass}>
          <h2 id="saved-title" className="border-b border-border pb-3 text-xl font-bold text-foreground">
            Saved for later ({saved.length} {saved.length === 1 ? "item" : "items"})
          </h2>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {saved.map((product) => (
              <li key={product.slug} className="group animate-fade-in flex flex-col rounded-xl border border-border p-3">
                <Link href={`/product/${product.slug}`} tabIndex={-1} aria-hidden="true">
                  <ProductImage image={product.image} alt="" sizes="200px" className="aspect-square rounded-lg bg-surface" />
                </Link>
                <Link
                  href={`/product/${product.slug}`}
                  className="mt-0.5 line-clamp-2 py-1.5 text-[14px] leading-snug text-foreground hover:text-primary hover:underline"
                >
                  {product.name}
                </Link>
                <Price amount={product.price} size="sm" className="mt-1" />
                <div className="mt-auto grid gap-1 pt-3">
                  <button
                    type="button"
                    onClick={() => moveToCart(product.slug)}
                    aria-label={`Move ${product.name} to cart`}
                    className="min-h-11 rounded-full border border-foreground/25 text-[14px] font-semibold text-foreground transition-colors duration-150 hover:border-primary hover:bg-primary-soft hover:text-primary"
                  >
                    Move to cart
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSaved(product.slug)}
                    aria-label={`Delete ${product.name} from saved items`}
                    className="min-h-11 text-[14px] font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ProductRail title="Customers also bought" products={suggestions} href="/shop" />
    </div>
  );
}
